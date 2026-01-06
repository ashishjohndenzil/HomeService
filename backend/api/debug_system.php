<?php
require_once '../config.php';
header('Content-Type: text/plain');

echo "=== DEBUG REPORT ===\n\n";

// 1. Check Headers
echo "--- Request Headers ---\n";
$headers = getRequestHeaders(); // Helper function below
foreach ($headers as $name => $value) {
    echo "$name: $value\n";
}
echo "\n";

// 2. Check Database Connection
echo "--- Database Status ---\n";
try {
    echo "Connected to DB: " . $pdo->getAttribute(PDO::ATTR_CONNECTION_STATUS) . "\n";
    
    // 3. Check Services
    echo "\n--- Services ---\n";
    $stmt = $pdo->query("SELECT id, name FROM services");
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($services as $s) {
        echo "ID: {$s['id']}, Name: {$s['name']}\n";
    }
    
    // 4. Check Providers
    echo "\n--- Providers ---\n";
    $stmt = $pdo->query("SELECT id, user_id, service_id, hourly_rate FROM providers");
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($providers)) {
        echo "NO PROVIDERS FOUND IN TABLE!\n";
    } else {
        foreach ($providers as $p) {
            echo "ID: {$p['id']}, ServiceID: {$p['service_id']}, UserID: {$p['user_id']}, Rate: {$p['hourly_rate']}\n";
        }
    }
    
    // 5. Check Users (Providers only)
    echo "\n--- Provider Users ---\n";
    $stmt = $pdo->query("SELECT id, email, user_type FROM users WHERE user_type = 'provider'");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $u) {
        echo "ID: {$u['id']}, Email: {$u['email']}, Type: {$u['user_type']}\n";
    }

} catch (PDOException $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}

// Helper to get headers safely
function getRequestHeaders() {
    if (function_exists('getallheaders')) {
        return getallheaders();
    }
    $headers = [];
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) == 'HTTP_') {
            $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
        }
    }
    return $headers;
}
?>
