# FUHUO-PROTOCOL

## 目標
在容器啟動或關鍵節點時，自動判斷是否需要執行 出生、上傳 或 歸來 三個子協議中的一個。

## 入口檢查

1. 本地根目錄是否存在 `FUHUO-FILES-TREE.json`（預設：`/root/clawd/FUHUO-FILES-TREE.json`）

2. 是否能讀取以下環境變數且值不為空：

   - BACKUP_R2_ACCOUNT_ID
   - BACKUP_R2_ACCESS_KEY_ID
   - BACKUP_R2_SECRET_ACCESS_KEY
   - BACKUP_R2_BUCKET_NAME

3. 如果檢查失敗，必須輸出完整檢查結果給人類

## 雲端檢查

讀取遠端 BACKUP_R2_BUCKET_NAME 規定的儲存桶中的 `FUHUO-FILES-TREE.json`（預設：`{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`，無前綴時為 `FUHUO-FILES-TREE.json`），與本地 `FUHUO-FILES-TREE.json` 比對。如果遠端不存在，也被視為差異。

## 雲端儲存結構

```
FUHUO-FILES-TREE.json    # 文件樹索引（根目錄）
openclaw/                # 文件目錄
├── AGENTS.md            # 對應到 /root/clawd/AGENTS.md
├── IDENTITY.md          # 對應到 /root/clawd/IDENTITY.md
├── MEMORY.md            # 對應到 /root/clawd/MEMORY.md
├── SOUL.md              # 對應到 /root/clawd/SOUL.md
├── USER.md              # 對應到 /root/clawd/USER.md
├── TOOLS.md             # 對應到 /root/clawd/TOOLS.md
├── HEARTBEAT.md         # 對應到 /root/clawd/HEARTBEAT.md
├── MAIL-NEWS-MEMORY.md  # 對應到 /root/clawd/MAIL-NEWS-MEMORY.md
├── config/              # 對應到 /root/clawd/config/
├── scripts/             # 對應到 /root/clawd/scripts/
├── skills/              # 對應到 /root/clawd/skills/
├── fuhuo/               # 對應到 /root/clawd/fuhuo/
└── _config/             # 對應到 /root/.openclaw/ 或 /root/.clawdbot/
    └── openclaw.json
```

## 選擇子協議

- 本地與雲端都沒有 `FUHUO-FILES-TREE.json`：執行 **出生協議** FUHUO-BIRTH.md
- 本地有且雲端無：執行 **上傳協議** FUHUO-UPLOAD.md
- 本地與雲端都有：
  - 存在差異：
    - 如果雲端文件數 > 本地文件數：執行 **歸來協議** FUHUO-RELIVE.md
    - 否則（本地文件數更多或相同）：執行 **上傳協議** FUHUO-UPLOAD.md
  - 無差異：不執行上傳
- 本地無且雲端有：執行 **歸來協議** FUHUO-RELIVE.md

### 決策邏輯詳解

當本地與雲端都有文件樹但存在差異時，透過比較文件數量決定協議：

| 場景 | 本地文件數 | 雲端文件數 | 執行協議 |
|------|-----------|-----------|---------|
| 雲端更多 | 49 | 50 | 歸來協議 |
| 本地更多 | 50 | 49 | 上傳協議 |
| 數量相同但內容不同 | 49 | 49 | 上傳協議 |

**理由**：
- 雲端更多 → 可能是容器重啟後本地丟失，需要從雲端恢復
- 本地更多 → 本地有新文件，需要備份到雲端
- 數量相同但有差異 → 本地文件有修改，需要上傳新版本
