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
        // New user - Prevent auto-creation and ask to register first (to capture phone/role)
        handleError('Account not found. Please register first to set up your profile.', 404);
    }
    
} catch (PDOException $e) {
    error_log("Google login error: " . $e->getMessage());
    handleError('Database error occurred', 500);
} catch (Exception $e) {
    error_log("Google login error: " . $e->getMessage());
    handleError('An error occurred during authentication', 500);
}
?>
