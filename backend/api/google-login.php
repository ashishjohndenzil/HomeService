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
    
    if (!isset($data['email']) || !isset($data['name'])) {
        handleError('Missing required fields');
    }
    
    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    $name = htmlspecialchars($data['name']);
    $picture = isset($data['picture']) ? $data['picture'] : null;
    
    // Check if user exists (regardless of auth provider)
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user) {
        // User exists, log them in
        $token = bin2hex(random_bytes(32));
        
        // Update last login and auth provider
        $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW(), auth_provider = 'google', updated_at = NOW() WHERE id = ?");
        $updateStmt->execute([$user['id']]);

        // Store session token
        $tokenStmt = $pdo->prepare("INSERT INTO user_sessions (user_id, token, created_at, expires_at) 
                                    VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))");
        $tokenStmt->execute([$user['id'], $token]);
        
        // Fetch category if provider
        $category = null;
        if ($user['user_type'] === 'provider') {
            $catStmt = $pdo->prepare("SELECT s.category FROM providers p JOIN services s ON p.service_id = s.id WHERE p.user_id = ?");
            $catStmt->execute([$user['id']]);
            if ($catRow = $catStmt->fetch(PDO::FETCH_ASSOC)) {
                $category = $catRow['category'];
            }
        }
        
        sendResponse([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'user_type' => $user['user_type'],
                'profile_picture' => $picture,
                'category' => $category
            ],
            'token' => $token
        ]);
    } else {
        // New user - create account as customer by default
        $stmt = $pdo->prepare("
            INSERT INTO users (full_name, email, password, user_type, phone, auth_provider, created_at, updated_at) 
            VALUES (?, ?, ?, 'customer', '', 'google', NOW(), NOW())
        ");
        
        // Use a random password since they're using Google auth
        $randomPassword = password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
        if (!$stmt->execute([$name, $email, $randomPassword])) {
            handleError('Failed to create account');
        }
        
        $userId = $pdo->lastInsertId();
        $token = bin2hex(random_bytes(32));
        
        // Store session token
        $tokenStmt = $pdo->prepare("INSERT INTO user_sessions (user_id, token, created_at, expires_at) 
                                    VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))");
        $tokenStmt->execute([$userId, $token]);
        
        sendResponse([
            'success' => true,
            'message' => 'Account created successfully',
            'user' => [
                'id' => $userId,
                'full_name' => $name,
                'email' => $email,
                'user_type' => 'customer',
                'profile_picture' => $picture
            ],
            'token' => $token
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Google login error: " . $e->getMessage());
    handleError('Database error occurred', 500);
} catch (Exception $e) {
    error_log("Google login error: " . $e->getMessage());
    handleError('An error occurred during authentication', 500);
}
?>
