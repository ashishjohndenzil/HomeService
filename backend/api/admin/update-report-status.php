<?php
require_once '../../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['report_id']) || !isset($data['status'])) {
    die(json_encode(['success' => false, 'message' => 'Report ID and Status required']));
}

$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : null);
$token = $authHeader ? str_replace('Bearer ', '', $authHeader) : null;

// Auth Check
try {
    $stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Unauthorized']));
    }
    
    $adminCheck = $pdo->prepare("SELECT user_type FROM users WHERE id = ?");
    $adminCheck->execute([$session['user_id']]);
    $user = $adminCheck->fetch();

    if ($user['user_type'] !== 'admin') {
        http_response_code(403);
        die(json_encode(['success' => false, 'message' => 'Access denied']));
    }

    $allowedStatus = ['pending', 'resolved', 'dismissed'];
    if (!in_array($data['status'], $allowedStatus)) {
        die(json_encode(['success' => false, 'message' => 'Invalid status']));
    }

    $update = $pdo->prepare("UPDATE reports SET status = ? WHERE id = ?");
    $update->execute([$data['status'], $data['report_id']]);

    echo json_encode(['success' => true, 'message' => 'Report status updated']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
