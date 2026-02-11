# FUHUO-UPLOAD

## Goal
Generate the local `FUHUO-FILES-TREE.json` and perform differential upload and delete sync.

## Required environment variables

- BACKUP_R2_ACCESS_KEY_ID
- BACKUP_R2_SECRET_ACCESS_KEY
- BACKUP_R2_ACCOUNT_ID
- BACKUP_R2_BUCKET_NAME
- BACKUP_R2_ENDPOINT (optional)
- BACKUP_R2_PREFIX (optional)

## Path mapping

- Local root: `/root/clawd`
- Remote tree file: `{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`
- Remote file root: `{BACKUP_R2_PREFIX}/openclaw/`
- Mapping rules:
  - Local `/root/clawd/xxx` → Remote `openclaw/xxx`
  - Local `/root/.openclaw/yyy` or `/root/.clawdbot/yyy` → Remote `openclaw/_config/yyy`

## Cloud storage structure

```
FUHUO-FILES-TREE.json    # File tree index (root)
openclaw/                # File directory
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## Diff strategy

- New files: upload
- Content changes: upload based on hash changes
- Deleted locally: delete remotely

## Usage

1. Install dependencies
```bash
cd /root/clawd
npm install @aws-sdk/client-s3
```

2. Save the script as `/root/clawd/scripts/fuhuo_upload.js` (already saved)

3. Execute Upload
```bash
node /root/clawd/scripts/fuhuo_upload.js
```
