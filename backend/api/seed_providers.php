<?php
require_once '../config.php';
header('Content-Type: text/plain');

try {
    echo "Starting Database Seeding for Providers...\n";

    // Services mapping (based on previous observations: 1=Plumbing, 2=Electrical, etc.)
    $services = [
        1 => 'Plumbing',
        2 => 'Electrical',
        3 => 'Cleaning',
        4 => 'Carpentry',
        5 => 'Painting',
        6 => 'Repairs'
    ];

    $passwordHash = password_hash('password123', PASSWORD_DEFAULT);

    foreach ($services as $serviceId => $serviceName) {
        $providerEmail = strtolower($serviceName) . "_pro@example.com";
        $username = $serviceName . " Pro";

        // 1. Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$providerEmail]);
        $user = $stmt->fetch();

        if (!$user) {
            // Create User
            $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password, user_type) VALUES (?, ?, ?, 'provider')");
            $stmt->execute([$username, $providerEmail, $passwordHash]);
            $userId = $pdo->lastInsertId();
            echo "Created User: $username ($providerEmail)\n";
        } else {
            $userId = $user['id'];
            echo "User exists: $username ($providerEmail)\n";
        }

        // 2. Check if provider profile exists
        $stmt = $pdo->prepare("SELECT id FROM providers WHERE user_id = ? AND service_id = ?");
        $stmt->execute([$userId, $serviceId]);
        $provider = $stmt->fetch();

        if (!$provider) {
            // Create Provider Profile
            $stmt = $pdo->prepare("
                INSERT INTO providers (user_id, service_id, experience_years, bio, hourly_rate, rating, total_reviews, is_verified) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $hourlyRate = rand(300, 800);
            $stmt->execute([
                $userId, 
                $serviceId, 
                5, 
                "Expert in $serviceName services with over 5 years of experience.", 
                $hourlyRate, 
                4.8, 
                10, 
                1
            ]);
            echo "Created Provider Profile for $serviceName (Rate: $hourlyRate)\n";
        } else {
            echo "Provider Profile exists for $serviceName\n";
        }
    }

    echo "\nSeeding Completed Successfully!\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
