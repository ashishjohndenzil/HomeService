<?php
require_once 'config.php';

try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'provider_schedule'");
    if ($stmt->rowCount() > 0) {
        echo "Table exists.";
    } else {
        echo "Table does NOT exist.";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
