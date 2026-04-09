#!/bin/bash
# Double-click in Finder to run (opens Terminal). Same role as 启动每日任务-Windows.bat on Windows.
cd "$(dirname "$0")" || exit 1

export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.local/bin:$PATH"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] 未找到 npm，请先安装 Node.js: https://nodejs.org"
  read -r -p "按回车关闭..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "首次运行：正在 npm install ..."
  if ! npm install; then
    echo "[ERROR] npm install 失败"
    read -r -p "按回车关闭..."
    exit 1
  fi
fi

if ! npm start; then
  echo "[ERROR] 启动失败"
  read -r -p "按回车关闭..."
  exit 1
fi
