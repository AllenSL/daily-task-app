@echo off
setlocal EnableDelayedExpansion
REM Portable exe -> out\DailyTaskApp-*-portable.exe (or out-RANDOM if out\ is locked)
cd /d "%~dp0"

taskkill /F /IM electron.exe 2>nul
taskkill /F /IM DailyTaskApp.exe 2>nul
timeout /t 2 /nobreak >nul

set OUTDIR=out
if exist out rmdir /s /q out 2>nul
if exist out (
  set "OUTDIR=out-!RANDOM!"
  echo [WARN] Cannot clean folder "out\" ^(Explorer / antivirus / old build^). Building to "!OUTDIR!\" instead.
  if exist "!OUTDIR!" rmdir /s /q "!OUTDIR!" 2>nul
)

set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

REM Pass output dir on CLI so we do not need "npm run pack" with fixed package.json path
call npx electron-builder --win portable --x64 -c.directories.output=!OUTDIR!
set ERR=%errorlevel%

echo.
if %ERR% equ 0 (
  echo Done. Portable exe: !OUTDIR!\DailyTaskApp-*-portable.exe
) else (
  echo [ERROR] electron-builder failed ^(code %ERR%^).
)
exit /b %ERR%
