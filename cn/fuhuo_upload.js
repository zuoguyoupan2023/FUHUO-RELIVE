#!/usr/bin/env node

/**
 * FUHUO 上传协议 - 自包含版本
 * 生成本地 FUHUO-FILES-TREE.json 并执行差异化上传与删除同步
 * 路径映射: 本地 /root/clawd/ → R2 openclaw/
 *
 * 只依赖 Node.js 内置模块，无需安装任何包
 *
 * 使用方法：
 * 1. 确保环境变量已设置：
 *    - BACKUP_R2_ACCESS_KEY_ID
 *    - BACKUP_R2_SECRET_ACCESS_KEY
 *    - BACKUP_R2_ACCOUNT_ID
 *    - BACKUP_R2_BUCKET_NAME
 * 2. 运行: node fuhuo_upload_standalone.js
 */

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

// 检查环境变量
const required = [
  'BACKUP_R2_ACCESS_KEY_ID',
  'BACKUP_R2_SECRET_ACCESS_KEY',
  'BACKUP_R2_ACCOUNT_ID',
  'BACKUP_R2_BUCKET_NAME',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ 缺少环境变量: ${missing.join(', ')}`);
  console.error('\n请设置以下环境变量后重试：');
  required.forEach(env => console.error(`  ${env}`));
  process.exit(1);
}

const accountId = process.env.BACKUP_R2_ACCOUNT_ID;
const bucket = process.env.BACKUP_R2_BUCKET_NAME;
const prefix = (process.env.BACKUP_R2_PREFIX || '').replace(/^\/+|\/+$/g, '');
const basePrefix = prefix ? `${prefix}/` : '';

const rootDir = '/root/clawd';
const openclawDir = fs.existsSync('/root/.openclaw') ? '/root/.openclaw' : '/root/.clawdbot';
const openclawConfig = fs.existsSync(path.join(openclawDir, 'openclaw.json'))
  ? path.join(openclawDir, 'openclaw.json')
  : path.join(openclawDir, 'clawdbot.json');

const excluded = new Set(['.git', 'node_modules']);

/**
 * AWS Signature V4 签名
 */
function getAuthHeaders(method, pathKey, contentHash = null) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const service = 's3';
  const region = 'auto';

  // 规范化 URI
  const canonicalUri = `/${pathKey}`;

  // 规范化查询字符串
  const canonicalQuery = '';

  // 规范化头
  const canonicalHeaders = `host:${bucket}.${accountId}.r2.cloudflarestorage.com\nx-amz-date:${amzDate}\n`;

  // 签名头列表
  const signedHeaders = 'host;x-amz-date';

  // 请求哈希
  const payloadHash = contentHash || crypto.createHash('sha256').update('').digest('hex');

  // 规范请求
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');

  // 待签名字符串
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');

  // 计算签名密钥
  const kDate = hmacSha256(`AWS4${process.env.BACKUP_R2_SECRET_ACCESS_KEY}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, 'aws4_request');

  // 计算签名
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  // 构造授权头
  const authorization = `AWS4-HMAC-SHA256 Credential=${process.env.BACKUP_R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    'Authorization': authorization,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash
  };
}

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

/**
 * 发送 HTTPS 请求
 */
function request(method, key, body = null, contentType = null) {
  return new Promise((resolve, reject) => {
    const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;

    // 计算内容哈希
    const contentHash = body ? crypto.createHash('sha256').update(body).digest('hex') : null;
    const headers = getAuthHeaders(method, key, contentHash);

    headers['Host'] = host;
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const options = {
      hostname: host,
      port: 443,
      path: `/${key}`,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, headers: res.headers, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.toString()}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

/**
 * 上传对象
 */
async function putObject(key, body, contentType = 'application/octet-stream') {
  return await request('PUT', key, body, contentType);
}

/**
 * 获取远程对象
 */
async function fetchObject(key) {
  const response = await request('GET', key);
  return response.data;
}

/**
 * 删除多个对象
 */
async function deleteObjects(keys) {
  if (keys.length === 0) return;

  // 分批删除（R2 限制每次最多 1000 个）
  const chunks = [];
  for (let i = 0; i < keys.length; i += 1000) {
    chunks.push(keys.slice(i, i + 1000));
  }

  for (const chunk of chunks) {
    // 逐个删除（使用 DELETE 请求）
    for (const key of chunk) {
      await request('DELETE', key);
    }
  }
}

/**
 * 文件系统工具
 */
const isDirectory = (p) => {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
};

const isFile = (p) => {
  try { return fs.statSync(p).isFile(); } catch { return false; }
};

async function listFiles(dir) {
  if (!isDirectory(dir)) return [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (excluded.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listFiles(full);
      results.push(...nested);
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

async function sha256(filePath) {
  const data = await fsp.readFile(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 构建文件条目
 */
async function buildEntries() {
  const entries = [];

  const dirs = [
    { path: path.join(rootDir, 'core'), prefix: 'core' },
    { path: path.join(rootDir, 'skills'), prefix: 'skills' },
    { path: path.join(rootDir, 'scripts'), prefix: 'scripts' },
    { path: path.join(rootDir, 'config'), prefix: 'config' },
    { path: path.join(rootDir, 'memory'), prefix: 'memory' },
    { path: path.join(rootDir, 'fuhuo'), prefix: 'fuhuo' },
    { path: path.join(rootDir, 'github-record'), prefix: 'github-record' },
    { path: path.join(rootDir, 'plan'), prefix: 'plan' },
    { path: path.join(rootDir, 'relive-page'), prefix: 'relive-page' },
  ];

  // 扫描目录
  for (const dir of dirs) {
    const files = await listFiles(dir.path);
    for (const filePath of files) {
      const rel = path.relative(dir.path, filePath).split(path.sep).join('/');
      entries.push({ local: filePath, rel: `${dir.prefix}/${rel}` });
    }
  }

  // 核心文件（*.md）- 根目录
  const corePatterns = [
    'AGENTS.md', 'IDENTITY.md', 'MEMORY.md', 'SOUL.md',
    'USER.md', 'TOOLS.md', 'HEARTBEAT.md', 'MAIL-NEWS-MEMORY.md'
  ];

  for (const pattern of corePatterns) {
    const filePath = path.join(rootDir, pattern);
    if (isFile(filePath)) {
      entries.push({ local: filePath, rel: pattern });
    }
  }

  // 根目录的其他文件（指定扩展名）
  const rootExtensions = new Set([
    '.md', '.js', '.py', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'
  ]);

  const rootEntries = await fsp.readdir(rootDir, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!rootExtensions.has(ext)) continue;

    const filePath = path.join(rootDir, entry.name);
    const relPath = entry.name;

    // 检查是否已经在 corePatterns 中
    if (corePatterns.includes(entry.name)) continue;

    // 检查是否已经在 entries 中（避免重复）
    if (entries.some(e => e.rel === relPath)) continue;

    entries.push({ local: filePath, rel: relPath });
  }

  // 配置文件 - 映射到 _config/
  if (isFile(openclawConfig)) {
    const name = path.basename(openclawConfig);
    entries.push({ local: openclawConfig, rel: `_config/${name}` });
  }

  return entries;
}

/**
 * 构建文件树
 */
async function buildTree(entries) {
  const files = [];
  for (const entry of entries) {
    const stats = await fsp.stat(entry.local);
    const hash = await sha256(entry.local);
    files.push({
      path: entry.rel,
      hash,
      size: stats.size,
      mtimeMs: stats.mtimeMs,
    });
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    files,
  };
}

/**
 * 写入文件树
 */
async function writeTreeFile(tree) {
  const treePath = path.join(rootDir, 'FUHUO-FILES-TREE.json');
  await fsp.writeFile(treePath, JSON.stringify(tree, null, 2));
  return treePath;
}

/**
 * 获取远程文件树
 */
async function fetchRemoteTree() {
  const treeKey = `openclaw/.metadata/FUHUO-FILES-TREE.json`;
  try {
    const data = await fetchObject(`${basePrefix}${treeKey}`);
    const content = data.toString('utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.message.includes('404') || err.message.includes('NoSuchKey')) {
      return null;
    }
    throw err;
  }
}

/**
 * 转换为 Map
 */
function toMap(tree) {
  if (!tree || !Array.isArray(tree.files)) return new Map();
  return new Map(tree.files.map((item) => [item.path, item]));
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始 FUHUO 上传协议...\n');
  console.log(`📦 存储桶: ${bucket}`);
  console.log(`📁 R2前缀: ${basePrefix || '(root)'}`);
  console.log(`📂 本地路径: ${rootDir}`);
  console.log(`📂 R2路径: ${basePrefix}openclaw/`);
  console.log('');

  // 构建文件条目和树
  const entries = await buildEntries();
  const tree = await buildTree(entries);
  const treePath = await writeTreeFile(tree);

  // 获取远程文件树
  const remoteTree = await fetchRemoteTree();
  const localMap = toMap(tree);
  const remoteMap = toMap(remoteTree);

  // 计算差异
  const uploadList = [];
  const deleteList = [];

  console.log(`📊 本地文件: ${localMap.size}`);
  console.log(`📊 远端文件: ${remoteMap.size}\n`);

  for (const [rel, item] of localMap.entries()) {
    const remote = remoteMap.get(rel);
    if (!remote || remote.hash !== item.hash) {
      uploadList.push(rel);
    }
  }

  for (const [rel] of remoteMap.entries()) {
    if (!localMap.has(rel)) {
      deleteList.push(rel);
    }
  }

  console.log(`📤 需要上传: ${uploadList.length} 个文件`);
  console.log(`🗑️  需要删除: ${deleteList.length} 个文件\n`);

  // 上传文件
  if (uploadList.length > 0) {
    console.log('开始上传文件...');
    for (const rel of uploadList) {
      const entry = entries.find((item) => item.rel === rel);
      if (!entry) continue;

      const data = await fsp.readFile(entry.local);
      const key = `${basePrefix}openclaw/${rel}`;
      await putObject(key, data);
      console.log(`  ✅ ${rel}`);
    }
  }

  // 删除文件
  if (deleteList.length > 0) {
    console.log('\n删除远端文件...');
    const keys = deleteList.map(rel => `${basePrefix}openclaw/${rel}`);

    // R2 删除限制：每次最多 1000 个
    const chunks = [];
    for (let i = 0; i < keys.length; i += 1000) {
      chunks.push(keys.slice(i, i + 1000));
    }

    for (const chunk of chunks) {
      await deleteObjects(chunk);
    }

    console.log(`  ✅ 已删除 ${deleteList.length} 个文件`);
  }

  // 上传文件树到 openclaw/.metadata 目录
  const treeKey = `${basePrefix}openclaw/.metadata/FUHUO-FILES-TREE.json`;
  const treeData = await fsp.readFile(treePath);
  await putObject(treeKey, treeData, 'application/json');

  console.log('\n' + '─'.repeat(60));
  console.log('✅ FUHUO upload completed!');
  console.log(`📦 存储桶: ${bucket}`);
  console.log(`📁 前缀: ${basePrefix || '(root)'}`);
  console.log(`📤 上传: ${uploadList.length} 个文件`);
  if (deleteList.length > 0) {
    console.log(`🗑️  删除: ${deleteList.length} 个文件`);
  }
  console.log('─'.repeat(60));
}

main().catch((err) => {
  console.error('\n❌ 上传协议执行失败:', err.message);
  console.error('\n请检查：');
  console.error('  1. 环境变量是否正确设置');
  console.error('  2. R2 存储桶是否存在');
  console.error('  3. 网络连接是否正常');
  process.exit(1);
});
