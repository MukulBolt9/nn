# NowBrief GitHub Setup Script (PowerShell)
# Run with: .\setup_github.ps1

Write-Host "NowBrief GitHub Setup" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

# Initialize git if not already done
if (-not (Test-Path ".git")) {
    git init
    Write-Host "Git initialized" -ForegroundColor Green
}

git add .
git commit -m "feat: NowBrief - Samsung Live Notification app with Gemini AI"

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create a GitHub repo at: https://github.com/new (name it NowBrief)"
Write-Host "2. Run these commands:"
Write-Host '   git remote add origin https://github.com/YOUR_USERNAME/NowBrief.git' -ForegroundColor White
Write-Host '   git branch -M main' -ForegroundColor White
Write-Host '   git push -u origin main' -ForegroundColor White
Write-Host ""
Write-Host "Done! Ready to push." -ForegroundColor Green
