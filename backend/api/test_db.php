<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once '../config.php';
    echo "Config loaded successfully.<br>";
    
    if (isset($pdo)) {
        echo "PDO object exists.<br>";
        $stmt = $pdo->query("SELECT 1");
        echo "Database connection successful. Test query returned: " . $stmt->fetchColumn();
    } else {
        echo "PDO object is NOT set in config.php";
    }
    
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage();
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>
