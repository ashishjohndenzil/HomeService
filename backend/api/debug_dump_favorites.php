<?php
require_once '../config.php';

echo "Dumping favorites table...\n";

try {
    $stmt = $pdo->query("SELECT * FROM favorites");
    $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($favorites);

    echo "\nTotal: " . count($favorites) . "\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
