<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

$response = array();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate input
    if (empty($data['email']) || empty($data['password'])) {
        $response['success'] = false;
        $response['message'] = 'Email and password are required';
        echo json_encode($response);
        exit;
    }

    $email = trim($data['email']);
    $password = $data['password'];
    $remember = isset($data['remember']) ? $data['remember'] : false;

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['success'] = false;
        $response['message'] = 'Invalid email format';
        echo json_encode($response);
        exit;
    }

    try {
        // Get user from database
        $stmt = $pdo->prepare("SELECT id, full_name, email, phone, password, user_type FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() === 0) {
            $response['success'] = false;
            $response['message'] = 'Invalid email or password';
            echo json_encode($response);
            exit;
        }

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Verify password
        if (password_verify($password, $user['password'])) {
            // Generate a simple token (in production, use JWT or similar)
            $token = bin2hex(random_bytes(32));

            // Update last login
            $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
            $updateStmt->execute([$user['id']]);

            // Store session token (optional - create sessions table if needed)
            $tokenStmt = $pdo->prepare("INSERT INTO user_sessions (user_id, token, created_at, expires_at) 
                                        VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))");
            $tokenStmt->execute([$user['id'], $token]);

            $response['success'] = true;
            $response['message'] = 'Login successful';
            $response['token'] = $token;
            $response['user'] = [
                'id' => $user['id'],
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'user_type' => $user['user_type']
            ];
        } else {
            $response['success'] = false;
            $response['message'] = 'Invalid email or password';
        }

    } catch (PDOException $e) {
        $response['success'] = false;
        $response['message'] = 'Database error: ' . $e->getMessage();
    }

} else {
    $response['success'] = false;
    $response['message'] = 'Invalid request method';
}

echo json_encode($response);
?>
