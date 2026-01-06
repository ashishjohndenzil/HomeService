<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once('../config.php');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all services with their average provider rate
    $stmt = $pdo->prepare("
        SELECT s.*, 
               COALESCE(AVG(p.hourly_rate), CASE 
                    WHEN s.id = 1 THEN 500 
                    WHEN s.id = 2 THEN 600
                    WHEN s.id = 3 THEN 800
                    WHEN s.id = 4 THEN 800
                    WHEN s.id = 5 THEN 1200
                    WHEN s.id = 6 THEN 700
                    ELSE 500 
               END) as average_rate 
        FROM services s 
        LEFT JOIN providers p ON s.id = p.service_id 
        GROUP BY s.id
    ");
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format rate to 2 decimal places
        foreach ($services as &$service) {
            $service['average_rate'] = number_format((float)$service['average_rate'], 2, '.', '');
        }
        
        sendResponse(['success' => true, 'data' => $services]);
    } else {
        handleError('No services found');
    }
} else {
    handleError('Invalid request method', 405);
}
