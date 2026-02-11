# FUHUO-BIRTH

## 目標
在本地與雲端都不存在 `FUHUO-FILES-TREE.json` 時，生成基線文件樹並初始化雲端基線。

## 作用範圍

預設掃描並生成文件樹（記錄 path/hash/size/mtimeMs）：
- `/root/clawd/core`
- `/root/clawd/skills`
- `/root/clawd/scripts`
- `/root/clawd/config`
- `/root/clawd/memory`
- `/root/clawd/fuhuo`
- `/root/.openclaw/openclaw.json` 或 `/root/.clawdbot/clawdbot.json`
- `/root/clawd/*.md` 核心文件（AGENTS/IDENTITY/MEMORY/SOUL/USER/TOOLS/HEARTBEAT/MAIL-NEWS-MEMORY）

排除目錄：
- `.git`
- `node_modules`

## 執行步驟

### 1. 生成本地文件樹

```bash
node /root/clawd/scripts/generate_file_tree.js
```

### 2. 執行上傳協議

```bash
node /root/clawd/scripts/fuhuo_upload.js
```

參考：[FUHUO-UPLOAD.md](./FUHUO-UPLOAD.md)

### 3. 修改 HEARTBEAT.md

在 HEARTBEAT.md 中增加一項規則：

執行復活協議，並判斷是否需要執行 復活-上傳協議，如果需要就執行。

## 腳本路徑

- 文件樹生成：`/root/clawd/scripts/generate_file_tree.js`
- 上傳腳本：`/root/clawd/scripts/fuhuo_upload.js`

## 雲端儲存結構

```
FUHUO-FILES-TREE.json    # 文件樹索引（根目錄）
openclaw/                # 文件目錄
├── AGENTS.md
├── IDENTITY.md
├── MEMORY.md
├── SOUL.md
├── USER.md
├── TOOLS.md
├── HEARTBEAT.md
├── MAIL-NEWS-MEMORY.md
├── config/
├── scripts/
├── skills/
├── fuhuo/
└── _config/
```

## 使用場景

- **首次部署**：初始化雲端備份
- **重置備份**：清空雲端後重新建立基線
- **遷移儲存**：更換儲存桶時重建
