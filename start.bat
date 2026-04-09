@echo off
REM Same as 启动每日任务.bat (ASCII-safe for cmd.exe)
cd /d "%~dp0"
where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found in PATH. Install from https://nodejs.org
  pause
  exit /b 1
)
if not exist "%~dp0node_modules" (
  echo Running npm install ...
  call npm.cmd install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)
call npm.cmd start
if errorlevel 1 pause
