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
    
    if (!isset($data['token']) || !isset($data['password'])) {
        handleError('Token and password are required');
        exit;
    }
    
    $token = $data['token'];
    $password = $data['password'];
    
    if (strlen($password) < 6) {
        sendResponse([
            'success' => false,
            'message' => 'Password must be at least 6 characters long.'
        ]);
        exit;
    }
    
    // Check if token exists and is not expired
    $stmt = $pdo->prepare("
        SELECT id, email, reset_token_expiry 
        FROM users 
        WHERE reset_token = ?
    ");
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    
    if (!$user) {
        error_log("Token not found: $token");
        sendResponse([
            'success' => false,
            'message' => 'Reset token is invalid.'
        ]);
        exit;
    }
    
    // Check if token is expired
    $expiryTime = strtotime($user['reset_token_expiry']);
    $currentTime = time();
    
    if ($currentTime > $expiryTime) {
        error_log("Token expired for: {$user['email']}");
        sendResponse([
            'success' => false,
            'message' => 'Reset token has expired.'
        ]);
        exit;
    }
    
    // Hash the new password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    // Update password and clear reset token
    $stmt = $pdo->prepare("
        UPDATE users 
        SET password = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$hashedPassword, $user['id']]);
    
    error_log("Password reset successfully for user: {$user['email']}");
    
    sendResponse([
        'success' => true,
        'message' => 'Password has been reset successfully.'
    ]);
    
} catch (PDOException $e) {
    error_log("Reset password error: " . $e->getMessage());
    handleError('Database error occurred', 500);
} catch (Exception $e) {
    error_log("Reset password error: " . $e->getMessage());
    handleError('An error occurred', 500);
}
?>
