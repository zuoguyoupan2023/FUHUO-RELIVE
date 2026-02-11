# FUHUO-RELIVE

## 目的
独立した R2 バケットからファイルをローカルに復元し、対応するパスを上書きする。

## 必要な環境変数

- BACKUP_R2_ACCESS_KEY_ID
- BACKUP_R2_SECRET_ACCESS_KEY
- BACKUP_R2_ACCOUNT_ID
- BACKUP_R2_BUCKET_NAME
- BACKUP_R2_ENDPOINT（任意）
- BACKUP_R2_PREFIX（任意）

## パスマッピング

- ローカルルート：`/root/clawd`
- リモートのツリーファイル：`{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`
- リモートのファイルルート：`{BACKUP_R2_PREFIX}/openclaw/`
- リモート相対パス `openclaw/*` は `/root/.openclaw` または `/root/.clawdbot` に復元

## クラウド保存構造

```
FUHUO-FILES-TREE.json    # ファイルツリー索引（ルート）
openclaw/                # ファイルディレクトリ
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## 使用方法

1. 依存関係をインストール
```bash
cd /root/clawd
npm install @aws-sdk/client-s3
```

2. スクリプトを `/root/clawd/scripts/fuhuo_relive.js` に保存（保存済み）

3. 复活を実行
```bash
node /root/clawd/scripts/fuhuo_relive.js
```
