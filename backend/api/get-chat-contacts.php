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

$user_id = $session['user_id'];

try {
    // Get user type
    $stmt = $pdo->prepare("SELECT user_type FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();
    $user_type = $user['user_type'];

    // Find contacts based on bookings
    // If I am a customer, I want to talk to providers linked to my bookings
    // If I am a provider, I want to talk to customers linked to my bookings
    
    $contacts = [];
    
    if ($user_type === 'customer') {
        // Get Providers
        $query = "
            SELECT DISTINCT u.id, u.full_name, u.email
            FROM bookings b
            JOIN providers p ON b.provider_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE b.customer_id = ?
        ";
    } else {
        // Get Customers
        $query = "
            SELECT DISTINCT u.id, u.full_name, u.email
            FROM bookings b
            JOIN users u ON b.customer_id = u.id
            WHERE b.provider_id = (SELECT id FROM providers WHERE user_id = ?)
        ";
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute([$user_id]);
    $raw_contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Enhance with unread count and last message
    foreach ($raw_contacts as $contact) {
        $contact_id = $contact['id'];
        
        // Unread count
        $stmt_unread = $pdo->prepare("
            SELECT COUNT(*) FROM messages 
            WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE
        ");
        $stmt_unread->execute([$contact_id, $user_id]);
        $unread = $stmt_unread->fetchColumn();

        // Last message
        $stmt_last = $pdo->prepare("
            SELECT message, created_at FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at DESC LIMIT 1
        ");
        $stmt_last->execute([$user_id, $contact_id, $contact_id, $user_id]);
        $last_msg = $stmt_last->fetch(PDO::FETCH_ASSOC);

        $contact['unread_count'] = $unread;
        $contact['last_message'] = $last_msg ? $last_msg['message'] : '';
        $contact['last_message_time'] = $last_msg ? $last_msg['created_at'] : '';
        
        $contacts[] = $contact;
    }

    echo json_encode(['success' => true, 'contacts' => $contacts]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
