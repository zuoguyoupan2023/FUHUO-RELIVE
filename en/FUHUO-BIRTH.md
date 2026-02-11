# FUHUO-BIRTH

## Goal
When `FUHUO-FILES-TREE.json` does not exist locally or in the cloud, generate a baseline file tree and initialize the cloud baseline.

## Scope

Default scan targets (record path/hash/size/mtimeMs):
- `/root/clawd/core`
- `/root/clawd/skills`
- `/root/clawd/scripts`
- `/root/clawd/config`
- `/root/clawd/memory`
- `/root/clawd/fuhuo`
- `/root/.openclaw/openclaw.json` or `/root/.clawdbot/clawdbot.json`
- `/root/clawd/*.md` core files (AGENTS/IDENTITY/MEMORY/SOUL/USER/TOOLS/HEARTBEAT/MAIL-NEWS-MEMORY)

Excluded directories:
- `.git`
- `node_modules`

## Steps

### 1. Generate the local file tree

```bash
node /root/clawd/scripts/generate_file_tree.js
```

### 2. Execute Upload protocol

```bash
node /root/clawd/scripts/fuhuo_upload.js
```

Reference: [FUHUO-UPLOAD.md](./FUHUO-UPLOAD.md)

### 3. Modify HEARTBEAT.md

Add a rule to HEARTBEAT.md:

Execute the Relive protocol and decide whether to run the Relive-Upload protocol; if needed, run it.

## Script paths

- File tree generation: `/root/clawd/scripts/generate_file_tree.js`
- Upload script: `/root/clawd/scripts/fuhuo_upload.js`

## Cloud storage structure

```
FUHUO-FILES-TREE.json    # File tree index (root)
openclaw/                # File directory
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

## Use cases

- **First deployment**: initialize cloud backup
- **Reset backup**: rebuild baseline after clearing the cloud
- **Storage migration**: rebuild when switching buckets
