<?php
// Simulating the frontend logic in PHP to verify
require_once 'backend/config.php';

// 1. Login as provider (using Ashish again, id 29)
$user_id = 45; // User ID for provider 29
// But wait, provider-services.php needs a token. 
// Let's just manually query what the frontend would query.

echo "--- Simulating Frontend Filters ---\n";

// A. Get Provider Services
$stmt = $pdo->prepare("
    SELECT s.id, s.name 
    FROM services s
    JOIN providers p ON s.id = p.service_id
    WHERE p.user_id = ?
");
$stmt->execute([$user_id]);
$providerServices = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Provider Services:\n";
$existingIds = [];
foreach ($providerServices as $s) {
    echo "- " . $s['name'] . " (ID: " . $s['id'] . ")\n";
    $existingIds[] = $s['id'];
}

// B. Get All Services
$stmt = $pdo->query("SELECT id, name FROM services");
$allServices = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\nAll Services:\n";
foreach ($allServices as $s) {
    echo "- " . $s['name'] . " (ID: " . $s['id'] . ")\n";
}

// C. Filter
echo "\nFiltered Dropdown Options (Should NOT include Provider Services):\n";
$count = 0;
foreach ($allServices as $s) {
    if (!in_array($s['id'], $existingIds)) {
        echo "+ " . $s['name'] . " (ID: " . $s['id'] . ")\n";
        $count++;
    } else {
        echo "x " . $s['name'] . " (ID: " . $s['id'] . ") - Excluded\n";
    }
}

if ($count === 0) {
    echo "No more services available to add.\n";
}

?>
