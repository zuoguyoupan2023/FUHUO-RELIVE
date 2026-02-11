# FUHUO-PROTOCOL

## Goal
When the container starts or at key checkpoints, automatically decide whether to execute one of the Birth, Upload, or Relive sub-protocols.

## Entry checks

1. Whether `FUHUO-FILES-TREE.json` exists in the local root (default: `/root/clawd/FUHUO-FILES-TREE.json`)

2. Whether the following environment variables can be read and are not empty:

   - BACKUP_R2_ACCOUNT_ID
   - BACKUP_R2_ACCESS_KEY_ID
   - BACKUP_R2_SECRET_ACCESS_KEY
   - BACKUP_R2_BUCKET_NAME

3. If checks fail, output the full check results to the human

## Cloud check

Read `FUHUO-FILES-TREE.json` in the bucket specified by BACKUP_R2_BUCKET_NAME (default: `{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`, or `FUHUO-FILES-TREE.json` when no prefix), and compare with the local `FUHUO-FILES-TREE.json`. If the remote file does not exist, treat it as a difference.

## Cloud storage structure

```
FUHUO-FILES-TREE.json    # File tree index (root)
openclaw/                # File directory
├── AGENTS.md            # Maps to /root/clawd/AGENTS.md
├── IDENTITY.md          # Maps to /root/clawd/IDENTITY.md
├── MEMORY.md            # Maps to /root/clawd/MEMORY.md
├── SOUL.md              # Maps to /root/clawd/SOUL.md
├── USER.md              # Maps to /root/clawd/USER.md
├── TOOLS.md             # Maps to /root/clawd/TOOLS.md
├── HEARTBEAT.md         # Maps to /root/clawd/HEARTBEAT.md
├── MAIL-NEWS-MEMORY.md  # Maps to /root/clawd/MAIL-NEWS-MEMORY.md
├── config/              # Maps to /root/clawd/config/
├── scripts/             # Maps to /root/clawd/scripts/
├── skills/              # Maps to /root/clawd/skills/
├── fuhuo/               # Maps to /root/clawd/fuhuo/
└── _config/             # Maps to /root/.openclaw/ or /root/.clawdbot/
    └── openclaw.json
```

## Select sub-protocol

- No local and no remote `FUHUO-FILES-TREE.json`: execute **Birth** protocol FUHUO-BIRTH.md
- Local exists and remote missing: execute **Upload** protocol FUHUO-UPLOAD.md
- Both local and remote exist:
  - Differences present:
    - If remote file count > local file count: execute **Relive** protocol FUHUO-RELIVE.md
    - Otherwise (local count greater or equal): execute **Upload** protocol FUHUO-UPLOAD.md
  - No differences: do not upload
- Local missing and remote exists: execute **Relive** protocol FUHUO-RELIVE.md

### Decision logic details

When both local and remote trees exist but differ, decide by comparing file counts:

| Scenario | Local file count | Remote file count | Protocol |
|----------|------------------|-------------------|----------|
| Remote has more | 49 | 50 | Relive |
| Local has more | 50 | 49 | Upload |
| Same count, different contents | 49 | 49 | Upload |

**Rationale**:
- Remote has more → local might be missing after a restart, restore from cloud
- Local has more → local has new files, back up to cloud
- Same count but different contents → local files changed, upload new versions
