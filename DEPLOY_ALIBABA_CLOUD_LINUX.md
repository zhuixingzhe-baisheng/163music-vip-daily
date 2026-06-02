# Alibaba Cloud Linux 3 部署指南

适用于 **Alibaba Cloud Linux 3.2104 LTS 64 位** 系统的网易云音乐自动任务 Web 管理版部署指南。

---

## 系统信息

- **操作系统**: Alibaba Cloud Linux 3.2104 LTS 64 位
- **兼容性**: 与 RHEL/CentOS 8/9 完全兼容
- **包管理器**: `yum` / `dnf`
- **Node.js 版本**: 推荐 18.x 或 20.x

---

## 🚀 快速部署（Web 管理版）

### 方式一：一键脚本部署（推荐）

```bash
# 1. 创建部署脚本
cat > deploy_aliyun.sh << 'EOF'
#!/bin/bash
set -e

echo "========================================"
echo "Alibaba Cloud Linux 3 网易云自动任务部署"
echo "========================================"

# 检查是否为 root 用户
if [ $EUID -ne 0 ]; then
    echo "请使用 root 用户执行此脚本"
    exit 1
fi

# 安装 Node.js 20.x
echo "📦 安装 Node.js 20.x..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# 验证安装
echo "✅ Node.js版本：$(node -v)"
echo "✅ npm 版本：$(npm -v)"

# 安装 PM2
echo "📦 安装 PM2..."
npm install -g pm2

# 克隆项目
echo "📁 克隆项目..."
cd /usr/local
git clone https://github.com/zhuixingzhe-baisheng/163music-vip-daily.git
cd 163music-vip-daily

# 安装依赖
echo "🔧 安装项目依赖..."
npm install

# 创建日志目录
mkdir -p logs

# 配置防火墙（如已开启）
if systemctl is-active --quiet firewalld; then
    echo "🔥 配置防火墙..."
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --permanent --add-port=3001/tcp
    firewall-cmd --reload
fi

# 启动服务
echo "🚀 启动服务..."
pm2 start ecosystem.config.js
pm2 save

# 设置开机自启
echo "⚙️  配置开机自启..."
pm2 startup systemd -u root --hp /root
eval $(pm2 startup | grep systemctl)

echo ""
echo "========================================"
echo "✅ 部署完成！"
echo "========================================"
echo ""
echo "📝 下一步操作："
echo "1. 访问 http://<服务器 IP>:3000"
echo "2. 在 Web 界面配置账号和任务"
echo "3. 配置防火墙安全组（阿里云控制台）"
echo ""
echo "🔧 常用命令："
echo "  pm2 status          # 查看服务状态"
echo "  pm2 logs            # 查看日志"
echo "  pm2 restart all     # 重启所有服务"
echo "  pm2 monit           # 监控面板"
echo ""
EOF

# 执行脚本
chmod +x deploy_aliyun.sh
./deploy_aliyun.sh
```

---

### 方式二：手动部署

#### 1. 安装 Node.js

```bash
# 方法 A: 使用 NodeSource（推荐）
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# 方法 B: 使用 EPEL 源（版本可能较旧）
yum install -y epel-release
yum install -y nodejs npm

# 验证安装
node -v  # 应该显示 v20.x.x
npm -v   # 应该显示 10.x.x
```

#### 2. 安装 PM2

```bash
npm install -g pm2
```

#### 3. 获取项目

```bash
cd /usr/local
git clone https://github.com/zhuixingzhe-baisheng/163music-vip-daily.git
cd 163music-vip-daily
```

#### 4. 安装依赖

```bash
npm install
```

#### 5. 配置阿里云安全组

在阿里云控制台配置安全组规则：

