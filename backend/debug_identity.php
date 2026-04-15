<?php
require_once 'config.php';

try {
    echo "--- USERS (Joseph) ---\n";
    $stmt = $pdo->query("SELECT id, full_name, email FROM users WHERE full_name LIKE '%joseph%' OR email LIKE '%joseph%'");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($users);

    if (count($users) > 0) {
        $uids = array_column($users, 'id');
        $inQuery = implode(',', array_fill(0, count($uids), '?'));
        
        echo "\n--- PROVIDERS (For these users) ---\n";
        $stmt = $pdo->prepare("SELECT * FROM providers WHERE user_id IN ($inQuery)");
        $stmt->execute($uids);
        $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        print_r($providers);
        
        if (count($providers) > 0) {
            $pids = array_column($providers, 'id');
            $pQuery = implode(',', array_fill(0, count($pids), '?'));
            
            echo "\n--- REVIEWS (For these providers) ---\n";
            // Check RAW reviews table first
            $stmt = $pdo->prepare("SELECT * FROM reviews WHERE provider_id IN ($pQuery)");
            $stmt->execute($pids);
            print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
            
            echo "\n--- BOOKINGS (For these providers) ---\n";
            $stmt = $pdo->prepare("SELECT id, status, provider_id FROM bookings WHERE provider_id IN ($pQuery)");
            $stmt->execute($pids);
            print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
    } else {
        echo "No user found matching 'joseph'. Dumping all users...\n";
        $stmt = $pdo->query("SELECT id, full_name FROM users LIMIT 10");
        print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
