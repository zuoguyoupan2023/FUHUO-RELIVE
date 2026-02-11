# FUHUO-PROTOCOL

## 目的
コンテナ起動や重要タイミングで、出生・上传・复活のいずれかの子プロトコルを自動判定して実行する。

## 入口チェック

1. ローカルのルートに `FUHUO-FILES-TREE.json` が存在するか（デフォルト：`/root/clawd/FUHUO-FILES-TREE.json`）

2. 以下の環境変数が読み取れ、空でないか：

   - BACKUP_R2_ACCOUNT_ID
   - BACKUP_R2_ACCESS_KEY_ID
   - BACKUP_R2_SECRET_ACCESS_KEY
   - BACKUP_R2_BUCKET_NAME

3. 失敗した場合、完全なチェック結果を人間へ出力する

## クラウドチェック

BACKUP_R2_BUCKET_NAME のバケットから `FUHUO-FILES-TREE.json` を読み込み（デフォルト：`{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`、プレフィックス無しの場合は `FUHUO-FILES-TREE.json`）、ローカルの `FUHUO-FILES-TREE.json` と比較する。リモートが存在しない場合も差分とみなす。

## クラウド保存構造

```
FUHUO-FILES-TREE.json    # ファイルツリー索引（ルート）
openclaw/                # ファイルディレクトリ
├── AGENTS.md            # /root/clawd/AGENTS.md に対応
├── IDENTITY.md          # /root/clawd/IDENTITY.md に対応
├── MEMORY.md            # /root/clawd/MEMORY.md に対応
├── SOUL.md              # /root/clawd/SOUL.md に対応
├── USER.md              # /root/clawd/USER.md に対応
├── TOOLS.md             # /root/clawd/TOOLS.md に対応
├── HEARTBEAT.md         # /root/clawd/HEARTBEAT.md に対応
├── MAIL-NEWS-MEMORY.md  # /root/clawd/MAIL-NEWS-MEMORY.md に対応
├── config/              # /root/clawd/config/ に対応
├── scripts/             # /root/clawd/scripts/ に対応
├── skills/              # /root/clawd/skills/ に対応
├── fuhuo/               # /root/clawd/fuhuo/ に対応
└── _config/             # /root/.openclaw/ または /root/.clawdbot/ に対応
    └── openclaw.json
```

## 子プロトコルの選択

- ローカルにもリモートにも `FUHUO-FILES-TREE.json` がない：**出生协议** FUHUO-BIRTH.md を実行
- ローカルにありリモートにない：**上传协议** FUHUO-UPLOAD.md を実行
- 両方にある：
  - 差分あり：
    - リモートのファイル数 > ローカルのファイル数：**复活协议** FUHUO-RELIVE.md を実行
    - それ以外（ローカルが多いまたは同数）：**上传协议** FUHUO-UPLOAD.md を実行
  - 差分なし：Upload を実行しない
- ローカルになくリモートにある：**复活协议** FUHUO-RELIVE.md を実行

### 判定ロジックの詳細

ローカルとリモートの両方にツリーがあるが差分がある場合、ファイル数で判断する：

| シナリオ | ローカル数 | リモート数 | 実行プロトコル |
|----------|------------|------------|----------------|
| リモートが多い | 49 | 50 | 复活协议 |
| ローカルが多い | 50 | 49 | 上传协议 |
| 同数だが内容が違う | 49 | 49 | 上传协议 |

**理由**：
- リモートが多い → 再起動後にローカルが欠損の可能性、クラウドから復元
- ローカルが多い → ローカルに新規ファイルがあるためクラウドへ保存
- 同数だが差分あり → ローカル内容が変更、更新版をアップロード
