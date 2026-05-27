# Linux 环境变量部署指南

本文介绍如何在 Linux 服务器上使用环境变量的方式部署网易云音乐自动任务。

## 🎯 为什么使用环境变量？

- ✅ **安全性更高**：Cookie 不会写入配置文件，避免泄露风险
- ✅ **适合自动化**：便于 CI/CD 和脚本自动化部署
- ✅ **多账号管理**：可以配合不同的 shell 环境管理多个账号
- ✅ **配置灵活**：可以随时修改环境变量而不改动代码

## 📋 部署步骤

### 1. 准备环境

```bash
# 安装 Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Node.js (CentOS)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v
npm -v
```

### 2. 获取项目代码

```bash
# 方式 1: Git 克隆
git clone https://github.com/zhuixingzhe-baisheng/163music-vip-daily.git
cd 163music-vip-daily

# 方式 2: 下载后解压（本地部署）
cd /workspace
```

### 3. 安装依赖

```bash
npm install
```

### 4. 配置环境变量

#### 方式 A: 临时配置（当前会话有效）

```bash
export NETEASE_MUSIC_U="MUSIC_U=你的 cookie 值"
export SERVER_SENDKEY="SCTxxxxxxxx"      # 可选
export PUSHPLUS_TOKEN="你的 token"        # 可选
```

#### 方式 B: 永久配置（推荐）

编辑 `~/.bashrc` 或 `~/.profile`：

```bash
# 添加以下内容
export NETEASE_MUSIC_U="MUSIC_U=你的 cookie 值"
export NETEASE_NICKNAME="我的账号"        # 可选
export SERVER_SENDKEY="SCTxxxxxxxx"       # 可选
export PUSHPLUS_TOKEN="你的 token"        # 可选
export PUSHPLUS_CHANNEL="wechat"          # 可选
```

使配置生效：

```bash
source ~/.bashrc
```

#### 方式 C: 在脚本中使用 .env 文件

创建 `.env` 文件：

```bash
cat > .env << 'EOF'
export NETEASE_MUSIC_U="MUSIC_U=你的 cookie 值"
export SERVER_SENDKEY="SCTxxxxxxxx"
export PUSHPLUS_TOKEN="你的 token"
EOF

# 加载环境变量
source .env
```

### 5. 获取 MUSIC_U Cookie

1. 打开浏览器访问 https://music.163.com
2. 登录你的网易云音乐账号
3. 按 F12 打开开发者工具
4. 切换到 **Application** 标签（Chrome）或 **存储** 标签（Firefox）
5. 展开左侧 **Cookies** → https://music.163.com
6. 找到 `MUSIC_U`，复制它的值
7. 填入环境变量：`MUSIC_U=复制的值`

### 6. 测试运行

```bash
node auto_tasks_enhanced.js
```

如果看到任务正常执行，说明配置成功！

### 7. 设置定时任务（Cron）

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天早上 8:00 执行）
0 8 * * * cd /path/to/163music-vip-daily && /usr/bin/node auto_tasks_enhanced.js >> /path/to/logs/netease.log 2>&1

# 或者使用环境变量文件的方式
0 8 * * * cd /path/to/163music-vip-daily && source .env && /usr/bin/node auto_tasks_enhanced.js >> /path/to/logs/netease.log 2>&1
```

### 8. 后台运行（PM2）

```bash
# 安装 PM2
npm install -g pm2

# 启动任务
pm2 start auto_tasks_enhanced.js --name "netease-tasks"

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs netease-tasks

