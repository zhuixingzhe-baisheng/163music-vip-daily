# 网易云音乐自动任务脚本

[![GitHub](https://img.shields.io/github/v/tag/zhuixingzhe-baisheng/163music-vip-daily?label=version)](https://github.com/zhuixingzhe-baisheng/163music-vip-daily)
[![License](https://img.shields.io/github/license/zhuixingzhe-baisheng/163music-vip-daily)](LICENSE)

基于 **API Enhanced** 的网易云音乐自动任务工具，支持云贝签到、VIP 乐签打卡、VIP 成长值领取、VIP 音乐任务等功能。

> 🎉 **新功能：可视化 Web 管理界面已上线！** 无需配置，直接在浏览器中管理任务和账号。详见 [Web 管理界面](#-web-管理界面)

> 🐉 **使用青龙面板？** 请切换到 [qinglong 分支](https://github.com/zhuixingzhe-baisheng/163music-vip-daily/tree/qinglong)

---

## 🌐 Web 管理界面

### 快速启动

```bash
# 方式 1: 同时启动前端和 API 服务（推荐）
npm install -g concurrently
npm run dev:all

# 方式 2: 仅启动前端
cd frontend && npm run dev
```

访问：**http://localhost:3000**

### 功能特性

- 👤 **多账号管理** - 可视化添加/删除网易云音乐账号
- ⚙️ **任务配置** - 一键切换任务开关，实时保存配置
- 📋 **执行日志** - 查看任务执行历史和详细状态
- 🔧 **配置导入导出** - 方便备份和迁移配置
- 📱 **消息推送配置** - Server 酱、PushPlus 可视化配置

### 界面预览

| 页面 | 功能 |
|------|------|
| 首页 | 项目概览、快捷操作入口 |
| 账号配置 | 添加/删除账号、Cookie 获取教程、配置导入导出 |
| 任务管理 | 7 个任务开关、VIP 高级参数、推送渠道配置 |
| 执行日志 | 历史记录、执行详情、日志导出 |

详细说明请参考 [frontend/README.md](./frontend/README.md)

---

## 🚀 快速开始

### 步骤 1: 拉取仓库

```bash
git clone https://github.com/zhuixingzhe-baisheng/163music-vip-daily.git
cd 163music-vip-daily
```

### 步骤 2: 安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 步骤 3: 安装依赖

```bash
npm install
```

### 步骤 4: 配置账号（二选一）

**方式 A: 环境变量（推荐）**

```bash
export NETEASE_MUSIC_U="MUSIC_U=你的 cookie 值"
```

**方式 B: 配置文件**

```bash
cp config_example.json config.json
# 编辑 config.json 填入 MUSIC_U cookie
```

### 步骤 5: 运行

```bash
node auto_tasks_enhanced.js
```

---

## 📋 功能特性

| 功能 | 状态 | 说明 |
|------|------|------|
| 云贝签到 | ✅ | 每日云贝签到（安卓端 + PC 端） |
| VIP 乐签打卡 | ✅ | VIP 用户每日乐签打卡 |
| VIP 成长值领取 | ✅ | 自动领取已完成任务的成长值 |
| VIP 音乐任务 | ✅ | 收藏歌曲 + 听歌记录 + 领取成长值 |
| 自动发布动态 | ✅ | 每日自动分享歌曲到动态 |

---

## ⚙️ 配置说明

### 方式 A: 环境变量

#### 临时配置（当前会话）

```bash
export NETEASE_MUSIC_U="MUSIC_U=你的 cookie 值"
export NETEASE_NICKNAME="我的账号"          # 可选
export SERVER_SENDKEY="SCTxxxxxxxx"         # 可选，Server 酱推送
export PUSHPLUS_TOKEN="你的 token"          # 可选，PushPlus 推送
```

#### 永久配置（推荐）

```bash
cat >> ~/.bashrc << 'EOF'
export NETEASE_MUSIC_U="MUSIC_U=你的 cookie 值"
export NETEASE_NICKNAME="我的账号"
export SERVER_SENDKEY="SCTxxxxxxxx"
export PUSHPLUS_TOKEN="你的 token"
EOF
source ~/.bashrc
```

### 方式 B: 配置文件

编辑 `config.json`：

```json
{
  "users": [
    {
      "nickname": "主账号",
      "cookie": "MUSIC_U=xxxxxxxxxxxxx"
    }
  ],
  "enableYunbeiSign": true,
  "enableYunbeiSignPC": true,
  "enableVipSign": true,
  "enableVipGrowthpoint": true,
  "enableVipMusicTasks": true
}
```

### 获取 MUSIC_U Cookie

1. 访问 https://music.163.com 并登录
2. 按 F12 打开开发者工具
3. 进入 **Application** → **Cookies** → https://music.163.com
4. 复制 `MUSIC_U` 的值
5. 填入配置：`MUSIC_U=复制的值`

---

## 📱 消息推送

### Server 酱

1. 访问 https://sct.ftqq.com/ 获取 SendKey
2. 配置：`export SERVER_SENDKEY="SCTxxxxxxxx"`

### PushPlus

1. 访问 http://www.pushplus.plus/doc/guide/web.html 获取 Token
2. 配置：
```bash
export PUSHPLUS_TOKEN="你的 token"
export PUSHPLUS_CHANNEL="wechat"  # wechat, wechatcp, corp, webhook, sms
```

---

## 🚀 高级用法

### PM2 后台运行

```bash
npm install -g pm2
pm2 start auto_tasks_enhanced.js --name "netease-tasks"
pm2 startup
pm2 save
```

### 定时任务

**方法 1: PM2 定时任务（推荐）**

```bash
# 启动并设置定时重启
export NETEASE_MUSIC_U="MUSIC_U=你的 cookie"
pm2 start auto_tasks_enhanced.js --name "netease-tasks" --cron-restart="0 8 * * *"
pm2 save
```

**方法 2: Crontab 定时任务**

```bash
# 编辑 crontab
crontab -e

# 添加任务（每天早上 8:00 执行）
0 8 * * * cd /path/to/163music-vip-daily && /usr/bin/node auto_tasks_enhanced.js >> /path/to/logs/netease.log 2>&1
```

**常用 Cron 时间：**
- `0 8 * * *` - 每天早上 8:00
- `0 20 * * *` - 每天晚上 8:00
- `0 */6 * * *` - 每 6 小时

### 消息推送

**环境变量方式：** 为每个账号创建独立脚本

**配置文件方式：**
```json
{
  "users": [
    {
      "nickname": "账号 1",
      "cookie": "MUSIC_U=xxxx1"
    },
    {
      "nickname": "账号 2",
      "cookie": "MUSIC_U=xxxx2"
    }
  ]
}
```

---

## 📁 项目文件

| 文件 | 用途 |
|------|------|
| `auto_tasks_enhanced.js` | 主脚本（支持环境变量和配置文件） |
| `package.json` | 项目配置和依赖 |
| `config.json` | 配置文件（需自行创建） |
| `config_example.json` | 配置文件示例 |
| `DEPLOY_LINUX.md` | Linux 环境变量部署指南 |
| `deploy_linux.sh` | Linux 自动化部署脚本 |
| `frontend/` | Web 管理界面源码（Vue 3 + Vite） |
| `api-server.js` | 前端 API 服务器 |

---

## 🔧 配置参数

### 功能开关

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `enableYunbeiSign` | true | 云贝签到（安卓端） |
| `enableYunbeiSignPC` | true | 云贝签到（PC 端） |
| `enableVipSign` | true | VIP 乐签打卡 |
| `enableVipGrowthpoint` | true | VIP 成长值领取 |
| `enableVipMusicTasks` | true | VIP 音乐任务 |
| `enableAutoPost` | true | 自动发布动态 |
| `deletePreviousPost` | true | 删除上次动态 |

### VIP 任务配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `vipMusicPlaylistId` | 8402996200 | 会员雷达歌单 ID |
| `vipMusicSongCount` | 3 | 处理歌曲数量 |
| `postPlaylistId` | 8402996200 | 发布动态歌单 ID |
| `postSongCount` | 1 | 每次发布歌曲数（1-3） |

---

## ⚠️ 注意事项

1. **Cookie 安全**：不要将 Cookie 提交到 Git 仓库
2. **请求频率**：脚本已内置延时，避免请求过快
3. **任务时效**：VIP 任务可能每天刷新，建议每天执行
4. **账号风控**：多账号建议设置更长的延时时间

---

## 🐛 故障排查

### Cookie 过期
**症状**：API 返回 401 或 400 错误  
**解决**：重新获取 Cookie 并更新配置

### VIP 音乐任务未执行
**症状**：日志中没有"执行 VIP 音乐任务"  
**解决**：检查配置 `enableVipMusicTasks: true`

### 无法领取成长值
**症状**：显示"暂无可领取的成长值"  
**解决**：正常状态，等待任务刷新（通常每天 0:00）

---

## 📄 相关文档

- [frontend/README.md](./frontend/README.md) - Web 管理界面使用说明
- [DEPLOY_LINUX.md](./DEPLOY_LINUX.md) - Linux 环境变量部署指南
- [DEPLOY.md](./DEPLOY.md) - 快速部署指南
- [qinglong 分支](https://github.com/zhuixingzhe-baisheng/163music-vip-daily/tree/qinglong) - 青龙面板版本

## 📖 参考资料

- API Enhanced: https://github.com/neteasecloudmusicapienhanced/api-enhanced
- npm 包：https://www.npmjs.com/package/@neteasecloudmusicapienhanced/api

## 📄 License

MIT

---

**最后更新**: 2026-06-01  
**维护状态**: ✅ 正常维护（含 Web 管理界面）
