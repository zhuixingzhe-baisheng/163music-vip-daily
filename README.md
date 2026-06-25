# 网易云音乐自动任务

[![GitHub](https://img.shields.io/github/v/tag/zhuixingzhe-baisheng/163music-vip-daily?label=version)](https://github.com/zhuixingzhe-baisheng/163music-vip-daily)
[![License](https://img.shields.io/github/license/zhuixingzhe-baisheng/163music-vip-daily)](LICENSE)

基于 `@neteasecloudmusicapienhanced/api` SDK 的网易云音乐每日自动任务工具，无需浏览器，命令行一键运行。

---

## 1. 功能介绍

### 已实现的自动化任务

| 任务 | 说明 |
|------|------|
| 云贝签到（安卓端） | 每日安卓端云贝签到，获取云贝积分 |
| 云贝签到（PC 端） | 每日 PC 端云贝签到，与安卓端独立累计 |
| VIP 乐签打卡 | VIP 用户每日打卡，获取成长值 |
| VIP 成长值领取 | 一键领取所有已完成 VIP 任务的成长值 |
| VIP 音乐任务 | 自动从指定歌单收藏歌曲、取消收藏，刷 VIP 等级经验 |
| 听歌打卡（内联） | 收藏时同步上报听歌记录，计入每日听歌时长 |
| 听歌打卡（独立歌单） | 从自定义歌单取歌打卡，与收藏流程分离 |
| 自动发动态 | 每日自动分享一首歌曲到个人动态 |
| 删除上次动态 | 发新动态前自动删除上一条，避免刷屏 |

### 特性

- 纯 SDK 调用，无需启动 HTTP 服务
- Cookie 仅需 `MUSIC_U` 字段，获取简单
- 支持环境变量和 `config.json` 双模式配置
- Cookie 301 过期时自动降级切换备用 Cookie
- 执行日志自动保存到 `logs.json`
- 支持 Server 酱、PushPlus 消息推送
- 支持 PM2 定时执行

### 运行要求

- Node.js >= 18.0.0

---

## 2. 部署教程

### 快速上手（命令行）

```bash
# 1. 克隆仓库
git clone https://github.com/zhuixingzhe-baisheng/163music-vip-daily.git
cd 163music-vip-daily

# 2. 安装依赖
npm install

# 3. 复制配置文件
cp config_example.json config.json

# 4. 编辑 config.json，填入你的 MUSIC_U Cookie（获取方法见下方）
nano config.json

# 5. 运行
node auto_tasks_enhanced.js
```

### 获取 Cookie

1. 浏览器访问 https://music.163.com 并登录
2. 按 F12 打开开发者工具
3. 进入 **Application**（或 **存储**）标签页
4. 左侧选择 **Cookies** > `https://music.163.com`
5. 找到 `MUSIC_U`，复制其值
6. 填入 `config.json` 的 `cookie` 字段，格式为 `MUSIC_U=你复制的值`

> 只需 `MUSIC_U` 即可，不需要 `__csrf` 或 `NMTID`。

### 环境变量配置（Docker / CI 场景）

不创建 `config.json` 文件时，脚本自动读取以下环境变量：

| 环境变量 | 说明 |
|----------|------|
| `NETEASE_MUSIC_U` | Cookie 的 MUSIC_U 值 |
| `NETEASE_NICKNAME` | 账号昵称（可选，默认 "账号 1"） |
| `SERVER_SENDKEY` | Server 酱 SendKey（可选） |
| `PUSHPLUS_TOKEN` | PushPlus Token（可选） |

```bash
export NETEASE_MUSIC_U="你的 MUSIC_U 值"
node auto_tasks_enhanced.js
```

### PM2 定时执行（服务器部署）

```bash
# 安装 PM2
npm install -g pm2

# 启动定时任务
pm2 start ecosystem.config.js

# 查看日志
pm2 logs netease-tasks

# 设置开机自启
pm2 save && pm2 startup
```

默认每天早上 8:00 执行，修改时间请编辑 `ecosystem.config.js` 中的 `cron_restart` 字段。

### 更新 Cookie（过期后）

Cookie 过期时，编辑 `config.json` 替换新的 `MUSIC_U` 值即可。也可以设置环境变量 `NETEASE_MUSIC_U` 作为备用：当环境变量 Cookie 失效（返回 301）时，脚本自动降级使用 `config.json` 中的 Cookie。

---

## 3. 配置参数说明

### config.json 完整示例

```json
{
  "users": [
    {
      "nickname": "我的账号",
      "cookie": "MUSIC_U=xxxxxxxxx"
    }
  ],
  "enableYunbeiSign": true,
  "enableYunbeiSignPC": true,
  "enableVipSign": true,
  "enableVipGrowthpoint": true,
  "showVipTaskList": true,
  "enableVipMusicTasks": true,
  "vipMusicPlaylistId": 8402996200,
  "vipMusicSongCount": 3,
  "enableVipMusicScrobble": true,
  "enableAutoPost": true,
  "deletePreviousPost": true,
  "postPlaylistId": 8402996200,
  "postSongCount": 1,
  "serverSendKey": "",
  "pushPlusToken": "",
  "pushPlusChannel": "",
  "pushPlusWebhook": ""
}
```

### 任务开关

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enableYunbeiSign` | boolean | `true` | 云贝签到（安卓端），每天可获取云贝 |
| `enableYunbeiSignPC` | boolean | `true` | 云贝签到（PC 端），与安卓端独立 |
| `enableVipSign` | boolean | `true` | VIP 乐签打卡，VIP 用户专属 |
| `enableVipGrowthpoint` | boolean | `true` | 一键领取所有已完成任务的成长值 |
| `showVipTaskList` | boolean | `true` | 运行后展示当前 VIP 任务列表 |
| `enableVipMusicTasks` | boolean | `true` | VIP 音乐任务（收藏 + 取消收藏） |
| `enableVipMusicScrobble` | boolean | `true` | 是否上报听歌打卡记录 |
| `enableAutoPost` | boolean | `true` | 自动发布动态（分享歌曲） |
| `deletePreviousPost` | boolean | `true` | 发新动态前删除上一条 |

### VIP 音乐任务

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `vipMusicPlaylistId` | number | `8402996200` | 收藏用的歌单 ID，每日从中选取歌曲进行收藏 |
| `vipMusicSongCount` | number | `4` | 每次处理的歌曲数量，建议 1-10 |
| `vipMusicFallbackPlaylistIds` | number[] | `[7785066739, 5453912201]` | 备用歌单列表，主歌单无可用歌曲时依次尝试 |

### 听歌打卡（独立歌单）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `scrobblePlaylistId` | number | `0` | 独立打卡歌单 ID。设为 `0` 时不启用，打卡与收藏用同一歌单；设为歌单 ID 后从该歌单取歌单独打卡 |
| `scrobbleSongCount` | number | `0` | 打卡歌曲数量。`-1` = 全部歌曲，`0` = 等同于 `vipMusicSongCount`，`>0` = 指定数量 |

> 当 `scrobblePlaylistId` 未设置时，听歌打卡与收藏流程内联执行（收藏一首打一首）；设置后，收藏和打卡分离，分别从各自的歌单取歌。

### 动态发布

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `postPlaylistId` | number | `8402996200` | 发布动态时分享歌曲的来源歌单 |
| `postSongCount` | number | `1` | 每次发布动态分享的歌曲数，建议 1-3 |

### 消息推送

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `serverSendKey` | string | `""` | [Server 酱](https://sct.ftqq.com/) SendKey，以 `SCT` 开头 |
| `pushPlusToken` | string | `""` | [PushPlus](https://www.pushplus.plus/) Token |
| `pushPlusChannel` | string | `"wechat"` | PushPlus 推送渠道，可选 `wechat` / `webhook` / `mail` 等 |
| `pushPlusWebhook` | string | `""` | PushPlus webhook 地址（channel 为 webhook 时使用） |

### 用户配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `users` | array | - | 用户列表，每项包含 `nickname`（昵称）和 `cookie`（MUSIC_U=xxx） |
| `users[].nickname` | string | - | 账号标识，用于日志输出 |
| `users[].cookie` | string | - | Cookie，格式 `MUSIC_U=xxxxxxxxx` |

---

## 项目结构

```
163music-vip-daily/
├── auto_tasks_enhanced.js   # 主任务脚本
├── task-runner.js            # 任务执行器（公共模块）
├── api-extras/               # SDK 扩展模块（听歌打卡等）
├── ecosystem.config.js       # PM2 定时配置
├── config.json               # 用户配置（不提交到 git）
├── config_example.json       # 配置模板
├── logs.json                 # 执行日志
└── package.json              # 项目依赖
```

## License

MIT
