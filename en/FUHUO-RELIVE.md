# FUHUO-RELIVE

## Goal
Restore files from an independent R2 bucket to local, overwriting the corresponding local paths.

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
- Remote relative path `openclaw/*` restores to `/root/.openclaw` or `/root/.clawdbot`

## Cloud storage structure

```
FUHUO-FILES-TREE.json    # File tree index (root)
openclaw/                # File directory
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## Usage

1. Install dependencies
```bash
cd /root/clawd
npm install @aws-sdk/client-s3
```

2. Save the script as `/root/clawd/scripts/fuhuo_relive.js` (already saved)

3. Execute Relive
```bash
node /root/clawd/scripts/fuhuo_relive.js
```
