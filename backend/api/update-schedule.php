<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

// Get provider
$token = null;
// Check Authorization header
$authHeader = null;
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
} elseif (function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    }
}

if ($authHeader) {
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
    }
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM providers WHERE user_id = ?");
$stmt->execute([$user['user_id']]);
$provider = $stmt->fetch();

if (!$provider) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

$provider_id = $provider['id'];

// Get Data
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['schedule']) || !is_array($data['schedule'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid schedule data']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Upsert schedule for each day
    $stmt = $pdo->prepare("
        INSERT INTO provider_schedule (provider_id, day_of_week, start_time, end_time, is_active)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        start_time = VALUES(start_time),
        end_time = VALUES(end_time),
        is_active = VALUES(is_active)
    ");

    foreach ($data['schedule'] as $day) {
        $stmt->execute([
            $provider_id,
            $day['day_of_week'],
            $day['start_time'],
            $day['end_time'],
            $day['is_active']
        ]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Schedule updated successfully']);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
