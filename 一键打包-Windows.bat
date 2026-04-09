@echo off
REM One-click Windows portable build -> release\DailyTaskApp-*-portable.exe
cd /d "%~dp0"

echo [daily-task-app] Windows pack...
call pack.bat
if errorlevel 1 (
  echo.
  echo [ERROR] Build failed.
  pause
  exit /b 1
)
echo.
echo Done. Check folder: release\
pause
