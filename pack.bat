@echo off
REM Portable exe -> out\DailyTaskApp-*-portable.exe  (out avoids stale locked release\)
cd /d "%~dp0"

REM app.asar lock: close app / electron test; Explorer preview on out\ or release\
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM DailyTaskApp.exe 2>nul
timeout /t 2 /nobreak >nul

if exist out rmdir /s /q out 2>nul
if exist out (
  echo [ERROR] Cannot remove out\. Close Explorer on that folder, then retry.
  pause
  exit /b 1
)

set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
call npm run pack
