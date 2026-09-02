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
| 云小编签到 | 每日签到领取 5 积分 |
| 云小编审核任务 | 自动完成入站考试并执行歌曲审核任务，刷取积分 |
| 云小编领取会员 | 积分达 50 自动领取 1 日黑胶 VIP |
| 云小编每日抽奖 | 消耗 200 积分抽奖，每日最多 3 次 |

### 智能答题策略

云小编入站考试和审核任务使用多策略智能答题，无需人工干预：

| 审核类型 | 策略 | 正确率 |
|---------|------|--------|
| 歌曲语种审核 | 歌词字符集检测（韩/日/中/俄/泰/越/法/德/西/葡等） | ~100% |
| 歌曲原唱审核 | 歌手名模糊匹配 | ~80% |
| 歌曲曲风审核 | LLM 分析（智谱 GLM-4-Flash） | ~90% |
| 情绪标签审核 | LLM 分析 + 网易云标签定义 | ~90% |

> LLM 答题需要配置 `llmApiKey`（智谱 AI 免费 API Key），未配置时曲风/情绪标签降级为随机答题。

### 特性

- 纯 SDK 调用，无需启动 HTTP 服务
- Cookie 仅需 `MUSIC_U` 字段，获取简单
- 支持环境变量和 `config.json` 双模式配置
- Cookie 301 过期时自动降级切换备用 Cookie
- 执行日志自动保存到 `logs.json`
- 支持 Server 酱、PushPlus 消息推送
- 支持 PM2 定时执行
- 云小编智能答题：语种检测 + 歌手匹配 + LLM 分析

### 运行要求

- Node.js >= 18.0.0
- （可选）智谱 AI API Key 用于 LLM 答题，在 https://open.bigmodel.cn 免费获取

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

```jsonc
{
  // ==================== 用户账号 ====================
  "users": [
    {
      "nickname": "我的账号",         // 账号标识，用于日志输出
      "cookie": "MUSIC_U=xxxxxxxxx"    // Cookie，只需 MUSIC_U 字段即可
    }
  ],

  // ==================== 任务开关 ====================
  "enableYunbeiSign": true,          // 云贝签到（安卓端），每天可获取云贝
  "enableYunbeiSignPC": true,        // 云贝签到（PC 端），与安卓端独立累计
  "enableVipSign": true,             // VIP 乐签打卡，VIP 用户每日打卡获取成长值
  "enableVipGrowthpoint": true,      // 一键领取所有已完成 VIP 任务的成长值
  "showVipTaskList": true,           // 运行后展示当前 VIP 任务列表
  "enableVipMusicTasks": true,       // VIP 音乐任务（收藏歌曲 + 取消收藏）
  "enableVipMusicScrobble": true,    // 是否上报听歌打卡记录
  "enableAutoPost": true,            // 自动发布动态（每日分享一首歌曲）
  "deletePreviousPost": true,        // 发新动态前删除上一条，避免刷屏

  // ==================== VIP 音乐任务 ====================
  "vipMusicPlaylistId": 8402996200,  // 收藏用的歌单 ID，每日从中选取歌曲进行收藏
  "vipMusicSongCount": 3,            // 每次处理的歌曲数量，建议 1-10
  "vipMusicFallbackPlaylistIds": [   // 备用歌单列表，主歌单无可用歌曲时依次尝试
    7785066739,
    5453912201
  ],

  // ==================== 听歌打卡（独立歌单） ====================
  // 当未设置 scrobblePlaylistId 时，打卡与收藏内联执行（收藏一首打一首）
  // 设置后，从该歌单取歌单独打卡，与收藏流程分离
  "scrobblePlaylistId": 0,           // 独立打卡歌单 ID。0 = 不启用，与收藏用同一歌单
  "scrobbleSongCount": 0,            // 打卡歌曲数量。-1 = 全部，0 = 等同于 vipMusicSongCount，>0 = 指定数量

  // ==================== 动态发布 ====================
  "postPlaylistId": 8402996200,    // 发布动态时分享歌曲的来源歌单
  "postSongCount": 1,               // 每次发布动态分享的歌曲数，建议 1-3

  // ==================== 消息推送（可选） ====================
  "serverSendKey": "",             // Server 酱 SendKey，以 SCT 开头。留空不推送
  "pushPlusToken": "",             // PushPlus Token，留空不推送
  "pushPlusChannel": "wechat",     // PushPlus 推送渠道：wechat / webhook / mail 等
  "pushPlusWebhook": "",           // PushPlus webhook 地址（channel 为 webhook 时使用）

  // ==================== 云小编 ====================
  "enableCloudEditor": true,       // 云小编总开关（签到 + 领取会员）
  "enableCloudEditorExam": true,   // 云小编入站考试（自动答题）
  "enableCloudEditorTask": true,   // 云小编审核任务（需先通过考试）
  "enableCloudEditorLottery": false, // 云小编每日抽奖（消耗 200 积分/次）
  "cloudEditorTaskCount": 10,      // 每种审核类型最大任务数（建议 ≤50 避免频率限制）

  // ==================== LLM 答题（可选） ====================
  "llmApiKey": ""                  // 智谱 AI API Key，用于曲风/情绪标签审核。在 https://open.bigmodel.cn 免费获取
}
```

> JSON 标准不支持注释，以上注释仅用于文档说明。实际使用时请复制 `config_example.json` 并去除注释。

---

## 项目结构

```
163music-vip-daily/
├── auto_tasks_enhanced.js   # 主任务脚本
├── task-runner.js            # 任务执行器（公共模块）
├── api-extras/               # SDK 扩展模块（听歌打卡、云小编等）
├── ecosystem.config.js       # PM2 定时配置
├── config.json               # 用户配置（不提交到 git）
├── config_example.json       # 配置模板
├── logs.json                 # 执行日志
└── package.json              # 项目依赖
```

## License

MIT
