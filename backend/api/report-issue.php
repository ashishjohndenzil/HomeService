<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

// Get the user from token
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

if ($token) {
    // Verify token and get user info
    $stmt = $pdo->prepare("
        SELECT user_id 
        FROM user_sessions 
        WHERE token = ? AND expires_at > NOW()
    ");
    
    if ($stmt->execute([$token])) {
        $row = $stmt->fetch();
        if ($row) {
            $user_id = $row['user_id'];
        }
    }
}

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['booking_id']) || empty($data['issue_type']) || empty($data['description'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    $booking_id = intval($data['booking_id']);
    $issue_type = $data['issue_type'];
    $description = $data['description'];

    // Verify booking belongs to user
    $stmt = $pdo->prepare("SELECT id FROM bookings WHERE id = ? AND customer_id = ?");
    $stmt->execute([$booking_id, $user_id]);
    if ($stmt->rowCount() === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid booking ID']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO reports (booking_id, customer_id, issue_type, description) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$booking_id, $user_id, $issue_type, $description])) {
            echo json_encode(['success' => true, 'message' => 'Report submitted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to submit report']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
