#!/usr/bin/env node
/**
 * FUHUO 协议检查脚本 (自包含版本)
 * 根据 FUHUO-PROTOCOL 规则检查是否需要执行上传或归来协议
 *
 * 只依赖 Node.js 内置模块，使用自包含 R2 客户端
 */

const fs = require('fs');
const r2 = require('./lib/r2-client-native');
const { generate } = require('./lib/generate_tree');

const getLocalTree = () => {
  const treePath = '/root/clawd/FUHUO-FILES-TREE.json';
  if (!fs.existsSync(treePath)) return null;
  try {
    const content = fs.readFileSync(treePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
};

const compareTrees = (local, remote) => {
  if (!local || !remote) return false;

  const localCount = local.files?.length || 0;
  const remoteCount = remote.files?.length || 0;

  // 如果文件数量不同，直接返回不一致
  if (localCount !== remoteCount) return false;

  const localMap = new Map(local.files?.map(f => [f.path, f.hash]) || []);
  const remoteMap = new Map(remote.files?.map(f => [f.path, f.hash]) || []);

  if (localMap.size !== remoteMap.size) return false;

  for (const [path, hash] of localMap.entries()) {
    if (remoteMap.get(path) !== hash) return false;
  }

  return true;
};

const run = async () => {
  console.log('🔍 FUHUO 协议检查 (FUHUO-PROTOCOL)\n');
  console.log(`📦 存储桶: ${process.env.BACKUP_R2_BUCKET_NAME}`);
  console.log(`📁 前缀: ${(process.env.BACKUP_R2_PREFIX || '').replace(/^\/+|\/+$/g, '') || '(root)'}\n`);

  // 0️⃣ 先生成最新的本地文件树
  console.log('📊 步骤 0: 生成本地文件树...');
  try {
    await generate();
    console.log('');
  } catch (err) {
    console.error('⚠️  文件树生成失败:', err.message);
    console.error('   将继续使用现有文件树进行检查\n');
  }

  // 检查本地和远端的 FUHUO-FILES-TREE.json
  const localTree = getLocalTree();

  // 获取远端文件树
  // 2026-02-12 更新: 文件树在 openclaw/.metadata 目录
  const treeKey = 'openclaw/.metadata/FUHUO-FILES-TREE.json';
  let remoteTree = null;

  try {
    const data = await r2.getObject(treeKey);
    remoteTree = JSON.parse(data.toString('utf8'));
  } catch (err) {
    if (err.message.includes('404') || err.message.includes('NoSuchKey')) {
      // 文件不存在，remoteTree 保持为 null
    } else {
      console.error('❌ 获取远端文件树失败:', err.message);
      process.exit(2);
    }
  }

  const hasLocal = !!localTree;
  const hasRemote = !!remoteTree;
  const isSame = hasLocal && hasRemote && compareTrees(localTree, remoteTree);

  console.log('📊 步骤 1: 检查结果:');
  console.log(`   本地 FUHUO-FILES-TREE.json: ${hasLocal ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`   远端 FUHUO-FILES-TREE.json: ${hasRemote ? '✅ 存在' : '❌ 不存在'}`);
  if (hasLocal && hasRemote) {
    console.log(`   内容一致性: ${isSame ? '✅ 一致' : '⚠️ 有差异'}`);
  }
  console.log('');

  // 根据 FUHUO-PROTOCOL 规则决定
  console.log('📊 步骤 2: 判断需要执行的协议');
  let action = null;

  if (!hasLocal && !hasRemote) {
    console.log('🆕 本地与云端都没有 FUHUO-FILES-TREE.json');
    console.log('   → 需要执行: 出生协议 (FUHUO-BIRTH)');
    console.log('   → 脚本: node /root/clawd/fuhuo/fuhuo_upload.js (首次上传)');
    action = 'BIRTH';
  } else if (hasLocal && !hasRemote) {
    console.log('📤 本地有，云端无');
    console.log('   → 需要执行: 上传协议 (FUHUO-UPLOAD)');
    console.log('   → 脚本: node /root/clawd/fuhuo/fuhuo_upload.js');
    action = 'UPLOAD';
  } else if (!hasLocal && hasRemote) {
    console.log('📥 本地无，云端有');
    console.log('   → 需要执行: 归来协议 (FUHUO-RELIVE)');
    console.log('   → 脚本: node /root/clawd/fuhuo/fuhuo_relive_standalone.js');
    action = 'RELIVE';
  } else if (hasLocal && hasRemote && !isSame) {
    // 新逻辑：比较文件数量
    const localCount = localTree.files?.length || 0;
    const remoteCount = remoteTree.files?.length || 0;

    console.log('🔄 本地与云端都有，但存在差异');
    console.log(`   📊 本地文件数: ${localCount}`);
    console.log(`   📊 云端文件数: ${remoteCount}`);

    if (remoteCount > localCount) {
      console.log('   → 云端文件更多，执行: 归来协议 (FUHUO-RELIVE)');
      console.log('   → 脚本: node /root/clawd/fuhuo/fuhuo_relive_standalone.js');
      action = 'RELIVE';
    } else {
      console.log('   → 本地文件更多或相同，执行: 上传协议 (FUHUO-UPLOAD)');
      console.log('   → 脚本: node /root/clawd/fuhuo/fuhuo_upload.js');
      action = 'UPLOAD';
    }
  } else {
    console.log('✅ 本地与云端一致，无需执行协议');
    action = 'NONE';
  }

  console.log('');
  console.log('─'.repeat(60));

  // 返回需要执行的动作
  return action;
};

run()
  .then((action) => {
    console.log('📊 步骤 3: 检查完成');
    if (action !== 'NONE') {
      console.log(`\n⚠️  需要执行 FUHUO 协议: ${action}`);
      process.exit(1); // 非0退出码表示需要处理
    } else {
      console.log('\n✅ FUHUO 协议检查完成，无需执行操作');
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('\n❌ 检查失败:', err.message);
    console.error(err.stack);
    process.exit(2);
  });
