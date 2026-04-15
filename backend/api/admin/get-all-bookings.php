<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config.php';

try {
    $sql = "
        SELECT 
            b.id, 
            b.booking_date, 
            b.status, 
            b.total_amount,
            s.name as service_name,
            c.full_name as customer_name,
            p_user.full_name as provider_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users c ON b.customer_id = c.id
        JOIN providers p ON b.provider_id = p.id
        JOIN users p_user ON p.user_id = p_user.id
        ORDER BY b.booking_date DESC
    ";
    
    $stmt = $pdo->query($sql);
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'bookings' => $bookings]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
