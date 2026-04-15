<?php
header('Content-Type: application/json');
require_once '../config.php';

// Auth Check
$token = null;
$headers = apache_request_headers();
if (isset($headers['Authorization'])) {
    $authHeader = $headers['Authorization'];
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
    }
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Get User ID from Token
$stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
$stmt->execute([$token]);
$session = $stmt->fetch();

if (!$session) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

$sender_id = $session['user_id'];

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$receiver_id = isset($data['receiver_id']) ? intval($data['receiver_id']) : null;
$message = isset($data['message']) ? trim($data['message']) : '';
$booking_id = isset($data['booking_id']) ? intval($data['booking_id']) : null;

if (!$receiver_id || empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Receiver ID and Message are required']);
    exit;
}

try {
    // Verify receiver exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $stmt->execute([$receiver_id]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Receiver not found']);
        exit;
    }

    // Insert Message
    $stmt = $pdo->prepare("
        INSERT INTO messages (sender_id, receiver_id, booking_id, message) 
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$sender_id, $receiver_id, $booking_id, $message]);

    // --- Notification Logic ---
    // 1. Get Sender Name
    $stmtUser = $pdo->prepare("SELECT full_name FROM users WHERE id = ?");
    $stmtUser->execute([$sender_id]);
    $sender = $stmtUser->fetch();
    $sender_name = $sender ? $sender['full_name'] : 'User';

    // 2. Check for existing UNREAD chat notification from this sender
    $stmtCheck = $pdo->prepare("SELECT id FROM notifications WHERE user_id = ? AND type = 'chat_message' AND related_id = ? AND is_read = 0");
    $stmtCheck->execute([$receiver_id, $sender_id]);
    $existing = $stmtCheck->fetch();

    if ($existing) {
        // Update timestamp to bump it to top
        $stmtUpdate = $pdo->prepare("UPDATE notifications SET created_at = NOW(), message = ? WHERE id = ?");
        $stmtUpdate->execute(["New message from " . $sender_name, $existing['id']]);
    } else {
        // Insert new notification
        $stmtInsert = $pdo->prepare("INSERT INTO notifications (user_id, type, message, related_id) VALUES (?, 'chat_message', ?, ?)");
        $stmtInsert->execute([$receiver_id, "New message from " . $sender_name, $sender_id]);
    }

    echo json_encode(['success' => true, 'message' => 'Message sent']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
