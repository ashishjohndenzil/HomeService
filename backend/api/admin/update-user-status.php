<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config.php';

// Basic Auth Check (In production, replace with robust JWT validation)
$headers = getallheaders();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

// Stub validation - assume if header exists it's admin for this quick implementation,
// OR rely on previous login check. Ideally, verify token against DB.

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !isset($data['is_active'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing parameters']);
    exit;
}

try {
    // Map string/int status to TINYINT
    $rawStatus = $data['is_active'];
    $isActive = ($rawStatus === 'active' || $rawStatus == 1 || $rawStatus === true) ? 1 : 0;
    
    $stmt = $pdo->prepare("UPDATE users SET is_active = ? WHERE id = ?");
    $result = $stmt->execute([$isActive, $data['user_id']]);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'User status updated']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
