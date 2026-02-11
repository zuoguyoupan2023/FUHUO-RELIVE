# FUHUO-UPLOAD

## 目的
ローカルの `FUHUO-FILES-TREE.json` を生成し、差分アップロードと削除同期を行う。

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
- マッピング規則：
  - ローカル `/root/clawd/xxx` → リモート `openclaw/xxx`
  - ローカル `/root/.openclaw/yyy` または `/root/.clawdbot/yyy` → リモート `openclaw/_config/yyy`

## クラウド保存構造

```
FUHUO-FILES-TREE.json    # ファイルツリー索引（ルート）
openclaw/                # ファイルディレクトリ
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

## 差分戦略

- 新規ファイル：アップロード
- 内容変更：hash の差分でアップロード
- ローカル削除：リモートも同期削除

## 使用方法

1. 依存関係をインストール
```bash
cd /root/clawd
npm install @aws-sdk/client-s3
```

2. スクリプトを `/root/clawd/scripts/fuhuo_upload.js` に保存（保存済み）

3. 上传を実行
```bash
node /root/clawd/scripts/fuhuo_upload.js
```
