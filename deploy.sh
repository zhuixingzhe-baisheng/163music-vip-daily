#!/bin/bash

# 网易云音乐自动任务 - 快速部署脚本
# 使用方法：在服务器执行 curl 下载后运行 bash deploy.sh

set -e

echo "=============================================="
echo "网易云音乐自动任务 - 快速部署"
echo "=============================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安装 Node.js，请先安装"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    echo ""
    echo "CentOS:"
    echo "  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -"
    echo "  sudo yum install -y nodejs"
    exit 1
fi

echo "✅ Node.js: $(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未安装 npm"
    exit 1
fi

echo "✅ npm: $(npm -v)"
echo ""

# 创建部署目录
DEPLOY_DIR="$HOME/163music-vip-daily"
echo "📁 部署目录：$DEPLOY_DIR"

# 检查目录是否存在
if [ -d "$DEPLOY_DIR" ]; then
    echo "⚠️  目录已存在，是否覆盖？(y/n)"
    read -p "> " confirm
    if [ "$confirm" = "y" ]; then
        rm -rf "$DEPLOY_DIR"
        echo "已删除旧目录"
    else
        echo "取消部署"
        exit 0
    fi
fi

# 创建目录
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# 克隆仓库
echo ""
echo "📦 克隆仓库 (qinglong 分支)..."
git clone -b qinglong https://github.com/zhuixingzhe-baisheng/163music-vip-daily.git .

# 安装依赖
echo ""
echo "🔧 安装依赖..."
npm install

# 完成
echo ""
echo "=============================================="
echo "✅ 部署完成！"
echo "=============================================="
echo ""
echo "项目目录：$DEPLOY_DIR"
echo ""
echo "下一步操作："
echo "----------------------------------------------"
echo ""
echo "1. 设置 MUSIC_U Cookie"
echo ""
echo "   方式 1: 直接设置环境变量"
echo "   export NetEase_MusicU='MUSIC_U=你的 cookie 值'"
echo ""
echo "   方式 2: 创建配置文件"
echo "   cat > .env << 'EOF'"
echo "   NetEase_MusicU=MUSIC_U=你的 cookie 值"
echo "   EOF"
echo ""
echo "2. 获取 Cookie 方法"
echo "   - 访问 https://music.163.com"
echo "   - 登录账号"
echo "   - 按 F12 → Application → Cookies"
echo "   - 复制 MUSIC_U 的值"
echo ""
echo "3. 测试运行"
echo "   cd $DEPLOY_DIR"
echo "   export NetEase_MusicU='MUSIC_U=你的 cookie'"
echo "   node auto_tasks_qinglong.js"
echo ""
echo "4. 设置定时任务（可选）"
echo "   crontab -e"
echo "   添加：0 8 * * * cd $DEPLOY_DIR && /usr/bin/node auto_tasks_qinglong.js"
echo ""
echo "5. 后台运行（可选）"
echo "   npm install -g pm2"
echo "   pm2 start auto_tasks_qinglong.js --name netease"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "=============================================="
