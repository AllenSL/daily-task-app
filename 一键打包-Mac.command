#!/bin/bash
# One-click macOS dmg+zip build (run on Mac only). Same idea as 一键打包-Windows.bat
cd "$(dirname "$0")" || exit 1

export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.local/bin:$PATH"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
fi

export ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm not found. Install Node.js from https://nodejs.org"
  read -r -p "Press Enter to close..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Running npm install..."
  npm install || {
    echo "[ERROR] npm install failed"
    read -r -p "Press Enter to close..."
    exit 1
  }
fi

echo "[daily-task-app] macOS pack (dmg + zip)..."
npm run pack:mac
rc=$?
if [ $rc -ne 0 ]; then
  echo "[ERROR] Build failed"
  read -r -p "Press Enter to close..."
  exit $rc
fi

echo "Done. Check folder: release/"
read -r -p "Press Enter to close..."
