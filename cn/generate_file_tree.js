#!/usr/bin/env node

/**
 * 生成 FUHUO-FILES-TREE.json
 * 扫描指定目录，记录 path/hash/size/mtimeMs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = '/root/clawd';
const OUTPUT_FILE = path.join(BASE_DIR, 'FUHUO-FILES-TREE.json');

// 扫描目录配置
const SCAN_DIRS = [
  'core',
  'skills',
  'scripts',
  'config',
  'memory',      // 🆕 添加 memory 目录（每日记忆）
  'fuhuo',       // 🆕 添加 fuhuo 目录（复活协议文档）
  'github-record', // 🆕 添加 github-record 目录（GitHub 参与记录）
];

// 扫描文件配置（绝对路径）
const SCAN_FILES = [
  '/root/.openclaw/openclaw.json',
  '/root/.clawdbot/clawdbot.json',
];

// 核心文件配置（*.md 文件）
const CORE_PATTERNS = [
  'AGENTS.md',
  'IDENTITY.md',
  'MEMORY.md',
  'SOUL.md',
  'USER.md',
  'TOOLS.md',
  'HEARTBEAT.md',
  'MAIL-NEWS-MEMORY.md',
];

// 根目录文件扩展名白名单
const ROOT_EXTENSIONS = [
  '.md',    // Markdown 文档
  '.js',    // JavaScript 脚本
  '.py',    // Python 脚本
  '.txt',   // 文本文件
  '.png',   // PNG 图片
  '.jpg',   // JPEG 图片
  '.jpeg',  // JPEG 图片
  '.gif',   // GIF 图片
  '.webp',  // WebP 图片
  '.svg',   // SVG 图片
];

// 排除目录
const EXCLUDE_DIRS = [
  '.git',
  'node_modules',
  '__pycache__',
  '.pytest_cache',
  'dist',
  'build',
];

/**
 * 计算文件 SHA256 哈希
 */
function calculateHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

/**
 * 递归扫描目录
 */
function scanDirectory(dirPath, baseDir) {
  const results = [];

  if (!fs.existsSync(dirPath)) {
    return results;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    // 排除指定目录
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.includes(entry.name)) {
        continue;
      }
      // 递归扫描子目录
      results.push(...scanDirectory(fullPath, baseDir));
    } else if (entry.isFile()) {
      // 跳过隐藏文件（除了配置文件）
      if (entry.name.startsWith('.') && !entry.name.endsWith('.json')) {
        continue;
      }

      try {
        const stats = fs.statSync(fullPath);
        const fileHash = calculateHash(fullPath);

        results.push({
          path: relativePath,
          hash: fileHash,
          size: stats.size,
          mtimeMs: stats.mtimeMs,
        });
      } catch (error) {
        console.warn(`⚠️  无法读取文件: ${relativePath} - ${error.message}`);
      }
    }
  }

  return results;
}

/**
 * 扫描单个文件
 */
function scanFile(filePath, baseDir) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const stats = fs.statSync(filePath);
    const relativePath = path.relative(baseDir, filePath);
    const fileHash = calculateHash(filePath);

    return [{
      path: relativePath,
      hash: fileHash,
      size: stats.size,
      mtimeMs: stats.mtimeMs,
    }];
  } catch (error) {
    console.warn(`⚠️  无法读取文件: ${filePath} - ${error.message}`);
    return [];
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🌳 正在生成 FUHUO-FILES-TREE.json...\n');

  const fileTree = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    generatedAtZh: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    baseDir: BASE_DIR,
    files: [],
  };

  let totalFiles = 0;
  let totalSize = 0;

  // 扫描目录
  for (const dir of SCAN_DIRS) {
    const dirPath = path.join(BASE_DIR, dir);
    console.log(`📁 扫描目录: ${dir}`);

    const files = scanDirectory(dirPath, BASE_DIR);
    fileTree.files.push(...files);

    totalFiles += files.length;
    totalSize += files.reduce((sum, f) => sum + f.size, 0);

    console.log(`   找到 ${files.length} 个文件\n`);
  }

  // 扫描单个文件
  console.log('📄 扫描配置文件...');
  for (const filePath of SCAN_FILES) {
    const files = scanFile(filePath, BASE_DIR);
    fileTree.files.push(...files);

    totalFiles += files.length;
    totalSize += files.reduce((sum, f) => sum + f.size, 0);

    if (files.length > 0) {
      console.log(`   ✅ ${path.basename(filePath)}`);
    }
  }

  // 扫描核心 MD 文件
  console.log('📄 扫描核心文件...');
  for (const pattern of CORE_PATTERNS) {
    const filePath = path.join(BASE_DIR, pattern);
    const files = scanFile(filePath, BASE_DIR);
    fileTree.files.push(...files);

    totalFiles += files.length;
    totalSize += files.reduce((sum, f) => sum + f.size, 0);

    if (files.length > 0) {
      console.log(`   ✅ ${pattern}`);
    }
  }

  // 扫描根目录的指定扩展名文件
  console.log('📄 扫描根目录文件...');
  const rootEntries = fs.readdirSync(BASE_DIR, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (ROOT_EXTENSIONS.includes(ext)) {
      const filePath = path.join(BASE_DIR, entry.name);
      const files = scanFile(filePath, BASE_DIR);

      // 检查是否已经添加过（避免重复）
      const relativePath = path.relative(BASE_DIR, filePath);
      const exists = fileTree.files.some(f => f.path === relativePath);

      if (!exists && files.length > 0) {
        fileTree.files.push(...files);
        totalFiles += files.length;
        totalSize += files.reduce((sum, f) => sum + f.size, 0);
        console.log(`   ✅ ${entry.name}`);
      }
    }
  }

  // 统计信息
  fileTree.stats = {
    totalFiles,
    totalSize,
    totalSizeHuman: totalSize > 1024 * 1024
      ? `${(totalSize / 1024 / 1024).toFixed(2)} MB`
      : totalSize > 1024
      ? `${(totalSize / 1024).toFixed(2)} KB`
      : `${totalSize} B`,
  };

  // 写入文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fileTree, null, 2), 'utf-8');

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ 文件树生成完成！`);
  console.log(`📊 统计:`);
  console.log(`   - 文件总数: ${totalFiles}`);
  console.log(`   - 总大小: ${fileTree.stats.totalSizeHuman}`);
  console.log(`   - 输出文件: ${OUTPUT_FILE}`);
  console.log('─'.repeat(60));
}

main();
