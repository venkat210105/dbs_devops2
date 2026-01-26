# Simple Railway MySQL Import Script
# This version uses the MYSQL_URL or individual credentials

Write-Host "=== Railway Database Import - Simple Version ===" -ForegroundColor Cyan
Write-Host ""

# Check backup file
if (-not (Test-Path "backup_feedback.sql")) {
    Write-Host "❌ backup_feedback.sql not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Railway provides two ways to connect:" -ForegroundColor Yellow
Write-Host "1. Using MYSQL_URL (recommended - single connection string)" -ForegroundColor White
Write-Host "2. Using individual variables (host, port, user, password)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Which do you prefer? (1 or 2)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Host "Please paste your MYSQL_URL from Railway:" -ForegroundColor Cyan
    Write-Host "(Format: mysql://user:password@host:port/database)" -ForegroundColor Gray
    $MYSQL_URL = Read-Host "MYSQL_URL"
    
    # Parse the URL
    if ($MYSQL_URL -match "mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
        $user = $matches[1]
        $password = $matches[2]
        $host = $matches[3]
        $port = $matches[4]
        $database = $matches[5]
        
        Write-Host ""
        Write-Host "Parsed credentials:" -ForegroundColor Green
        Write-Host "  Host: $host" -ForegroundColor Gray
        Write-Host "  Port: $port" -ForegroundColor Gray
        Write-Host "  User: $user" -ForegroundColor Gray
        Write-Host "  Database: $database" -ForegroundColor Gray
    } else {
        Write-Host "❌ Invalid MYSQL_URL format" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    $host = Read-Host "MYSQLHOST (e.g., metro.proxy.rlwy.net)"
    $port = Read-Host "MYSQLPORT (e.g., 52769)"
    $user = Read-Host "MYSQLUSER (often 'root')"
    $password = Read-Host "MYSQLPASSWORD" -AsSecureString
    $database = Read-Host "MYSQLDATABASE (often 'railway')"
    
    # Convert secure password
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    $password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Host ""
Write-Host "=== Testing Connection ===" -ForegroundColor Cyan

$testCmd = "mysql -h $host -P $port -u $user -p$password -e 'SELECT 1;' 2>&1"
$testResult = Invoke-Expression $testCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Connection failed!" -ForegroundColor Red
    Write-Host $testResult
    exit 1
}

Write-Host "✅ Connection successful!" -ForegroundColor Green

Write-Host ""
Write-Host "=== Importing 80 Feedback Records ===" -ForegroundColor Cyan

# Import using Get-Content and pipeline
$content = Get-Content "backup_feedback.sql" -Raw
$importCmd = "mysql -h $host -P $port -u $user -p$password $database"

try {
    $content | & mysql -h $host -P $port -u $user -p"$password" $database 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Import successful!" -ForegroundColor Green
    }
} catch {
    Write-Host "Attempting alternative import method..." -ForegroundColor Yellow
}

# Verify
Write-Host ""
Write-Host "=== Verifying Import ===" -ForegroundColor Cyan

$countQuery = "SELECT COUNT(*) as count FROM feedback;"
$countResult = mysql -h $host -P $port -u $user -p"$password" $database -sN -e $countQuery 2>&1 | Select-Object -Last 1

Write-Host "Records in Railway database: $countResult" -ForegroundColor White

if ($countResult -ge 80) {
    Write-Host "✅ Import verified! Found $countResult records." -ForegroundColor Green
} else {
    Write-Host "⚠️  Found $countResult records. Expected at least 80." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Green
