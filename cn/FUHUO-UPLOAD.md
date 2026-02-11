# FUHUO-UPLOAD

## 目标
生成本地 `FUHUO-FILES-TREE.json` 并执行差异化上传与删除同步。

## 需要的环境变量

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

1. 安装依赖
```bash
cd /root/clawd
npm install @aws-sdk/client-s3
```

2. 将脚本保存为 `/root/clawd/scripts/fuhuo_upload.js`（已保存）

3. 执行上传
```bash
node /root/clawd/scripts/fuhuo_upload.js
```
