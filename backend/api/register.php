<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

$response = array();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate input
    if (empty($data['fullName']) || empty($data['email']) || empty($data['phone']) || 
        empty($data['password']) || empty($data['userType'])) {
        $response['success'] = false;
        $response['message'] = 'All fields are required';
        echo json_encode($response);
        exit;
    }

    // For providers, validate service_id
    if ($data['userType'] === 'provider' && empty($data['serviceId'])) {
        $response['success'] = false;
        $response['message'] = 'Service selection is required for providers';
        echo json_encode($response);
        exit;
    }

    $fullName = trim($data['fullName']);
    $email = trim($data['email']);
    $phone = trim($data['phone']);
    $password = $data['password'];
    $userType = $data['userType'];
    $serviceId = isset($data['serviceId']) ? intval($data['serviceId']) : null;

    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response['success'] = false;
        $response['message'] = 'Invalid email format';
        echo json_encode($response);
        exit;
    }

    // Validate user type
    if (!in_array($userType, ['customer', 'provider'])) {
        $response['success'] = false;
        $response['message'] = 'Invalid user type';
        echo json_encode($response);
        exit;
    }

    try {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() > 0) {
            $response['success'] = false;
            $response['message'] = 'Email already registered';
            echo json_encode($response);
            exit;
        }

        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Insert user into database
        $stmt = $pdo->prepare("INSERT INTO users (full_name, email, phone, password, user_type, created_at) 
                               VALUES (?, ?, ?, ?, ?, NOW())");
        
        if ($stmt->execute([$fullName, $email, $phone, $hashedPassword, $userType])) {
            $userId = $pdo->lastInsertId();
            
            // If provider, create provider record with selected service
            if ($userType === 'provider' && $serviceId) {
                try {
                    $providerStmt = $pdo->prepare("INSERT INTO providers (user_id, service_id, hourly_rate, experience_years, is_verified, created_at) 
                                                   VALUES (?, ?, ?, 0, 0, NOW())");
                    
                    // Default rates based on service ID
                    $defaultRates = [
                        1 => 500.00, // Plumbing
                        2 => 600.00, // Electrical
                        3 => 400.00, // Cleaning
                        4 => 550.00, // Carpentry
                        5 => 450.00, // Painting
                        6 => 350.00  // Repairs
                    ];
                    
                    $hourlyRate = isset($defaultRates[$serviceId]) ? $defaultRates[$serviceId] : 500.00;
                    
                    $providerStmt->execute([$userId, $serviceId, $hourlyRate]);
                    
                    // Fetch the complete user data with service info
                    $userQuery = $pdo->prepare("
                        SELECT u.id, u.full_name, u.email, u.phone, u.user_type,
                               s.id as service_id, s.name as service_name, s.category
                        FROM users u
                        LEFT JOIN providers p ON u.id = p.user_id
                        LEFT JOIN services s ON p.service_id = s.id
                        WHERE u.id = ?
                    ");
                    $userQuery->execute([$userId]);
                    $userData = $userQuery->fetch();
                    
                    $response['success'] = true;
                    $response['message'] = 'Registration successful';
                    $response['userId'] = $userId;
                    $response['user'] = $userData;
                } catch (PDOException $e) {
                    $response['success'] = false;
                    $response['message'] = 'Provider setup failed: ' . $e->getMessage();
                }
            } else {
                $response['success'] = true;
                $response['message'] = 'Registration successful';
                $response['userId'] = $userId;
            }
        } else {
            $response['success'] = false;
            $response['message'] = 'Registration failed. Please try again';
        }

    } catch (PDOException $e) {
        $response['success'] = false;
        $response['message'] = 'Database error: ' . $e->getMessage();
    }

} else {
    $response['success'] = false;
    $response['message'] = 'Invalid request method';
}

echo json_encode($response);
?>
