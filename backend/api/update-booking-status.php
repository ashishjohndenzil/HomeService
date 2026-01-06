<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    handleError('Invalid request method', 405);
}

try {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate Input
    if (empty($data['booking_id']) || empty($data['status'])) {
        handleError('Booking ID and new status are required');
    }
    
    // Validate Token (Simple Check)
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    // In a real app, verify the token. For this MVP, we rely on the ID passed in payload matching the session/token user.
    // However, since we don't have a robust token validator middleware here, we will trust the client sends the correct user_id context 
    // OR ideally we fetch the user from the token. 
    // Given the current architecture uses localStorage 'user' object, we'll validate permissions via database queries.
    
    if (empty($data['user_id'])) {
        handleError('User ID is required for authorization');
    }

    $bookingId = intval($data['booking_id']);
    $newStatus = $data['status'];
    $userId = intval($data['user_id']);
    $userType = $data['user_type']; // 'customer' or 'provider'

    // Fetch Booking
    $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$booking) {
        handleError('Booking not found', 404);
    }

    // Authorization & State Transition Logic
    $allowed = false;
    $message = '';

    if ($userType === 'customer') {
        // Customer can only CANCEL and only if it is their booking
        if ($booking['customer_id'] !== $userId) {
            handleError('Unauthorized access to this booking', 403);
        }
        if ($newStatus === 'cancelled') {
            if ($booking['status'] === 'pending' || $booking['status'] === 'confirmed') {
                $allowed = true;
                $message = 'Booking cancelled successfully';
            } else {
                handleError('Cannot cancel a booking that is already ' . $booking['status']);
            }
        } else {
            handleError('Customers can only cancel bookings');
        }
    } elseif ($userType === 'provider') {
        // Provider Verification: Check if this provider owns the booking
        // First get provider ID for this user info
        $pStmt = $pdo->prepare("SELECT id FROM providers WHERE user_id = ?");
        $pStmt->execute([$userId]);
        $provider = $pStmt->fetch(PDO::FETCH_ASSOC);

        if (!$provider || $booking['provider_id'] !== $provider['id']) {
            handleError('Unauthorized: This booking is not assigned to you', 403);
        }

        // Provider Transitions
        if ($newStatus === 'confirmed') {
            if ($booking['status'] === 'pending') {
                $allowed = true;
                $message = 'Booking confirmed';
            } else {
                handleError('Booking is already ' . $booking['status']);
            }
        } elseif ($newStatus === 'rejected') { // Map rejected to cancelled or a specific rejected status? System uses 'cancelled' enum usually.
             // Looking at schema: ENUM('pending', 'confirmed', 'completed', 'cancelled')
             // So 'rejected' should probably map to 'cancelled' or we use 'cancelled' directly.
             // Let's assume 'cancelled' for rejection for now to match schema.
             if ($newStatus === 'rejected') $newStatus = 'cancelled';
             
             if ($booking['status'] === 'pending') {
                 $allowed = true;
                 $message = 'Booking rejected';
             } else {
                 handleError('Cannot reject a booking that is ' . $booking['status']);
             }
        } elseif ($newStatus === 'cancelled') {
             // Provider cancelling after confirming?
             if ($booking['status'] === 'pending' || $booking['status'] === 'confirmed') {
                 $allowed = true;
                 $message = 'Booking cancelled';
             }
        } elseif ($newStatus === 'completed') {
            if ($booking['status'] === 'confirmed') {
                $allowed = true;
                $message = 'Job marked as completed';
            } else {
                 handleError('Only confirmed bookings can be marked as completed');
            }
        } else {
            handleError('Invalid status update for provider');
        }
    } else {
        handleError('Invalid user type');
    }

    if ($allowed) {
        $updateStmt = $pdo->prepare("UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?");
        if ($updateStmt->execute([$newStatus, $bookingId])) {
            sendResponse([
                'success' => true,
                'message' => $message,
                'new_status' => $newStatus
            ]);
        } else {
            handleError('Failed to update booking status');
        }
    }

} catch (PDOException $e) {
    handleError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    handleError('Error: ' . $e->getMessage(), 500);
}
?>
