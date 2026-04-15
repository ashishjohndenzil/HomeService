<?php
require_once '../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['provider_id'])) {
    die(json_encode(['success' => false, 'message' => 'Provider ID required']));
}

$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : null);
$token = $authHeader ? str_replace('Bearer ', '', $authHeader) : null;

if (!$token) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized']));
}

try {
    // Verify User
    $stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Invalid token']));
    }
    
    $customerId = $session['user_id'];
    $providerId = $data['provider_id'];

    // Check if valid provider
    $checkProv = $pdo->prepare("SELECT id FROM providers WHERE id = ?");
    $checkProv->execute([$providerId]);
    if ($checkProv->rowCount() === 0) {
        die(json_encode(['success' => false, 'message' => 'Provider not found']));
    }

    // Check if already favorited
    $check = $pdo->prepare("SELECT id FROM favorites WHERE customer_id = ? AND provider_id = ?");
    $check->execute([$customerId, $providerId]);

    if ($check->rowCount() > 0) {
        // Remove
        $delete = $pdo->prepare("DELETE FROM favorites WHERE customer_id = ? AND provider_id = ?");
        $delete->execute([$customerId, $providerId]);
        echo json_encode(['success' => true, 'action' => 'removed', 'message' => 'Removed from favorites']);
    } else {
        // Add
        $insert = $pdo->prepare("INSERT INTO favorites (customer_id, provider_id) VALUES (?, ?)");
        $insert->execute([$customerId, $providerId]);
        echo json_encode(['success' => true, 'action' => 'added', 'message' => 'Added to favorites']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
