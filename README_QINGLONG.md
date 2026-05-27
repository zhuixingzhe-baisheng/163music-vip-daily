# 青龙面板部署指南

网易云音乐自动任务的青龙面板版本，支持定时执行和环境变量配置。

## 📋 功能特性

| 功能 | 说明 |
|------|------|
| 云贝签到 | 安卓端 + PC 端双签到 |
| VIP 乐签打卡 | 每日签到获得成长值 |
| VIP 成长值领取 | 自动领取已完成任务 |
| VIP 音乐任务 | 收藏→听歌→取消，完成平台限时任务 |
| 自动发布动态 | 每日分享歌曲到动态 |

## 🚀 部署步骤

### 1. 拉取仓库

在青龙面板中添加仓库：

```
仓库地址：https://github.com/zhuixingzhe-baisheng/163music-vip-daily
分支：main
定时类型：crontab
定时规则：0 8 * * * （每天早上 8 点执行）
```

### 2. 安装依赖

在青龙面板的"依赖管理"中添加：

```
名称：@neteasecloudmusicapienhanced/api
类型：nodeJs
版本：latest
```

或者在容器内手动执行：

```bash
pnpm add @neteasecloudmusicapienhanced/api
```

### 3. 配置环境变量

在青龙面板"环境变量"中添加以下变量：

**必填变量**：

| 变量名 | 值示例 | 说明 |
|--------|--------|------|
| `NetEase_MusicU` | `MUSIC_U=00B09401045DAC...` | 网易云音乐 Cookie |

**可选变量**（默认值已优化，按需修改）：

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

### 4. 运行任务

- **手动执行**：在青龙面板任务列表中点击运行按钮
- **自动执行**：根据 crontab 定时规则自动执行

## 📝 获取 MUSIC_U Cookie

1. 打开网易云音乐网页版 (https://music.163.com)
2. 登录账号
3. 按 F12 打开开发者工具
4. 进入 Application → Cookies → https://music.163.com
5. 复制 `MUSIC_U` 的值
6. 格式：`MUSIC_U=xxxxxxxxxxxxx`

## 🔧 多账号支持

青龙面板支持多账号，有两种方式：

### 方式一：多个环境变量

为每个账号创建独立的环境变量：

```
NetEase_MusicU_1 = MUSIC_U=账号 1 的 cookie
NetEase_MusicU_2 = MUSIC_U=账号 2 的 cookie
```

### 方式二：使用 & 分隔

在单个环境变量中使用 `&` 分隔多个账号：

```
NetEase_MusicU = MUSIC_U=账号 1& MUSIC_U=账号 2
```

## 📊 查看日志

- **实时日志**：在执行中的任务中查看
- **历史日志**：在青龙面板任务日志中查看历史执行记录

## ⚠️ 注意事项

1. **Cookie 有效期**：MUSIC_U cookie 有有效期，需定期更新（建议 30 天）
2. **执行时间**：VIP 音乐任务每首歌需等待 30-60 秒，3 首歌约 2-3 分钟
3. **账号风控**：建议设置合理延时，避免频繁请求触发风控
4. **环境隔离**：青龙面板容器默认 UTC 时间，北京时间需 +8 小时

## 🐛 常见问题

### Q1: 提示"未设置 MUSIC_U cookie"

**原因**：环境变量未正确设置

**解决**：
1. 检查环境变量名称是否拼写正确
2. 确认变量值格式为 `MUSIC_U=xxxxxxxx`
3. 重启青龙容器或重新加载环境变量

### Q2: VIP 任务提示"暂无可领取的成长值"

**原因**：平台限时任务未完成或未刷新

**解决**：
- 这是正常现象，脚本会自动检测平台限时任务
- 平台限时任务通常为"收藏三首歌曲"，脚本会自动完成
- 如无限时任务，跳过成长值领取

### Q3: 乐签打卡显示"成长值已到账，歌曲信息稍后更新"

**原因**：网易云 API 返回中间状态

**解决**：
- 这是正常现象，成长值已成功到账
- 歌曲信息会在稍后更新
- 不影响打卡结果和成长值获取

## 📄 文件说明

| 文件 | 用途 |
|------|------|
| `auto_tasks_qinglong.js` | 青龙面板版本脚本 |
| `README.md` | 项目主文档 |
| `DEPLOY.md` | 快速部署指南 |
| `README_QINGLONG.md` | 青龙面板部署指南（本文档） |

## 🔗 相关链接

- [项目 GitHub](https://github.com/zhuixingzhe-baisheng/163music-vip-daily)
- [青龙面板文档](https://github.com/whyour/qinglong)
- [网易云 API Enhanced](https://www.npmjs.com/package/@neteasecloudmusicapienhanced/api)
