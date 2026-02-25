<?php
require_once '../config.php';

echo "Checking user_sessions table...\n";

try {
    // Check if table exists
    $check = $pdo->query("SHOW TABLES LIKE 'user_sessions'");
    if ($check->rowCount() == 0) {
        echo "Table 'user_sessions' does NOT exist.\n";
    } else {
        echo "Table 'user_sessions' exists.\n";
        
        $stmt = $pdo->query("SELECT COUNT(*) FROM user_sessions");
        $count = $stmt->fetchColumn();
        echo "Total Sessions: $count\n";

        $active = $pdo->query("SELECT COUNT(*) FROM user_sessions WHERE expires_at > NOW()")->fetchColumn();
        echo "Active Sessions: $active\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
