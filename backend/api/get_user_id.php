<?php
require_once '../config.php';
$stmt = $pdo->query("SELECT id FROM users WHERE user_type = 'customer' LIMIT 1");
$user = $stmt->fetch();
echo "Valid User ID: " . ($user['id'] ?? 'None') . "\n";
?>
