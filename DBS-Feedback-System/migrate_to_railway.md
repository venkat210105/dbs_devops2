# Railway Database Migration Guide

## Overview
This guide will help you migrate your 80 local feedback records to Railway's MySQL database.

## Prerequisites
1. Railway account with MySQL database provisioned
2. Railway CLI installed or access to Railway dashboard
3. Local backup file: `backup_feedback.sql` (already created ✓)

## Method 1: Using Railway CLI (Recommended)

### Step 1: Install Railway CLI
```powershell
# Install using npm
npm install -g @railway/cli

# Or download from: https://railway.app/cli
```

### Step 2: Login to Railway
```powershell
railway login
```

### Step 3: Link to Your Project
```powershell
cd d:\DBS_Devops\DBS-Feedback-System
railway link
```

### Step 4: Get Database Connection Info
```powershell
# This will show you the database credentials
railway variables
```

### Step 5: Import Data to Railway
```powershell
# Connect to Railway MySQL and import the backup
railway run mysql -h <MYSQL_HOST> -P <MYSQL_PORT> -u <MYSQL_USER> -p<MYSQL_PASSWORD> <MYSQL_DATABASE> < backup_feedback.sql
```

## Method 2: Using MySQL Client Directly

### Step 1: Get Railway Database Credentials
From Railway dashboard:
1. Go to your project
2. Click on the MySQL service
3. Go to "Variables" tab
4. Note down:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

### Step 2: Import Using MySQL Command
```powershell
mysql -h <MYSQL_HOST> -P <MYSQL_PORT> -u <MYSQL_USER> -p<MYSQL_PASSWORD> <MYSQL_DATABASE> < backup_feedback.sql
```

## Method 3: Using Railway Console (For Small Data)

### Step 1: Access Railway Database Console
1. Go to Railway dashboard
2. Select your MySQL service
3. Click "Connect" or "Query"
4. Open the database console

### Step 2: Copy and Paste SQL
1. Open `backup_feedback.sql` in a text editor
2. Copy the INSERT statements
3. Paste and execute in Railway console

## Method 4: Using MySQL Workbench or DBeaver

### Step 1: Create New Connection
Use the Railway database credentials to create a new connection in your preferred MySQL client.

### Step 2: Import SQL File
- In MySQL Workbench: Server → Data Import
- In DBeaver: Tools → Execute SQL Script
- Select `backup_feedback.sql`

## Verification After Import

### Check Record Count
```sql
SELECT COUNT(*) as total_records FROM feedback;
-- Expected: 80 records
```

### Check Sample Data
```sql
SELECT id, customer_name, email, rating, sentiment 
FROM feedback 
ORDER BY created_at DESC 
LIMIT 10;
```

### Verify Sentiment Distribution
```sql
SELECT sentiment, COUNT(*) as count 
FROM feedback 
GROUP BY sentiment;
```

## Troubleshooting

### Issue: "Table doesn't exist"
Solution: Make sure the backend has run at least once to create tables, or manually run the schema creation:
```sql
-- See database/init.sql for table creation schema
```

### Issue: "Duplicate entry"
Solution: The backup contains INSERT statements. If you need to update existing data:
```powershell
# Export with INSERT IGNORE or REPLACE
docker exec dbs-feedback-mysql mysqldump -uroot -proot --no-create-info --skip-triggers --compact --no-tablespaces --insert-ignore dbs_feedback feedback > backup_feedback_safe.sql
```

### Issue: Connection timeout
Solution: Ensure Railway database is not sleeping. Railway free tier databases may sleep after inactivity.

## Post-Migration

### Update Backend Configuration
Make sure your backend environment variables point to Railway:
```properties
SPRING_DATASOURCE_URL=jdbc:mysql://<RAILWAY_MYSQL_HOST>:<PORT>/<DATABASE>
SPRING_DATASOURCE_USERNAME=<RAILWAY_USER>
SPRING_DATASOURCE_PASSWORD=<RAILWAY_PASSWORD>
```

### Test the Connection
```powershell
# Test backend connection to Railway
railway run mvn spring-boot:run
```

## Data Summary
- Total records to migrate: **80 feedback entries**
- Date range: September 26, 2025 - November 4, 2025
- Sentiment distribution: Positive, Neutral, Negative
- Includes chatbot submissions, web forms, and implicit feedback
