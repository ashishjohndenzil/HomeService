<?php
require_once 'backend/config.php';

try {
    $stmt = $pdo->query("SELECT id, name, category FROM services");
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    print_r($services);
    echo "</pre>";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
