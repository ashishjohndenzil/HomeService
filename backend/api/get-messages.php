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

$current_user_id = $session['user_id'];
$contact_id = isset($_GET['contact_id']) ? intval($_GET['contact_id']) : null;

if (!$contact_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Contact ID is required']);
    exit;
}

try {
    // Mark messages from contact to current user as read
    $updateStmt = $pdo->prepare("
        UPDATE messages 
        SET is_read = TRUE 
        WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE
    ");
    $updateStmt->execute([$contact_id, $current_user_id]);

    // Fetch messages
    $stmt = $pdo->prepare("
        SELECT id, sender_id, receiver_id, message, created_at, is_read 
        FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
    ");
    $stmt->execute([$current_user_id, $contact_id, $contact_id, $current_user_id]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'messages' => $messages]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
