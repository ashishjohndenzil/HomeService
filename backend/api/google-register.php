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
    
    if (!isset($data['email']) || !isset($data['name']) || !isset($data['userType'])) {
        handleError('Missing required fields');
    }
    
    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    $name = htmlspecialchars($data['name']);
    $userType = in_array($data['userType'], ['customer', 'provider']) ? $data['userType'] : 'customer';
    $picture = isset($data['picture']) ? $data['picture'] : null;
    
    // Check if user already exists
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $existingUser = $stmt->fetch();
    
    if ($existingUser) {
        handleError('An account with this email already exists. Please login instead.');
    }
    
    // Create new user
    $stmt = $pdo->prepare("
        INSERT INTO users (full_name, email, password, user_type, phone, auth_provider, created_at, updated_at) 
        VALUES (?, ?, ?, ?, '', 'google', NOW(), NOW())
    ");
    
    // Use a random password since they're using Google auth
    $randomPassword = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
    if (!$stmt->execute([$name, $email, $randomPassword, $userType])) {
        handleError('Failed to create account');
    }
    
    $userId = $pdo->lastInsertId();
    $token = bin2hex(random_bytes(32));
    
    sendResponse([
        'success' => true,
        'message' => 'Account created successfully',
        'user' => [
            'id' => $userId,
            'full_name' => $name,
            'email' => $email,
            'user_type' => $userType,
            'profile_picture' => $picture
        ],
        'token' => $token
    ]);
    
} catch (PDOException $e) {
    error_log("Google registration error: " . $e->getMessage());
    handleError('Database error occurred', 500);
} catch (Exception $e) {
    error_log("Google registration error: " . $e->getMessage());
    handleError('An error occurred during registration', 500);
}
?>
