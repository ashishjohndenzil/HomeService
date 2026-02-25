<?php
// Local Configuration Template
// Copy this file to config.local.php and fill in your actual credentials
// config.local.php is excluded from Git for security

// Google OAuth Configuration
define('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID_HERE');
define('GOOGLE_CLIENT_SECRET', 'YOUR_GOOGLE_CLIENT_SECRET_HERE');
define('GOOGLE_REDIRECT_URI', 'http://localhost/HomeService/backend/google_callback.php');

// Gmail SMTP Configuration for Password Reset Emails
define('GMAIL_ACCOUNT', 'your-email@gmail.com');
define('GMAIL_APP_PASSWORD', 'your-gmail-app-password');
?>
