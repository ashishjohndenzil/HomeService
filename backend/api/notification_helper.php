<?php
// Function to create a notification
function createNotification($user_id, $type, $message, $related_id = null) {
    global $pdo;
    
    if (!isset($pdo)) {
        // Try to locate config.php
        $paths = ['../config.php', 'config.php', '../../config.php'];
        foreach ($paths as $path) {
            if (file_exists($path)) {
                require_once $path;
                break;
            }
        }
    }
    
    if (!isset($pdo)) {
        error_log("Notification Error: Database connection not available");
        return false;
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, message, related_id, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        
        return $stmt->execute([$user_id, $type, $message, $related_id]);
    } catch (PDOException $e) {
        // Log error but don't stop execution
        error_log("Notification Error: " . $e->getMessage());
        return false;
    }
}
?>
