@echo off
REM Fix incomplete Electron download. Close this IDE tab for this folder, close any Electron window, then run.
cd /d "%~dp0"
where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js not in PATH.
  pause
  exit /b 1
)

echo Killing stray Electron processes...
taskkill /F /IM electron.exe 2>nul
timeout /t 2 /nobreak >nul

echo Removing node_modules\electron (if not locked)...
if exist "%~dp0node_modules\electron" rd /s /q "%~dp0node_modules\electron" 2>nul
if exist "%~dp0node_modules\electron" (
  echo [WARN] Could not delete node_modules\electron - file in use.
  echo Close Cursor/VS Code for this folder, close antivirus scan on this path, then run this again.
  echo Or delete the folder manually in Explorer, then run: npm.cmd install
  pause
  exit /b 1
)

echo Installing electron with mirror from .npmrc ...
call npm.cmd install electron@28.3.3 --save-dev --no-fund --no-audit
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo Done. Try: start.bat
pause
