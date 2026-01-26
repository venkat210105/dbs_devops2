# Additional Railway Environment Variables for Email Scheduling

Add these to your Railway backend service:

```bash
# Email Agent Configuration (for inbox monitoring)
EMAIL_IMAP_HOST="imap.gmail.com"
EMAIL_IMAP_PORT="993"
EMAIL_USERNAME="venkatmariserla001@gmail.com"

# Spring Mail Configuration (for sending emails)
SPRING_MAIL_HOST="smtp.gmail.com"
SPRING_MAIL_PORT="587"
SPRING_MAIL_USERNAME="venkatmariserla001@gmail.com"
SPRING_MAIL_PASSWORD="mwcgugpqzslutzjt"

# Email Agent Settings
app.emailAgent.enabled="true"
app.emailAgent.poll-interval-ms="60000"

# Digest Agent (for scheduled email notifications)
app.agents.digest.enabled="true"
app.agents.digest.cron="0 0 9,16 * * *"
```

## Complete Environment Variable List for Railway:

```bash
# Database
SPRING_DATASOURCE_URL="jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}"
SPRING_DATASOURCE_USERNAME="${{MySQL.MYSQLUSER}}"
SPRING_DATASOURCE_PASSWORD="${{MySQL.MYSQLPASSWORD}}"

# Email Sending (SMTP)
SMTP_USERNAME="venkatmariserla001@gmail.com"
SMTP_PASSWORD="mwcgugpqzslutzjt"
SPRING_MAIL_USERNAME="venkatmariserla001@gmail.com"
SPRING_MAIL_PASSWORD="mwcgugpqzslutzjt"
SPRING_MAIL_HOST="smtp.gmail.com"
SPRING_MAIL_PORT="587"

# Email Receiving (IMAP - for monitoring inbox)
EMAIL_IMAP_HOST="imap.gmail.com"
EMAIL_IMAP_PORT="993"
EMAIL_USERNAME="venkatmariserla001@gmail.com"

# OAuth
GOOGLE_CLIENT_SECRET="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"

# Application URLs
APP_UI_BASE_URL="https://dbs-feedback-frontend.netlify.app"

# Server Port
PORT="8085"
```

## What This Enables:

1. **Email Review Agent**: Checks inbox every 60 seconds for feedback submissions via email
2. **Digest Agent**: Sends scheduled email digests at 9:00 AM and 4:00 PM daily
3. **Email Notifications**: Sends confirmation emails when feedback is received

After adding these variables, redeploy your backend service on Railway.
