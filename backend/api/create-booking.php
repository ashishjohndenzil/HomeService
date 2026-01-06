
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

// Handle POST request to create booking
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    $required_fields = ['service_id', 'booking_date', 'booking_time', 'total_amount'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }
    
    $service_id = intval($data['service_id']);
    $booking_date = $data['booking_date'];
    $booking_time = $data['booking_time'];
    $total_amount = floatval($data['total_amount']);
    $description = $data['description'] ?? '';
    $provider_id = isset($data['provider_id']) ? intval($data['provider_id']) : null;
    
    // Validate date and time
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $booking_date)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date format']);
        exit;
    }
    
    if (!preg_match('/^\d{2}:\d{2}$/', $booking_time)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid time format']);
        exit;
    }
    
    try {
        // Verify service exists
        $stmt = $pdo->prepare("SELECT id FROM services WHERE id = ?");
        $stmt->execute([$service_id]);
        if ($stmt->rowCount() === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid service']);
            exit;
        }
        
        if (!$provider_id) {
            // Auto-assign a provider who offers this service
            $stmt = $pdo->prepare("SELECT id FROM providers WHERE service_id = ? ORDER BY RAND() LIMIT 1");
            $stmt->execute([$service_id]);
            if ($row = $stmt->fetch()) {
                $provider_id = $row['id'];
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'No providers available for this service']);
                exit;
            }
        } else {
            // Validate provider offers this service
            $stmt = $pdo->prepare("SELECT id FROM providers WHERE id = ? AND service_id = ?");
            $stmt->execute([$provider_id, $service_id]);
            if ($stmt->rowCount() === 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid provider for this service']);
                exit;
            }
        }
        
        // Create the booking
        $stmt = $pdo->prepare("
            INSERT INTO bookings 
            (customer_id, provider_id, service_id, booking_date, booking_time, description, total_amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        
        if ($stmt->execute([$user_id, $provider_id, $service_id, $booking_date, $booking_time, $description, $total_amount])) {
            // Get the inserted booking ID
            $booking_id = $pdo->lastInsertId();
            echo json_encode([
                'success' => true,
                'message' => 'Booking created successfully',
                'booking_id' => $booking_id
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create booking']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>

