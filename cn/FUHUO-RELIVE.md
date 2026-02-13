# FUHUO-RELIVE - 归来协议

## 目标
从独立 R2 存储桶恢复文件到本地，覆盖本地对应路径。

## 步骤 1：验证环境变量（必须先执行）⚠️

在执行归来协议之前，**必须先确认环境变量是否存在**：

```bash
env | grep BACKUP_R2
```

**期望输出**（应该看到这4个变量）：
```bash
BACKUP_R2_ACCOUNT_ID=409198b57859944e8c4277c5a4236cb0
BACKUP_R2_ACCESS_KEY_ID=d4f72e7ac3ff0055a6cab1301e826309
BACKUP_R2_SECRET_ACCESS_KEY=81501e66f09be1abde87f9e41d2ffbee507db07ad95a10cc668cdd154c8e90f3
BACKUP_R2_BUCKET_NAME=openclawbotonline-data-2
```

### 🔴 如果输出为空

**说明环境变量未设置**，需要先获取这些值：
- 检查系统配置文件（`/etc/environment`、`~/.bashrc`、`~/.zshrc`）
- 检查 OpenClaw 配置（`/root/.openclaw/openclaw.json`）
- 或询问用户获取这些变量的值

### 🟢 如果看到这4个变量

✅ **可以继续执行归来协议**，进入步骤2。

---

## 环境变量说明

必需的4个变量：

| 变量名 | 用途 | 示例值 |
|--------|------|--------|
| `BACKUP_R2_ACCOUNT_ID` | Cloudflare 账户ID | `409198b57859944e8c4277c5a4236cb0` |
| `BACKUP_R2_ACCESS_KEY_ID` | R2 访问密钥ID | `d4f72e7ac3ff0055a6cab1301e826309` |
| `BACKUP_R2_SECRET_ACCESS_KEY` | R2 访问密钥 | `81501e66f09be1abde87f9e41d2ffbee507db07ad95a10cc668cdd154c8e90f3` |
| `BACKUP_R2_BUCKET_NAME` | R2 存储桶名称 | `openclawbotonline-data-2` |

可选变量：

- `BACKUP_R2_ENDPOINT`（可选）- R2 端点，默认自动生成
- `BACKUP_R2_PREFIX`（可选）- R2 路径前缀，默认为根目录

---

## 步骤 2：执行归来协议

## 路径映射

- 本地根目录：`/root/clawd`
- 远端树文件：`{BACKUP_R2_PREFIX}/FUHUO-FILES-TREE.json`
- 远端文件根：`{BACKUP_R2_PREFIX}/openclaw/`
- 映射规则：
  - 远端 `openclaw/xxx` → 本地 `/root/clawd/xxx`
  - 远端 `openclaw/_config/yyy` → 本地 `/root/.openclaw/yyy` 或 `/root/.clawdbot/yyy`

## 云端存储结构

```
FUHUO-FILES-TREE.json    # 文件树索引（根目录）
openclaw/                # 文件目录
├── AGENTS.md
├── scripts/
├── config/
└── ...
```

### 执行归来协议

```bash
node /root/clawd/fuhuo/fuhuo_relive.js
```

**期望输出**：
```bash
🔄 开始 FUHUO 归来协议...
📦 存储桶: openclawbotonline-data-2
📋 读取文件树: openclaw/.metadata/FUHUO-FILES-TREE.json
📋 找到 107 个文件需要恢复
  ✅ AGENTS.md
  ✅ MEMORY.md
  ✅ SOUL.md
  ✅ IDENTITY.md
  ...
✅ FUHUO relive completed!
```

### 步骤 3：验证恢复

```bash
cat /root/clawd/IDENTITY.md
```

**期望看到**：
```markdown
# IDENTITY.md - Who Am I

- **Name:** 熊大
- **Creature:** 森林里的熊大 🐻
```

✅ **成功标志**: 看到熊大的身份信息

---

## AI 执行流程（重要）

```
┌─────────────────────────────────────┐
│  用户指令："执行归来协议"            │
└─────────────────┬───────────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │ 步骤1：检查环境   │
        │ env | grep R2    │
        └────────┬─────────┘
                 │
         ┌───────┴───────┐
         │               │
    有变量 ❓          无变量
         │               │
         ▼               ▼
   执行归来协议      询问用户获取
         │         环境变量值
         ▼
   node relive.js
         │
         ▼
    ✅ 恢复完成
```

**关键原则**：
1. ✅ **先检查环境变量**（`env | grep BACKUP_R2`）
2. ✅ **有变量就继续**，不要问用户
3. ❌ **无变量才询问**用户获取

---

## 使用方式（快速版本）

### 一键归来（推荐）

```bash
# 方法1：使用 fuhuo.me（最简单）
curl -fsSL https://fuhuo.me/cn/fuhuo_relive.js | node -

# 方法2：使用本地脚本
node /root/clawd/fuhuo/fuhuo_relive.js
```

**说明**：
- ✅ 只依赖 Node.js 内置模块
- ✅ 无需 `npm install`
- ✅ 自动从 R2 恢复文件
- ✅ 自动恢复文件树

---

## 路径映射
