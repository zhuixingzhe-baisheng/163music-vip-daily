# 网易云音乐自动任务 - API Enhanced 版使用说明

## 项目简介

基于 [网易云音乐 API Enhanced](https://github.com/neteasecloudmusicapienhanced/api-enhanced) 重写的自动任务工具，支持云贝签到、VIP 乐签打卡、成长值领取等功能。

## 功能列表

### ✅ 已支持功能

| 功能模块 | 说明 | API 端点 |
|---------|------|---------|
| 云贝签到 | 每日云贝签到 | `/api/point/signed/get` |
| VIP 乐签打卡 | 黑胶会员每日签到 | `/api/vip-center-bff/task/sign` |
| VIP 任务列表 | 查看会员任务进度 | `/api/vipnewcenter/app/level/task/list` |
| 领取成长值 | 一键领取已完成任务 | `/api/vipnewcenter/app/level/task/reward/get` |
| 音乐人任务 | 获取音乐人任务列表 | `/api/nmusician/workbench/mission/cycle/list` |

### 📋 计划中功能

- [ ] 自动完成听歌任务
- [ ] 自动收藏歌曲任务
- [ ] 音乐人自动任务（签到、发动态等）
- [ ] 云贝任务自动完成

## 快速开始

### 方案一：Node.js 脚本 (推荐新手)

#### 1. 安装依赖

```bash
# 安装 Node.js (v18+)
# 安装 pnpm
npm install -g pnpm

# 安装 API 包
npm install @neteasecloudmusicapienhanced/api
```

#### 2. 获取 MUSIC_U

**方法 1：浏览器获取**

1. 打开网易云音乐网页版 https://music.163.com/
2. 按 F12 打开开发者工具
3. 登录账号
4. 在 Network 标签中找到任意请求
5. 复制 Request Headers 中的 `Cookie` 值，提取 `MUSIC_U`

**方法 2：使用 QuickLogin 工具**

到项目 releases 页面下载 QuickLogin 工具，扫描获取 MUSIC_U

#### 3. 配置脚本

编辑 `auto_tasks_enhanced.js`，修改配置：

```javascript
const config = {
  users: [
    {
      cookie: 'YOUR_MUSIC_U_HERE', // 填入你的 MUSIC_U
      nickname: '我的账号'
    },
    // 可以添加多个用户
    {
      cookie: 'ANOTHER_MUSIC_U',
      nickname: '小号'
    }
  ],
  // 功能开关
  enableYunbeiSign: true,        // 云贝签到
  enableVipSign: true,           // VIP 乐签
  enableVipGrowthpoint: true,    // 自动领成长值
  showVipTaskList: true          // 显示任务列表
}
```

#### 4. 运行脚本

```bash
node auto_tasks_enhanced.js
```

### 方案二：Go 项目调用 API 服务

#### 1. 部署 API 服务

**使用 Docker (推荐)**

```bash
# 拉取镜像
docker pull moefurina/ncm-api:latest

# 运行容器
docker run -d -p 3000:3000 --name ncm-api \
  -e ENABLE_PROXY=true \
  -e ENABLE_GENERAL_UNBLOCK=true \
  moefurina/ncm-api:latest
```

**本地运行**

```bash
git clone https://github.com/neteasecloudmusicapienhanced/api-enhanced.git
cd api-enhanced
pnpm install
node app.js
```

#### 2. 编译 Go 项目

```bash
# 将 api_enhanced.go 复制到项目目录
go build -o Fuck163MusicTasks
```

#### 3. 配置文件

编辑 `config.json`:

```json
{
  "NcmApiEnhanced": {
    "Enabled": true,
    "BaseUrl": "http://localhost:3000"
  },
  "YunbeiSign": true,
  "VipSign": true,
  "AutoGetVipGrowthpoint": true
}
```

#### 4. 运行

```bash
./Fuck163MusicTasks
```

## 配置说明

### Node.js 版配置项

```javascript
const config = {
  // 用户列表
  users: [
    {
      cookie: 'MUSIC_U=...',  // Cookie
      nickname: '用户名'      // 昵称 (可选)
    }
  ],
  
  // 功能开关
  enableYunbeiSign: true,       // 云贝签到
  enableVipSign: true,          // VIP 乐签
  enableVipGrowthpoint: true,   // 自动领成长值
  showVipTaskList: false,       // 显示任务列表
  
  // 延时设置 (秒)
  lagBetweenUsers: 5,           // 多用户间延时
  randomLag: true,              // 随机延时
  lagMin: 600,                  // 最小延时
  lagMax: 3600                  // 最大延时
}
```

### Go 版配置项

```json
{
  "NcmApiEnhanced": {
    "Enabled": true,
    "BaseUrl": "http://localhost:3000"
  },
  "YunbeiSign": false,
  "VipSign": false,
  "VipListen": false,
  "VipSongLike": false,
  "AutoGetVipGrowthpoint": false,
  "ShowVipTaskList": false
}
```

## 定时任务

### 使用系统 Cron (Linux/Mac)

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 1 点执行
0 1 * * * /path/to/node /path/to/auto_tasks_enhanced.js

# 每天凌晨 1 点和下午 1 点执行 (推荐)
0 1,13 * * * /path/to/node /path/to/auto_tasks_enhanced.js
```

### 使用系统计划任务 (Windows)

1. 打开"任务计划程序"
2. 创建基本任务
3. 设置触发器 (每天 1:00 和 13:00)
4. 操作：启动程序
   - 程序：`node.exe`
   - 参数：`auto_tasks_enhanced.js`
   - 起始于：脚本所在目录

### 使用内置 Cron (Node.js)

安装 node-cron:

```bash
npm install node-cron
```

修改脚本添加定时功能:

```javascript
const cron = require('node-cron')

// 每天凌晨 1 点和下午 1 点执行
cron.schedule('0 1,13 * * *', () => {
  console.log('开始执行定时任务...')
  main()
})

console.log('定时任务已启动')
```

## 输出示例

```
============================================================
网易云音乐自动任务 (API Enhanced 版本)
============================================================

>>> 开始处理用户：我的账号
------------------------------------------------------------
[我的账号] 检查 VIP 状态...
[我的账号] VIP 状态：已开通
[我的账号] 执行云贝签到...
[我的账号] 云贝签到结果：{ code: 200, message: 'success' }
[我的账号] 执行 VIP 乐签打卡...
[我的账号] ✓ 乐签打卡成功，获得成长值 +10
[我的账号] 获取 VIP 任务列表...
[我的账号] = VIP 任务列表 =
[我的账号] 收藏歌曲 | 进度: 3/3 | 成长值: +5
[我的账号] 听歌任务 | 进度: 300/300 | 成长值: +20
[我的账号] 领取 VIP 成长值...
[我的账号] 发现 2 个可领取任务
[我的账号] ✓ 领取成长值成功，总计 +25
[我的账号] ✓ 任务完成
------------------------------------------------------------

============================================================
所有用户任务执行完成!
============================================================
```

## 环境变量

可以使用环境变量配置敏感信息：

```bash
export MUSIC_U="YOUR_COOKIE"
export NCM_API_BASE_URL="http://localhost:3000"
```

然后在脚本中读取：

```javascript
const config = {
  users: [
    {
      cookie: process.env.MUSIC_U,
      nickname: '默认用户'
    }
  ]
}
```

## 常见问题

### Q: 提示 "MUSIC_U 无效"
**A**: 请确保：
1. Cookie 格式正确，包含 `MUSIC_U=`
2. Cookie 未过期
3. 账号状态正常

### Q: VIP 乐签失败
**A**: 可能原因：
1. 不是黑胶 VIP 会员
2. 今日已签到
3. Cookie 失效

### Q: 成长值领取失败
**A**: 检查：
1. 任务是否真的完成了
2. 是否已经领取过
3. 网络连接是否正常

### Q: 如何添加多个账号？
**A**: 在配置文件中添加多个用户对象：

```javascript
users: [
  { cookie: 'MUSIC_U_1', nickname: '大号' },
  { cookie: 'MUSIC_U_2', nickname: '小号' },
  { cookie: 'MUSIC_U_3', nickname: '小小号' }
]
```

### Q: 会被风控吗？
**A**: 建议：
1. 开启随机延时
2. 多账号间设置足够间隔
3. 不要在短时间内频繁请求
4. 使用正常的网络环境

## API 文档

完整的 API 文档请查看:
- [在线文档](https://neteasecloudmusicapienhanced.js.org/)
- [GitHub 仓库](https://github.com/neteasecloudmusicapienhanced/api-enhanced)

## 文件清单

```
.
├── auto_tasks_enhanced.js    # Node.js 自动任务脚本
├── api_enhanced.go           # Go API 适配层
├── config.json               # Go 项目配置
├── README_ENHANCED.md        # 本文档
└── VIP_SIGN_GUIDE.md         # VIP 乐签使用说明
```

## 更新日志

### v2.0.0 (API Enhanced 版本)
- ✅ 使用新的 API Enhanced 项目
- ✅ 重写云贝签到功能
- ✅ 重写 VIP 乐签打卡
- ✅ 重写成长值领取
- ✅ 支持多账号
- ✅ 添加定时任务支持

## 致谢

- [网易云音乐 API Enhanced](https://github.com/neteasecloudmusicapienhanced/api-enhanced) - 提供 API 支持
- [Binaryify/NeteaseCloudMusicApi](https://github.com/binaryify/NeteaseCloudMusicApi) - 原作者项目
- [Fuck163MusicTasks](https://github.com/XiaoMengXinX/Fuck163MusicTasks) - 原项目

## License

MIT License
