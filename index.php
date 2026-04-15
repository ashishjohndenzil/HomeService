<?php
/**
 * Main Entry Point
 * 
 * This file redirects the root request to the frontend directory.
 * This ensures that when the project is accessed via a PHP server (like XAMPP),
 * it correctly loads the main landing page.
 */

header("Location: frontend/index.html");
exit;
