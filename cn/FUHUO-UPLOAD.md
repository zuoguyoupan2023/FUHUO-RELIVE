# FUHUO-UPLOAD

## 目标
生成本地 `FUHUO-FILES-TREE.json` 并执行差异化上传与删除同步。

## 用env | grep BACKUP 命令读取这些变量

- BACKUP_R2_ACCESS_KEY_ID
- BACKUP_R2_SECRET_ACCESS_KEY
- BACKUP_R2_ACCOUNT_ID
- BACKUP_R2_BUCKET_NAME
- BACKUP_R2_ENDPOINT（可选）
- BACKUP_R2_PREFIX（可选）

## 路径映射

- 本地根目录：`/root/clawd`
- 远端树文件：`{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`
- 远端文件根：`{BACKUP_R2_PREFIX}/openclaw/`
- 映射规则：
  - 本地 `/root/clawd/xxx` → 远端 `openclaw/xxx`
  - 本地 `/root/.openclaw/yyy` 或 `/root/.clawdbot/yyy` → 远端 `openclaw/_config/yyy`

## 云端存储结构

```
FUHUO-FILES-TREE.json    # 文件树索引（根目录）
openclaw/                # 文件目录
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## 差异策略

- 新增文件：上传
- 内容变更：基于 hash 变化上传
- 本地已删除：远端同步删除

## 使用方式

**自包含版本** (推荐，零依赖）：

1. 确保环境变量已设置：
```bash
export BACKUP_R2_ACCESS_KEY_ID="your_key"
export BACKUP_R2_SECRET_ACCESS_KEY="your_secret"
export BACKUP_R2_ACCOUNT_ID="your_account"
export BACKUP_R2_BUCKET_NAME="your_bucket"
```

2. 执行上传
```bash
node /root/clawd/fuhuo/fuhuo_upload.js
```

**说明**：
- ✅ 只依赖 Node.js 内置模块
- ✅ 无需 `npm install`
- ✅ 自动差量同步
- ✅ 支持批量删除

---

## 生成文件树

**重要**: 在执行上传前，需要先生成文件树索引：

```bash
# 切换到 fuhuo 目录
cd /root/clawd/fuhuo

# 生成文件树
node generate_file_tree.js

# 执行上传
cd /root/clawd
node fuhuo/fuhuo_upload.js
```

**说明**：
- `generate_file_tree.js` 会扫描所有目录并生成 `FUHUO-FILES-TREE.json`
- 上传协议使用此文件树进行差量同步
- 每次上传前建议重新生成文件树
