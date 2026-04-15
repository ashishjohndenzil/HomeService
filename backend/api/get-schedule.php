<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

// Get provider from token
$token = null;
$user_id = null;

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

// Verify token
$stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

$user_id = $user['user_id'];

// Check if user is a provider
$stmt = $pdo->prepare("SELECT id FROM providers WHERE user_id = ?");
$stmt->execute([$user_id]);
$provider = $stmt->fetch();

if (!$provider) {
    http_response_code(403);
    echo json_encode(['error' => 'Not a provider']);
    exit;
}

$provider_id = $provider['id'];

// Fetch schedule
$stmt = $pdo->prepare("SELECT day_of_week, start_time, end_time, is_active FROM provider_schedule WHERE provider_id = ?");
$stmt->execute([$provider_id]);
$schedule = $stmt->fetchAll(PDO::FETCH_ASSOC);

// If no schedule found, return default
if (empty($schedule)) {
    $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    $defaultSchedule = [];
    foreach ($days as $day) {
        $defaultSchedule[] = [
            'day_of_week' => $day,
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'is_active' => ($day !== 'Sunday') ? 1 : 0
        ];
    }
    echo json_encode(['success' => true, 'schedule' => $defaultSchedule, 'is_default' => true]);
} else {
    echo json_encode(['success' => true, 'schedule' => $schedule]);
}
?>
