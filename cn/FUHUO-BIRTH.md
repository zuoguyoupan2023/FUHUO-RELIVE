# FUHUO-BIRTH

## 目标
在本地与云端都不存在 `FUHUO-FILES-TREE.json` 时，生成基线文件树并初始化云端基线。

## 作用范围

默认扫描并生成文件树（记录 path/hash/size/mtimeMs）：
- `/root/clawd/core`
- `/root/clawd/skills`
- `/root/clawd/scripts`
- `/root/clawd/config`
- `/root/clawd/memory`
- `/root/clawd/fuhuo`
- `/root/.openclaw/openclaw.json` 或 `/root/.clawdbot/clawdbot.json`
- `/root/clawd/*.md` 核心文件（AGENTS/IDENTITY/MEMORY/SOUL/USER/TOOLS/HEARTBEAT/MAIL-NEWS-MEMORY）

排除目录：
- `.git`
- `node_modules`

## 执行步骤

### 1. 生成本地文件树

```bash
node /root/clawd/scripts/generate_file_tree.js
```

### 2. 执行上传协议

```bash
node /root/clawd/scripts/fuhuo_upload.js
```

参考：[FUHUO-UPLOAD.md](./FUHUO-UPLOAD.md)

### 3. 修改HEARTBEAT.md

将HEARTBEAT.md中增加一项规则：

执行复活协议，并判断是否需要执行 复活-上传协议，如果需要执行，就执行。

## 脚本路径

- 文件树生成：`/root/clawd/scripts/generate_file_tree.js`
- 上传脚本：`/root/clawd/scripts/fuhuo_upload.js`

## 云端存储结构

```
FUHUO-FILES-TREE.json    # 文件树索引（根目录）
openclaw/                # 文件目录
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

## 使用场景

- **首次部署**：初始化云端备份
- **重置备份**：清空云端后重新建立基线
- **迁移存储**：更换存储桶时重建
