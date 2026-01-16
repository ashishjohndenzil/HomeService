<?php
require_once '../config.php';

header('Content-Type: text/plain');

try {
    echo "Starting Final Rate Fix...\n";

    $updates = [
        1 => 500.00, // Plumbing
        2 => 600.00, // Electrical
        3 => 400.00, // Cleaning
        4 => 550.00, // Carpentry
        5 => 450.00, // Painting
        6 => 350.00  // Repairs
    ];

    $total = 0;

    foreach ($updates as $sId => $rate) {
        $stmt = $pdo->prepare("
            UPDATE providers 
            SET hourly_rate = ? 
            WHERE service_id = ? AND (hourly_rate IS NULL OR hourly_rate = 0)
        ");
        
        $stmt->execute([$rate, $sId]);
        $count = $stmt->rowCount();
        
        if ($count > 0) {
            echo "Updated $count services for Service ID $sId to ₹$rate\n";
            $total += $count;
        }
    }

    echo "\nTotal updated: $total\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
