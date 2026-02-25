<?php
require_once '../../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get Token
$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : null);
$token = $authHeader ? str_replace('Bearer ', '', $authHeader) : null;

if (!$token) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized - No Token']));
}

try {
    // Verify Admin Token
    $stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Invalid token']));
    }
    
    // Check if user is admin
    $adminCheck = $pdo->prepare("SELECT user_type FROM users WHERE id = ?");
    $adminCheck->execute([$session['user_id']]);
    $user = $adminCheck->fetch();

    if ($user['user_type'] !== 'admin') {
        http_response_code(403);
        die(json_encode(['success' => false, 'message' => 'Access denied']));
    }

    // Fetch Reviews
    // Join with bookings, users (customer), providers (and their user record)
    $query = "
        SELECT 
            r.id, 
            r.rating, 
            r.comment, 
            r.created_at,
            b.service_id,
            s.name as service_name,
            u.full_name as customer_name,
            pu.full_name as provider_name
        FROM reviews r
        JOIN bookings b ON r.booking_id = b.id
        JOIN users u ON b.customer_id = u.id
        JOIN services s ON b.service_id = s.id
        JOIN providers p ON b.provider_id = p.id
        JOIN users pu ON p.user_id = pu.id
        ORDER BY r.created_at DESC
    ";

    $stmt = $pdo->query($query);
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'reviews' => $reviews]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
