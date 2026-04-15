<?php
require_once '../config.php';

try {
    $tables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }

    echo "Tables:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
        $stmt2 = $pdo->query("DESCRIBE $table");
        $columns = $stmt2->fetchAll(PDO::FETCH_COLUMN);
        echo "  Columns: " . implode(", ", $columns) . "\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
