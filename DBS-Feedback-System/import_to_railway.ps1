# PowerShell Script to Import Data to Railway MySQL
# Usage: .\import_to_railway.ps1

Write-Host "=== Universal Feedback System - Railway Database Import ===" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayInstalled) {
    Write-Host "⚠️  Railway CLI not found!" -ForegroundColor Yellow
    Write-Host "Install it with: npm install -g @railway/cli" -ForegroundColor Yellow
    Write-Host "Or download from: https://railway.app/cli" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Continue with manual MySQL connection? (y/n): " -NoNewline -ForegroundColor Cyan
    $response = Read-Host
    if ($response -ne 'y') {
        exit
    }
}

# Check if backup file exists
$backupFile = "backup_feedback.sql"
if (-not (Test-Path $backupFile)) {
    Write-Host "❌ Backup file not found: $backupFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found backup file with data to import" -ForegroundColor Green
Write-Host ""

# Get Railway database credentials
Write-Host "Please enter your Railway MySQL credentials:" -ForegroundColor Cyan
Write-Host "(You can find these in Railway Dashboard → MySQL Service → Variables)" -ForegroundColor Gray
Write-Host ""

$MYSQL_HOST = Read-Host "MySQL Host (e.g., monorail.proxy.rlwy.net - DO NOT include port)"
$MYSQL_PORT = Read-Host "MySQL Port (e.g., 52769)"
$MYSQL_USER = Read-Host "MySQL User"
$MYSQL_PASSWORD = Read-Host "MySQL Password" -AsSecureString
$MYSQL_DATABASE = Read-Host "MySQL Database (default: railway)"

# Convert secure string to plain text for mysql command
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($MYSQL_PASSWORD)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrEmpty($MYSQL_PORT)) { $MYSQL_PORT = "3306" }
if ([string]::IsNullOrEmpty($MYSQL_DATABASE)) { $MYSQL_DATABASE = "railway" }

Write-Host ""
Write-Host "=== Testing Connection ===" -ForegroundColor Cyan

# Test connection first
$testQuery = "SELECT 1;"
$testCommand = "mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$PlainPassword -e `"$testQuery`" 2>&1"

try {
    $testResult = Invoke-Expression $testCommand
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connection successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Connection failed!" -ForegroundColor Red
        Write-Host $testResult
        exit 1
    }
} catch {
    Write-Host "❌ Connection error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Importing Data ===" -ForegroundColor Cyan
Write-Host "Importing 80 feedback records to Railway..." -ForegroundColor Yellow

# Import the backup using PowerShell redirection
try {
    $importResult = Get-Content $backupFile | mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$PlainPassword $MYSQL_DATABASE 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Data imported successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Import completed with warnings:" -ForegroundColor Yellow
        Write-Host $importResult
    }
} catch {
    Write-Host "❌ Import error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Verifying Import ===" -ForegroundColor Cyan

# Verify record count
$verifyQuery = "SELECT COUNT(*) as total FROM feedback;"
$verifyCommand = "mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$PlainPassword $MYSQL_DATABASE -e `"$verifyQuery`" 2>&1"

try {
    $verifyResult = Invoke-Expression $verifyCommand
    Write-Host $verifyResult
    
    if ($verifyResult -match "80") {
        Write-Host "✅ All 80 records verified!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Record count mismatch. Please check manually." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not verify: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Import Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your backend .env or Railway variables with these credentials" -ForegroundColor Gray
Write-Host "2. Test your backend connection: railway run mvn spring-boot:run" -ForegroundColor Gray
Write-Host "3. Verify data in your frontend application" -ForegroundColor Gray
Write-Host ""
