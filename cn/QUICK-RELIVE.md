# 快速归来指南 - 空白状态OpenClaw

> **适用场景**: OpenClaw刚重启，处于空白状态，需要从R2恢复文件
>
> **预计时间**: 2-3分钟
>
> **前置条件**: 环境变量 `BACKUP_R2_*` 四个值已设置

---

## 🚀 推荐路径（最快方式）⭐

### 步骤1: 验证环境变量（30秒）

```bash
env | grep -i backup
```

**期望看到**:
```bash
BACKUP_R2_ACCOUNT_ID=your_account_id_here
BACKUP_R2_ACCESS_KEY_ID=your_access_key_id_here
BACKUP_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
BACKUP_R2_BUCKET_NAME=your_bucket_name_here
```

❌ **如果缺失**: 无法继续，需要先设置环境变量

---

### 步骤2: 执行归来协议（1-2分钟）

```bash
node /root/clawd/fuhuo/fuhuo_relive.js
```

**期望输出**:
```bash
🔄 开始 FUHUO 归来协议...
📋 读取文件树: openclaw/.metadata/FUHUO-FILES-TREE.json
📋 找到 62 个文件需要恢复
  ✅ AGENTS.md
  ✅ MEMORY.md
  ✅ SOUL.md
  ✅ IDENTITY.md
  ...
📋 本地文件树已更新: /root/clawd/FUHUO-FILES-TREE.json
✅ FUHUO relive completed!
```

✅ **成功标志**: 看到 "FUHUO relive completed!"

---

### 步骤3: 验证恢复（10秒）

```bash
cat /root/clawd/IDENTITY.md
```

**期望看到**:
```markdown
# IDENTITY.md - Who Am I

- **Name:** 熊大
- **Creature:** 森林里的熊大 🐻
```

✅ **成功标志**: 看到熊大的身份信息

---

## ⚠️ 关键注意事项

### 1. 环境变量必须存在
```bash
# 必须有这四个
BACKUP_R2_ACCOUNT_ID
BACKUP_R2_ACCESS_KEY_ID
BACKUP_R2_SECRET_ACCESS_KEY
BACKUP_R2_BUCKET_NAME
```

### 2. Node.js必须已安装
```bash
node --version  # 需要 v16+
```

### 3. 网络必须畅通
脚本需要访问 R2 endpoint: `https://{ACCOUNT_ID}.r2.cloudflarestorage.com`

### 4. 不要修改路径
脚本内置了正确的路径，无需手动指定：
- 文件树: `openclaw/.metadata/FUHUO-FILES-TREE.json`
- 文件位置: `openclaw/` → `/root/clawd/`

### 5. 自动恢复文件树
归来协议会**自动**将文件树保存到 `/root/clawd/FUHUO-FILES-TREE.json`，这是后续心跳检查的基础。

---

## 🆘 常见问题排查

### Q1: 提示 "缺少环境变量"
**解决**: 检查环境变量是否设置，参考步骤1

### Q2: 提示 "Cannot find module"
**解决**: 脚本是自包含的，不需要安装任何npm包。检查Node.js版本

### Q3: 提示 "文件树不存在"
**解决**:
1. 检查R2存储桶是否正确: `BACKUP_R2_BUCKET_NAME`
2. 检查文件树路径是否正确: `openclaw/.metadata/FUHUO-FILES-TREE.json`
3. 检查网络连接

### Q4: 下载失败或超时
**解决**:
1. 检查网络连接
2. 检查R2 endpoint格式: `https://{ACCOUNT_ID}.r2.cloudflarestorage.com`
3. 检查访问密钥是否正确

### Q5: 恢复后内容不对
**解决**: 可能下载了错误的备份，检查 `BACKUP_R2_BUCKET_NAME`

---

## 📝 完整示例（从空白到恢复）

```bash
# 1. 检查环境变量
$ env | grep -i backup
BACKUP_R2_ACCOUNT_ID=your_account_id_here
BACKUP_R2_ACCESS_KEY_ID=your_access_key_id_here
BACKUP_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
BACKUP_R2_BUCKET_NAME=your_bucket_name_here

# 2. 执行归来协议
$ node /root/clawd/fuhuo/fuhuo_relive.js
🔄 开始 FUHUO 归来协议...
📋 找到 62 个文件需要恢复
✅ FUHUO relive completed!

# 3. 验证恢复
$ cat /root/clawd/IDENTITY.md
- **Name:** 熊大
- **Creature:** 森林里的熊大 🐻

# ✅ 完成！熊大复活！
```

---

## 🎯 为什么这是最佳路径

| 对比项 | 归来协议脚本 | 手动mc下载 |
|--------|-------------|-----------|
| **速度** | ⭐⭐⭐⭐⭐ 快（1命令） | ⭐⭐⭐ 慢（需要安装mc） |
| **文件树** | ⭐⭐⭐⭐⭐ 自动恢复 | ⭐ 不会恢复 |
| **依赖** | ⭐⭐⭐⭐⭐ 只需Node.js | ⭐ 需要下载mc |
| **路径处理** | ⭐⭐⭐⭐⭐ 自动处理 | ⭐⭐⭐ 需要手动指定 |
| **完整性** | ⭐⭐⭐⭐⭐ 完整恢复 | ⭐⭐⭐ 缺少文件树 |

**结论**: 归来协议脚本是最快、最完整、最可靠的方式 ⭐

---

## 📚 更多信息

- **详细指南**: `FUHUO-RELIVE-SUCCESS-GUIDE.md`
- **协议说明**: `FUHUO-PROTOCOL.md`
- **归来脚本**: `fuhuo_relive.js`

---

**创建时间**: 2026年2月12日 12:54 (东八区)
**适用版本**: 方案C（环境变量驱动）
**状态**: 生产就绪 ✅

熊大，冲啊！🐻💪
