# 网易云音乐自动任务脚本

[![GitHub](https://img.shields.io/github/v/tag/zhuixingzhe-baisheng/163music-vip-daily?label=version)](https://github.com/zhuixingzhe-baisheng/163music-vip-daily)
[![License](https://img.shields.io/github/license/zhuixingzhe-baisheng/163music-vip-daily)](LICENSE)

基于 **API Enhanced** 的网易云音乐自动任务工具，支持云贝签到、VIP 乐签打卡、VIP 成长值领取、VIP 音乐任务等功能。

## 🌿 分支说明

| 分支 | 用途 | 配置方式 | 适用场景 |
|------|------|----------|----------|
| **main** | 本地运行版本 | `config.json` 文件 | 本地服务器、PM2、Crontab |
| **qinglong** | 青龙面板版本 | 环境变量 | 青龙面板 Docker 部署 |

**👉 使用青龙面板？请切换到 [qinglong](https://github.com/zhuixingzhe-baisheng/163music-vip-daily/tree/qinglong) 分支**

---

## 📋 功能特性

| 功能 | 状态 | 说明 |
|------|------|------|
| 云贝签到 | ✅ | 每日云贝签到，获得云贝 reward |
| VIP 乐签打卡 | ✅ | VIP 用户每日乐签打卡，获得成长值 |
| VIP 成长值领取 | ✅ | 自动领取已完成的 VIP 任务成长值 |
| VIP 音乐任务 | ✅ | 收藏歌曲 + 听歌记录 + 领取成长值 + 取消收藏 |

### VIP 音乐任务详解

**任务流程**：
1. **收藏歌曲** - 从指定歌单收藏 3 首 VIP 歌曲
2. **上传听歌记录** - 使用实际歌曲时长上报听歌记录
3. **领取成长值** - 如果"收藏三首歌曲"任务存在且完成，自动领取成长值
4. **取消收藏** - 取消已收藏的歌曲，保持歌单整洁

**特点**：
- ✅ 从 API 动态获取歌曲（每次运行可能获取不同的歌曲）
- ✅ 使用实际歌曲时长（从 `dt` 字段获取，单位：毫秒）
- ✅ 自动检测并领取成长值（+3 成长值/天）
- ✅ 支持多用户并发处理

## 📦 安装依赖

```bash
npm install
```

依赖包：
- `@neteasecloudmusicapienhanced/api` (v4.32.1+) - 网易云音乐 API Enhanced 版本

## ⚙️ 配置说明

### main 分支 - 配置文件方式

1. **复制配置文件**

```bash
cp config_example.json config.json
```

2. **编辑 `config.json`**，填入你的 MUSIC_U cookie：

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
  "showVipTaskList": true,
  "enableVipMusicTasks": true,
  "vipMusicPlaylistId": 8402996200,
  "vipMusicSongCount": 3,
  "enableAutoPost": true,
  "deletePreviousPost": true,
  "postPlaylistId": 8402996200,
  "postSongCount": 1
}
```

### qinglong 分支 - 环境变量方式

**环境变量配置**（青龙面板 → 环境变量）：

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `NetEase_MusicU` | ✅ | - | 网易云音乐 Cookie（必填） |
| `NetEase_Nickname` | ❌ | `主账号` | 用户昵称 |
| `NetEase_EnableYunbeiSign` | ❌ | `true` | 云贝签到 - 安卓端 |
| `NetEase_EnableYunbeiSignPC` | ❌ | `true` | 云贝签到-PC 端 |
| `NetEase_EnableVipSign` | ❌ | `true` | VIP 乐签打卡 |
| `NetEase_EnableVipGrowthpoint` | ❌ | `true` | VIP 成长值领取 |
| `NetEase_ShowVipTaskList` | ❌ | `true` | 显示 VIP 任务列表 |
| `NetEase_EnableVipMusicTasks` | ❌ | `true` | VIP 音乐任务 |
| `NetEase_VipMusicPlaylistId` | ❌ | `8402996200` | 会员雷达歌单 ID |
| `NetEase_VipMusicSongCount` | ❌ | `3` | 处理歌曲数量 |
| `NetEase_EnableAutoPost` | ❌ | `true` | 自动发布动态 |
| `NetEase_DeletePreviousPost` | ❌ | `true` | 删除上次动态 |
| `NetEase_PostPlaylistId` | ❌ | `8402996200` | 发布动态歌单 ID |
| `NetEase_PostSongCount` | ❌ | `1` | 每次发布歌曲数 |

**配置参数说明**（main 分支）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `users` | Array | - | 用户列表，支持多账号 |
| `users[].nickname` | String | - | 用户昵称（日志显示用） |
| `users[].cookie` | String | - | MUSIC_U cookie（必填） |
| `enableYunbeiSign` | Boolean | true | 云贝签到（安卓端） |
| `enableYunbeiSignPC` | Boolean | true | 云贝签到（PC 端） |
| `enableVipSign` | Boolean | true | VIP 乐签打卡 |
| `enableVipGrowthpoint` | Boolean | true | VIP 成长值领取 |
| `showVipTaskList` | Boolean | true | 显示 VIP 任务列表 |
| `enableVipMusicTasks` | Boolean | true | VIP 音乐任务 |
| `vipMusicPlaylistId` | Number | 8402996200 | 会员雷达歌单 ID |
| `vipMusicSongCount` | Number | 3 | 处理歌曲数量 |
| `enableAutoPost` | Boolean | true | 自动发布动态 |
| `deletePreviousPost` | Boolean | true | 删除上次动态 |
| `postPlaylistId` | Number | 8402996200 | 发布动态歌单 ID |
| `postSongCount` | Number | 1 | 每次发布歌曲数（1-3） |

### 获取 Cookie

1. 打开网易云音乐网页版 (https://music.163.com)
2. 登录账号
3. 按 F12 打开开发者工具
4. 进入 Application → Cookies → https://music.163.com
5. 复制 `MUSIC_U` 的值
6. 填入配置：`"cookie": "MUSIC_U=xxxxxxxxxxxxx"`

**安全提示**：`config.json` 包含敏感信息，请勿上传到公开仓库！

## 🚀 使用方法

### 方法 1: 直接运行（推荐）

```bash
node auto_tasks_enhanced.js
```

### 方法 2: 使用 PM2 后台运行

```bash
# 安装 PM2
npm install -g pm2

# 启动任务
pm2 start auto_tasks_enhanced.js --name "netease-tasks"

# 设置开机自启
pm2 startup
pm2 save
```

### 方法 3: 设置定时任务 (Cron)

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天早上 8:00 执行）
0 8 * * * /usr/bin/node /path/to/auto_tasks_enhanced.js >> /path/to/logs/netease.log 2>&1
```

## 📊 输出示例

```
============================================================
网易云音乐自动任务 (API Enhanced 版本)
============================================================

>>> 开始处理用户：测试用户
------------------------------------------------------------
[测试用户] 检查 VIP 状态...
[测试用户] VIP 状态：已开通
[测试用户] 执行云贝签到...
[测试用户] 云贝签到结果：{ data: { days: 0, shells: 1 }, code: 200 }
[测试用户] 执行 VIP 音乐任务...
  准备处理 3 首歌曲:
    1. 不分手的恋爱 - 汪苏泷 (3.43 分钟)
    2. 我看过 - 周星星 (2.74 分钟)
  [1] 收藏歌曲...
    ✓ 不分手的恋爱
    ✓ 我看过
  [2] 上传听歌记录...
    ✓ 不分手的恋爱 (3.42 分钟)
    ✓ 我看过 (2.73 分钟)
  [3] 领取成长值...
    ✓ 领取成功 +3
  [4] 取消收藏...
    ✓ 不分手的恋爱
    ✓ 我看过
  ✓ VIP 音乐任务完成
------------------------------------------------------------

============================================================
所有用户任务执行完成!
============================================================
```

## 🎯 VIP 任务说明

### 当前可用的 VIP 任务

| 任务名称 | 成长值 | 状态 | 说明 |
|---------|--------|------|------|
| 成长值 +3（浏览黑胶时光机） | +3 | ✅ 已完成 | 每日任务，已计入成长值 |

### 限时任务（可能刷新）

| 任务名称 | 成长值 | 说明 |
|---------|--------|------|
| 收藏三首歌曲 | +3 | 平台限时任务，可能每天/每周刷新 |

**注意**："收藏三首歌曲"任务是网易云音乐平台配置的限时任务，无法通过 API 手动创建。脚本会在每次运行时检查任务列表，当任务出现时自动完成并领取成长值。

## 📁 项目文件

| 文件 | 用途 |
|------|------|
| `auto_tasks_enhanced.js` | **主脚本**（包含所有功能） |
| `package.json` | 项目配置和依赖 |
| `config.json` | **配置文件**（需自行创建，包含敏感信息） |
| `config_example.json` | 配置文件示例 |
| `README.md` | 项目文档 |
| `DEPLOY.md` | 快速部署指南 |

## 🌿 分支选择指南

**我应该使用哪个分支？**

### 选择 main 分支，如果你：

- ✅ 在本地服务器运行（Linux、macOS、Windows）
- ✅ 使用 PM2 管理进程
- ✅ 使用 Crontab 定时任务
- ✅ 喜欢配置文件方式

### 选择 qinglong 分支，如果你：

- ✅ 使用青龙面板 Docker 部署
- ✅ 希望使用环境变量配置
- ✅ 需要面板可视化管理
- ✅ 想要定时任务管理界面

**分支切换**：

```bash
# 克隆 main 分支（本地版）
git clone https://github.com/zhuixingzhe-baisheng/163music-vip-daily.git

# 克隆 qinglong 分支（青龙版）
git clone -b qinglong https://github.com/zhuixingzhe-baisheng/163music-vip-daily.git
```

## 📄 相关文档

- [DEPLOY.md](./DEPLOY.md) - 快速部署指南
- [qinglong 分支 README](https://github.com/zhuixingzhe-baisheng/163music-vip-daily/tree/qinglong) - 青龙面板文档

## 🔧 高级配置

### 多用户配置

```javascript
users: [
  {
    cookie: 'MUSIC_U=xxxx1',
    nickname: '账号 1'
  },
  {
    cookie: 'MUSIC_U=xxxx2',
    nickname: '账号 2'
  }
]
```

脚本会依次处理每个用户，用户间延时 5 秒（避免风控）。

### VIP 音乐任务歌单选择

默认使用"会员雷达"歌单（ID: 8402996200），你可以替换为其他歌单：

```javascript
vipMusicPlaylistId: 1234567890  // 替换为你喜欢的 VIP 专属歌单
```

## ⚠️ 注意事项

1. **Cookie 安全**: 不要将 Cookie 提交到 Git 仓库或公开分享
2. **请求频率**: 脚本已内置延时，避免请求过快导致封禁
3. **任务时效**: VIP 任务可能每天刷新，及时执行脚本
4. **账号风控**: 多账号建议设置更长的延时时间
5. **API 稳定性**: 网易云 API 可能变化，如遇问题请更新 API 包

## 🐛 故障排查

### 问题 1: Cookie 过期

**症状**: API 返回 401 或 400 错误

**解决**:
1. 重新获取 Cookie（参考"获取 Cookie"章节）
2. 更新配置文件
3. 重新启动脚本

### 问题 2: VIP 音乐任务未执行

**症状**: 日志中没有"执行 VIP 音乐任务"

**解决**:
1. 检查配置：`enableVipMusicTasks: true`
2. 确认依赖已安装：`npm install`
3. 重新运行脚本

### 问题 3: 无法领取成长值

**症状**: 显示"暂无可领取的成长值"

**解决**:
- 这是正常状态，表示当前没有已完成但未领取的任务
- VIP 音乐任务出现时会自动领取（+3 成长值）
- 等待任务刷新（通常每天 0:00）

## 📖 参考资料

- **API Enhanced 仓库**: https://github.com/neteasecloudmusicapienhanced/api-enhanced
- **API Enhanced 文档**: https://github.com/neteasecloudmusicapienhanced/api-enhanced/blob/master/README.md
- **npm 包**: https://www.npmjs.com/package/@neteasecloudmusicapienhanced/api

## 📄 License

MIT

---

**最后更新**: 2026-05-22  
**维护状态**: ✅ 正常维护
