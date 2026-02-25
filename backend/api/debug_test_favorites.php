<?php
require_once '../config.php';

echo "Testing get-favorites logic...\n";

// 1. Get a customer user
$stmt = $pdo->query("SELECT id FROM users WHERE user_type = 'customer' LIMIT 1");
$customerId = $stmt->fetchColumn();

if (!$customerId) {
    die("No customer found.\n");
}
echo "Testing for Customer ID: $customerId\n";

// 2. Run Query
try {
    $query = "
        SELECT 
            p.id as provider_id,
            p.rating,
            p.experience_years,
            p.hourly_rate,
            s.name as service_name,
            u.full_name as provider_name,
            u.profile_image
        FROM favorites f
        JOIN providers p ON f.provider_id = p.id
        JOIN users u ON p.user_id = u.id
        JOIN services s ON p.service_id = s.id
        WHERE f.customer_id = ?
        ORDER BY f.created_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$customerId]);
    $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Found " . count($favorites) . " favorites.\n";
    print_r($favorites);

} catch (PDOException $e) {
    echo "SQL Error: " . $e->getMessage() . "\n";
}
?>
