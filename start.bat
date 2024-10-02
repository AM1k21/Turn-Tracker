@echo off
:: Install npm packages
call npm install

:: Run npm preview command
call npm run preview

:: Keep the console window open after npm preview finishes
echo.
echo Press any key to close this window...
pause >nul
