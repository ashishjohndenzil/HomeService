<?php
// Error Suppression for Production
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', dirname(__FILE__) . '/error.log');
error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);

// Suppress all warnings and notices from displaying
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        return false;
    }
    error_log("[$errno] $errstr in $errfile on line $errline");
    return true;
});

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'home_service_booking');

// Google OAuth Configuration
define('GOOGLE_CLIENT_ID', '190292476430-chm5q72tenmqhaf2465ea53931jfdotu.apps.googleusercontent.com');
define('GOOGLE_CLIENT_SECRET', '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');
define('GOOGLE_REDIRECT_URI', 'http://localhost/HomeService/backend/google_callback.php');

// Gmail SMTP Configuration for Password Reset Emails
define('GMAIL_ACCOUNT', 'ashishyt100@gmail.com'); // Your Gmail address
define('GMAIL_APP_PASSWORD', 'rqkaxjowqenermzh'); // Gmail app password

// Create PDO connection
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    
    // Set error mode to exceptions
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// API Response Helper
function sendResponse($data, $statusCode = 200) {
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Error Handler
function handleError($message, $statusCode = 400) {
    sendResponse(['error' => $message], $statusCode);
    exit;
}

// Gmail SMTP Email Function
function sendEmailViaGmailDirect($to, $toName, $subject, $message, $resetLink) {
    try {
        // Gmail SMTP Server Details
        $smtpHost = 'smtp.gmail.com';
        $smtpPort = 587;
        $smtpUser = GMAIL_ACCOUNT;
        $smtpPass = GMAIL_APP_PASSWORD;
        
        // Create connection using fsockopen
        $socket = @fsockopen($smtpHost, $smtpPort, $errno, $errstr, 10);
        
        if (!$socket) {
            error_log("SMTP Connection Failed: $errstr ($errno)");
            error_log("Reset link: $resetLink");
            return false;
        }
        
        // Read server response
        $response = fgets($socket, 1024);
        error_log("SMTP Response 1: " . trim($response));
        
        // Send EHLO command
        fputs($socket, "EHLO localhost\r\n");
        $response = fgets($socket, 1024);
        // Read all EHLO response lines
        while (substr($response, 3, 1) == '-') {
            $response = fgets($socket, 1024);
        }
        error_log("EHLO sent");
        
        // Start TLS
        fputs($socket, "STARTTLS\r\n");
        $response = fgets($socket, 1024);
        error_log("STARTTLS: " . trim($response));
        
        // Enable crypto/TLS
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            error_log("TLS negotiation failed");
            fclose($socket);
            error_log("Reset link: $resetLink");
            return false;
        }
        
        // Send EHLO again after TLS
        fputs($socket, "EHLO localhost\r\n");
        $response = fgets($socket, 1024);
        while (substr($response, 3, 1) == '-') {
            $response = fgets($socket, 1024);
        }
        
        // Authenticate
        fputs($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 1024);
        error_log("AUTH LOGIN: " . trim($response));
        
        // Send encoded username
        fputs($socket, base64_encode($smtpUser) . "\r\n");
        $response = fgets($socket, 1024);
        error_log("Username sent: " . trim($response));
        
        // Send encoded password
        fputs($socket, base64_encode($smtpPass) . "\r\n");
        $response = fgets($socket, 1024);
        error_log("Password sent: " . trim($response));
        
        if (strpos($response, '235') === false && strpos($response, '2.7.0') === false) {
            error_log("Authentication FAILED: " . trim($response));
            fclose($socket);
            error_log("Reset link: $resetLink");
            return false;
        }
        
        error_log("Authentication successful!");
        
        // Send MAIL FROM
        fputs($socket, "MAIL FROM:<" . GMAIL_ACCOUNT . ">\r\n");
        $response = fgets($socket, 1024);
        
        // Send RCPT TO
        fputs($socket, "RCPT TO:<$to>\r\n");
        $response = fgets($socket, 1024);
        
        // Send DATA
        fputs($socket, "DATA\r\n");
        $response = fgets($socket, 1024);
        
        // Compose email
        $email = "From: HomeService <" . GMAIL_ACCOUNT . ">\r\n";
        $email .= "To: $toName <$to>\r\n";
        $email .= "Subject: $subject\r\n";
        $email .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $email .= "MIME-Version: 1.0\r\n\r\n";
        $email .= $message . "\r\n.\r\n";
        
        fputs($socket, $email);
        $response = fgets($socket, 1024);
        error_log("Email sent response: " . trim($response));
        
        // Send QUIT
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        error_log("Email sent successfully to: $to");
        return true;
        
    } catch (Exception $e) {
        error_log("Email sending exception: " . $e->getMessage());
        error_log("Reset link: $resetLink");
        return false;
    }
}

// Email Function - Sends reset password emails
function sendPasswordResetEmail($to, $toName, $subject, $message, $resetLink): bool {
    return sendEmailViaGmailDirect($to, $toName, $subject, $message, $resetLink);
}
?>
