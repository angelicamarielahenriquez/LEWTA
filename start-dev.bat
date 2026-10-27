@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing project dependencies...
  call npm.cmd install
  if errorlevel 1 goto error
)
echo Starting LEWTA at http://localhost:3000
call npm.cmd run dev
goto end
:error
echo Dependency installation failed. Check your internet connection and Node.js installation.
pause
:end
