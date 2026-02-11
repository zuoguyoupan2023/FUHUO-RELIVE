# FUHUO-BIRTH

## 目的
ローカルとクラウドの両方に `FUHUO-FILES-TREE.json` が存在しない場合、基準のファイルツリーを生成し、クラウドの基準を初期化する。

## 対象範囲

デフォルトでスキャンし、ファイルツリーを生成（path/hash/size/mtimeMs を記録）：
- `/root/clawd/core`
- `/root/clawd/skills`
- `/root/clawd/scripts`
- `/root/clawd/config`
- `/root/clawd/memory`
- `/root/clawd/fuhuo`
- `/root/.openclaw/openclaw.json` または `/root/.clawdbot/clawdbot.json`
- `/root/clawd/*.md` コアファイル（AGENTS/IDENTITY/MEMORY/SOUL/USER/TOOLS/HEARTBEAT/MAIL-NEWS-MEMORY）

除外ディレクトリ：
- `.git`
- `node_modules`

## 実行手順

### 1. ローカルのファイルツリーを生成

```bash
node /root/clawd/scripts/generate_file_tree.js
```

### 2. 上传协议 を実行

```bash
node /root/clawd/scripts/fuhuo_upload.js
```

参照：[FUHUO-UPLOAD.md](./FUHUO-UPLOAD.md)

### 3. HEARTBEAT.md を修正

HEARTBEAT.md にルールを追加：

复活协议 を実行し、复活-上传 を実行する必要があるか判断し、必要なら実行する。

## スクリプトのパス

- ファイルツリー生成：`/root/clawd/scripts/generate_file_tree.js`
- 上传スクリプト：`/root/clawd/scripts/fuhuo_upload.js`

## クラウド保存構造

```
FUHUO-FILES-TREE.json    # ファイルツリー索引（ルート）
openclaw/                # ファイルディレクトリ
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

## 使用シーン

- **初回デプロイ**：クラウドバックアップを初期化
- **バックアップのリセット**：クラウドを消して基準を再作成
- **ストレージ移行**：バケット変更時に再構築
