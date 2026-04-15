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

if (!isset($data['review_id'])) {
    die(json_encode(['success' => false, 'message' => 'Review ID required']));
}

// Auth Check
$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : null);
$token = $authHeader ? str_replace('Bearer ', '', $authHeader) : null;

if (!$token) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized - No Token']));
}

try {
    // Verify Admin
    $stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Invalid token']));
    }
    
    $adminCheck = $pdo->prepare("SELECT user_type FROM users WHERE id = ?");
    $adminCheck->execute([$session['user_id']]);
    $user = $adminCheck->fetch();

    if ($user['user_type'] !== 'admin') {
        http_response_code(403);
        die(json_encode(['success' => false, 'message' => 'Access denied']));
    }

    // Get Booking/Provider ID BEFORE deleting review (to update stats later)
    $getProv = $pdo->prepare("
        SELECT b.provider_id 
        FROM reviews r 
        JOIN bookings b ON r.booking_id = b.id 
        WHERE r.id = ?
    ");
    $getProv->execute([$data['review_id']]);
    $provider = $getProv->fetch(PDO::FETCH_ASSOC);

    if (!$provider) {
        die(json_encode(['success' => false, 'message' => 'Review not found']));
    }
    
    $providerId = $provider['provider_id'];

    // Delete Review
    $delete = $pdo->prepare("DELETE FROM reviews WHERE id = ?");
    $delete->execute([$data['review_id']]);

    // Recalculate Provider Stats
    // Reusing logic from fix_review_stats.php
    $statsStmt = $pdo->prepare("
        SELECT COUNT(*) as count, AVG(rating) as avg_rating 
        FROM reviews r 
        JOIN bookings b ON r.booking_id = b.id 
        WHERE b.provider_id = ?
    ");
    $statsStmt->execute([$providerId]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    $newRating = $stats['avg_rating'] !== null ? $stats['avg_rating'] : 0;
    $newCount = $stats['count'];

    $updateProv = $pdo->prepare("UPDATE providers SET rating = ?, total_reviews = ? WHERE id = ?");
    $updateProv->execute([$newRating, $newCount, $providerId]);

    echo json_encode(['success' => true, 'message' => 'Review deleted and provider stats updated']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
