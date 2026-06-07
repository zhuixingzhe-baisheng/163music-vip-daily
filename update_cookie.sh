#!/bin/bash

# 网易云音乐 Cookie 更新脚本
# 用法：./update_cookie.sh "你的 MUSIC_U cookie 值"

if [ -z "$1" ]; then
  echo "❌ 请提供 cookie 值"
  echo ""
  echo "用法："
  echo "  ./update_cookie.sh MUSIC_U=xxxxxxxxx"
  echo "  ./update_cookie.sh \"MUSIC_U=xxxxxxxxx\""
  echo ""
  exit 1
fi

COOKIE=$1

# 检查 config.json 是否存在
if [ ! -f "config.json" ]; then
  echo "❌ config.json 不存在"
  exit 1
fi

# 备份原文件
cp config.json config.json.bak

# 替换 cookie
# 支持多种格式输入
if [[ "$COOKIE" == MUSIC_U=* ]]; then
  # 输入已包含 MUSIC_U=
  COOKIE_VALUE="$COOKIE"
else
  # 输入只有 cookie 值，添加前缀
  COOKIE_VALUE="MUSIC_U=$COOKIE"
fi

# 使用 sed 替换
sed -i "s/\(\"cookie\": \"MUSIC_U=\)[^\"]*/\1${COOKIE_VALUE#MUSIC_U=}/g" config.json

# 检查是否成功
if [ $? -eq 0 ]; then
  echo "✅ Cookie 已更新"
  echo ""
  echo "新 cookie 值："
  grep -o '"cookie": "[^"]*"' config.json | head -1
  echo ""
  echo "备份文件：config.json.bak"
else
  echo "❌ 更新失败"
  echo "恢复备份："
  echo "  mv config.json.bak config.json"
fi
