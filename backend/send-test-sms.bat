@echo off
echo.
echo ============================================
echo   KIVRO SMS Test - Sending to +254706242439
echo ============================================
echo.
curl -X POST http://localhost:3002/api/test-sms/send ^
  -H "Content-Type: application/json" ^
  -d "{\"phone_number\":\"+254706242439\",\"message\":\"KIVRO SMS Test - It works!\"}"
echo.
echo.
echo ============================================
echo   Check your phone for the SMS!
echo ============================================
pause
