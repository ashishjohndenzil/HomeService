<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once('../config.php');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $service_id = isset($_GET['service_id']) ? $_GET['service_id'] : null;

    if (!$service_id) {
        handleError('Service ID is required');
    }

    // Join providers and users to get full details
    $sql = "SELECT p.id as provider_id, u.full_name, u.profile_image,
                 p.hourly_rate, p.rating, p.experience_years, p.bio, p.is_verified,
                 p.service_id, s.name AS service_name, s.category,
                 (SELECT COALESCE(AVG(hourly_rate), CASE 
                    WHEN p.service_id = 1 THEN 500 
                    WHEN p.service_id = 2 THEN 600
                    WHEN p.service_id = 3 THEN 800
                    WHEN p.service_id = 4 THEN 800
                    WHEN p.service_id = 5 THEN 1200
                    WHEN p.service_id = 6 THEN 700
                    ELSE 500 
                 END) FROM providers WHERE service_id = p.service_id) as average_service_rate
             FROM providers p
             JOIN users u ON p.user_id = u.id
             JOIN services s ON p.service_id = s.id
             WHERE p.service_id = ? AND u.is_active = 1
             ORDER BY p.is_verified DESC, p.rating DESC, p.hourly_rate ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$service_id]);
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(['success' => true, 'data' => $providers]);

} else {
    handleError('Invalid request method', 405);
}
