<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

// Get the user from token
$token = null;
$user_id = null;

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
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['service_id'])) {
    echo json_encode(['success' => false, 'message' => 'Service ID is required']);
    exit;
}

try {
    // Verify that this service belongs to the user
    $checkStmt = $pdo->prepare("SELECT id FROM providers WHERE id = ? AND user_id = ?");
    $checkStmt->execute([$data['service_id'], $user_id]);
    
    if ($checkStmt->rowCount() === 0) {
        echo json_encode(['success' => false, 'message' => 'Service not found or unauthorized']);
        exit;
    }

    // Prepare update fields
    $fields = [];
    $params = [];
    
    if (isset($data['hourly_rate'])) {
        $fields[] = "hourly_rate = ?";
        $params[] = $data['hourly_rate'];
    }
    
    if (isset($data['experience_years'])) {
        $fields[] = "experience_years = ?";
        $params[] = $data['experience_years'];
    }
    
    if (isset($data['description'])) { // In case we want to support description updates (mapped to bio usually)
         // Note: providers table has 'bio', not 'description'. Mapping check if needed.
         // Assuming 'bio' is what we want to update for description-like content
         $fields[] = "bio = ?";
         $params[] = $data['description'];
    }

    if (empty($fields)) {
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }

    // Add service ID to params for WHERE clause
    $params[] = $data['service_id'];
    $params[] = $user_id;

    $sql = "UPDATE providers SET " . implode(', ', $fields) . " WHERE id = ? AND user_id = ?";
    $stmt = $pdo->prepare($sql);
    
    if ($stmt->execute($params)) {
        echo json_encode(['success' => true, 'message' => 'Service updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update service']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
