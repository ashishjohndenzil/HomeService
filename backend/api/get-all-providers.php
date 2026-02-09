<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once('../config.php');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $service_id = isset($_GET['service_id']) ? $_GET['service_id'] : null;

    $sql = "SELECT p.id as provider_id, u.id as user_id, u.full_name, u.profile_image,
                 p.hourly_rate, p.rating, p.experience_years, p.bio, p.is_verified,
                 p.service_id, s.name AS service_name, s.category,
                 (SELECT COUNT(*) FROM bookings WHERE provider_id = p.id AND status = 'completed') as completed_jobs
             FROM providers p
             JOIN users u ON p.user_id = u.id
             JOIN services s ON p.service_id = s.id
             WHERE u.is_active = 1 AND p.is_verified = 1";

    $params = [];
    if ($service_id) {
        $sql .= " AND p.service_id = ?";
        $params[] = $service_id;
    }

    $sql .= " ORDER BY p.rating DESC, p.hourly_rate ASC";
    
    try {
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute($params);
        
        if (!$result) {
            throw new Exception("Query execution failed: " . implode(" ", $stmt->errorInfo()));
        }

        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC); // Fetch as associative array

        // Normalize data types
        foreach ($providers as &$provider) {
            $provider['rating'] = (float)$provider['rating'];
            $provider['hourly_rate'] = (float)$provider['hourly_rate'];
            $provider['experience_years'] = (int)$provider['experience_years'];
        }

        sendResponse(['success' => true, 'data' => $providers]);
    } catch (Exception $e) {
        sendResponse(['success' => false, 'message' => $e->getMessage()]);
    }


} else {
    handleError('Invalid request method', 405);
}
?>
