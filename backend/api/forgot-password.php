<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    handleError('Invalid request method', 405);
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['email'])) {
        handleError('Email is required');
    }
    
    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        handleError('Invalid email format');
    }
    
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id, full_name, email FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // For security, don't reveal if email exists or not
        sendResponse([
            'success' => true,
            'message' => 'If an account exists with this email, you will receive a password reset link shortly.'
        ]);
        exit;
    }
    
    // Generate password reset token
    $resetToken = bin2hex(random_bytes(32));
    $resetExpiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Store reset token in database
    $stmt = $pdo->prepare("
        UPDATE users 
        SET reset_token = ?, reset_token_expiry = ? 
        WHERE id = ?
    ");
    $stmt->execute([$resetToken, $resetExpiry, $user['id']]);
    
    // Generate reset link
    $resetLink = "http://localhost/HomeService/frontend/reset-password.html?token=" . $resetToken;
    
    // Email content
    $subject = "Password Reset Request - HomeService";
    $emailBody = "Hello {$user['full_name']},\n\n";
    $emailBody .= "You requested a password reset. Click the link below to reset your password:\n\n";
    $emailBody .= $resetLink . "\n\n";
    $emailBody .= "This link will expire in 1 hour.\n\n";
    $emailBody .= "If you didn't request this, please ignore this email.\n\n";
    $emailBody .= "Best regards,\nHomeService Team";
    
    // Send email via Gmail SMTP
    $emailSent = sendPasswordResetEmail($email, $user['full_name'], $subject, $emailBody, $resetLink);
    
    // Always respond with success
    sendResponse([
        'success' => true,
        'message' => 'Password reset link has been sent to your email.'
    ]);
    
} catch (PDOException $e) {
    error_log("Forgot password error: " . $e->getMessage());
    handleError('Database error occurred', 500);
} catch (Exception $e) {
    error_log("Forgot password error: " . $e->getMessage());
    handleError('An error occurred', 500);
}
?>