1. 登录 [阿里云 ECS 控制台](https://ecs.console.aliyun.com/)
2. 找到你的实例 → 安全组 → 配置规则
3. 添加入方向规则：
   - 端口范围：`3000/3000`（前端）
   - 端口范围：`3001/3001`（API）
   - 授权对象：`0.0.0.0/0`（或指定 IP）
   - 协议：TCP
   - 策略：允许

#### 6. 配置本地防火墙（如已启用）

```bash
# 检查防火墙状态
systemctl status firewalld

# 如果已启用，开放端口
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload

# 查看已开放的端口
firewall-cmd --list-ports
```

#### 7. 启动服务

```bash
# 启动所有服务
pm2 start ecosystem.config.js

# 保存进程列表
pm2 save

# 设置开机自启
pm2 startup systemd -u root --hp /root

# 复制输出的命令并执行（重要！）
# 例如：sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

---

## 📋 Web 界面使用

### 1. 访问管理界面

```
http://<你的服务器 IP>:3000
```

### 2. 配置账号

1. 访问 **账号配置** 页面
2. 点击「添加账号」
3. 填入昵称和 MUSIC_U Cookie

#### 获取 Cookie

1. 访问 https://music.163.com
2. 登录账号
3. F12 → Network → 刷新页面
4. 点击任意请求 → Headers
5. 复制 Cookie 中的 `MUSIC_U=xxxxxxxxx`

### 3. 配置任务开关

访问 **任务设置** 页面，根据需要开启/关闭任务。

### 4. 配置消息推送

支持两种推送方式：

- **Server 酱** - 微信推送（https://sct.ftqq.com/）
- **PushPlus** - 微信公众号推送（https://pushplus.plus/）

---

## 🔧 PM2 常用命令

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs

# 查看特定服务日志
pm2 logs netease-api-server
pm2 logs netease-frontend
pm2 logs netease-tasks

# 重启所有服务
pm2 restart all

# 重启特定服务
pm2 restart netease-frontend

# 停止服务
pm2 stop netease-tasks

# 删除服务
pm2 delete netease-tasks

# 监控面板
pm2 monit

# 查看详细信息
pm2 show netease-api-server

# 保存当前进程列表
pm2 save

# 清空日志
pm2 flush
```

---

## ⏰ 定时任务配置

### 方式一：PM2 定时执行

编辑 `ecosystem.config.js`：

```javascript
{
  name: 'netease-tasks',
  script: './auto_tasks_enhanced.js',
  cron_restart: '0 8 * * *',  // 每天 8:00
  autorestart: false
}
```

重启任务：
```bash
pm2 restart netease-tasks
```

### 方式二：系统 Crontab

```bash
# 编辑 crontab
crontab -e

# 添加任务（每天 8:00 执行）
0 8 * * * cd /usr/local/163music-vip-daily && /usr/bin/node auto_tasks_enhanced.js >> /usr/local/163music-vip-daily/logs/cron.log 2>&1

# 查看 crontab
crontab -l

# 查看 cron 日志
tail -f /var/log/cron
```

---

## 📦 系统优化建议

### 1. 关闭 SELinux（如不需要）

```bash
# 查看 SELinux 状态
getenforce

# 临时关闭
setenforce 0

# 永久关闭（编辑配置文件）
vi /etc/selinux/config
# 修改：SELINUX=disabled
```

### 2. 配置 Swap（防止内存不足）

```bash
# 创建 2GB swap 文件
dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 验证
free -h

# 设置开机启用
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 3. 优化文件描述符限制

```bash
# 查看当前限制
ulimit -n

# 临时修改
ulimit -n 65535

# 永久修改（编辑 /etc/security/limits.conf）
cat >> /etc/security/limits.conf << EOF
* soft nofile 65535
* hard nofile 65535
root soft nofile 65535
root hard nofile 65535
EOF
```

### 4. 配置 NTP 时间同步

```bash
# 安装 chrony
yum install -y chrony

# 启动服务
systemctl start chronyd
systemctl enable chronyd

# 查看时间同步状态
chronyc sources -v
```

---

## 🐛 故障排查

### 问题 1: 无法访问 Web 界面

**症状**：浏览器无法打开 http://IP:3000

**排查步骤**：

```bash
# 1. 检查服务是否运行
pm2 status

# 2. 检查端口是否监听
ss -tlnp | grep 3000

# 3. 检查防火墙
firewall-cmd --list-ports

# 4. 检查阿里云安全组（需在控制台检查）
```

**解决方案**：

```bash
# 重启服务
pm2 restart all

# 开放防火墙端口
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload

# 检查阿里云安全组规则（控制台配置）
```

### 问题 2: Node.js 版本过低

**症状**：`npm install` 报错或 PM2 无法启动

**解决方案**：

```bash
# 安装 nvm 管理 Node.js 版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# 验证
node -v  # 应该显示 v20.x.x
```

### 问题 3: 内存不足

**症状**：PM2 进程频繁重启或系统卡死

**解决方案**：

```bash
# 查看内存使用
free -h
pm2 monit

# 限制 PM2 进程内存（ecosystem.config.js）
{
  max_memory_restart: '256M'
}

# 配置 swap（见上文）
```

### 问题 4: Cookie 过期

**症状**：API 返回 401/400 错误

**解决方案**：

1. 重新获取 Cookie（参考 Web 界面教程）
2. 在 Web 界面更新 Cookie

### 问题 5: 开机后服务未自启

**症状**：服务器重启后需要手动 `pm2 start`

**解决方案**：

```bash
# 重新配置开机自启
pm2 startup systemd -u root --hp /root
# 复制输出的命令并执行

# 保存进程列表
pm2 save

# 验证
reboot
pm2 status  # 应该显示 online
```

---

## 📊 日志管理

### 日志位置

```bash
# PM2 日志
/root/.pm2/logs/

# 项目日志
/usr/local/163music-vip-daily/logs/
```

### 查看日志

```bash
# PM2 统一日志
pm2 logs

# 按服务查看
pm2 logs netease-api-server --lines 50

# 实时查看
tail -f /usr/local/163music-vip-daily/logs/tasks-out.log
```

### 清理日志

```bash
# PM2 清空日志
pm2 flush

# 手动清理
> /usr/local/163music-vip-daily/logs/api-server-out.log
> /usr/local/163music-vip-daily/logs/frontend-out.log
> /usr/local/163music-vip-daily/logs/tasks-out.log
```

---

## 📈 监控与告警

### 使用 PM2 Monit

```bash
pm2 monit
```

显示：
- CPU 使用率
- 内存使用率
- 进程状态
- 日志流

### 配置告警（可选）

使用 `pm2-logrotate` 管理日志轮转：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## ⚠️ 安全建议

### 1. 配置 SSH 密钥登录

```bash
# 生成密钥对（本地执行）
ssh-keygen -t ed25519

# 上传公钥到服务器
ssh-copy-id root@<你的服务器 IP>

# 修改 SSH 配置
vi /etc/ssh/sshd_config
# PasswordAuthentication no
# PubkeyAuthentication yes

# 重启 SSH 服务
systemctl restart sshd
```

### 2. 定期更新系统

```bash
# 每月更新
yum update -y

# 自动更新（可选）
yum install -y yum-cron
systemctl enable yum-cron
```

### 3. 禁用不必要的服务

```bash
# 查看运行的服务
systemctl list-units --type=service --state=running

# 禁用不需要的服务
systemctl disable <service-name>
```

---

## 📄 相关文件

- `ecosystem.config.js` - PM2 配置文件
- `config.json` - 用户配置（自动生成）
- `logs.json` - 执行日志（自动生成）
- `README.md` - 项目完整文档

---

## 🔗 参考链接

- [Alibaba Cloud Linux 3 文档](https://help.aliyun.com/product/51642.html)
- [阿里云 ECS 安全组配置](https://help.aliyun.com/document_detail/25471.html)
- [Node.js 官方下载](https://nodejs.org/)
- [PM2 文档](https://pm2.keymetrics.io/docs/)

---

**最后更新**: 2026-06-02  
**适用系统**: Alibaba Cloud Linux 3.2104 LTS 64 位
