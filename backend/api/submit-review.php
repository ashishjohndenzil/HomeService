<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

$token = null;
$headers = getallheaders();
if (isset($headers['Authorization'])) {
    $token = str_replace('Bearer ', '', $headers['Authorization']);
} elseif (isset($_GET['token'])) {
    $token = $_GET['token'];
}

if (!$token) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized']));
}

try {
    // Verify token
    $stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();
    
    if (!$session) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Invalid or expired token']));
    }
    
    $user_id = $session['user_id'];
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (empty($data['booking_id']) || empty($data['rating'])) {
        die(json_encode(['success' => false, 'message' => 'Booking ID and Rating are required']));
    }
    
    $bookingId = $data['booking_id'];
    $rating = (float)$data['rating'];
    $comment = isset($data['review']) ? $data['review'] : '';
    
    if ($rating < 1 || $rating > 5) {
        die(json_encode(['success' => false, 'message' => 'Rating must be between 1 and 5']));
    }
    
    // Verify booking belongs to user and is completed
    $check = $pdo->prepare("SELECT id, provider_id FROM bookings WHERE id = ? AND customer_id = ? AND status = 'completed'");
    $check->execute([$bookingId, $user_id]);
    
    if ($check->rowCount() === 0) {
        die(json_encode(['success' => false, 'message' => 'Booking not found or not completed']));
    }
    
    $booking = $check->fetch();
    $providerId = $booking['provider_id'];
    
    // Check if review already exists
    $exists = $pdo->prepare("SELECT id FROM reviews WHERE booking_id = ?");
    $exists->execute([$bookingId]);
    
    if ($exists->rowCount() > 0) {
        die(json_encode(['success' => false, 'message' => 'Review already submitted for this booking']));
    }
    
    // Begin Transaction
    $pdo->beginTransaction();
    
    // Insert Review
    $insert = $pdo->prepare("INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
    $insert->execute([$bookingId, $user_id, $providerId, $rating, $comment]);
    
    // Update Provider Average Rating
    // 1. Get current stats
    $prov = $pdo->prepare("SELECT rating, total_reviews FROM providers WHERE id = ?");
    $prov->execute([$providerId]);
    $pData = $prov->fetch();
    
    $currentRating = (float)$pData['rating'];
    $totalReviews = (int)$pData['total_reviews'];
    
    // 2. Calculate new average
    // New Avg = ((Old Avg * Old Count) + New Rating) / (Old Count + 1)
    $newTotal = $totalReviews + 1;
    $newRating = (($currentRating * $totalReviews) + $rating) / $newTotal;
    
    $update = $pdo->prepare("UPDATE providers SET rating = ?, total_reviews = ? WHERE id = ?");
    $update->execute([$newRating, $newTotal, $providerId]);
    
    $pdo->commit();
    
    echo json_encode(['success' => true, 'message' => 'Review submitted successfully']);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
