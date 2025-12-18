<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once('../config.php');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get all services
    $stmt = $pdo->prepare("SELECT * FROM services");
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendResponse(['success' => true, 'data' => $services]);
    } else {
        handleError('No services found');
    }
} else {
    handleError('Invalid request method', 405);
}
?>
