@echo off
REM Portable exe -> release\DailyTasks-*-portable.exe
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
call npm run pack
