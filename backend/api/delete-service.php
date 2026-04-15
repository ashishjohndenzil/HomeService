<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

// Auth Verification
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : (isset($_GET['token']) ? $_GET['token'] : null);

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
        die(json_encode(['success' => false, 'message' => 'Invalid token']));
    }
    
    $user_id = $session['user_id'];
    
    // Get Service ID
    $data = json_decode(file_get_contents("php://input"), true);
    $service_id = $data['service_id'] ?? null;
    
    if (!$service_id) {
        die(json_encode(['success' => false, 'message' => 'Service ID required']));
    }
    
    // Verify ownership
    $verify = $pdo->prepare("SELECT id FROM providers WHERE id = ? AND user_id = ?");
    $verify->execute([$service_id, $user_id]);
    
    if ($verify->rowCount() === 0) {
        die(json_encode(['success' => false, 'message' => 'Service not found or unauthorized']));
    }
    
    // Delete
    $delete = $pdo->prepare("DELETE FROM providers WHERE id = ?");
    if ($delete->execute([$service_id])) {
        echo json_encode(['success' => true, 'message' => 'Service deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete service']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
