<?php
/**
 * Plugin Name: Strikebot - {{CHATBOT_NAME}}
 * Plugin URI: https://strikebot.io
 * Description: AI-powered chatbot for your website with Knowledge Base support
 * Version: 1.0.0
 * Author: Strikebot
 * License: GPL v2 or later
 * Text Domain: strikebot
 */

if (!defined('ABSPATH')) {
    exit;
}

define('STRIKEBOT_VERSION', '1.0.0');
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
        add_action('wp_ajax_strikebot_save_knowledge', array($this, 'save_knowledge'));
        add_action('wp_ajax_strikebot_delete_knowledge', array($this, 'delete_knowledge'));
        add_action('wp_ajax_strikebot_get_knowledge', array($this, 'get_knowledge'));
        add_action('wp_ajax_strikebot_crawl_sitemap', array($this, 'crawl_sitemap'));
        add_action('wp_ajax_strikebot_crawl_url', array($this, 'crawl_url'));
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
                'messageCreditsPerMonth' => 50,
                'storageLimitMB' => 0.4,
                'aiActionsPerAgent' => 0,
                'linkTrainingLimit' => 10
            ),
            'features' => $this->config['features'] ?? array(
                'integrations' => false,
                'apiAccess' => false,
                'analytics' => 'none',
                'autoRetrain' => false,
                'modelAccess' => 'limited'
            )
        );

        add_option('strikebot_settings', $defaults);
        add_option('strikebot_api_key', $this->config['apiKey'] ?? '');
        add_option('strikebot_api_endpoint', $this->config['apiEndpoint'] ?? 'https://api.openai.com/v1');
        add_option('strikebot_model', $this->config['model'] ?? 'gpt-3.5-turbo');
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
        $limit = $settings['limits']['messageCreditsPerMonth'] ?? 50;

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

        $items = $wpdb->get_results("SELECT * FROM $table ORDER BY created_at DESC LIMIT 50");

        // Limit context to ~15000 tokens to avoid exceeding API limits
        // Approximate: 1 token ≈ 4 characters
        $max_chars = 60000; // ~15000 tokens
        $context = "";
        
        foreach ($items as $item) {
            $item_content = "\n---\n" . $item->content;
            $new_length = strlen($context) + strlen($item_content);
            
            if ($new_length > $max_chars) {
                // Add partial content if there's room
                $remaining = $max_chars - strlen($context);
                if ($remaining > 100) { // Only add if there's meaningful space
                    $context .= substr($item_content, 0, $remaining);
                }
                break;
            }
            
            $context .= $item_content;
        }

        return $context;
    }

    private function build_system_prompt($context) {
        $settings = get_option('strikebot_settings');
        $name = $settings['name'] ?? 'Assistant';

        $prompt = "You are $name, a helpful AI assistant. ";
        $prompt .= "Answer questions based on the following knowledge base:\n";
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

        update_option('strikebot_settings', $settings);

        wp_send_json_success(array('message' => 'Settings saved'));
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

        $current_size = $wpdb->get_var("SELECT SUM(LENGTH(content)) FROM $table");
        $new_content = sanitize_textarea_field($_POST['content'] ?? '');

        if (($current_size + strlen($new_content)) > $limit_bytes) {
            wp_send_json_error(array('message' => 'Storage limit exceeded'));
        }

        // Check link limit for URL types
        $type = sanitize_text_field($_POST['type'] ?? '');
        if (in_array($type, array('url', 'sitemap'))) {
            $link_limit = $settings['limits']['linkTrainingLimit'];
            if ($link_limit !== null) {
                $link_count = $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM $table WHERE type IN ('url', 'sitemap')"
                ));
                if ($link_count >= $link_limit) {
                    wp_send_json_error(array('message' => 'Link training limit reached'));
                }
            }
        }

        $wpdb->insert($table, array(
            'type' => $type,
            'name' => sanitize_text_field($_POST['name'] ?? ''),
            'content' => $new_content,
            'metadata' => sanitize_text_field($_POST['metadata'] ?? '')
        ));

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
        check_ajax_referer('strikebot_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'));
        }

        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';
        $id = intval($_POST['id'] ?? 0);

        $item = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table WHERE id = %d",
            $id
        ));

        if (!$item) {
            wp_send_json_error(array('message' => 'Item not found'));
        }

        wp_send_json_success(array(
            'name' => $item->name,
            'content' => $item->content,
            'type' => $item->type
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

        $response = wp_remote_get($url);
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => $response->get_error_message()));
        }

        $body = wp_remote_retrieve_body($response);

        // Extract text content
        $content = $this->extract_text_from_html($body);

        wp_send_json_success(array('content' => $content));
    }

    private function extract_text_from_html($html) {
        // Remove script and style elements
        $html = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $html);
        $html = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $html);

        // Convert to text
        $text = strip_tags($html);

        // Clean up whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);

        return $text;
    }
}

// Initialize plugin
Strikebot::get_instance();
