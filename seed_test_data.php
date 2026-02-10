<?php
require_once 'backend/config.php';

header('Content-Type: text/plain');

try {
    echo "--- Seeding Test Data ---\n";
    
    // 1. Ensure 'Plumbing' Service Exists
    $serviceName = 'Plumbing';
    $stmt = $pdo->prepare("SELECT id FROM services WHERE name = ?");
    $stmt->execute([$serviceName]);
    $serviceId = $stmt->fetchColumn();

    if (!$serviceId) {
        echo "Service '$serviceName' not found. Inserting...\n";
        $stmt = $pdo->prepare("INSERT INTO services (name, description, base_price) VALUES (?, ?, ?)");
        $stmt->execute([$serviceName, 'Professional plumbing services', 500.00]);
        $serviceId = $pdo->lastInsertId();
        echo "Created Service '$serviceName' (ID: $serviceId)\n";
    } else {
        echo "Service '$serviceName' exists (ID: $serviceId). Updating category...\n";
        $stmt = $pdo->prepare("UPDATE services SET category = ? WHERE id = ?");
        $stmt->execute([$serviceName, $serviceId]);
    }

    // 2. Ensure Test Provider Exists
    $providerEmail = 'test_plumber@example.com';
    
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$providerEmail]);
    $userId = $stmt->fetchColumn();

    if (!$userId) {
        echo "User '$providerEmail' not found. Inserting...\n";
        // Create User
        $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password, user_type, is_active, phone, location) VALUES (?, ?, ?, ?, ?, ?, ?)");
        // Password hash for 'password123' (simplified or use plain if app supports it, using plain based on other scripts)
        $password = 'password123'; 
        
        $stmt->execute(['Test Plumber', $providerEmail, $password, 'provider', 1, '1234567890', 'Test City']);
        $userId = $pdo->lastInsertId();
        echo "Created User ID: $userId\n";
    } else {
        echo "User ID: $userId exists.\n";
    }

    // Check if provider record exists for this user
    $stmt = $pdo->prepare("SELECT id FROM providers WHERE user_id = ?");
    $stmt->execute([$userId]);
    $providerId = $stmt->fetchColumn();

    if (!$providerId) {
        echo "Provider record not found for user. Inserting...\n";
        $stmt = $pdo->prepare("INSERT INTO providers (user_id, service_id, hourly_rate, experience_years, is_verified, bio, rating) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $userId,
            $serviceId,
            80.00,
            5,
            1,
            'Expert test plumber ready for automation.',
            4.8
        ]);
        $providerId = $pdo->lastInsertId();
        echo "Created Provider ID: $providerId\n";
    } else {
        echo "Provider record exists (ID: $providerId)\n";
    }
    
    echo "--- Seeding Complete ---\n";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
