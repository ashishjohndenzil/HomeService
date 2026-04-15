<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

// Get the user from token
$token = null;
$user_id = null;

// Check Authorization header
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

if (!$token && isset($_GET['token'])) {
    $token = $_GET['token'];
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

// Handle GET request to fetch provider's services
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                p.id,
                p.user_id,
                s.id as service_id,
                s.name as service_name,
                s.category,
                s.description,
                p.experience_years,
                p.hourly_rate,
                p.rating,
                p.total_reviews,
                p.is_verified,
                p.portfolio_image,
                p.created_at
            FROM providers p
            JOIN services s ON p.service_id = s.id
            WHERE p.user_id = ?
            ORDER BY s.name
        ");
        
        $stmt->execute([$user_id]);
        $services = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'services' => $services,
            'total' => count($services)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
