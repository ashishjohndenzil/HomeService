<?php
require_once '../config.php';
header('Content-Type: text/plain');

try {
    echo "Checking Providers Count per Service:\n";
    $stmt = $pdo->query("
        SELECT s.id, s.name, COUNT(p.id) as provider_count 
        FROM services s 
        LEFT JOIN providers p ON s.id = p.service_id 
        GROUP BY s.id, s.name
    ");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($results as $row) {
        echo "Service: " . $row['name'] . " (ID: " . $row['id'] . ") - Providers: " . $row['provider_count'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
