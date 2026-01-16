<?php
/**
 * Strikebot Uninstall
 *
 * This file runs when the plugin is deleted from WordPress.
 * It removes ALL data associated with the plugin for a clean uninstall.
 */

// Exit if not called by WordPress
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

global $wpdb;

// Delete all database tables
$tables = array(
    $wpdb->prefix . 'strikebot_knowledge',
    $wpdb->prefix . 'strikebot_chat_history',
    $wpdb->prefix . 'strikebot_usage'
);

foreach ($tables as $table) {
    $wpdb->query("DROP TABLE IF EXISTS $table");
}

// Delete all options
$options = array(
    'strikebot_settings',
    'strikebot_api_key',
    'strikebot_api_endpoint',
    'strikebot_model'
);

foreach ($options as $option) {
    delete_option($option);
}

// Delete any transients
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%_transient_strikebot_%'");
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%_transient_timeout_strikebot_%'");

// Clear any scheduled hooks
wp_clear_scheduled_hook('strikebot_auto_retrain');
wp_clear_scheduled_hook('strikebot_cleanup');

// Delete uploaded files (if any were stored in uploads)
$upload_dir = wp_upload_dir();
$strikebot_dir = $upload_dir['basedir'] . '/strikebot';
if (is_dir($strikebot_dir)) {
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($strikebot_dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($files as $fileinfo) {
        $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
        $todo($fileinfo->getRealPath());
    }
    rmdir($strikebot_dir);
}

// Clear any cached data
wp_cache_flush();
