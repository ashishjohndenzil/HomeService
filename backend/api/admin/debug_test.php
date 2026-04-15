<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "Current Dir: " . __DIR__ . "\n";
echo "Attempting to include config.php...\n";

if (file_exists('../../config.php')) {
    echo "config.php found.\n";
    require_once '../../config.php';
    if (isset($pdo)) {
        echo "PDO object exists. Connection successful.\n";
    } else {
        echo "PDO object missing.\n";
    }
} else {
    echo "config.php NOT found at ../../config.php\n";
}
?>
