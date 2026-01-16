<?php
require_once '../config.php';

try {
    // Check table info
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll();
    echo "<h3>Table Structure:</h3><pre>";
    print_r($columns);
    echo "</pre>";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
