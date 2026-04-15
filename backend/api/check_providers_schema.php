<?php
require_once '../config.php';

try {
    // Check table info
    $stmt = $pdo->query("DESCRIBE providers");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<h3>Providers Table Structure:</h3><pre>";
    print_r($columns);
    echo "</pre>";
    
    // Also check current data
    $stmt = $pdo->query("SELECT id, hourly_rate FROM providers LIMIT 5");
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<h3>First 5 rows:</h3><pre>";
    print_r($data);
    echo "</pre>";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
