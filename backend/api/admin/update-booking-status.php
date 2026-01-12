<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['booking_id']) || !isset($data['status'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing parameters']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE bookings SET status = ? WHERE id = ?");
    $result = $stmt->execute([$data['status'], $data['booking_id']]);

    if ($result) {
        echo json_encode(['success' => true, 'message' => 'Booking status updated']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update booking']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
