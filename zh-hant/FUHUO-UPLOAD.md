# FUHUO-UPLOAD

## 目標
生成本地 `FUHUO-FILES-TREE.json` 並執行差異化上傳與刪除同步。

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
- 對應規則：
  - 本地 `/root/clawd/xxx` → 遠端 `openclaw/xxx`
  - 本地 `/root/.openclaw/yyy` 或 `/root/.clawdbot/yyy` → 遠端 `openclaw/_config/yyy`

## 雲端儲存結構

```
FUHUO-FILES-TREE.json    # 文件樹索引（根目錄）
openclaw/                # 文件目錄
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## 差異策略

- 新增文件：上傳
- 內容變更：基於 hash 變化上傳
- 本地已刪除：遠端同步刪除

## 使用方式

1. 安裝依賴
```bash
cd /root/clawd
npm install @aws-sdk/client-s3
```

2. 將腳本保存為 `/root/clawd/scripts/fuhuo_upload.js`（已保存）

3. 執行上傳
```bash
node /root/clawd/scripts/fuhuo_upload.js
```
