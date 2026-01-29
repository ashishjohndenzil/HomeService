
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
    $required_fields = ['service_id', 'booking_date', 'booking_time', 'total_amount', 'address'];
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
    $address = trim($data['address']);
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
            // Smart Provider Matching: Prefer providers in the same location
            // We'll extract the city/area from the address (simple string matching for now)
            // Ideally, we'd use geospatial data, but text matching on the 'location' column is a good start.
            
            $stmt = $pdo->prepare("
                SELECT p.id, u.location 
                FROM providers p
                JOIN users u ON p.user_id = u.id
                WHERE p.service_id = ?
            ");
            $stmt->execute([$service_id]);
            $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($providers)) {
                http_response_code(400);
                echo json_encode(['error' => 'No providers available for this service']);
                exit;
            }

            // Simple scoring system
            $best_provider_id = null;
            $max_score = -1;
            
            // Normalize booking address for comparison and split into parts
            // e.g. "123 Main St, New York, NY" -> ["123 main st", "new york", "ny"]
            $booking_parts = array_map('trim', explode(',', strtolower($address)));

            foreach ($providers as $prov) {
                $score = 0;
                $prov_loc = strtolower($prov['location'] ?? '');
                
                if ($prov_loc) {
                    // Split provider location too
                    $prov_parts = array_map('trim', explode(',', $prov_loc));
                    
                    // Check if any significant part of provider location exists in booking address
                    foreach ($prov_parts as $p_part) {
                        if (empty($p_part)) continue;
                        
                        foreach ($booking_parts as $b_part) {
                            // Match if one part contains the other
                            // e.g. Provider: "New York" matches Booking: "New York"
                            if (strpos($b_part, $p_part) !== false || strpos($p_part, $b_part) !== false) {
                                $score += 10;
                                break 2; // Found a match for this provider
                            }
                        }
                    }
                }
                
                // Add random factor to distribute load among matching providers
                $score += mt_rand(0, 5);
                
                if ($score > $max_score) {
                    $max_score = $score;
                    $best_provider_id = $prov['id'];
                }
            }
            
            $provider_id = $best_provider_id;

            if (!$provider_id) {
                // Fallback: Pick random
                 $provider_id = $providers[array_rand($providers)]['id'];
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
        // Check for double booking
        if ($provider_id) {
            // Calculate end time based on duration (default 1 hour if not set)
            $duration = isset($data['duration']) ? floatval($data['duration']) : 1;
            $start_datetime = new DateTime("$booking_date $booking_time");
            $end_datetime = clone $start_datetime;
            // Add duration hours. 
            // Note: 'duration' logic might need frontend update to send it. 
            // For now, assume 1 hour blocks or use simple equality check if exact match needed.
            // But better to checking overlap.
            
            // Let's assume bookings are fixed 1 hour slots for simplicity unless duration is passed
            $end_datetime->modify("+$duration hours");
            
            $start_str = $start_datetime->format('H:i:s');
            $end_str = $end_datetime->format('H:i:s');

            // 1. Check Provider Schedule (Working Hours)
            $day_of_week = date('l', strtotime($booking_date));
            $stmt = $pdo->prepare("SELECT start_time, end_time, is_active FROM provider_schedule WHERE provider_id = ? AND day_of_week = ?");
            $stmt->execute([$provider_id, $day_of_week]);
            $schedule = $stmt->fetch();

            if ($schedule) {
                if (!$schedule['is_active']) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Provider is not working on ' . $day_of_week]);
                    exit;
                }
                
                if ($start_str < $schedule['start_time'] || $end_str > $schedule['end_time']) {
                     http_response_code(400);
                     echo json_encode(['error' => 'Booking time is outside provider working hours (' . $schedule['start_time'] . ' - ' . $schedule['end_time'] . ')']);
                     exit;
                }
            }

            // 2. Check Existing Bookings (Overlap)
            // An overlap occurs if:
            // (NewStart < ExistingEnd) AND (NewEnd > ExistingStart)
            // Existing bookings end time = booking_time + 1 hour (default)
            // We need to fetch existing bookings for this provider on this date
            
            $stmt = $pdo->prepare("
                SELECT booking_time, status 
                FROM bookings 
                WHERE provider_id = ? 
                AND booking_date = ? 
                AND status IN ('pending', 'confirmed')
            ");
            $stmt->execute([$provider_id, $booking_date]);
            $existing_bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($existing_bookings as $b) {
                $b_start = new DateTime("$booking_date " . $b['booking_time']);
                $b_end = clone $b_start;
                $b_end->modify("+1 hour"); // Standard 1 hour slot for existing
                
                // Check overlap
                if ($start_datetime < $b_end && $end_datetime > $b_start) {
                    http_response_code(400);
                    echo json_encode(['error' => 'This time slot is already booked. Please choose another time.']);
                    exit;
                }
            }
        }
        
        // Create the booking
        $stmt = $pdo->prepare("
            INSERT INTO bookings 
            (customer_id, provider_id, service_id, booking_date, booking_time, description, address, total_amount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        
        if ($stmt->execute([$user_id, $provider_id, $service_id, $booking_date, $booking_time, $description, $address, $total_amount])) {
            // Get the inserted booking ID
            $booking_id = $pdo->lastInsertId();
            echo json_encode([
                'success' => true,
                'message' => 'Booking created successfully',
                'booking_id' => $booking_id
            ]);
            exit;
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create booking']);
            exit;
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

