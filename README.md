# 网易云音乐自动任务

[![GitHub](https://img.shields.io/github/v/tag/zhuixingzhe-baisheng/163music-vip-daily?label=version)](https://github.com/zhuixingzhe-baisheng/163music-vip-daily)
[![License](https://img.shields.io/github/license/zhuixingzhe-baisheng/163music-vip-daily)](LICENSE)

> 📦 基于 API Enhanced 的网易云音乐自动任务工具  
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

### 特性
- 🔌 **SDK 直连** - 直接使用 SDK API，无需 HTTP 服务器
- 📝 **完整日志** - 执行日志自动保存
- 🔔 **消息推送** - Server 酱、PushPlus 支持

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置账号

复制配置文件：
```bash
cp config_example.json config.json
```

编辑 `config.json`，添加你的 MUSIC_U Cookie：
```json
{
  "users": [
    {
      "nickname": "测试用户",
      "cookie": "MUSIC_U=xxxxxxxxx"
    }
  ],
  "enableYunbeiSign": true,
  "enableYunbeiSignPC": true,
  "enableVipSign": true,
  "enableVipGrowthpoint": true,
  "enableVipMusicTasks": true,
  "enableAutoPost": true
}
```

### 3. 更新 Cookie

Cookie 过期时，使用以下任一方法更新：

**方法 1：使用更新脚本**
```bash
./update_cookie.sh "MUSIC_U=你的新 cookie"
```

**方法 2：使用 sed 命令**
```bash
sed -i 's/\("cookie": "MUSIC_U=\)[^"]*/\1新的 cookie/g' config.json
```

**方法 3：手动编辑**
```bash
nano config.json  # 或使用 vim 等编辑器
```

### 4. 运行任务

```bash
# 直接运行
node auto_tasks_enhanced.js
```

---

## 📋 使用步骤

### 1. 获取 Cookie

1. 访问 https://music.163.com 并登录
2. 按 F12 打开开发者工具
3. 进入 **Network** → 刷新页面 → 点击任意请求 → **Headers**
4. 找到 `Cookie: MUSIC_U=xxxxxxxxx`
5. 复制 `MUSIC_U=xxxxxxxxx` 填入配置

### 2. 配置任务

编辑 `config.json`，根据需要开启/关闭任务。

### 3. 运行

```bash
node auto_tasks_enhanced.js
```

---

## ⚙️ 运行模式

### 前台运行（适合调试）

```bash
node auto_tasks_enhanced.js
```

### 后台运行（推荐使用 PM2）

### 定时执行（PM2）

`ecosystem.config.js` 已配置定时任务：

```javascript
cron_restart: '0 8 * * *' // 每天早上 8:00 执行
```

修改时间请编辑该配置文件。

---

## 📁 项目结构

```
163music-vip-daily/
├── auto_tasks_enhanced.js # 核心任务脚本
├── task-runner.js         # 任务执行器
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
2. 配置文件中添加 `serverSendKey: "SCTxxxxxxxx"`

### PushPlus

1. 访问 https://pushplus.plus/ 获取 Token
2. 配置文件中添加：
   - `pushplusToken: "xxxxxxxx"`
   - `pushplusChannel: "wechat"` (可选)
   - `pushplusWebhook: ""` (可选)

---

## 🔧 故障排查

### Cookie 过期

**症状**：API 返回 401/400  
**解决**：使用更新脚本快速刷新 Cookie

```bash
./update_cookie.sh "MUSIC_U=你的新 cookie"
```

或者手动编辑 `config.json` 文件。

### 依赖未安装

**症状**：启动时提示包未找到  
**解决**：
```bash
npm install
```

### 查看日志

```bash
# PM2 日志
pm2 logs

# 手动查看日志文件
cat logs.json
```

---

## 📄 License

MIT

---

**最后更新**: 2026-06-07
