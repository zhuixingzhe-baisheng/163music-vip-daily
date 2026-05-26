# 快速部署脚本

此脚本用于快速部署和配置网易云音乐自动任务。

## 使用步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Cookie

复制配置文件并编辑：

```bash
cp config_example.json config.json
vim config.json
# 或
nano config.json
```

在 `config.json` 中填入你的 `MUSIC_U` cookie：

```json
{
  "users": [
    {
      "nickname": "主账号",
      "cookie": "MUSIC_U=xxxxxxxxxxxxx"
    }
  ]
}
```

### 3. 测试运行

```bash
node auto_tasks_enhanced.js
```

### 4. 设置定时任务（可选）

```bash
# 添加到 crontab（每天早上 8:00 执行）
crontab -e
# 添加：
0 8 * * * /usr/bin/node /workspace/auto_tasks_enhanced.js >> /workspace/logs/netease.log 2>&1
```

### 5. 后台运行（可选）

```bash
# 使用 PM2
pm2 start auto_tasks_enhanced.js --name netease-tasks
pm2 save
pm2 startup
```

## 功能说明

详见 [README.md](./README.md)
