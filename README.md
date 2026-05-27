# 网易云音乐自动任务 - 青龙面板版

[![GitHub](https://img.shields.io/github/v/tag/zhuixingzhe-baisheng/163music-vip-daily?label=version)](https://github.com/zhuixingzhe-baisheng/163music-vip-daily)
[![License](https://img.shields.io/github/license/zhuixingzhe-baisheng/163music-vip-daily)](LICENSE)

网易云音乐每日自动任务工具，支持青龙面板部署，自动完成云贝签到、VIP 乐签打卡、成长值领取等任务。

## ✨ 功能特性

| 功能 | 说明 | 奖励 |
|------|------|------|
| 云贝签到 | 安卓端 + PC 端双签到 | +1 +50 云贝 |
| VIP 乐签打卡 | 每日签到获得成长值 | +3 成长值 |
| VIP 成长值领取 | 自动领取已完成任务 | 额外成长值 |
| VIP 音乐任务 | 收藏→听歌→取消完成限时任务 | +3 成长值 |
| 自动发布动态 | 每日分享歌曲到动态 | - |

## 🚀 快速开始

### 方式一：青龙面板（推荐）

**1. 添加仓库**

在青龙面板中添加：
```
名称：163music-vip-daily
仓库：https://github.com/zhuixingzhe-baisheng/163music-vip-daily
分支：qinglong
定时：0 8 * * *
```

**2. 安装依赖**

青龙面板 → 依赖管理 → 新建依赖：
```
类型：nodeJs
名称：@neteasecloudmusicapienhanced/api
版本：latest
```

**3. 添加环境变量**

青龙面板 → 环境变量 → 新建变量：

| 变量名 | 值示例 | 必填 |
|--------|--------|------|
| `NetEase_MusicU` | `MUSIC_U=00B09401045DAC...` | ✅ |
| `NetEase_Nickname` | `主账号` | ❌ |

**4. 运行任务**

- 手动运行：青龙面板 → 任务列表 → 点击运行
- 自动运行：每日 8:00 自动执行

---

## 📄 其他部署方式

**本地运行 / PM2 / Crontab**：请切换到 [main 分支](https://github.com/zhuixingzhe-baisheng/163music-vip-daily)

---

## ⚙️ 环境变量配置

### 必填变量

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `NetEase_MusicU` | 网易云音乐 Cookie | 见下方获取教程 |

### 可选变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NetEase_Nickname` | `主账号` | 用户昵称 |
| `NetEase_EnableYunbeiSign` | `true` | 云贝签到 - 安卓端 |
| `NetEase_EnableYunbeiSignPC` | `true` | 云贝签到-PC 端 |
| `NetEase_EnableVipSign` | `true` | VIP 乐签打卡 |
| `NetEase_EnableVipGrowthpoint` | `true` | VIP 成长值领取 |
| `NetEase_ShowVipTaskList` | `true` | 显示 VIP 任务列表 |
| `NetEase_EnableVipMusicTasks` | `true` | VIP 音乐任务 |
| `NetEase_VipMusicPlaylistId` | `8402996200` | 会员雷达歌单 ID |
| `NetEase_VipMusicSongCount` | `3` | 处理歌曲数量 |
| `NetEase_EnableAutoPost` | `true` | 自动发布动态 |
| `NetEase_DeletePreviousPost` | `true` | 删除上次动态 |
| `NetEase_PostPlaylistId` | `8402996200` | 发布动态歌单 ID |
| `NetEase_PostSongCount` | `1` | 每次发布歌曲数 |

## 🍪 获取 MUSIC_U Cookie

1. 打开 [网易云音乐网页版](https://music.163.com)
2. 登录账号
3. 按 `F12` 打开开发者工具
4. 进入 `Application` → `Cookies` → `https://music.163.com`
5. 复制 `MUSIC_U` 的值
6. 格式：`MUSIC_U=xxxxxxxxxxxxx`

**注意**：Cookie 有效期约 30 天，需定期更新。

## 📋 多账号配置

### 方式一：多个环境变量

```
NetEase_MusicU_1 = MUSIC_U=账号 1 的 cookie
NetEase_MusicU_2 = MUSIC_U=账号 2 的 cookie
NetEase_MusicU_3 = MUSIC_U=账号 3 的 cookie
```

### 方式二：使用 & 分隔

```
NetEase_MusicU = MUSIC_U=账号 1&MUSIC_U=账号 2&MUSIC_U=账号 3
```

## 📊 日志示例

```
============================================================
网易云音乐自动任务 (青龙面板版本)
============================================================

>>> 开始处理用户：主账号
------------------------------------------------------------
[主账号] VIP 状态：已开通
[主账号] 云贝签到（安卓）结果：+1 云贝
[主账号] 云贝签到（PC）结果：+50 云贝
[主账号] VIP 音乐任务：完成 3 首歌曲
[主账号] VIP 乐签打卡：+3 成长值
[主账号] ✓ 任务完成

============================================================
所有用户任务执行完成!
============================================================
```

## ⚠️ 注意事项

1. **Cookie 有效期**：MUSIC_U cookie 有效期约 30 天，过期需重新获取
2. **执行时间**：完整执行约 2-3 分钟（VIP 音乐任务需要等待）
3. **账号风控**：建议合理设置执行时间，避免频繁请求
4. **时区问题**：青龙容器默认 UTC 时间，北京时间 = UTC + 8

## 🐛 常见问题

### Q: 提示"未设置 MUSIC_U cookie"

**A**: 检查环境变量是否拼写正确，确认值格式为 `MUSIC_U=xxxxxxxx`

### Q: 乐签打卡显示"成长值已到账，歌曲信息稍后更新"

**A**: 网易云 API 中间状态，成长值已成功到账，不影响结果

### Q: VIP 任务"暂无可领取的成长值"

**A**: 平台限时任务未完成或未刷新，属正常现象

## 📄 文件结构

```
163music-vip-daily/
├── auto_tasks_qinglong.js    # 青龙面板脚本
├── package.json              # 依赖配置
├── README.md                 # 项目文档
├── LICENSE                   # 开源协议
└── .gitignore               # Git 忽略规则
```

## 📱 相关项目

- [main 分支](https://github.com/zhuixingzhe-baisheng/163music-vip-daily/tree/main) - 本地运行版本
- [网易云 API Enhanced](https://www.npmjs.com/package/@neteasecloudmusicapienhanced/api)
- [青龙面板](https://github.com/whyour/qinglong)

## 📝 更新日志

### v2.1.0 (2026-05-27)
- ✅ 新增青龙面板专用版本
- ✅ 支持环境变量配置
- ✅ 优化 VIP 乐签打卡判断逻辑
- ✅ 修复取消收藏功能

### v2.0.0 (2026-05-26)
- ✅ 改用配置文件方式
- ✅ 移除硬编码 Cookie
- ✅ 精简项目文件

## 📄 开源协议

MIT License

## ⭐ Star History

如果这个项目对你有帮助，请给个 Star ✨
