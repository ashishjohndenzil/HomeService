<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

// Auth Token Verification
$token = null;
$headers = getallheaders();
if (isset($headers['Authorization'])) {
    $token = str_replace('Bearer ', '', $headers['Authorization']);
} elseif (isset($_GET['token'])) {
    $token = $_GET['token'];
}

if (!$token) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized']));
}

try {
    // Verify token
    $stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();
    
    if (!$session) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Invalid or expired token']));
    }
    
    $user_id = $session['user_id'];
    
    // Get POST data
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validation
    if (empty($data['full_name']) || empty($data['phone'])) {
        die(json_encode(['success' => false, 'message' => 'Name and Phone are required']));
    }
    
    $location = isset($data['location']) ? trim($data['location']) : '';

    // Update user
    $update = $pdo->prepare("
        UPDATE users 
        SET full_name = ?, phone = ?, location = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    if ($update->execute([$data['full_name'], $data['phone'], $location, $user_id])) {
        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update profile']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
