<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

// Auth Token Verification
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

    // Get provider_id from providers table
    $provStmt = $pdo->prepare("SELECT id FROM providers WHERE user_id = ?");
    $provStmt->execute([$user_id]);
    $provider = $provStmt->fetch();

    if (!$provider) {
        echo json_encode([
            'success' => true,
            'reviews' => [],
            'avg_rating' => 0,
            'total_reviews' => 0
        ]);
        exit;
    }

    $provider_id = $provider['id'];

    // Get reviews with customer name and service name
    $query = "
        SELECT 
            r.id,
            r.rating,
            r.comment,
            r.created_at,
            u.full_name as customer_name,
            s.name as service_name
        FROM reviews r
        JOIN bookings b ON r.booking_id = b.id
        LEFT JOIN users u ON b.customer_id = u.id
        LEFT JOIN services s ON b.service_id = s.id
        WHERE b.provider_id = ? AND b.status = 'completed'
        ORDER BY r.created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$provider_id]);
    $reviews = $stmt->fetchAll();

    // Get aggregate stats
    $statsStmt = $pdo->prepare("SELECT rating, total_reviews FROM providers WHERE id = ?");
    $statsStmt->execute([$provider_id]);
    $stats = $statsStmt->fetch();

    // Calculate 5-star reviews count from the fetched reviews
    $five_star_count = 0;
    foreach ($reviews as $review) {
        if ((float)$review['rating'] >= 5) {
            $five_star_count++;
        }
    }

    echo json_encode([
        'success' => true,
        'reviews' => $reviews,
        'avg_rating' => round((float)$stats['rating'], 1),
        'total_reviews' => (int)$stats['total_reviews'],
        'five_star_count' => $five_star_count
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
