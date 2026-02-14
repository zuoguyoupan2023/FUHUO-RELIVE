#!/usr/bin/env node

/**
 * FUHUO 归来协议 - 自包含版本
 * 从 R2 存储桶恢复文件到本地
 * 只依赖 Node.js 内置模块，无需安装任何包
 *
 * 使用方法：
 * 1. 确保环境变量已设置：
 *    - BACKUP_R2_ACCESS_KEY_ID
 *    - BACKUP_R2_SECRET_ACCESS_KEY
 *    - BACKUP_R2_ACCOUNT_ID
 *    - BACKUP_R2_BUCKET_NAME
 * 2. 运行: node fuhuo_relive.js
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

/**
 * AWS Signature V4 签名
 */
function getAuthHeaders(method, path, queryParams = {}) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const service = 's3';
  const region = 'auto';

  // 构建查询字符串
  const queryString = Object.entries(queryParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  // 规范化 URI
  const canonicalUri = path;

  // 规范化查询字符串
  const canonicalQuery = queryString;

  // 规范化头
  const canonicalHeaders = `host:${bucket}.${accountId}.r2.cloudflarestorage.com\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:${amzDate}\n`;

  // 签名头列表
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  // 请求哈希
  const payloadHash = 'UNSIGNED-PAYLOAD';

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
    'x-amz-content-sha256': 'UNSIGNED-PAYLOAD'
  };
}

function hmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

/**
 * 发送 HTTPS 请求
 */
function request(method, key) {
  return new Promise((resolve, reject) => {
    const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;

    const headers = getAuthHeaders(method, `/${key}`);
    const encodedKey = encodeURI(key);
    headers['Host'] = host;

    const options = {
      hostname: host,
      port: 443,
      path: `/${encodedKey}`,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.toString()}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * 获取远程文件
 */
async function fetchObject(key) {
  return await request('GET', key);
}

/**
 * 解析文件树
 */
function parseTree(content) {
  const data = JSON.parse(content);
  if (!data || !Array.isArray(data.files)) return [];
  return data.files.map((item) => item.path).filter(Boolean);
}

/**
 * 安全路径拼接
 */
function safeJoin(base, rel) {
  const normalized = path.normalize(rel);
  if (normalized.startsWith('..')) {
    throw new Error(`Invalid path: ${rel}`);
  }
  return path.join(base, normalized);
}

/**
 * 恢复单个文件
 */
async function restoreFile(rel) {
  // R2 路径: openclaw/xxx → 本地: /root/clawd/xxx
  const r2Key = `${basePrefix}openclaw/${rel}`;
  const data = await fetchObject(r2Key);

  let targetBase = rootDir;
  let targetRel = rel;

  // 特殊处理: _config/ → /root/.openclaw 或 /root/.clawdbot
  if (rel.startsWith('_config/')) {
    targetBase = openclawDir;
    targetRel = rel.slice('_config/'.length);
  }

  const targetPath = safeJoin(targetBase, targetRel);
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  await fsp.writeFile(targetPath, data);

  return { r2Key, targetPath };
}

/**
 * 主函数
 */
async function main() {
  console.log('🔄 开始 FUHUO 归来协议...\n');
  console.log(`📦 存储桶: ${bucket}`);
  console.log(`📁 R2前缀: ${basePrefix || '(root)'}`);
  console.log(`📂 R2路径: ${basePrefix}openclaw/`);
  console.log(`💾 本地路径: ${rootDir}`);
  console.log('');

  // 获取文件树
  // 2026-02-12 更新: 文件树在 openclaw/.metadata 目录
  const treeKey = `openclaw/.metadata/FUHUO-FILES-TREE.json`;
  console.log(`📋 读取文件树: ${treeKey}`);

  try {
    const treeBody = await fetchObject(treeKey);
    const treeContent = treeBody.toString('utf8');
    const relPaths = parseTree(treeContent);

    console.log(`📋 找到 ${relPaths.length} 个文件需要恢复\n`);

    // 恢复文件
    let successCount = 0;
    let failCount = 0;

    for (const rel of relPaths) {
      try {
        const { r2Key, targetPath } = await restoreFile(rel);
        const relPath = path.relative(rootDir, targetPath);
        console.log(`  ✅ ${relPath}`);
        successCount++;
      } catch (err) {
        console.error(`  ❌ ${rel}: ${err.message}`);
        failCount++;
      }
    }

    // 保存本地文件树
    const localTreePath = path.join(rootDir, 'FUHUO-FILES-TREE.json');
    await fsp.writeFile(localTreePath, treeContent);
    console.log(`\n📋 本地文件树已更新: ${localTreePath}`);

    console.log('\n' + '─'.repeat(60));
    console.log('✅ FUHUO relive completed!');
    console.log(`📦 存储桶: ${bucket}`);
    console.log(`📁 恢复位置: ${rootDir}`);
    console.log(`✅ 成功: ${successCount} 个文件`);
    if (failCount > 0) {
      console.log(`❌ 失败: ${failCount} 个文件`);
    }
    console.log('─'.repeat(60));

  } catch (err) {
    console.error('\n❌ 归来协议执行失败:', err.message);
    console.error('\n请检查：');
    console.error('  1. 环境变量是否正确设置');
    console.error('  2. R2 存储桶是否存在');
    console.error('  3. FUHUO-FILES-TREE.json 是否存在');
    process.exit(1);
  }
}

main();
