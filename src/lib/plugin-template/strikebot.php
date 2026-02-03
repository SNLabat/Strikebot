<?php
/**
 * Plugin Name: Strikebot - {{CHATBOT_NAME}}
 * Plugin URI: https://strikebot.io
 * Description: AI-powered chatbot for your website with Knowledge Base support
 * Version: 1.8.2
 * Author: Strikebot
 * License: GPL v2 or later
 * Text Domain: strikebot
 */

if (!defined('ABSPATH')) {
    exit;
}

define('STRIKEBOT_VERSION', '1.8.2');
define('STRIKEBOT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('STRIKEBOT_PLUGIN_URL', plugin_dir_url(__FILE__));

// Configuration injected during plugin generation
define('STRIKEBOT_CONFIG', '{{CONFIG_JSON}}');

class Strikebot {
    private static $instance = null;
    private $config;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->config = json_decode(STRIKEBOT_CONFIG, true);
        $this->init();
    }

    private function init() {
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Initialize components
        add_action('init', array($this, 'load_textdomain'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'admin_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'frontend_scripts'));
        add_action('wp_footer', array($this, 'render_widget'));

        // AJAX handlers
        add_action('wp_ajax_strikebot_chat', array($this, 'handle_chat'));
        add_action('wp_ajax_nopriv_strikebot_chat', array($this, 'handle_chat'));
        add_action('wp_ajax_strikebot_save_settings', array($this, 'save_settings'));
        add_action('wp_ajax_strikebot_save_chatbot_config', array($this, 'save_chatbot_config'));
        add_action('wp_ajax_strikebot_save_admin_theme', array($this, 'save_admin_theme'));
        add_action('wp_ajax_strikebot_save_knowledge', array($this, 'save_knowledge'));
        add_action('wp_ajax_strikebot_delete_knowledge', array($this, 'delete_knowledge'));
        add_action('wp_ajax_strikebot_get_knowledge', array($this, 'get_knowledge'));
        add_action('wp_ajax_strikebot_crawl_sitemap', array($this, 'crawl_sitemap'));
        add_action('wp_ajax_strikebot_crawl_url', array($this, 'crawl_url'));
        add_action('wp_ajax_strikebot_debug_context', array($this, 'debug_context'));
        add_action('wp_ajax_strikebot_get_chat_logs', array($this, 'get_chat_logs'));
        add_action('wp_ajax_strikebot_get_analytics', array($this, 'get_analytics'));
        add_action('wp_ajax_strikebot_export_logs', array($this, 'export_logs'));
        add_action('wp_ajax_strikebot_export_analytics', array($this, 'export_analytics'));
        add_action('wp_ajax_strikebot_email_logs', array($this, 'email_logs'));
        add_action('wp_ajax_strikebot_email_analytics', array($this, 'email_analytics'));
        add_action('wp_ajax_strikebot_debug_urls', array($this, 'debug_urls'));
    }

    public function activate() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        // Create knowledge base table
        $table_name = $wpdb->prefix . 'strikebot_knowledge';
        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            type varchar(50) NOT NULL,
            name varchar(255) NOT NULL,
            content longtext NOT NULL,
            metadata longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";

        // Create chat history table
        $chat_table = $wpdb->prefix . 'strikebot_chat_history';
        $sql2 = "CREATE TABLE $chat_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            session_id varchar(100) NOT NULL,
            role varchar(20) NOT NULL,
            content longtext NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY session_id (session_id)
        ) $charset_collate;";

        // Create usage tracking table
        $usage_table = $wpdb->prefix . 'strikebot_usage';
        $sql3 = "CREATE TABLE $usage_table (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            month varchar(7) NOT NULL,
            message_count int(11) DEFAULT 0,
            storage_used bigint(20) DEFAULT 0,
            PRIMARY KEY (id),
            UNIQUE KEY month (month)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        dbDelta($sql2);
        dbDelta($sql3);

        // Set default options
        $defaults = array(
            'name' => $this->config['name'] ?? 'Chatbot',
            'tier' => $this->config['tier'] ?? 'starter',
            'billingPeriod' => $this->config['billingPeriod'] ?? 'monthly',
            'addOns' => $this->config['addOns'] ?? array(),
            'theme' => $this->config['theme'] ?? array(
                'primaryColor' => '#3B82F6',
                'secondaryColor' => '#1E40AF',
                'backgroundColor' => '#FFFFFF',
                'textColor' => '#1F2937',
                'mode' => 'light'
            ),
            'widget' => $this->config['widget'] ?? array(
                'position' => 'bottom-right',
                'welcomeMessage' => 'Hello! How can I help you today?',
                'placeholder' => 'Type your message...',
                'iconUrl' => ''
            ),
            'limits' => $this->config['limits'] ?? array(
                'messageCreditsPerMonth' => 10000,
                'storageLimitMB' => 50,
                'linkTrainingLimit' => null
            ),
            'features' => $this->config['features'] ?? array(
                'apiAccess' => false,
                'analytics' => 'basic',
                'autoRetrain' => true,
                'modelAccess' => 'limited'
            )
        );

        add_option('strikebot_settings', $defaults);
        add_option('strikebot_api_key', $this->config['apiKey'] ?? '');
        add_option('strikebot_api_endpoint', $this->config['apiEndpoint'] ?? 'https://api.openai.com/v1');
        add_option('strikebot_model', $this->config['model'] ?? 'gpt-4o-mini');
    }

    public function deactivate() {
        // Clean up scheduled events if any
        wp_clear_scheduled_hook('strikebot_auto_retrain');
    }

    public function load_textdomain() {
        load_plugin_textdomain('strikebot', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    public function add_admin_menu() {
        add_menu_page(
            __('Strikebot', 'strikebot'),
            __('Strikebot', 'strikebot'),
            'manage_options',
            'strikebot',
            array($this, 'render_admin_page'),
            'dashicons-format-chat',
            30
        );

        add_submenu_page(
            'strikebot',
            __('Dashboard', 'strikebot'),
            __('Dashboard', 'strikebot'),
            'manage_options',
            'strikebot',
            array($this, 'render_admin_page')
        );

        add_submenu_page(
            'strikebot',
            __('Knowledge Base', 'strikebot'),
            __('Knowledge Base', 'strikebot'),
            'manage_options',
            'strikebot-knowledge',
            array($this, 'render_knowledge_page')
        );

        add_submenu_page(
            'strikebot',
            __('Appearance', 'strikebot'),
            __('Appearance', 'strikebot'),
            'manage_options',
            'strikebot-appearance',
            array($this, 'render_appearance_page')
        );

        add_submenu_page(
            'strikebot',
            __('Settings', 'strikebot'),
            __('Settings', 'strikebot'),
            'manage_options',
            'strikebot-settings',
            array($this, 'render_settings_page')
        );
    }

    public function admin_scripts($hook) {
        if (strpos($hook, 'strikebot') === false) {
            return;
        }

        wp_enqueue_media();
        wp_enqueue_style('strikebot-admin', STRIKEBOT_PLUGIN_URL . 'assets/css/admin.css', array(), STRIKEBOT_VERSION);
        wp_enqueue_script('strikebot-admin', STRIKEBOT_PLUGIN_URL . 'assets/js/admin.js', array('jquery'), STRIKEBOT_VERSION, true);

        wp_localize_script('strikebot-admin', 'strikebotAdmin', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('strikebot_admin'),
            'settings' => get_option('strikebot_settings'),
            'limits' => $this->config['limits'] ?? array()
        ));
    }

    public function frontend_scripts() {
        wp_enqueue_style('strikebot-widget', STRIKEBOT_PLUGIN_URL . 'assets/css/widget.css', array(), STRIKEBOT_VERSION);
        wp_enqueue_script('strikebot-widget', STRIKEBOT_PLUGIN_URL . 'assets/js/widget.js', array(), STRIKEBOT_VERSION, true);

        $settings = get_option('strikebot_settings');
        wp_localize_script('strikebot-widget', 'strikebotWidget', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('strikebot_chat'),
            'settings' => $settings
        ));
    }

    public function render_admin_page() {
        include STRIKEBOT_PLUGIN_DIR . 'templates/admin/dashboard.php';
    }

    public function render_knowledge_page() {
        include STRIKEBOT_PLUGIN_DIR . 'templates/admin/knowledge.php';
    }

    public function render_appearance_page() {
        include STRIKEBOT_PLUGIN_DIR . 'templates/admin/appearance.php';
    }

    public function render_settings_page() {
        include STRIKEBOT_PLUGIN_DIR . 'templates/admin/settings.php';
    }

    public function render_widget() {
        include STRIKEBOT_PLUGIN_DIR . 'templates/widget.php';
    }

    public function handle_chat() {
        check_ajax_referer('strikebot_chat', 'nonce');

        $message = sanitize_text_field($_POST['message'] ?? '');
        $session_id = sanitize_text_field($_POST['session_id'] ?? '');

        if (empty($message)) {
            wp_send_json_error(array('message' => 'Message is required'));
        }

        // Check usage limits
        if (!$this->check_usage_limits()) {
            wp_send_json_error(array('message' => 'Monthly message limit reached'));
        }

        // Get knowledge base context
        $context = $this->get_knowledge_context($message);

        // Build messages array
        $messages = array(
            array(
                'role' => 'system',
                'content' => $this->build_system_prompt($context)
            )
        );

        // Add chat history
        $history = $this->get_chat_history($session_id);
        foreach ($history as $entry) {
            $messages[] = array(
                'role' => $entry->role,
                'content' => $entry->content
            );
        }

        // Add current message
        $messages[] = array(
            'role' => 'user',
            'content' => $message
        );

        // Call API
        $response = $this->call_api($messages);

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }

        // Save to history
        $this->save_chat_message($session_id, 'user', $message);
        $this->save_chat_message($session_id, 'assistant', $response);

        // Increment usage
        $this->increment_usage();

        wp_send_json_success(array('response' => $response));
    }

    private function check_usage_limits() {
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_usage';
        $month = date('Y-m');

        $usage = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE month = %s",
            $month
        ));

        $settings = get_option('strikebot_settings');
        $limit = $settings['limits']['messageCreditsPerMonth'] ?? 10000;

        // Add extra messages from add-ons
        $addOns = $settings['addOns'] ?? array();
        foreach ($addOns as $addOn) {
            if ($addOn['type'] === 'extra_messages' && isset($addOn['value'])) {
                $limit += $addOn['value'];
            }
        }

        return !$usage || $usage->message_count < $limit;
    }

    private function increment_usage() {
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_usage';
        $month = date('Y-m');

        $wpdb->query($wpdb->prepare(
            "INSERT INTO $table (month, message_count) VALUES (%s, 1)
             ON DUPLICATE KEY UPDATE message_count = message_count + 1",
            $month
        ));
    }

    private function get_knowledge_context($query) {
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';

        // Get ALL items and include as much as possible
        // Order: Q&A first (most specific), then files, then URLs
        $items = $wpdb->get_results("SELECT * FROM $table ORDER BY 
            CASE type 
                WHEN 'qa' THEN 1 
                WHEN 'text' THEN 2 
                WHEN 'file' THEN 3 
                WHEN 'url' THEN 4 
                ELSE 5 
            END, 
            created_at DESC");

        // Limit context based on model capabilities
        // GPT-4.1 and newer models can handle 128k+ tokens
        // Using ~100,000 chars (~25,000 tokens) to leave room for response
        $max_chars = 20000; // Reduced to prevent rate limits (~5K tokens)
        $context = "";
        $items_included = 0;
        $items_by_type = array();
        
        foreach ($items as $item) {
            // Skip items with no content
            if (empty($item->content)) {
                continue;
            }
            
            // Add type label for better context
            $type_label = '';
            switch ($item->type) {
                case 'qa':
                    $type_label = '[Q&A]';
                    break;
                case 'url':
                    $type_label = '[From webpage: ' . $item->name . ']';
                    break;
                case 'file':
                    $type_label = '[From document: ' . $item->name . ']';
                    break;
                case 'text':
                    $type_label = '[Information: ' . $item->name . ']';
                    break;
                default:
                    $type_label = '[' . ucfirst($item->type) . ': ' . $item->name . ']';
            }
            
            // For URLs, truncate very long content to allow more URLs to fit
            $content_to_add = $item->content;
            
            // Truncate content based on type to ensure variety in context
            $max_per_item = 5000; // Default max per item
            if ($item->type === 'url') {
                $max_per_item = 3000; // URLs get less (there are usually many)
            } elseif ($item->type === 'file') {
                $max_per_item = 20000; // Files get more but still capped
            }
            
            if (strlen($content_to_add) > $max_per_item) {
                $content_to_add = substr($content_to_add, 0, $max_per_item) . "\n[Content truncated - " . strlen($item->content) . " bytes total...]";
            }
            
            $item_content = "\n\n---\n" . $type_label . "\n" . $content_to_add;
            $new_length = strlen($context) + strlen($item_content);
            
            if ($new_length > $max_chars) {
                // Add partial content if there's room
                $remaining = $max_chars - strlen($context);
                if ($remaining > 200) {
                    $context .= substr($item_content, 0, $remaining) . "\n[Truncated...]";
                    $items_included++;
                    if (!isset($items_by_type[$item->type])) $items_by_type[$item->type] = 0;
                    $items_by_type[$item->type]++;
                }
                break;
            }
            
            $context .= $item_content;
            $items_included++;
            if (!isset($items_by_type[$item->type])) $items_by_type[$item->type] = 0;
            $items_by_type[$item->type]++;
        }
        
        // Log for debugging
        $type_summary = array();
        foreach ($items_by_type as $type => $count) {
            $type_summary[] = "$type: $count";
        }
        error_log('Strikebot: Built context with ' . $items_included . ' items (' . implode(', ', $type_summary) . '), ' . strlen($context) . ' characters');

        return $context;
    }

    private function build_system_prompt($context) {
        $settings = get_option('strikebot_settings');
        $name = $settings['name'] ?? 'Assistant';
        $instructions = $settings['instructions'] ?? '';

        $prompt = "You are $name, a helpful AI assistant. ";
        
        // Add custom instructions if provided
        if (!empty($instructions)) {
            $prompt .= "\n\n" . trim($instructions) . "\n";
        }
        
        $prompt .= "\nAnswer questions based on the following knowledge base:\n";
        $prompt .= $context;
        $prompt .= "\n\nIf you don't know the answer based on the knowledge base, say so politely.";

        return $prompt;
    }

    private function get_chat_history($session_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_chat_history';

        return $wpdb->get_results($wpdb->prepare(
            "SELECT role, content FROM $table WHERE session_id = %s ORDER BY created_at ASC LIMIT 20",
            $session_id
        ));
    }

    private function save_chat_message($session_id, $role, $content) {
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_chat_history';

        $wpdb->insert($table, array(
            'session_id' => $session_id,
            'role' => $role,
            'content' => $content
        ));
    }

    private function call_api($messages) {
        $api_key = get_option('strikebot_api_key');
        $api_endpoint = get_option('strikebot_api_endpoint');
        $model = get_option('strikebot_model');

        if (empty($api_key)) {
            return new WP_Error('no_api_key', 'API key not configured');
        }

        $response = wp_remote_post($api_endpoint . '/chat/completions', array(
            'timeout' => 60,
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode(array(
                'model' => $model,
                'messages' => $messages,
                'max_tokens' => 1000,
                'temperature' => 0.7
            ))
        ));

        if (is_wp_error($response)) {
            return $response;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (isset($body['error'])) {
            return new WP_Error('api_error', $body['error']['message'] ?? 'API error');
        }

        return $body['choices'][0]['message']['content'] ?? '';
    }

    public function save_settings() {
        check_ajax_referer('strikebot_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        $settings = get_option('strikebot_settings');

        // Update allowed settings (not limits - those are locked)
        if (isset($_POST['name'])) {
            $settings['name'] = sanitize_text_field($_POST['name']);
        }
        if (isset($_POST['theme'])) {
            $settings['theme'] = array_map('sanitize_text_field', $_POST['theme']);
        }
        if (isset($_POST['widget'])) {
            $settings['widget'] = array_map('sanitize_text_field', $_POST['widget']);
        }
        
        // Handle instructions (for chatbot configuration)
        if (isset($_POST['instructions'])) {
            // Always update instructions if provided (even if empty)
            $settings['instructions'] = sanitize_textarea_field($_POST['instructions']);
        }
        
        // Handle removeBranding checkbox (for chatbot configuration)
        // If instructions are being saved, we also need to handle removeBranding
        if (isset($_POST['instructions'])) {
            if (isset($_POST['removeBranding']) && ($_POST['removeBranding'] === 'true' || $_POST['removeBranding'] === '1')) {
                $settings['removeBranding'] = true;
            } else {
                // Checkbox not checked or not sent - set to false
                $settings['removeBranding'] = false;
            }
        }

        $update_result = update_option('strikebot_settings', $settings);
        
        // Return success response
        $response_data = array('message' => 'Settings saved successfully');
        
        // If saving chatbot config, verify and include debug info
        if (isset($_POST['instructions'])) {
            $saved_settings = get_option('strikebot_settings');
            $response_data['instructions_saved'] = strlen($saved_settings['instructions'] ?? '') > 0;
            $response_data['removeBranding_saved'] = (bool)($saved_settings['removeBranding'] ?? false);
            $response_data['instructions_length'] = strlen($saved_settings['instructions'] ?? '');
        }

        wp_send_json_success($response_data);
    }

    public function save_admin_theme() {
        check_ajax_referer('strikebot_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        $theme = sanitize_text_field($_POST['theme'] ?? 'light');
        
        if (!in_array($theme, array('light', 'dark'))) {
            $theme = 'light';
        }

        update_option('strikebot_admin_theme', $theme);

        wp_send_json_success(array('message' => 'Theme saved', 'theme' => $theme));
    }

    public function save_chatbot_config() {
        check_ajax_referer('strikebot_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        $settings = get_option('strikebot_settings', array());
        
        // Save instructions
        if (isset($_POST['instructions'])) {
            $instructions = sanitize_textarea_field($_POST['instructions']);
            $settings['instructions'] = $instructions;
        } else {
            $settings['instructions'] = '';
        }
        
        // Save removeBranding checkbox
        if (isset($_POST['removeBranding']) && $_POST['removeBranding'] === '1') {
            $settings['removeBranding'] = true;
        } else {
            $settings['removeBranding'] = false;
        }
        
        // Save to database
        $result = update_option('strikebot_settings', $settings);
        
        // Verify save
        $saved_settings = get_option('strikebot_settings', array());
        $instructions_saved = isset($saved_settings['instructions']) ? $saved_settings['instructions'] : '';
        $removeBranding_saved = isset($saved_settings['removeBranding']) ? (bool)$saved_settings['removeBranding'] : false;
        
        wp_send_json_success(array(
            'message' => 'Chatbot configuration saved successfully',
            'instructions_length' => strlen($instructions_saved),
            'removeBranding' => $removeBranding_saved,
            'saved' => true
        ));
    }

    public function save_knowledge() {
        check_ajax_referer('strikebot_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';

        // Check storage limit
        $settings = get_option('strikebot_settings');
        $limit_mb = $settings['limits']['storageLimitMB'] ?? 0.4;
        $limit_bytes = $limit_mb * 1024 * 1024;

        $current_size = $wpdb->get_var("SELECT SUM(LENGTH(content)) FROM $table") ?: 0;
        $new_content = isset($_POST['content']) ? $_POST['content'] : '';
        $original_length = strlen($new_content);
        
        // For knowledge base content, we want to preserve the text as-is
        // Only do basic security: remove null bytes and normalize line endings
        $new_content = str_replace(chr(0), '', $new_content); // Remove null bytes
        $new_content = str_replace("\r\n", "\n", $new_content); // Normalize line endings
        $new_content = str_replace("\r", "\n", $new_content);
        
        // If content was completely empty after receiving, log it
        $new_size = strlen($new_content);
        if ($new_size === 0 && $original_length > 0) {
            wp_send_json_error(array(
                'message' => 'Content was lost during processing. Original size: ' . $original_length . ' bytes'
            ));
        }
        if (($current_size + $new_size) > $limit_bytes) {
            $current_mb = round($current_size / 1024 / 1024, 2);
            $limit_mb = round($limit_bytes / 1024 / 1024, 2);
            wp_send_json_error(array(
                'message' => 'Storage limit exceeded. Current: ' . $current_mb . ' MB, Limit: ' . $limit_mb . ' MB, New content: ' . round($new_size / 1024, 2) . ' KB'
            ));
        }

        // Check link limit for URL types (but not for sitemap-crawled URLs)
        $type = sanitize_text_field($_POST['type'] ?? '');
        // Skip link limit check entirely for sitemap crawls
        // Check metadata BEFORE sanitizing to see if it's from sitemap
        $metadata_raw = isset($_POST['metadata']) ? $_POST['metadata'] : '';
        $is_from_sitemap = false;
        
        if (!empty($metadata_raw)) {
            // Check if metadata indicates it's from a sitemap crawl
            if (strpos($metadata_raw, 'from_sitemap') !== false || strpos($metadata_raw, 'sitemap') !== false) {
                $is_from_sitemap = true;
            }
        }
        
        // Only check link limit for manual URL entries, not for sitemap crawls
        if ($type === 'url' && !$is_from_sitemap) {
            $link_limit = $settings['limits']['linkTrainingLimit'];
            if ($link_limit !== null) {
                $link_count = $wpdb->get_var("SELECT COUNT(*) FROM $table WHERE type = 'url' AND (metadata IS NULL OR (metadata NOT LIKE '%sitemap%' AND metadata NOT LIKE '%from_sitemap%'))");
                if ($link_count >= $link_limit) {
                    wp_send_json_error(array('message' => 'Link training limit reached. Sitemap crawls bypass this limit.'));
                }
            }
        }

        // Don't sanitize metadata if it's JSON - just store it
        $metadata_to_store = isset($_POST['metadata']) ? $_POST['metadata'] : '';
        // Only sanitize if it's not JSON
        if (!empty($metadata_to_store) && !(substr($metadata_to_store, 0, 1) === '{' && substr($metadata_to_store, -1) === '}')) {
            $metadata_to_store = sanitize_text_field($metadata_to_store);
        }
        
        $name = sanitize_text_field($_POST['name'] ?? '');
        
        // Check for duplicate URLs (for URL type entries)
        if ($type === 'url') {
            // Extract actual URL from metadata if available (for sitemap crawls)
            $url_to_check = $name;
            if (!empty($metadata_to_store)) {
                // Try to decode JSON metadata
                $metadata_decoded = json_decode($metadata_to_store, true);
                if ($metadata_decoded && isset($metadata_decoded['crawled_url'])) {
                    $url_to_check = $metadata_decoded['crawled_url'];
                }
            }
            
            // Normalize URL for comparison
            $normalized_url = $this->normalize_url($url_to_check);
            
            // Get all existing URL entries and check for duplicates precisely
            $existing_urls = $wpdb->get_results("SELECT id, name, metadata FROM $table WHERE type = 'url'");
            $existing = null;
            
            foreach ($existing_urls as $entry) {
                // Normalize the existing entry's name
                $existing_normalized = $this->normalize_url($entry->name);
                
                // Check name match
                if ($existing_normalized === $normalized_url) {
                    $existing = $entry;
                    break;
                }
                
                // Also check metadata crawled_url if present
                if (!empty($entry->metadata)) {
                    // Try to decode metadata - handle both JSON and plain text
                    $entry_metadata = json_decode($entry->metadata, true);
                    if (json_last_error() === JSON_ERROR_NONE && $entry_metadata && isset($entry_metadata['crawled_url'])) {
                        $existing_crawled = $this->normalize_url($entry_metadata['crawled_url']);
                        if ($existing_crawled === $normalized_url) {
                            $existing = $entry;
                            break;
                        }
                    }
                }
            }
            
            if ($existing) {
                // Provide detailed duplicate information for debugging
                $duplicate_info = 'URL already exists in knowledge base. ';
                $duplicate_info .= 'Attempted: ' . $url_to_check . ' ';
                $duplicate_info .= '(normalizes to: ' . $normalized_url . ') ';
                $duplicate_info .= '| Existing: ' . $existing->name;

                wp_send_json_error(array(
                    'message' => $duplicate_info,
                    'duplicate_id' => $existing->id,
                    'is_duplicate' => true,
                    'debug' => array(
                        'attempted_url' => $url_to_check,
                        'attempted_normalized' => $normalized_url,
                        'existing_name' => $existing->name,
                        'existing_id' => $existing->id
                    )
                ));
            }
        }
        
        $insert_result = $wpdb->insert($table, array(
            'type' => $type,
            'name' => $name,
            'content' => $new_content,
            'metadata' => $metadata_to_store,
            'created_at' => current_time('mysql')
        ));
        
        if ($insert_result === false) {
            wp_send_json_error(array('message' => 'Failed to save knowledge: ' . $wpdb->last_error));
        }

        wp_send_json_success(array(
            'message' => 'Knowledge added',
            'id' => $wpdb->insert_id
        ));
    }

    public function delete_knowledge() {
        check_ajax_referer('strikebot_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';
        $id = intval($_POST['id'] ?? 0);

        $wpdb->delete($table, array('id' => $id));

        wp_send_json_success(array('message' => 'Knowledge deleted'));
    }

    public function get_knowledge() {
        // Verify nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'strikebot_admin')) {
            wp_send_json_error(array('message' => 'Security check failed. Please refresh the page and try again.'));
            return;
        }

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'You do not have permission to view this content.'));
            return;
        }

        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
        
        if ($id <= 0) {
            wp_send_json_error(array('message' => 'Invalid ID provided: ' . $id));
            return;
        }

        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';

        // Get the item
        $item = $wpdb->get_row($wpdb->prepare(
            "SELECT id, name, content, type, metadata, created_at FROM $table WHERE id = %d",
            $id
        ));

        if (!$item) {
            // Check if table exists
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'") === $table;
            wp_send_json_error(array(
                'message' => 'Item not found with ID: ' . $id,
                'debug' => array(
                    'table' => $table,
                    'table_exists' => $table_exists
                )
            ));
            return;
        }

        // Get content
        $content = isset($item->content) ? $item->content : '';
        $content_length = strlen($content);
        
        if (empty($content)) {
            $content = '[No content stored for this item]';
        }

        wp_send_json_success(array(
            'name' => $item->name,
            'content' => $content,
            'type' => $item->type,
            'id' => $item->id,
            'created_at' => $item->created_at,
            'debug' => array(
                'content_length' => $content_length,
                'has_content' => $content_length > 0,
                'item_id' => $item->id
            )
        ));
    }

    public function crawl_sitemap() {
        check_ajax_referer('strikebot_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        $url = esc_url_raw($_POST['url'] ?? '');
        if (empty($url)) {
            wp_send_json_error(array('message' => 'URL is required'));
        }

        $response = wp_remote_get($url);
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }

        $body = wp_remote_retrieve_body($response);
        $xml = simplexml_load_string($body);

        if (!$xml) {
            wp_send_json_error(array('message' => 'Invalid sitemap XML'));
        }

        $urls = array();
        foreach ($xml->url as $url_entry) {
            $urls[] = (string) $url_entry->loc;
        }

        wp_send_json_success(array('urls' => $urls));
    }

    public function crawl_url() {
        check_ajax_referer('strikebot_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        $url = esc_url_raw($_POST['url'] ?? '');
        if (empty($url)) {
            wp_send_json_error(array('message' => 'URL is required'));
        }

        $response = wp_remote_get($url, array(
            'timeout' => 30,
            'user-agent' => 'Mozilla/5.0 (compatible; Strikebot/1.0)'
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => 'Failed to fetch URL: ' . $response->get_error_message()));
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code !== 200) {
            wp_send_json_error(array('message' => 'URL returned status code: ' . $status_code));
        }

        $body = wp_remote_retrieve_body($response);
        
        if (empty($body)) {
            wp_send_json_error(array('message' => 'No content received from URL'));
        }

        // Extract text content
        $content = $this->extract_text_from_html($body);
        
        if (empty($content)) {
            wp_send_json_error(array('message' => 'No text content could be extracted from page'));
        }

        wp_send_json_success(array(
            'content' => $content,
            'content_length' => strlen($content),
            'url' => $url
        ));
    }

    private function normalize_url($url) {
        if (empty($url)) {
            return '';
        }

        // Parse URL to handle components properly
        $parsed = parse_url($url);
        if (!$parsed) {
            // If parse_url fails, just do basic normalization
            return rtrim(strtolower(trim($url)), '/');
        }

        // Reconstruct URL with normalized components
        $scheme = isset($parsed['scheme']) ? strtolower($parsed['scheme']) : 'https';
        $host = isset($parsed['host']) ? strtolower($parsed['host']) : '';

        // Remove 'www.' prefix for consistency
        if (strpos($host, 'www.') === 0) {
            $host = substr($host, 4);
        }

        // Get path and remove trailing slash (but keep single slash for root)
        $path = isset($parsed['path']) ? $parsed['path'] : '';
        if ($path !== '/' && substr($path, -1) === '/') {
            $path = substr($path, 0, -1);
        }
        if ($path === '/') {
            $path = '';
        }

        // Rebuild normalized URL (without query/fragment for comparison)
        $normalized = $scheme . '://' . $host . $path;

        // Convert to lowercase
        return strtolower($normalized);
    }

    private function extract_text_from_html($html) {
        // Remove script and style elements
        $html = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $html);
        $html = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $html);
        $html = preg_replace('/<noscript[^>]*>.*?<\/noscript>/is', '', $html);
        $html = preg_replace('/<nav[^>]*>.*?<\/nav>/is', '', $html);
        $html = preg_replace('/<header[^>]*>.*?<\/header>/is', '', $html);
        $html = preg_replace('/<footer[^>]*>.*?<\/footer>/is', '', $html);
        
        // Try to get main content area if it exists
        $main_content = '';
        if (preg_match('/<main[^>]*>(.*?)<\/main>/is', $html, $matches)) {
            $main_content = $matches[1];
        } elseif (preg_match('/<article[^>]*>(.*?)<\/article>/is', $html, $matches)) {
            $main_content = $matches[1];
        } elseif (preg_match('/<div[^>]*(?:class|id)=["\'][^"\']*(?:content|main|body)[^"\']*["\'][^>]*>(.*?)<\/div>/is', $html, $matches)) {
            $main_content = $matches[1];
        }
        
        // Use main content if found, otherwise use full HTML
        $text_html = !empty($main_content) ? $main_content : $html;

        // Convert to text
        $text = strip_tags($text_html);

        // Decode HTML entities
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');

        // Clean up whitespace but preserve paragraph breaks
        $text = preg_replace('/[ \t]+/', ' ', $text); // Collapse horizontal whitespace
        $text = preg_replace('/\n\s*\n\s*\n+/', "\n\n", $text); // Collapse multiple line breaks
        $text = trim($text);

        return $text;
    }
    
    public function debug_context() {
        check_ajax_referer('strikebot_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }
        
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';
        
        // Get all items
        $items = $wpdb->get_results("SELECT id, name, type, LENGTH(content) as content_length, LEFT(content, 500) as content_preview FROM $table ORDER BY created_at DESC");
        
        // Build the context
        $context = $this->get_knowledge_context('test query');
        
        wp_send_json_success(array(
            'items_count' => count($items),
            'items' => $items,
            'context_length' => strlen($context),
            'context_preview' => substr($context, 0, 2000),
            'full_context' => $context
        ));
    }

    public function get_chat_logs() {
        check_ajax_referer('strikebot_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_chat_history';
        
        $page = isset($_POST['page']) ? intval($_POST['page']) : 1;
        $per_page = isset($_POST['per_page']) ? intval($_POST['per_page']) : 50;
        $offset = ($page - 1) * $per_page;
        
        // Get total count
        $total = $wpdb->get_var("SELECT COUNT(DISTINCT session_id) FROM $table");
        
        // Get unique sessions with latest message time
        $sessions = $wpdb->get_results($wpdb->prepare(
            "SELECT session_id, MAX(created_at) as last_message, COUNT(*) as message_count 
             FROM $table 
             GROUP BY session_id 
             ORDER BY last_message DESC 
             LIMIT %d OFFSET %d",
            $per_page,
            $offset
        ));
        
        // Get all messages for these sessions
        $logs = array();
        foreach ($sessions as $session) {
            $messages = $wpdb->get_results($wpdb->prepare(
                "SELECT id, role, content, created_at 
                 FROM $table 
                 WHERE session_id = %s 
                 ORDER BY created_at ASC",
                $session->session_id
            ));
            
            $logs[] = array(
                'session_id' => $session->session_id,
                'last_message' => $session->last_message,
                'message_count' => intval($session->message_count),
                'messages' => $messages
            );
        }
        
        wp_send_json_success(array(
            'logs' => $logs,
            'total' => intval($total),
            'page' => $page,
            'per_page' => $per_page,
            'total_pages' => ceil($total / $per_page)
        ));
    }

    public function get_analytics() {
        check_ajax_referer('strikebot_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        global $wpdb;
        $chat_table = $wpdb->prefix . 'strikebot_chat_history';
        $usage_table = $wpdb->prefix . 'strikebot_usage';
        
        // Messages per day (last 30 days)
        $daily_messages = $wpdb->get_results("
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM $chat_table 
            WHERE role = 'user' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        
        // Total stats
        $total_sessions = $wpdb->get_var("SELECT COUNT(DISTINCT session_id) FROM $chat_table");
        $total_messages = $wpdb->get_var("SELECT COUNT(*) FROM $chat_table WHERE role = 'user'");
        $total_responses = $wpdb->get_var("SELECT COUNT(*) FROM $chat_table WHERE role = 'assistant'");
        
        // Messages today
        $messages_today = $wpdb->get_var("
            SELECT COUNT(*) 
            FROM $chat_table 
            WHERE role = 'user' 
            AND DATE(created_at) = CURDATE()
        ");
        
        // Messages this week
        $messages_week = $wpdb->get_var("
            SELECT COUNT(*) 
            FROM $chat_table 
            WHERE role = 'user' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        
        // Average messages per session
        $avg_messages = $total_sessions > 0 ? round($total_messages / $total_sessions, 2) : 0;
        
        // Monthly usage history
        $monthly_usage = $wpdb->get_results("
            SELECT month, message_count 
            FROM $usage_table 
            ORDER BY month DESC 
            LIMIT 12
        ");
        
        wp_send_json_success(array(
            'daily_messages' => $daily_messages,
            'total_sessions' => intval($total_sessions),
            'total_messages' => intval($total_messages),
            'total_responses' => intval($total_responses),
            'messages_today' => intval($messages_today),
            'messages_week' => intval($messages_week),
            'avg_messages_per_session' => $avg_messages,
            'monthly_usage' => $monthly_usage
        ));
    }

    public function export_logs() {
        check_ajax_referer('strikebot_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_chat_history';
        $format = isset($_GET['format']) ? sanitize_text_field($_GET['format']) : 'csv';
        
        // Get all chat logs grouped by session
        $sessions = $wpdb->get_results("
            SELECT session_id, MAX(created_at) as last_message, COUNT(*) as message_count 
            FROM $table 
            GROUP BY session_id 
            ORDER BY last_message DESC
        ");
        
        if ($format === 'json') {
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="strikebot-logs-' . date('Y-m-d') . '.json"');
            
            $export_data = array();
            foreach ($sessions as $session) {
                $messages = $wpdb->get_results($wpdb->prepare(
                    "SELECT role, content, created_at 
                     FROM $table 
                     WHERE session_id = %s 
                     ORDER BY created_at ASC",
                    $session->session_id
                ));
                
                $export_data[] = array(
                    'session_id' => $session->session_id,
                    'last_message' => $session->last_message,
                    'message_count' => intval($session->message_count),
                    'messages' => $messages
                );
            }
            
            echo json_encode($export_data, JSON_PRETTY_PRINT);
            exit;
        } else {
            // CSV format
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="strikebot-logs-' . date('Y-m-d') . '.csv"');
            
            $output = fopen('php://output', 'w');
            fputcsv($output, array('Session ID', 'Date', 'Role', 'Message'));
            
            foreach ($sessions as $session) {
                $messages = $wpdb->get_results($wpdb->prepare(
                    "SELECT role, content, created_at 
                     FROM $table 
                     WHERE session_id = %s 
                     ORDER BY created_at ASC",
                    $session->session_id
                ));
                
                foreach ($messages as $message) {
                    fputcsv($output, array(
                        $session->session_id,
                        $message->created_at,
                        $message->role,
                        $message->content
                    ));
                }
            }
            
            fclose($output);
            exit;
        }
    }

    public function export_analytics() {
        check_ajax_referer('strikebot_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        global $wpdb;
        $chat_table = $wpdb->prefix . 'strikebot_chat_history';
        $usage_table = $wpdb->prefix . 'strikebot_usage';
        $format = isset($_GET['format']) ? sanitize_text_field($_GET['format']) : 'csv';
        
        // Get analytics data
        $daily_messages = $wpdb->get_results("
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM $chat_table 
            WHERE role = 'user' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        
        $monthly_usage = $wpdb->get_results("
            SELECT month, message_count 
            FROM $usage_table 
            ORDER BY month DESC 
            LIMIT 12
        ");
        
        if ($format === 'json') {
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="strikebot-analytics-' . date('Y-m-d') . '.json"');
            
            echo json_encode(array(
                'daily_messages' => $daily_messages,
                'monthly_usage' => $monthly_usage,
                'exported_at' => current_time('mysql')
            ), JSON_PRETTY_PRINT);
            exit;
        } else {
            // CSV format
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="strikebot-analytics-' . date('Y-m-d') . '.csv"');
            
            $output = fopen('php://output', 'w');
            
            // Daily messages
            fputcsv($output, array('Type', 'Date/Period', 'Count'));
            fputcsv($output, array('Daily Messages', '', ''));
            foreach ($daily_messages as $day) {
                fputcsv($output, array('Daily', $day->date, $day->count));
            }
            
            fputcsv($output, array('')); // Empty row
            fputcsv($output, array('Monthly Usage', '', ''));
            foreach ($monthly_usage as $month) {
                fputcsv($output, array('Monthly', $month->month, $month->message_count));
            }
            
            fclose($output);
            exit;
        }
    }

    public function email_logs() {
        check_ajax_referer('strikebot_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        $email = isset($_POST['email']) ? sanitize_email($_POST['email']) : '';
        
        if (empty($email) || !is_email($email)) {
            wp_send_json_error(array('message' => 'Valid email address is required'));
        }

        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_chat_history';
        
        // Get all chat logs grouped by session
        $sessions = $wpdb->get_results("
            SELECT session_id, MAX(created_at) as last_message, COUNT(*) as message_count 
            FROM $table 
            GROUP BY session_id 
            ORDER BY last_message DESC
        ");
        
        // Build email content
        $email_subject = 'Strikebot Chat Logs - ' . date('Y-m-d');
        $email_body = "Chat Transcripts from Strikebot\n\n";
        $email_body .= "Generated: " . current_time('mysql') . "\n";
        $email_body .= "Total Sessions: " . count($sessions) . "\n\n";
        $email_body .= "=" . str_repeat("=", 70) . "\n\n";
        
        foreach ($sessions as $session) {
            $messages = $wpdb->get_results($wpdb->prepare(
                "SELECT role, content, created_at 
                 FROM $table 
                 WHERE session_id = %s 
                 ORDER BY created_at ASC",
                $session->session_id
            ));
            
            $email_body .= "SESSION: " . $session->session_id . "\n";
            $email_body .= "Last Message: " . $session->last_message . "\n";
            $email_body .= "Total Messages: " . $session->message_count . "\n";
            $email_body .= "-" . str_repeat("-", 70) . "\n\n";
            
            foreach ($messages as $message) {
                $role_label = strtoupper($message->role);
                $email_body .= "[" . $role_label . "] " . $message->created_at . "\n";
                $email_body .= wordwrap($message->content, 70, "\n") . "\n\n";
            }
            
            $email_body .= "\n" . "=" . str_repeat("=", 70) . "\n\n";
        }
        
        // Send email
        $headers = array('Content-Type: text/plain; charset=UTF-8');
        $sent = wp_mail($email, $email_subject, $email_body, $headers);
        
        if ($sent) {
            wp_send_json_success(array('message' => 'Chat logs sent successfully to ' . $email));
        } else {
            wp_send_json_error(array('message' => 'Failed to send email. Please check your WordPress email configuration.'));
        }
    }

    public function email_analytics() {
        check_ajax_referer('strikebot_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        $email = isset($_POST['email']) ? sanitize_email($_POST['email']) : '';
        
        if (empty($email) || !is_email($email)) {
            wp_send_json_error(array('message' => 'Valid email address is required'));
        }

        global $wpdb;
        $chat_table = $wpdb->prefix . 'strikebot_chat_history';
        $usage_table = $wpdb->prefix . 'strikebot_usage';
        
        // Get analytics data
        $daily_messages = $wpdb->get_results("
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM $chat_table 
            WHERE role = 'user' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        
        $monthly_usage = $wpdb->get_results("
            SELECT month, message_count 
            FROM $usage_table 
            ORDER BY month DESC 
            LIMIT 12
        ");
        
        $total_sessions = $wpdb->get_var("SELECT COUNT(DISTINCT session_id) FROM $chat_table");
        $total_messages = $wpdb->get_var("SELECT COUNT(*) FROM $chat_table WHERE role = 'user'");
        $messages_today = $wpdb->get_var("
            SELECT COUNT(*) 
            FROM $chat_table 
            WHERE role = 'user' 
            AND DATE(created_at) = CURDATE()
        ");
        $messages_week = $wpdb->get_var("
            SELECT COUNT(*) 
            FROM $chat_table 
            WHERE role = 'user' 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ");
        $avg_messages = $total_sessions > 0 ? round($total_messages / $total_sessions, 2) : 0;
        
        // Build email content
        $email_subject = 'Strikebot Analytics Report - ' . date('Y-m-d');
        $email_body = "Strikebot Analytics Report\n\n";
        $email_body .= "Generated: " . current_time('mysql') . "\n\n";
        
        $email_body .= "SUMMARY STATISTICS\n";
        $email_body .= "=" . str_repeat("=", 50) . "\n";
        $email_body .= "Total Sessions: " . $total_sessions . "\n";
        $email_body .= "Total Messages: " . $total_messages . "\n";
        $email_body .= "Messages Today: " . $messages_today . "\n";
        $email_body .= "Messages This Week: " . $messages_week . "\n";
        $email_body .= "Average Messages per Session: " . $avg_messages . "\n\n";
        
        $email_body .= "DAILY MESSAGES (Last 30 Days)\n";
        $email_body .= "=" . str_repeat("=", 50) . "\n";
        $email_body .= str_pad("Date", 15) . str_pad("Messages", 15) . "\n";
        $email_body .= "-" . str_repeat("-", 50) . "\n";
        foreach ($daily_messages as $day) {
            $email_body .= str_pad($day->date, 15) . str_pad($day->count, 15) . "\n";
        }
        
        $email_body .= "\nMONTHLY USAGE HISTORY\n";
        $email_body .= "=" . str_repeat("=", 50) . "\n";
        $email_body .= str_pad("Month", 15) . str_pad("Message Count", 20) . "\n";
        $email_body .= "-" . str_repeat("-", 50) . "\n";
        foreach ($monthly_usage as $month) {
            $email_body .= str_pad($month->month, 15) . str_pad($month->message_count, 20) . "\n";
        }
        
        // Send email
        $headers = array('Content-Type: text/plain; charset=UTF-8');
        $sent = wp_mail($email, $email_subject, $email_body, $headers);
        
        if ($sent) {
            wp_send_json_success(array('message' => 'Analytics report sent successfully to ' . $email));
        } else {
            wp_send_json_error(array('message' => 'Failed to send email. Please check your WordPress email configuration.'));
        }
    }

    public function debug_urls() {
        check_ajax_referer('strikebot_admin', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';
        
        // Get all URL entries
        $urls = $wpdb->get_results("SELECT id, name, metadata, created_at FROM $table WHERE type = 'url' ORDER BY created_at DESC");
        
        $url_list = array();
        foreach ($urls as $url_entry) {
            $normalized = $this->normalize_url($url_entry->name);
            $metadata_decoded = null;
            $crawled_url = null;
            
            if (!empty($url_entry->metadata)) {
                $metadata_decoded = json_decode($url_entry->metadata, true);
                if ($metadata_decoded && isset($metadata_decoded['crawled_url'])) {
                    $crawled_url = $metadata_decoded['crawled_url'];
                }
            }
            
            $url_list[] = array(
                'id' => $url_entry->id,
                'name' => $url_entry->name,
                'normalized' => $normalized,
                'crawled_url' => $crawled_url,
                'metadata' => $url_entry->metadata,
                'created_at' => $url_entry->created_at
            );
        }
        
        wp_send_json_success(array(
            'total_urls' => count($url_list),
            'urls' => $url_list
        ));
    }
}

// Initialize plugin
Strikebot::get_instance();