# 查看状态
pm2 status
```

## 📱 消息推送配置

### Server 酱推送

1. 访问 https://sct.ftqq.com/
2. 登录并获取 SendKey
3. 设置环境变量：

```bash
export SERVER_SENDKEY="SCTxxxxxxxx"
```

### PushPlus 推送

1. 访问 http://www.pushplus.plus/doc/guide/web.html
2. 登录并获取 Token
3. 设置环境变量：

```bash
export PUSHPLUS_TOKEN="你的 token"
export PUSHPLUS_CHANNEL="wechat"  # 可选：wechat, wechatcp, corp, webhook, sms
export PUSHPLUS_WEBHOOK="https://your-webhook.com/xxx"  # channel 为 webhook 时填写
```

## 🎯 多账号配置

使用环境变量方式时，如需支持多账号，可以通过创建多个脚本来实现：

**脚本 1: run_account1.sh**

```bash
#!/bin/bash
export NETEASE_MUSIC_U="MUSIC_U=账号 1 的 cookie"
export NETEASE_NICKNAME="账号 1"
cd /path/to/project && node auto_tasks_enhanced.js
```

**脚本 2: run_account2.sh**

```bash
#!/bin/bash
export NETEASE_MUSIC_U="MUSIC_U=账号 2 的 cookie"
export NETEASE_NICKNAME="账号 2"
cd /path/to/project && node auto_tasks_enhanced.js
```

然后分别为每个脚本设置定时任务。

## ⚙️ 完整的环境变量列表

| 变量名 | 必填 | 说明 | 示例 |
|--------|------|------|------|
| `NETEASE_MUSIC_U` | ✅ | 网易云 MUSIC_U cookie | `MUSIC_U=xxxxx` |
| `MUSIC_U` | ✅ | 同上（替代名称） | `MUSIC_U=xxxxx` |
| `NETEASE_NICKNAME` | ❌ | 用户昵称 | `我的账号` |
| `SERVER_SENDKEY` | ❌ | Server 酱 SendKey | `SCTxxxxxxxx` |
| `SERVER_CHAN_SENDKEY` | ❌ | 同上（替代名称） | `SCTxxxxxxxx` |
| `PUSHPLUS_TOKEN` | ❌ | PushPlus Token | `xxxxxxxxx` |
| `PUSH_PLUS_TOKEN` | ❌ | 同上（替代名称） | `xxxxxxxxx` |
| `PUSHPLUS_CHANNEL` | ❌ | PushPlus 渠道 | `wechat` |
| `PUSHPLUS_WEBHOOK` | ❌ | PushPlus Webhook | `https://...` |

## 🐛 故障排查

### 问题 1: 提示未找到配置文件

**症状：** 运行脚本提示 "未找到 config.json 配置文件，也未设置环境变量"

**解决：**

```bash
# 检查环境变量是否设置
echo $NETEASE_MUSIC_U

# 如果没有输出，说明环境变量未设置
# 重新设置环境变量
export NETEASE_MUSIC_U="MUSIC_U=你的 cookie"
```

### 问题 2: Cookie 过期

**症状：** API 返回 401 或 400 错误

**解决：**

1. 重新获取 Cookie（参考"获取 MUSIC_U Cookie"章节）
2. 更新环境变量：

```bash
export NETEASE_MUSIC_U="MUSIC_U=新的 cookie 值"
source ~/.bashrc
```

### 问题 3: 推送未收到

**症状：** 日志显示推送失败

**解决：**

```bash
# 检查推送配置
echo $SERVER_SENDKEY
echo $PUSHPLUS_TOKEN

# 如果没有输出，说明环境变量未设置
# 重新设置推送环境变量
```

## ⚠️ 注意事项

1. **Cookie 安全**: 不要将 Cookie 提交到 Git 仓库或公开分享
2. **环境变量保密**: 确保 `.bashrc` 等配置文件权限正确（600）
3. **请求频率**: 脚本已内置延时，避免请求过快导致封禁
4. **日志管理**: 定期清理日志文件，避免占用过多磁盘空间
5. **账号风控**: 多账号建议设置更长的延时时间

## 📄 相关文件

- `auto_tasks_enhanced.js` - 主脚本（支持环境变量）
- `deploy_linux.sh` - Linux 快速部署脚本
- `config_example.json` - 配置文件示例（配置文件方式使用时参考）
- `README.md` - 完整项目文档

---

**最后更新**: 2026-05-27
