# 网易云音乐自动任务 - Windows 版本使用说明

## 快速开始

### 1. 下载 Release

从 [GitHub Releases](https://github.com/zhuixingzhe-baisheng/163music-vip-daily/releases) 下载最新版本的 Windows 压缩包。

### 2. 解压文件

将下载的压缩包解压到任意目录（建议：`C:\NeteaseTasks\`）

### 3. 配置 Cookie

编辑 `auto_tasks_enhanced.js` 文件，找到以下部分：

```javascript
const config = {
  users: [
    {
      cookie: 'MUSIC_U=xxxxxxxxxxxxx',
      nickname: '你的昵称'
    }
  ],
  // ... 其他配置
}
```

将 `MUSIC_U=xxxxxxxxxxxxx` 替换为你的网易云音乐 Cookie。

#### 如何获取 Cookie

1. 打开网易云音乐网页版 (https://music.163.com)
2. 登录账号
3. 按 F12 打开开发者工具
4. 进入 Application → Cookies → https://music.163.com
5. 复制 `MUSIC_U` 的值
6. 替换配置文件中的值

### 4. 运行程序

#### 方法 1: 双击运行
双击 `run_windows.bat` 启动任务

#### 方法 2: 命令行运行
打开命令提示符，进入程序目录：
```cmd
cd C:\NeteaseTasks
netease-tasks.exe
```

## 功能特性

| 功能 | 说明 |
|------|------|
| 云贝签到 | 每日云贝签到，获得云贝奖励 |
| VIP 乐签打卡 | VIP 用户每日乐签打卡，获得成长值 +10 |
| VIP 成长值领取 | 自动领取已完成的 VIP 任务成长值 |
| VIP 音乐任务 | 收藏歌曲 + 听歌记录 + 领取成长值 + 取消收藏 |

## 定时任务设置

### 使用 Windows 任务计划程序

1. 打开"任务计划程序"（Win + R，输入 `taskschd.msc`）
2. 点击"创建基本任务"
3. 设置任务名称（如：网易云音乐自动任务）
4. 触发器选择"每天"
5. 设置执行时间（如：每天早上 8:00）
6. 操作选择"启动程序"
7. 程序或脚本：`C:\NeteaseTasks\netease-tasks.exe`
8. 完成创建

## 多账号配置

在 `auto_tasks_enhanced.js` 中添加多个用户：

```javascript
const config = {
  users: [
    {
      cookie: 'MUSIC_U=账号 1 的 Cookie',
      nickname: '账号 1'
    },
    {
      cookie: 'MUSIC_U=账号 2 的 Cookie',
      nickname: '账号 2'
    }
  ],
  // ... 其他配置
}
```

## 配置选项

```javascript
const config = {
  // 用户配置
  users: [...],
  
  // 功能开关
  enableYunbeiSign: true,          // 云贝签到
  enableVipSign: true,             // VIP 乐签打卡
  enableVipGrowthpoint: true,      // VIP 成长值领取
  showVipTaskList: true,           // 显示 VIP 任务列表
  
  // VIP 音乐任务
  enableVipMusicTasks: true,       // 是否启用 VIP 音乐任务
  vipMusicPlaylistId: 8402996200,  // 会员雷达歌单 ID
  vipMusicSongCount: 3             // 处理的歌曲数量
}
```

## 常见问题

### Q: Cookie 过期了怎么办？
A: 重新获取 Cookie 并更新配置文件即可。

### Q: 提示"非黑胶会员"？
A: 请确认账号已开通黑胶 VIP 会员。

### Q: 如何查看执行日志？
A: 程序运行时会在命令行显示详细日志，可以截图保存。

### Q: Windows Defender 报毒？
A: 这是误报。本程序是开源的 Node.js 打包程序，源代码可在 GitHub 查看。

## 注意事项

1. **Cookie 安全**: 不要将 Cookie 分享给他人
2. **请求频率**: 脚本已内置延时，请勿修改
3. **任务时效**: VIP 任务每日刷新，建议每天执行一次
4. **防火墙**: 首次运行时允许程序访问网络

## 技术支持

- GitHub Issues: https://github.com/zhuixingzhe-baisheng/163music-vip-daily/issues
- API Enhanced 文档：https://github.com/neteasecloudmusicapienhanced/api-enhanced

---

**版本**: v2.0.0  
**更新日期**: 2026-05-24
