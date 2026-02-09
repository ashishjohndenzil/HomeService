<?php
require_once 'backend/config.php';

try {
    $id = 29;
    
    echo "Checking user table:\n";
    $stmt = $pdo->prepare("SELECT id, full_name, is_active FROM users WHERE id = (SELECT user_id FROM providers WHERE id = ?)");
    $stmt->execute([$id]);
    print_r($stmt->fetch(PDO::FETCH_ASSOC));
    
    echo "\nChecking provider table:\n";
    $stmt = $pdo->prepare("SELECT id, user_id, service_id, is_verified FROM providers WHERE id = ?");
    $stmt->execute([$id]);
    $provider = $stmt->fetch(PDO::FETCH_ASSOC);
    print_r($provider);
    
    if ($provider) {
        echo "\nChecking service table:\n";
        $stmt = $pdo->prepare("SELECT id, name FROM services WHERE id = ?");
        $stmt->execute([$provider['service_id']]);
        print_r($stmt->fetch(PDO::FETCH_ASSOC));
    }
    
    // Test the JOIN query from get-all-providers.php but simplified
    echo "\nTesting JOIN query:\n";
    $sql = "SELECT p.id, u.full_name, s.name 
             FROM providers p
             JOIN users u ON p.user_id = u.id
             JOIN services s ON p.service_id = s.id
             WHERE p.id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo "JOIN successful:\n";
        print_r($result);
        
        // Add WHERE clauses
        $sql .= " AND u.is_active = 1 AND p.is_verified = 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id]);
        $resultVerified = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($resultVerified) {
             echo "JOIN with WHERE successful!\n";
        } else {
             echo "JOIN with WHERE FAILED.\n";
             // debug which one failed
             $stmt = $pdo->prepare("SELECT u.is_active, p.is_verified FROM providers p JOIN users u ON p.user_id = u.id WHERE p.id = ?");
             $stmt->execute([$id]);
             print_r($stmt->fetch(PDO::FETCH_ASSOC));
        }
    } else {
        echo "JOIN failed basic structure.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
