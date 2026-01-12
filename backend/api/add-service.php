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
    if (empty($data['service_id']) || empty($data['hourly_rate']) || empty($data['experience_years'])) {
        die(json_encode(['success' => false, 'message' => 'All fields are required']));
    }
    
    // Check if provider already has this service
    $check = $pdo->prepare("SELECT id FROM providers WHERE user_id = ? AND service_id = ?");
    $check->execute([$user_id, $data['service_id']]);
    
    if ($check->rowCount() > 0) {
        die(json_encode(['success' => false, 'message' => 'You already offer this service']));
    }
    
    // Insert new service
    $insert = $pdo->prepare("
        INSERT INTO providers (user_id, service_id, experience_years, hourly_rate, bio, is_verified, created_at)
        VALUES (?, ?, ?, ?, ?, 0, NOW())
    ");
    
    $bio = isset($data['description']) ? $data['description'] : 'Professional service provider';
    
    if ($insert->execute([
        $user_id, 
        $data['service_id'], 
        $data['experience_years'], 
        $data['hourly_rate'],
        $bio
    ])) {
        echo json_encode(['success' => true, 'message' => 'Service added successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add service']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
