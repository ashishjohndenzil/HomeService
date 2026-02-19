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
    $provider_id = isset($data['provider_id']) ? intval($data['provi
    \
    der_id']) : null;
    
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
            
            $stmt = $pdo->prepare("
                SELECT p.id, u.location 
                FROM providers p
                JOIN users u ON p.user_id = u.id
                WHERE p.service_id = ?
            ");
            $stmt->execute([$service_id]);
            $all_providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($all_providers)) {
                http_response_code(400);
                echo json_encode(['error' => 'No providers available for this service']);
                exit;
            }

            // Filter for Availability FIRST
            $available_providers = [];
            $booking_start = new DateTime("$booking_date $booking_time");
            $booking_end = clone $booking_start;
            // Assume 1 hour duration if not set
            $duration_chk = isset($data['duration']) ? floatval($data['duration']) : 1;
            $booking_end->modify("+$duration_chk hours");
            
            $day_name = date('l', strtotime($booking_date));

            foreach ($all_providers as $prov) {
                $pid = $prov['id'];

                // 1. Check Schedule
                $stmtSched = $pdo->prepare("SELECT start_time, end_time, is_active FROM provider_schedule WHERE provider_id = ? AND day_of_week = ?");
                $stmtSched->execute([$pid, $day_name]);
                $sched = $stmtSched->fetch();

                if ($sched) {
                    if (!$sched['is_active']) continue;
                    if ($booking_time < $sched['start_time'] || $booking_time >= $sched['end_time']) continue; // varied logic
                    // Strict overlap check for schedule not fully implemented in get-slots either, assuming standard hours if no strict match?
                    // Let's stick to the booking check primarily, as schedule validation happens later too.
                    // But we should at least check if they are working that day.
                } 
                
                // 2. Check Bookings
                // Check if this specific provider has a conflict
                $stmtChk = $pdo->prepare("
                    SELECT count(*) as cnt 
                    FROM bookings 
                    WHERE provider_id = ? 
                    AND booking_date = ? 
                    AND status IN ('pending', 'confirmed', 'completed', 'in_progress')
                    AND (
                        (booking_time < ? AND ADDTIME(booking_time, '01:00:00') > ?)
                        OR (booking_time >= ? AND booking_time < ?) 
                    )
                ");
                // The above query is complex with ADDTIME. Let's simplify:
                // Existing booking starts at B_START. Ends at B_END (B_START + 1hr).
                // Request starts at R_START. Ends at R_END.
                // Overlap if: B_START < R_END AND B_END > R_START
                
                $r_start = $booking_start->format('H:i:s');
                $r_end = $booking_end->format('H:i:s');
                
                // We'll just fetch all bookings for this provider on this day and check in PHP to be safe/consistent
                $stmtAuth = $pdo->prepare("SELECT booking_time FROM bookings WHERE provider_id = ? AND booking_date = ? AND status IN ('pending', 'confirmed', 'completed', 'in_progress')");
                $stmtAuth->execute([$pid, $booking_date]);
                $p_bookings = $stmtAuth->fetchAll(PDO::FETCH_COLUMN);
                
                $is_busy = false;
                foreach ($p_bookings as $b_time) {
                    $b_start_dt = new DateTime("$booking_date $b_time");
                    $b_end_dt = clone $b_start_dt;
                    $b_end_dt->modify("+1 hour"); // Assume existing bookings are 1h
                    
                    if ($booking_start < $b_end_dt && $booking_end > $b_start_dt) {
                        $is_busy = true;
                        break;
                    }
                }
                
                if (!$is_busy) {
                    $available_providers[] = $prov;
                }
            }

            if (empty($available_providers)) {
                http_response_code(400);
                echo json_encode(['error' => 'All providers are busy at this time. Please choose another slot.']);
                exit;
            }

            // Simple scoring system on AVAILABLE providers
            $best_provider_id = null;
            $max_score = -1;
            
            // Normalize booking address for comparison and split into parts
            // e.g. "123 Main St, New York, NY" -> ["123 main st", "new york", "ny"]
            $booking_parts = array_map('trim', explode(',', strtolower($address)));

            foreach ($available_providers as $prov) {
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
                // Fallback: Pick random from available
                 $provider_id = $available_providers[array_rand($available_providers)]['id'];
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
                AND status IN ('pending', 'confirmed', 'completed', 'in_progress')
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
        
    $transaction_id = $data['transaction_id'] ?? null;
    $payment_method = $transaction_id ? 'upi' : 'cash';
    $payment_status = $transaction_id ? 'pending' : 'pending'; // Admin will verify

    // Update query to include payment details
        $stmt = $pdo->prepare("
            INSERT INTO bookings 
            (customer_id, provider_id, service_id, booking_date, booking_time, description, address, total_amount, status, transaction_id, payment_method, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
        ");
        
        if ($stmt->execute([$user_id, $provider_id, $service_id, $booking_date, $booking_time, $description, $address, $total_amount, $transaction_id, $payment_method, $payment_status])) {
            // Get the inserted booking ID
            $booking_id = $pdo->lastInsertId();
            


            // Send Notification to Provider
            require_once 'notification_helper.php';
            // Get provider user_id
            $stmtProvParams = $pdo->prepare("SELECT user_id FROM providers WHERE id = ?");
            $stmtProvParams->execute([$provider_id]);
            $provUser = $stmtProvParams->fetch();
            
            if ($provUser) {
                 createNotification($provUser['user_id'], 'booking_new', "New booking request for " . $booking_date . " at " . $booking_time, $booking_id);
            }

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

