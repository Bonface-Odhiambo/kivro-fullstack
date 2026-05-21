@echo off
echo.
echo ===================================
echo   KIVRO Twilio Configuration Check
echo ===================================
echo.
curl http://localhost:3002/api/test-sms/status
echo.
echo.
echo ===================================
pause
