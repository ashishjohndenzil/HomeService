<?php
require_once '../config.php';
header('Content-Type: text/plain');

try {
    echo "--- Latest 5 Users ---\n";
    $stmt = $pdo->query("SELECT id, full_name, email, user_type, created_at FROM users ORDER BY id DESC LIMIT 5");
    $users = $stmt->fetchAll();
    
    foreach ($users as $user) {
        echo "ID: {$user['id']} | Name: {$user['full_name']} | Type: {$user['user_type']} | Email: {$user['email']}\n";
        
        if ($user['user_type'] === 'provider') {
            $pStmt = $pdo->prepare("
                SELECT p.*, s.name as service_name, s.category 
                FROM providers p 
                LEFT JOIN services s ON p.service_id = s.id 
                WHERE p.user_id = ?
            ");
            $pStmt->execute([$user['id']]);
            $provider = $pStmt->fetch();
            
            if ($provider) {
                echo "   -> Provider Record Found:\n";
                echo "      Service ID: {$provider['service_id']}\n";
                echo "      Service Name: " . ($provider['service_name'] ?? 'NULL') . "\n";
                echo "      Category: " . ($provider['category'] ?? 'NULL') . "\n";
            } else {
                echo "   -> [WARNING] No provider record found for this user!\n";
            }
        }
        echo "------------------------\n";
    }
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage();
}
?>
