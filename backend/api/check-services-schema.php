<?php
require_once '../config.php';

try {
    echo "<h3>Providers Table:</h3><pre>";
    $stmt = $pdo->query("DESCRIBE providers");
    print_r($stmt->fetchAll());
    echo "</pre>";

    echo "<h3>Services Table:</h3><pre>";
    $stmt = $pdo->query("DESCRIBE services");
    print_r($stmt->fetchAll());
    echo "</pre>";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
