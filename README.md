# 网易云音乐自动任务 - Web 管理版

[![GitHub](https://img.shields.io/github/v/tag/zhuixingzhe-baisheng/163music-vip-daily?label=version)](https://github.com/zhuixingzhe-baisheng/163music-vip-daily)
[![License](https://img.shields.io/github/license/zhuixingzhe-baisheng/163music-vip-daily)](LICENSE)

> 📦 基于 API Enhanced 的网易云音乐自动任务工具，配备可视化 Web 管理界面  
> 🎯 专注于每日自动任务：云贝签到、VIP 打卡、成长值领取、自动发动态

---

## ✨ 功能特性

### 自动化任务
| 功能 | 说明 |
|------|------|
| ☁️ 云贝签到 | 每日安卓端 + PC 端云贝签到 |
| 🎫 VIP 乐签打卡 | VIP 用户每日打卡 |
| 📈 VIP 成长值领取 | 自动领取已完成任务的成长值 |
| 🎵 VIP 音乐任务 | 收藏歌曲 + 听歌记录 + 领取成长值 |
| 📱 自动发布动态 | 每日自动分享歌曲到动态 |

### Web 管理界面
- 👤 **多账号管理** - 可视化添加/删除账号，支持配置导入导出
- ⚙️ **任务配置** - 一键切换任务开关，实时保存配置
- 🔔 **消息推送** - Server 酱、PushPlus 可视化配置
- 📝 **完整日志** - 执行日志自动保存，可追溯历史

---

## 🚀 快速开始

### 方式一：一键部署（推荐）

```bash
# 1. 拉取仓库
git clone https://github.com/zhuixingzhe-baisheng/163music-vip-daily.git
cd 163music-vip-daily

# 2. 安装依赖
npm install

# 3. 同时启动前端和 API 服务
npm run dev:all
```

访问：**http://localhost:3000**

### 方式二：单独启动

```bash
# 启动前端
cd frontend && npm run dev

# 启动 API 服务（新窗口）
npm run api
```

---

## 📋 使用步骤

### 1. 配置账号

1. 访问 http://localhost:3000/config
2. 点击「添加账号」
3. 填入账号昵称和 MUSIC_U Cookie

### 2. 获取 Cookie

1. 访问 https://music.163.com 并登录
2. 按 F12 打开开发者工具
3. 进入 **Network** → 刷新页面 → 点击任意请求 → **Headers**
4. 找到 `Cookie: MUSIC_U=xxxxxxxxx`
5. 复制 `MUSIC_U=xxxxxxxxx` 填入配置

### 3. 配置任务开关

访问 http://localhost:3000/settings，根据需要开启/关闭任务。

### 4. 配置消息推送（可选）

可选推送渠道：
- **Server 酱** - 微信推送（https://sct.ftqq.com/）
- **PushPlus** - 微信公众号/企业微信/短信/Webhook

---

## ⚙️ 运行模式

### 前台运行（适合调试）

```bash
# 同时启动前后端
npm run dev:all
```

### 后台运行（推荐使用 PM2）

```bash
# 安装 PM2
npm install -g pm2

# 启动所有服务
pm2 start ecosystem.config.js

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup
```

### 定时执行（PM2）

编辑 `ecosystem.config.js`，添加 `cron_restart`：

```javascript
{
  name: 'netease-tasks',
  script: './auto_tasks_enhanced.js',
  cron_restart: '0 8 * * *', // 每天早上 8:00 执行
  env: {
    NETEASE_MUSIC_U: 'MUSIC_U=你的 cookie'
  }
}
```

---

## 📁 项目结构

```
163music-vip-daily/
├── frontend/              # Vue 3 前端项目
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   ├── stores/       # 状态管理
│   │   └── router/       # 路由配置
│   └── package.json
├── api-server.js          # API 服务器
├── auto_tasks_enhanced.js # 核心任务脚本
├── ecosystem.config.js    # PM2 配置
├── config.json            # 用户配置（自动生成）
├── logs.json              # 执行日志（自动生成）
└── package.json           # 项目配置
```

---

## ⚙️ 配置参数

### 任务开关

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `enableYunbeiSign` | true | 云贝签到（安卓端） |
| `enableYunbeiSignPC` | true | 云贝签到（PC 端） |
| `enableVipSign` | true | VIP 乐签打卡 |
| `enableVipGrowthpoint` | true | VIP 成长值领取 |
| `showVipTaskList` | true | 显示 VIP 任务列表 |
| `enableVipMusicTasks` | true | VIP 音乐任务 |
| `enableAutoPost` | true | 自动发布动态 |
| `deletePreviousPost` | true | 删除上次动态 |

### VIP 高级配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `vipMusicPlaylistId` | 8402996200 | 会员雷达歌单 ID |
| `vipMusicSongCount` | 3 | 处理歌曲数量（1-10） |
| `postPlaylistId` | 8402996200 | 发布动态歌单 ID |
| `postSongCount` | 1 | 每次发布歌曲数（1-3） |

---

## 📱 消息推送

### Server 酱

1. 访问 https://sct.ftqq.com/ 获取 SendKey
2. Web 界面选择渠道：Server 酱
3. 填入 SendKey（格式：SCTxxxxxxxx）

### PushPlus

1. 访问 https://pushplus.plus/ 获取 Token
2. Web 界面选择推送渠道
3. 填入 Token 和可选的 Webhook 地址

---

## 🔧 故障排查

### 端口被占用

```bash
# 查看占用进程
pm2 list

# 删除 PM2 进程
pm2 delete all

# 或使用其他端口
PORT=3002 node api-server.js
```

### Cookie 过期

**症状**：API 返回 401/400  
**解决**：重新获取 Cookie 并在 Web 界面更新

### 依赖未安装

**症状**：启动检查失败  
**解决**：
```bash
npm install
```

---

## 📄 License

MIT

---

## 📝 相关文档

- [frontend/README.md](./frontend/README.md) - Web 前端详细说明
- [DEPLOY_LINUX.md](./DEPLOY_LINUX.md) - Linux 环境变量配置指南

---

**最后更新**: 2026-06-01
