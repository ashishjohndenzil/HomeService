<?php
require_once '../config.php';

try {
    $stmt = $pdo->query("
        SELECT p.id, p.service_id, s.name, p.hourly_rate 
        FROM providers p 
        LEFT JOIN services s ON p.service_id = s.id 
        WHERE p.hourly_rate IS NULL OR p.hourly_rate = 0
    ");
    
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>Providers with NULL/0 Rate:</h3><pre>";
    print_r($rows);
    echo "</pre>";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
