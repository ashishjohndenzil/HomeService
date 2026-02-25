# Security Setup Instructions

## ⚠️ Important: Credentials Configuration

This project uses local configuration files for sensitive credentials. These files are **not tracked by Git** for security.

## Initial Setup

### 1. Create Local Configuration Files

Copy the example files and fill in your actual credentials:

```bash
# Backend configuration
cp backend/config.local.example.php backend/config.local.php

# Cashfree configuration  
cp backend/api/cashfree_config.local.example.php backend/api/cashfree_config.local.php
```

### 2. Edit Configuration Files

Edit the newly created files with your actual credentials:

**backend/config.local.php:**
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
- `GMAIL_ACCOUNT`: Your Gmail address for sending emails
- `GMAIL_APP_PASSWORD`: Your Gmail app password

**backend/api/cashfree_config.local.php:**
- `CASHFREE_APP_ID`: Your Cashfree App ID
- `CASHFREE_SECRET_KEY`: Your Cashfree Secret Key
- `CASHFREE_ENV`: Set to 'TEST' or 'PROD'

### 3. Verify Setup

The application will automatically load credentials from `*.local.php` files if they exist.

## Files Excluded from Git

The following files contain sensitive information and are excluded from version control:

- `backend/config.local.php`
- `backend/api/cashfree_config.local.php`

These files are listed in `.gitignore` and should **never** be committed to the repository.

## For New Developers

When setting up the project:

1. Clone the repository
2. Follow the Initial Setup steps above
3. Add your own credentials to the `*.local.php` files
4. Never commit these files to Git

## Security Best Practices

- ✅ Keep all credentials in `*.local.php` files
- ✅ Never commit `*.local.php` files
- ✅ Use environment-specific credentials (test vs production)
- ❌ Never hardcode credentials in tracked files
- ❌ Never commit API keys or passwords
