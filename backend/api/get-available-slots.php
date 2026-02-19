<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config.php';

$service_id = isset($_GET['service_id']) ? intval($_GET['service_id']) : null;
$date = isset($_GET['date']) ? $_GET['date'] : null;
$provider_id = isset($_GET['provider_id']) ? intval($_GET['provider_id']) : null;

if (!$date) {
    echo json_encode(['error' => 'Date is required']);
    exit;
}

if (!$service_id && !$provider_id) {
    echo json_encode(['error' => 'Service ID or Provider ID is required']);
    exit;
}

try {
    // If no specific provider selected, check if we can find one or use generic logic
    // For this implementation, if only service_id is passed, we'll try to find ANY provider available
    // OR just use the first matching one for simplicity, as "Who" acts is decided at booking time in the current logic.
    // However, accurate availability requires checking specific providers. 
    // Let's find potential providers for this service.
    
    // Query to find eligible providers
    $query = "SELECT p.id FROM providers p JOIN users u ON p.user_id = u.id WHERE 1=1";
    $params = [];
    
    if ($service_id) {
        $query .= " AND p.service_id = ?";
        $params[] = $service_id;
    }
    
    if ($provider_id) {
        $query .= " AND p.id = ?";
        $params[] = $provider_id;
    }

    // If neither is set, we can't find slots (safety check)
    if (empty($params)) {
         echo json_encode(['success' => true, 'slots' => []]);
         exit;
    }
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $providers = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($providers)) {
        echo json_encode(['success' => true, 'slots' => []]); // No providers = no slots
        exit;
    }
    
    // Define standard business hours as fallback
    $fallbackStart = '09:00:00';
    $fallbackEnd = '17:00:00';
    $day_of_week = date('l', strtotime($date));
    
    // We need to find the UNION of available slots across all eligible providers
    // But to keep it simple and performant:
    // If multiple providers, we'll just check the "primary" one (e.g. first one) 
    // OR better, checking if at least ONE provider is free for a slot.
    
    // Let's iterate 09:00 to 17:00 in 1-hour intervals
    $all_possible_slots = [];
    $start = 9;
    $end = 17;
    for ($i = $start; $i < $end; $i++) {
        $all_possible_slots[] = sprintf("%02d:00", $i);
    }
    
    $final_available_slots = [];
    
    foreach ($all_possible_slots as $slot) {
        $slotStart = $slot; 
        // Assume 1 hour duration
        $slotEnd = sprintf("%02d:00", intval(substr($slot, 0, 2)) + 1);
        
        $is_slot_available_anywhere = false;
        
        foreach ($providers as $pid) {
            // 1. Check Schedule
            $stmt = $pdo->prepare("SELECT start_time, end_time, is_active FROM provider_schedule WHERE provider_id = ? AND day_of_week = ?");
            $stmt->execute([$pid, $day_of_week]);
            $schedule = $stmt->fetch();
            
            // If no schedule, assume default 9-5 M-F (skip Sunday)
            if (!$schedule) {
                if ($day_of_week === 'Sunday') continue;
                $schedStart = $fallbackStart;
                $schedEnd = $fallbackEnd;
            } else {
                if (!$schedule['is_active']) continue;
                $schedStart = $schedule['start_time'];
                $schedEnd = $schedule['end_time'];
            }
            
            // Check if slot is within working hours
            // Using string comparison for HH:MM:SS works fine
            if ($slotStart < $schedStart || $slotEnd > $schedEnd) {
                continue; // This provider can't do this slot
            }
            
            // 2. Check Bookings
            // Check for overlap
            $stmt = $pdo->prepare("
                SELECT COUNT(*) FROM bookings 
                WHERE provider_id = ? 
                AND booking_date = ? 
                AND status IN ('pending', 'confirmed', 'completed', 'in_progress')
                AND (
                    (booking_time <= ? AND ADDTIME(booking_time, '01:00:00') > ?)
                )
            ");
            // Logic: Existing booking starts before our slot ends AND ends after our slot starts
            // Simplified: Exact match on booking_time since we use fixed slots
            // But let's use the query logic:
            // Existing Start <= New Start AND Existing End > New Start (Overlapping start)
            // We assume bookings are 1 hour.
            
            $stmt = $pdo->prepare("
                SELECT booking_time FROM bookings 
                WHERE provider_id = ? 
                AND booking_date = ? 
                AND status IN ('pending', 'confirmed', 'completed', 'in_progress')
            ");
            $stmt->execute([$pid, $date]);
            $bookings = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $is_booked = false;
            foreach ($bookings as $b_time) {
                // If there's a booking at the same time, it's taken
                // Assuming strict 1-hour slots aligned at :00
                if (substr($b_time, 0, 5) === substr($slotStart, 0, 5)) {
                    $is_booked = true;
                    break;
                }
            }
            
            if (!$is_booked) {
                $is_slot_available_anywhere = true;
                break; // Found a provider for this slot!
            }
        }
        
        if ($is_slot_available_anywhere) {
            $final_available_slots[] = $slot;
        }
    }
    
    echo json_encode(['success' => true, 'slots' => $final_available_slots]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
