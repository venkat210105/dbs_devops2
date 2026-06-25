#!/bin/bash
# Bash Script to Import Data to Railway MySQL
# Usage: ./import_to_railway.sh

echo "=== Universal Feedback System - Railway Database Import ==="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠️  Railway CLI not found!"
    echo "Install it with: npm install -g @railway/cli"
    echo "Or download from: https://railway.app/cli"
    echo ""
    read -p "Continue with manual MySQL connection? (y/n): " response
    if [ "$response" != "y" ]; then
        exit 0
    fi
fi

# Check if backup file exists
BACKUP_FILE="backup_feedback.sql"
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "✅ Found backup file with data to import"
echo ""

# Get Railway database credentials
echo "Please enter your Railway MySQL credentials:"
echo "(You can find these in Railway Dashboard → MySQL Service → Variables)"
echo ""

read -p "MySQL Host (e.g., mysql.railway.internal): " MYSQL_HOST
read -p "MySQL Port (default: 3306): " MYSQL_PORT
read -p "MySQL User: " MYSQL_USER
read -sp "MySQL Password: " MYSQL_PASSWORD
echo ""
read -p "MySQL Database (default: railway): " MYSQL_DATABASE

MYSQL_PORT=${MYSQL_PORT:-3306}
MYSQL_DATABASE=${MYSQL_DATABASE:-railway}

echo ""
echo "=== Testing Connection ==="

# Test connection
if mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT 1;" &> /dev/null; then
    echo "✅ Connection successful!"
else
    echo "❌ Connection failed!"
    exit 1
fi

echo ""
echo "=== Importing Data ==="
echo "Importing 80 feedback records to Railway..."

# Import the backup
if mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$BACKUP_FILE" 2>&1 | grep -v "Warning"; then
    echo "✅ Data imported successfully!"
else
    echo "⚠️  Import completed with warnings"
fi

echo ""
echo "=== Verifying Import ==="

# Verify record count
RECORD_COUNT=$(mysql -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" -sN -e "SELECT COUNT(*) FROM feedback;")

echo "Total records in database: $RECORD_COUNT"

if [ "$RECORD_COUNT" -eq 80 ]; then
    echo "✅ All 80 records verified!"
else
    echo "⚠️  Record count mismatch. Expected 80, found $RECORD_COUNT"
fi

echo ""
echo "=== Import Complete ==="
echo "Next steps:"
echo "1. Update your backend .env or Railway variables with these credentials"
echo "2. Test your backend connection: railway run mvn spring-boot:run"
echo "3. Verify data in your frontend application"
echo ""
