<?php
require_once '../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : null);
$token = $authHeader ? str_replace('Bearer ', '', $authHeader) : null;

if (!$token) {
    http_response_code(401);
    die(json_encode(['success' => false, 'message' => 'Unauthorized']));
}

try {
    // Verify User
    $stmt = $pdo->prepare("SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > NOW()");
    $stmt->execute([$token]);
    $session = $stmt->fetch();

    if (!$session) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Invalid token']));
    }
    
    $customerId = $session['user_id'];

    // Fetch Favorites with Provider Details
    $query = "
        SELECT 
            p.id as provider_id,
            p.rating,
            p.experience_years,
            p.hourly_rate,
            s.id as service_id,
            s.name as service_name,
            u.full_name as provider_name,
            u.profile_image,
            u.location
        FROM favorites f
        JOIN providers p ON f.provider_id = p.id
        JOIN users u ON p.user_id = u.id
        JOIN services s ON p.service_id = s.id
        WHERE f.customer_id = ?
        ORDER BY f.created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$customerId]);
    $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'favorites' => $favorites]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
