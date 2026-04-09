@echo off
REM One-click Windows portable build -> out\DailyTaskApp-*-portable.exe
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
echo.
echo Done. Portable exe is under out\ or the folder name printed above if out was locked.
pause
