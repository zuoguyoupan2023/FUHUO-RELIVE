# FUHUO-RELIVE

## 目标
从独立 R2 存储桶恢复文件到本地，覆盖本地对应路径。

## 用 env | grep BACKUP 命令读取这些变量

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
  - 远端 `openclaw/xxx` → 本地 `/root/clawd/xxx`
  - 远端 `openclaw/_config/yyy` → 本地 `/root/.openclaw/yyy` 或 `/root/.clawdbot/yyy`

## 云端存储结构

```
FUHUO-FILES-TREE.json    # 文件树索引（根目录）
openclaw/                # 文件目录
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## 使用方式

1. 将脚本保存为 `/root/clawd/fuhuo/fuhuo_relive.js`

3. 执行归来
```bash
node /root/clawd/fuhuo/fuhuo_relive.js
```
