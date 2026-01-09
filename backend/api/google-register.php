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
    $input = file_get_contents('php://input');
    error_log("Google Register Input: " . $input);
    $data = json_decode($input, true);
    
    if (!isset($data['email']) || !isset($data['name']) || !isset($data['userType'])) {
        handleError('Missing required fields');
    }
    
    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    $name = htmlspecialchars($data['name']);
    $userType = in_array($data['userType'], ['customer', 'provider']) ? $data['userType'] : 'customer';
    $picture = isset($data['picture']) ? $data['picture'] : null;
    $serviceId = isset($data['serviceId']) ? intval($data['serviceId']) : null;
    
    // For providers, validate service selection
    if ($userType === 'provider' && empty($serviceId)) {
        handleError('Service selection is required for providers');
    }
    
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
    
    // If provider, create provider record with selected service
    if ($userType === 'provider' && $serviceId) {
        try {
            $providerStmt = $pdo->prepare("INSERT INTO providers (user_id, service_id, created_at) 
                                           VALUES (?, ?, NOW())");
            $providerStmt->execute([$userId, $serviceId]);
        } catch (PDOException $e) {
            error_log("Provider record creation failed: " . $e->getMessage());
            handleError('Failed to create provider profile');
        }
    }
    
    $token = bin2hex(random_bytes(32));
    
    // Store session token
    $tokenStmt = $pdo->prepare("INSERT INTO user_sessions (user_id, token, created_at, expires_at) 
                                VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))");
    $tokenStmt->execute([$userId, $token]);
    
    // Get the service category if provider
    $category = null;
    if ($userType === 'provider' && $serviceId) {
        $serviceStmt = $pdo->prepare("SELECT category FROM services WHERE id = ?");
        $serviceStmt->execute([$serviceId]);
        $service = $serviceStmt->fetch();
        $category = $service ? $service['category'] : null;
    }
    
    sendResponse([
        'success' => true,
        'message' => 'Account created successfully',
        'user' => [
            'id' => $userId,
            'full_name' => $name,
            'email' => $email,
            'user_type' => $userType,
            'profile_picture' => $picture,
            'category' => $category
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
