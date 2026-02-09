<?php
header('Content-Type: application/json');
require_once '../config.php';

// Auth Check
$token = null;
$headers = apache_request_headers();
if (isset($headers['Authorization'])) {
    if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
        $token = $matches[1];
    }
}

if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Get User
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
    // Fetch completed bookings for this user
    $stmt = $pdo->prepare("
        SELECT 
            b.id,
            b.booking_date,
            b.booking_time,
            b.total_amount,
            s.name as service_name,
            u.full_name as provider_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN providers p ON b.provider_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE b.customer_id = ? AND b.status = 'completed'
        ORDER BY b.booking_date DESC, b.booking_time DESC
    ");
    
    $stmt->execute([$user_id]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'transactions' => $transactions
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
