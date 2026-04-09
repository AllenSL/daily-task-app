@echo off
REM Use ASCII-only lines so cmd.exe does not break UTF-8/GBK batch parsing on Chinese Windows.
cd /d "%~dp0"

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not found in PATH. Install LTS from https://nodejs.org then reopen this window.
  pause
  exit /b 1
)

if not exist "%~dp0node_modules" (
  echo First run: npm install ...
  call npm.cmd install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

call npm.cmd start
if errorlevel 1 pause
