<?php
require_once 'backend/config.php';

try {
    // Check if providers exist
    $stmt = $pdo->query("SELECT COUNT(*) FROM providers");
    if ($stmt->fetchColumn() > 0) {
        echo "Providers already exist.";
        // Determine if we need to return them to verify
        $stmt = $pdo->query("SELECT p.id, u.full_name, s.name FROM providers p JOIN users u ON p.user_id = u.id JOIN services s ON p.service_id = s.id LIMIT 5");
        echo "<pre>";
        print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
        echo "</pre>";
        exit;
    }

    // Insert dummy providers
    $providers = [
        [
            'name' => 'Mario Plumber',
            'email' => 'mario@example.com',
            'service' => 'Plumbing',
            'rate' => 65.00,
            'bio' => 'Expert plumber with over 10 years of experience in residential and commercial plumbing.'
        ],
        [
            'name' => 'Luigi Bros',
            'email' => 'luigi@example.com',
            'service' => 'Plumbing',
            'rate' => 55.00,
            'bio' => 'Fast and reliable plumbing services. Specializing in leak detection and repairs.'
        ],
        [
            'name' => 'Electric Sally',
            'email' => 'sally@example.com',
            'service' => 'Electrical',
            'rate' => 70.00,
            'bio' => 'Licensed electrician for all your wiring and installation needs.'
        ],
        [
            'name' => 'Clean King',
            'email' => 'clean@example.com',
            'service' => 'Cleaning',
            'rate' => 40.00,
            'bio' => 'Top-rated home cleaning service. We leave your home sparkling clean.'
        ]
    ];

    foreach ($providers as $p) {
        // Get Service ID
        $stmt = $pdo->prepare("SELECT id FROM services WHERE name = ?");
        $stmt->execute([$p['service']]);
        $serviceId = $stmt->fetchColumn();

        if (!$serviceId) continue;

        // Insert User
        $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password, role, is_active) VALUES (?, ?, 'password123', 'provider', 1)");
        $stmt->execute([$p['name'], $p['email']]);
        $userId = $pdo->lastInsertId();

        // Insert Provider
        $stmt = $pdo->prepare("INSERT INTO providers (user_id, service_id, hourly_rate, rating, experience_years, is_verified, bio) VALUES (?, ?, ?, ?, ?, 1, ?)");
        $stmt->execute([
            $userId, 
            $serviceId, 
            $p['rate'], 
            4.5 + (rand(0,4)/10), // Random rating 4.5-4.9
            rand(2, 15), 
            $p['bio']
        ]);
    }

    echo "Dummy providers inserted successfully.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
