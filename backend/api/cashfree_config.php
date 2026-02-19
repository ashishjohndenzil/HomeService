<?php
// Cashfree Configuration - SANDBOX
// NOTE: Set these values in your environment variables or .env file
define('CASHFREE_APP_ID', getenv('CASHFREE_APP_ID') ?: 'YOUR_APP_ID_HERE');
define('CASHFREE_SECRET_KEY', getenv('CASHFREE_SECRET_KEY') ?: 'YOUR_SECRET_KEY_HERE');
define('CASHFREE_API_VERSION', '2023-08-01');
define('CASHFREE_ENV', getenv('CASHFREE_ENV') ?: 'TEST'); // TEST or PROD

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
