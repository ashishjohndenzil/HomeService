<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

// Get the user from token
$token = null;
$user_id = null;
$user_type = null;

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

// If no token in header, try to get from localStorage via POST
if (!$token && isset($_POST['token'])) {
    $token = $_POST['token'];
}
if (!$token && isset($_GET['token'])) {
    $token = $_GET['token'];
}

if ($token) {
    // Verify token and get user info
    $stmt = $pdo->prepare("
        SELECT us.user_id, u.user_type 
        FROM user_sessions us 
        JOIN users u ON us.user_id = u.id 
        WHERE us.token = ? AND us.expires_at > NOW()
    ");
    
    if ($stmt->execute([$token])) {
        $row = $stmt->fetch();
        if ($row) {
            $user_id = $row['user_id'];
            $user_type = $row['user_type'];
        }
    }
}

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Handle GET request to fetch bookings
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $status = isset($_GET['status']) ? $_GET['status'] : null;
    
    try {
        if ($user_type === 'customer') {
            // Customer: get their bookings
            $query = "
                SELECT 
                    b.id,
                    b.booking_date,
                    b.booking_time,
                    b.status,
                    b.total_amount,
                    b.description,
                    b.created_at,
                    s.name as service_name,
                    s.category as service_category,

                    u.id as provider_user_id,
                    u.full_name as provider_name,
                    u.email as provider_email,
                    b.address as customer_location,
                    r.rating as user_rating,
                    r.comment as user_review
                FROM bookings b
                JOIN services s ON b.service_id = s.id
                JOIN providers p ON b.provider_id = p.id
                JOIN users u ON p.user_id = u.id
                JOIN users cust ON b.customer_id = cust.id
                LEFT JOIN reviews r ON b.id = r.booking_id
                WHERE b.customer_id = ?
            ";
            
            $params = [$user_id];
            
            if ($status) {
                $query .= " AND b.status = ?";
                $params[] = $status;
            }
            
            $query .= " ORDER BY b.booking_date DESC, b.booking_time DESC";

            
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $bookings = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'bookings' => $bookings,
                'total' => count($bookings)
            ]);
            
        } else if ($user_type === 'provider') {
            // Provider: get service requests for their services
            $query = "
                SELECT 
                    b.id,
                    b.booking_date,
                    b.booking_time,
                    b.status,
                    b.total_amount,
                    b.description,
                    b.created_at,
                    s.name as service_name,
                    s.category as service_category,
                    b.customer_id,
                    u.full_name as customer_name,
                    u.email as customer_email,
                    u.phone as customer_phone,
                    b.address as customer_location,
                    r.rating as user_rating,
                    r.comment as user_review
                FROM bookings b
                JOIN services s ON b.service_id = s.id
                JOIN providers p ON b.provider_id = p.id
                JOIN users u ON b.customer_id = u.id
                LEFT JOIN reviews r ON b.id = r.booking_id
                WHERE p.user_id = ?
            ";
            
            $params = [$user_id];
            
            if ($status) {
                $query .= " AND b.status = ?";
                $params[] = $status;
            }
            

            
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $bookings = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'bookings' => $bookings,
                'total' => count($bookings)
            ]);
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
        }
    } catch (PDOException $e) {
        $errorMsg = 'Database error: ' . $e->getMessage();
        file_put_contents('debug_error.log', $errorMsg . "\n" . $e->getTraceAsString());
        http_response_code(500);
        echo json_encode(['error' => $errorMsg]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

