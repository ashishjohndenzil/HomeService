<?php
// Cashfree Configuration Template
// Copy this file to cashfree_config.local.php and fill in your actual credentials
// cashfree_config.local.php is excluded from Git for security

// Load local configuration if exists
if (file_exists(__DIR__ . '/cashfree_config.local.php')) {
    require_once __DIR__ . '/cashfree_config.local.php';
} else {
    // Default test values
    define('CASHFREE_APP_ID', 'YOUR_CASHFREE_APP_ID_HERE');
    define('CASHFREE_SECRET_KEY', 'YOUR_CASHFREE_SECRET_KEY_HERE');
    define('CASHFREE_API_VERSION', '2023-08-01');
    define('CASHFREE_ENV', 'TEST'); // TEST or PROD
}

// Base URL based on Environment
define('CASHFREE_BASE_URL', (CASHFREE_ENV === 'PROD') 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg');

function getCashfreeHeaders() {
    return [
        'Content-Type: application/json',
        'x-api-version: ' . CASHFREE_API_VERSION,
        'x-client-id: ' . CASHFREE_APP_ID,
        'x-client-secret: ' . CASHFREE_SECRET_KEY
    ];
}
?>
