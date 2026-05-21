# KIVRO SMS Test Script
# This script sends a test SMS to verify Twilio configuration

$phoneNumber = "+254706242439"
$testMessage = "🎉 KIVRO SMS Test! Your SMS system is working perfectly! Time: " + (Get-Date).ToString()

$body = @{
    phone_number = $phoneNumber
    message = $testMessage
} | ConvertTo-Json

Write-Host "📱 Sending test SMS to: $phoneNumber" -ForegroundColor Cyan
Write-Host "Message: $testMessage" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/test-sms/send" `
                                  -Method Post `
                                  -ContentType "application/json" `
                                  -Body $body
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3
    
    Write-Host ""
    Write-Host "📱 Check your phone for the SMS!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Yellow
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 3
    }
}
