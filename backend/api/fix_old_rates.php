<?php
require_once '../config.php';
header('Content-Type: text/plain');

try {
    echo "Starting Rate Migration for Existing Providers...\n";

    // Default rates mapping
    $defaultRates = [
        1 => 500.00, // Plumbing
        2 => 600.00, // Electrical
        3 => 400.00, // Cleaning
        4 => 550.00, // Carpentry
        5 => 450.00, // Painting
        6 => 350.00  // Repairs
    ];

    $totalUpdated = 0;

    foreach ($defaultRates as $serviceId => $rate) {
        $stmt = $pdo->prepare("
            UPDATE providers 
            SET hourly_rate = ? 
            WHERE service_id = ? AND (hourly_rate = 0 OR hourly_rate IS NULL)
        ");
        
        $stmt->execute([$rate, $serviceId]);
        $count = $stmt->rowCount();
        
        if ($count > 0) {
            echo "Updated $count providers for Service ID $serviceId to rate ₹$rate\n";
            $totalUpdated += $count;
        }
    }

    if ($totalUpdated > 0) {
        echo "\nSuccessfully updated $totalUpdated providers who had 0 rate.\n";
    } else {
        echo "\nNo providers needed updating (all already have rates).\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
