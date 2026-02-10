<?php
// Debug script to dump API responses
$outputCheck = [];

// 1. Check Services
ob_start();
// simulate request
$_SERVER['REQUEST_METHOD'] = 'GET';
require 'services.php';
$servicesJson = ob_get_clean();
$outputCheck['services_raw'] = $servicesJson;
$outputCheck['services'] = json_decode($servicesJson, true);

// 2. Check Providers
ob_start();
// Reset potential globals or just include
$_SERVER['REQUEST_METHOD'] = 'GET';
// We need to re-include config? require_once prevents it.
// $pdo variable should be available from services.php include if it didn't exit.
// verify if services.php exits?
// services.php usually just outputs JSON. It might exit() at end?
// Let's check services.php content.
require 'get-all-providers.php';
$providersJson = ob_get_clean();
$outputCheck['providers_raw'] = $providersJson;
$outputCheck['providers'] = json_decode($providersJson, true);

file_put_contents('../../debug_api_dump.json', json_encode($outputCheck, JSON_PRETTY_PRINT));
echo "Dumped API responses to ../../debug_api_dump.json\n";
?>
