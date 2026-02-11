# FUHUO-RELIVE

## 目標
從獨立 R2 儲存桶恢復文件到本地，覆蓋本地對應路徑。

## 需要的環境變數

- BACKUP_R2_ACCESS_KEY_ID
- BACKUP_R2_SECRET_ACCESS_KEY
- BACKUP_R2_ACCOUNT_ID
- BACKUP_R2_BUCKET_NAME
- BACKUP_R2_ENDPOINT（可選）
- BACKUP_R2_PREFIX（可選）

## 路徑對應

- 本地根目錄：`/root/clawd`
- 遠端樹文件：`{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`
- 遠端文件根：`{BACKUP_R2_PREFIX}/openclaw/`
- 遠端相對路徑 `openclaw/*` 恢復到 `/root/.openclaw` 或 `/root/.clawdbot`

## 雲端儲存結構

```
FUHUO-FILES-TREE.json    # 文件樹索引（根目錄）
openclaw/                # 文件目錄
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## 使用方式

1. 安裝依賴
```bash
cd /root/clawd
npm install @aws-sdk/client-s3
```

2. 將腳本保存為 `/root/clawd/scripts/fuhuo_relive.js`（已保存）

3. 執行歸來
```bash
node /root/clawd/scripts/fuhuo_relive.js
```
