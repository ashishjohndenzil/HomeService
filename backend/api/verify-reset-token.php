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
    
    if (!isset($data['token'])) {
        handleError('Reset token is required');
        exit;
    }
    
    $token = $data['token'];
    
    // Check if token exists and is not expired
    $stmt = $pdo->prepare("
        SELECT id, email, reset_token_expiry 
        FROM users 
        WHERE reset_token = ?
    ");
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    
    if (!$user) {
        error_log("Token not found in database: $token");
        sendResponse([
            'success' => false,
            'message' => 'Reset token is invalid.'
        ]);
        exit;
    }
    
    // Check if token is expired
    $expiryTime = strtotime($user['reset_token_expiry']);
    $currentTime = time();
    
    error_log("Token expiry: {$user['reset_token_expiry']} (timestamp: $expiryTime), Current time: " . date('Y-m-d H:i:s') . " (timestamp: $currentTime)");
    
    if ($currentTime > $expiryTime) {
        error_log("Token expired for user: {$user['email']}");
        sendResponse([
            'success' => false,
            'message' => 'Reset token has expired.'
        ]);
        exit;
    }
    
    sendResponse([
        'success' => true,
        'message' => 'Token is valid.'
    ]);
    
} catch (PDOException $e) {
    error_log("Verify reset token error: " . $e->getMessage());
    handleError('Database error occurred', 500);
} catch (Exception $e) {
    error_log("Verify reset token error: " . $e->getMessage());
    handleError('An error occurred', 500);
}
?>
