#!/bin/bash

# 网易云音乐自动任务 - Linux 环境变量部署脚本
# 使用方法：bash deploy_linux.sh

set -e

echo "=============================================="
echo "网易云音乐自动任务 - Linux 部署"
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

# 部署目录
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

# 创建目录并复制文件
mkdir -p "$DEPLOY_DIR"
cp -r /workspace/* "$DEPLOY_DIR/"
cd "$DEPLOY_DIR"

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
echo "1. 设置环境变量（永久配置）"
echo ""
echo "   编辑 ~/.bashrc 或 ~/.profile："
echo "   cat >> ~/.bashrc << 'EOF'"
echo "   export NETEASE_MUSIC_U='MUSIC_U=你的 cookie 值'"
echo "   export SERVER_SENDKEY='SCTxxxxxxxx'           # 可选"
echo "   export PUSHPLUS_TOKEN='你的 token'            # 可选"
echo "   EOF"
echo ""
echo "   使配置生效："
echo "   source ~/.bashrc"
echo ""
echo "2. 获取 MUSIC_U Cookie 方法"
echo "   - 访问 https://music.163.com"
echo "   - 登录账号"
echo "   - 按 F12 → Application → Cookies"
echo "   - 复制 MUSIC_U 的值"
echo ""
echo "3. 测试运行"
echo "   cd $DEPLOY_DIR"
echo "   node auto_tasks_enhanced.js"
echo ""
echo "4. 设置定时任务（每天早上 8:00 执行）"
echo "   crontab -e"
echo "   添加："
echo "   0 8 * * * cd $DEPLOY_DIR && /usr/bin/node auto_tasks_enhanced.js >> $DEPLOY_DIR/logs/netease.log 2>&1"
echo ""
echo "5. 后台运行（可选）"
echo "   npm install -g pm2"
echo "   pm2 start auto_tasks_enhanced.js --name netease"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "=============================================="
