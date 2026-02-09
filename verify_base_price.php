<?php
// Simulate API call
require_once 'backend/config.php';

$_SERVER['REQUEST_METHOD'] = 'GET';
ob_start();
require 'backend/api/services.php';
$output = ob_get_clean();

$data = json_decode($output, true);

if ($data['success']) {
    echo "API Success. Checking first service:\n";
    $first = $data['data'][0];
    echo "Name: " . $first['name'] . "\n";
    if (isset($first['base_price'])) {
        echo "Base Price: " . $first['base_price'] . "\n";
    } else {
        echo "Base Price: MISSING\n";
    }
} else {
    echo "API Failed: " . $output;
}
?>
