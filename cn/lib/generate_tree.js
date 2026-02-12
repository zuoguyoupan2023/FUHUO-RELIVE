#!/usr/bin/env node
/**
 * FUHUO 文件树生成模块
 *
 * 用于生成 FUHUO-FILES-TREE.json
 * 可被 fuhuo_upload.js 和 check_fuhuo.js 共用
 *
 * 只依赖 Node.js 内置模块
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

// 配置
const rootDir = '/root/clawd';
const openclawDir = fs.existsSync('/root/.openclaw') ? '/root/.openclaw' : '/root/.clawdbot';
const openclawConfig = fs.existsSync(path.join(openclawDir, 'openclaw.json'))
  ? path.join(openclawDir, 'openclaw.json')
  : path.join(openclawDir, 'clawdbot.json');

/**
 * SHA256 哈希
 */
async function sha256(filePath) {
  const data = await fsp.readFile(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 列出目录下的所有文件
 */
async function listFiles(dirPath) {
  const files = [];

  async function traverse(currentPath) {
    const entries = await fsp.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await traverse(dirPath);
  return files;
}

/**
 * 检查是否为文件
 */
function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
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
    if (!fs.existsSync(dir.path)) continue;
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
 * 主函数：生成文件树
 */
async function generate() {
  console.log('📊 正在生成 FUHUO 文件树...');

  const entries = await buildEntries();
  const tree = await buildTree(entries);
  const treePath = await writeTreeFile(tree);

  console.log(`✅ 文件树已生成: ${treePath}`);
  console.log(`📁 包含 ${tree.files.length} 个文件`);

  return tree;
}

/**
 * 导出模块
 */
module.exports = {
  generate,
  buildEntries,
  buildTree,
  writeTreeFile,
};

// 如果直接运行此脚本
if (require.main === module) {
  generate()
    .then(() => {
      console.log('\n✅ 文件树生成完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ 生成失败:', err.message);
      console.error(err.stack);
      process.exit(1);
    });
}
