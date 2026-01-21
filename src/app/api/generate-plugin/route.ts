import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

interface ChatbotConfig {
  id: string;
  name: string;
  tier: string;
  model: string;
  apiKey: string;
  apiEndpoint: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    mode: 'light' | 'dark';
  };
  widget: {
    position: string;
    welcomeMessage: string;
    placeholder: string;
    iconUrl: string;
  };
  limits: {
    messageCreditsPerMonth: number;
    storageLimitMB: number;
    linkTrainingLimit: number | null;
  };
  features: {
    apiAccess: boolean;
    analytics: string;
    autoRetrain: boolean;
    modelAccess: string;
  };
  createdAt: string;
}

// Plugin template files as strings (since we're in a serverless environment)
const pluginTemplates = {
  'strikebot.php': `<?php
/**
 * Plugin Name: Strikebot - {{CHATBOT_NAME}}
 * Plugin URI: https://strikebot.io
 * Description: AI-powered chatbot for your website with Knowledge Base support
 * Version: 1.3.0
 * Author: Strikebot
 * License: GPL v2 or later
 * Text Domain: strikebot
 */

if (!defined('ABSPATH')) {
    exit;
}

define('STRIKEBOT_VERSION', '1.3.0');
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
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        add_action('init', array($this, 'load_textdomain'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'admin_scripts'));
        add_action('wp_enqueue_scripts', array($this, 'frontend_scripts'));
        add_action('wp_footer', array($this, 'render_widget'));

        add_action('wp_ajax_strikebot_chat', array($this, 'handle_chat'));
        add_action('wp_ajax_nopriv_strikebot_chat', array($this, 'handle_chat'));
        add_action('wp_ajax_strikebot_save_settings', array($this, 'save_settings'));
        add_action('wp_ajax_strikebot_save_admin_theme', array($this, 'save_admin_theme'));
        add_action('wp_ajax_strikebot_save_knowledge', array($this, 'save_knowledge'));
        add_action('wp_ajax_strikebot_delete_knowledge', array($this, 'delete_knowledge'));
        add_action('wp_ajax_strikebot_get_knowledge', array($this, 'get_knowledge'));
        add_action('wp_ajax_strikebot_crawl_sitemap', array($this, 'crawl_sitemap'));
        add_action('wp_ajax_strikebot_crawl_url', array($this, 'crawl_url'));
        add_action('wp_ajax_strikebot_debug_context', array($this, 'debug_context'));
        add_action('wp_ajax_strikebot_clear_history', array($this, 'clear_history'));
        add_action('wp_ajax_strikebot_reset_knowledge', array($this, 'reset_knowledge'));
    }

    public function activate() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

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

        $defaults = array(
            'name' => $this->config['name'] ?? 'Chatbot',
            'theme' => $this->config['theme'] ?? array(),
            'widget' => $this->config['widget'] ?? array(),
            'limits' => $this->config['limits'] ?? array(),
            'features' => $this->config['features'] ?? array(),
            'tier' => $this->config['tier'] ?? 'starter',
            'billingPeriod' => $this->config['billingPeriod'] ?? 'monthly',
            'addOns' => $this->config['addOns'] ?? array(),
            'instructions' => ''
        );

        add_option('strikebot_settings', $defaults);
        add_option('strikebot_api_key', $this->config['apiKey'] ?? '');
        add_option('strikebot_api_endpoint', $this->config['apiEndpoint'] ?? 'https://api.openai.com/v1');
        add_option('strikebot_model', $this->config['model'] ?? 'gpt-4.1-nano');
    }

    public function deactivate() {
        wp_clear_scheduled_hook('strikebot_auto_retrain');
    }

    public function load_textdomain() {
        load_plugin_textdomain('strikebot', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    public function add_admin_menu() {
        add_menu_page(__('Strikebot', 'strikebot'), __('Strikebot', 'strikebot'), 'manage_options', 'strikebot', array($this, 'render_admin_page'), 'dashicons-format-chat', 30);
        add_submenu_page('strikebot', __('Dashboard', 'strikebot'), __('Dashboard', 'strikebot'), 'manage_options', 'strikebot', array($this, 'render_admin_page'));
        add_submenu_page('strikebot', __('Knowledge Base', 'strikebot'), __('Knowledge Base', 'strikebot'), 'manage_options', 'strikebot-knowledge', array($this, 'render_knowledge_page'));
        add_submenu_page('strikebot', __('Appearance', 'strikebot'), __('Appearance', 'strikebot'), 'manage_options', 'strikebot-appearance', array($this, 'render_appearance_page'));
        add_submenu_page('strikebot', __('Settings', 'strikebot'), __('Settings', 'strikebot'), 'manage_options', 'strikebot-settings', array($this, 'render_settings_page'));
    }

    public function admin_scripts($hook) {
        if (strpos($hook, 'strikebot') === false) return;
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

    public function render_admin_page() { include STRIKEBOT_PLUGIN_DIR . 'templates/admin/dashboard.php'; }
    public function render_knowledge_page() { include STRIKEBOT_PLUGIN_DIR . 'templates/admin/knowledge.php'; }
    public function render_appearance_page() { include STRIKEBOT_PLUGIN_DIR . 'templates/admin/appearance.php'; }
    public function render_settings_page() { include STRIKEBOT_PLUGIN_DIR . 'templates/admin/settings.php'; }
    public function render_widget() { include STRIKEBOT_PLUGIN_DIR . 'templates/widget.php'; }

    public function handle_chat() {
        check_ajax_referer('strikebot_chat', 'nonce');
        $message = sanitize_text_field($_POST['message'] ?? '');
        $session_id = sanitize_text_field($_POST['session_id'] ?? '');
        if (empty($message)) { wp_send_json_error(array('message' => 'Message is required')); }
        if (!$this->check_usage_limits()) { wp_send_json_error(array('message' => 'Monthly message limit reached')); }
        $context = $this->get_knowledge_context($message);
        $messages = array(array('role' => 'system', 'content' => $this->build_system_prompt($context)));
        $history = $this->get_chat_history($session_id);
        foreach ($history as $entry) { $messages[] = array('role' => $entry->role, 'content' => $entry->content); }
        $messages[] = array('role' => 'user', 'content' => $message);
        $response = $this->call_api($messages);
        if (is_wp_error($response)) { wp_send_json_error(array('message' => $response->get_error_message())); }
        $this->save_chat_message($session_id, 'user', $message);
        $this->save_chat_message($session_id, 'assistant', $response);
        $this->increment_usage();
        wp_send_json_success(array('response' => $response));
    }

    private function check_usage_limits() {
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_usage';
        $month = date('Y-m');
        $usage = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE month = %s", $month));
        $settings = get_option('strikebot_settings');
        $limit = $settings['limits']['messageCreditsPerMonth'] ?? 50;
        $addOns = $settings['addOns'] ?? array();
        foreach ($addOns as $addOn) {
            if (is_array($addOn) && $addOn['type'] === 'extra_messages' && isset($addOn['value'])) {
                $limit += $addOn['value'];
            }
        }
        return !$usage || $usage->message_count < $limit;
    }

    private function increment_usage() {
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_usage';
        $month = date('Y-m');
        $wpdb->query($wpdb->prepare("INSERT INTO $table (month, message_count) VALUES (%s, 1) ON DUPLICATE KEY UPDATE message_count = message_count + 1", $month));
    }

    private function get_knowledge_context($query) {
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';
        $items = $wpdb->get_results("SELECT * FROM $table ORDER BY CASE type WHEN 'qa' THEN 1 WHEN 'text' THEN 2 WHEN 'file' THEN 3 WHEN 'url' THEN 4 ELSE 5 END, created_at DESC");
        
        $max_chars = 100000;
        $context = "";
        $items_included = 0;
        
        foreach ($items as $item) {
            if (empty($item->content)) { continue; }
            
            $type_label = '';
            switch ($item->type) {
                case 'qa': $type_label = '[Q&A]'; break;
                case 'url': $type_label = '[From webpage: ' . $item->name . ']'; break;
                case 'file': $type_label = '[From document: ' . $item->name . ']'; break;
                case 'text': $type_label = '[Information: ' . $item->name . ']'; break;
                default: $type_label = '[' . ucfirst($item->type) . ': ' . $item->name . ']';
            }
            
            $content_to_add = $item->content;
            
            $max_per_item = 5000;
            if ($item->type === 'url') { $max_per_item = 3000; }
            elseif ($item->type === 'file') { $max_per_item = 20000; }
            
            if (strlen($content_to_add) > $max_per_item) {
                $content_to_add = substr($content_to_add, 0, $max_per_item) . "\\n[Content truncated - " . strlen($item->content) . " bytes total...]";
            }
            
            $item_content = "\\n\\n---\\n" . $type_label . "\\n" . $content_to_add;
            $new_length = strlen($context) + strlen($item_content);
            
            if ($new_length > $max_chars) {
                $remaining = $max_chars - strlen($context);
                if ($remaining > 200) {
                    $context .= substr($item_content, 0, $remaining) . "\\n[Truncated...]";
                    $items_included++;
                }
                break;
            }
            
            $context .= $item_content;
            $items_included++;
        }
        
        error_log('Strikebot: Built context with ' . $items_included . ' items, ' . strlen($context) . ' characters');
        return $context;
    }

    private function build_system_prompt($context) {
        $settings = get_option('strikebot_settings');
        $name = $settings['name'] ?? 'Assistant';
        $instructions = $settings['instructions'] ?? '';
        $prompt = "You are $name, a helpful AI assistant.";
        if (!empty($instructions)) {
            $prompt .= "\\n\\n" . $instructions;
        }
        $prompt .= "\\n\\nAnswer questions based on the following knowledge base:\\n" . $context . "\\n\\nIf you don't know the answer based on the knowledge base, say so politely.";
        return $prompt;
    }

    private function get_chat_history($session_id) {
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_chat_history';
        return $wpdb->get_results($wpdb->prepare("SELECT role, content FROM $table WHERE session_id = %s ORDER BY created_at ASC LIMIT 20", $session_id));
    }

    private function save_chat_message($session_id, $role, $content) {
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_chat_history';
        $wpdb->insert($table, array('session_id' => $session_id, 'role' => $role, 'content' => $content));
    }

    private function call_api($messages) {
        $api_key = get_option('strikebot_api_key');
        $api_endpoint = get_option('strikebot_api_endpoint');
        $model = get_option('strikebot_model');
        if (empty($api_key)) { return new WP_Error('no_api_key', 'API key not configured'); }
        $response = wp_remote_post($api_endpoint . '/chat/completions', array(
            'timeout' => 60,
            'headers' => array('Authorization' => 'Bearer ' . $api_key, 'Content-Type' => 'application/json'),
            'body' => json_encode(array('model' => $model, 'messages' => $messages, 'max_tokens' => 1000, 'temperature' => 0.7))
        ));
        if (is_wp_error($response)) { return $response; }
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (isset($body['error'])) { return new WP_Error('api_error', $body['error']['message'] ?? 'API error'); }
        return $body['choices'][0]['message']['content'] ?? '';
    }

    public function save_settings() {
        check_ajax_referer('strikebot_admin', 'nonce');
        if (!current_user_can('manage_options')) { wp_send_json_error(array('message' => 'Unauthorized')); }
        $settings = get_option('strikebot_settings');
        if (isset($_POST['name'])) { $settings['name'] = sanitize_text_field($_POST['name']); }
        if (isset($_POST['instructions'])) { $settings['instructions'] = sanitize_textarea_field($_POST['instructions']); }
        if (isset($_POST['removeBranding'])) { $settings['removeBranding'] = $_POST['removeBranding'] === 'true' || $_POST['removeBranding'] === '1'; }
        if (isset($_POST['theme'])) { $settings['theme'] = array_map('sanitize_text_field', $_POST['theme']); }
        if (isset($_POST['widget'])) { $settings['widget'] = array_map('sanitize_text_field', $_POST['widget']); }
        if (isset($_POST['api_key'])) { update_option('strikebot_api_key', sanitize_text_field($_POST['api_key'])); }
        update_option('strikebot_settings', $settings);
        wp_send_json_success(array('message' => 'Settings saved'));
    }

    public function save_admin_theme() {
        check_ajax_referer('strikebot_admin', 'nonce');
        if (!current_user_can('manage_options')) { wp_send_json_error(array('message' => 'Unauthorized')); }
        $theme = sanitize_text_field($_POST['theme'] ?? 'light');
        if (!in_array($theme, array('light', 'dark'))) { $theme = 'light'; }
        update_option('strikebot_admin_theme', $theme);
        wp_send_json_success(array('message' => 'Theme saved', 'theme' => $theme));
    }

    public function save_knowledge() {
        check_ajax_referer('strikebot_admin', 'nonce');
        if (!current_user_can('manage_options')) { wp_send_json_error(array('message' => 'Unauthorized')); }
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';
        $settings = get_option('strikebot_settings');
        $limit_mb = $settings['limits']['storageLimitMB'] ?? 0.4;
        $limit_bytes = $limit_mb * 1024 * 1024;
        $current_size = $wpdb->get_var("SELECT SUM(LENGTH(content)) FROM $table") ?: 0;
        $new_content = isset($_POST['content']) ? $_POST['content'] : '';
        $original_length = strlen($new_content);
        $new_content = str_replace(chr(0), '', $new_content);
        $new_content = str_replace("\\r\\n", "\\n", $new_content);
        $new_content = str_replace("\\r", "\\n", $new_content);
        $new_size = strlen($new_content);
        if ($new_size === 0 && $original_length > 0) {
            wp_send_json_error(array('message' => 'Content was lost during processing. Original size: ' . $original_length));
        }
        if (($current_size + $new_size) > $limit_bytes) {
            $current_mb = round($current_size / 1024 / 1024, 2);
            $limit_mb_display = round($limit_bytes / 1024 / 1024, 2);
            wp_send_json_error(array('message' => 'Storage limit exceeded. Current: ' . $current_mb . ' MB, Limit: ' . $limit_mb_display . ' MB, New content: ' . round($new_size / 1024, 2) . ' KB'));
        }
        $type = sanitize_text_field($_POST['type'] ?? '');
        $metadata_raw = isset($_POST['metadata']) ? $_POST['metadata'] : '';
        $is_from_sitemap = false;
        if (!empty($metadata_raw)) {
            if (strpos($metadata_raw, 'from_sitemap') !== false || strpos($metadata_raw, 'sitemap') !== false) {
                $is_from_sitemap = true;
            }
        }
        if ($type === 'url' && !$is_from_sitemap) {
            $link_limit = $settings['limits']['linkTrainingLimit'];
            if ($link_limit !== null) {
                $link_count = $wpdb->get_var("SELECT COUNT(*) FROM $table WHERE type = 'url' AND (metadata IS NULL OR (metadata NOT LIKE '%sitemap%' AND metadata NOT LIKE '%from_sitemap%'))");
                if ($link_count >= $link_limit) { wp_send_json_error(array('message' => 'Link training limit reached. Sitemap crawls bypass this limit.')); }
            }
        }
        $metadata_to_store = isset($_POST['metadata']) ? $_POST['metadata'] : '';
        if (!empty($metadata_to_store) && !(substr($metadata_to_store, 0, 1) === '{' && substr($metadata_to_store, -1) === '}')) {
            $metadata_to_store = sanitize_text_field($metadata_to_store);
        }
        $insert_result = $wpdb->insert($table, array('type' => $type, 'name' => sanitize_text_field($_POST['name'] ?? ''), 'content' => $new_content, 'metadata' => $metadata_to_store, 'created_at' => current_time('mysql')));
        if ($insert_result === false) { wp_send_json_error(array('message' => 'Failed to save knowledge: ' . $wpdb->last_error)); }
        wp_send_json_success(array('message' => 'Knowledge added', 'id' => $wpdb->insert_id));
    }

    public function delete_knowledge() {
        check_ajax_referer('strikebot_admin', 'nonce');
        if (!current_user_can('manage_options')) { wp_send_json_error(array('message' => 'Unauthorized')); }
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';
        $wpdb->delete($table, array('id' => intval($_POST['id'] ?? 0)));
        wp_send_json_success(array('message' => 'Knowledge deleted'));
    }

    public function get_knowledge() {
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'strikebot_admin')) {
            wp_send_json_error(array('message' => 'Security check failed. Please refresh the page.'));
            return;
        }
        if (!current_user_can('manage_options')) { wp_send_json_error(array('message' => 'Unauthorized')); return; }
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';
        $id = intval($_POST['id'] ?? 0);
        if ($id <= 0) { wp_send_json_error(array('message' => 'Invalid ID provided')); return; }
        $item = $wpdb->get_row($wpdb->prepare("SELECT id, name, content, type, metadata, created_at FROM $table WHERE id = %d", $id));
        if (!$item) {
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'") === $table;
            wp_send_json_error(array('message' => 'Item not found with ID: ' . $id, 'debug' => array('table' => $table, 'table_exists' => $table_exists)));
            return;
        }
        $content = isset($item->content) ? $item->content : '';
        $content_length = strlen($content);
        if (empty($content)) { $content = '[No content stored for this item]'; }
        wp_send_json_success(array('name' => $item->name, 'content' => $content, 'type' => $item->type, 'id' => $item->id, 'debug' => array('content_length' => $content_length, 'has_content' => $content_length > 0)));
    }

    public function crawl_sitemap() {
        check_ajax_referer('strikebot_admin', 'nonce');
        if (!current_user_can('manage_options')) { wp_send_json_error(array('message' => 'Unauthorized')); }
        $url = esc_url_raw($_POST['url'] ?? '');
        if (empty($url)) { wp_send_json_error(array('message' => 'URL is required')); }
        $response = wp_remote_get($url);
        if (is_wp_error($response)) { wp_send_json_error(array('message' => $response->get_error_message())); }
        $body = wp_remote_retrieve_body($response);
        $xml = simplexml_load_string($body);
        if (!$xml) { wp_send_json_error(array('message' => 'Invalid sitemap XML')); }
        $urls = array();
        foreach ($xml->url as $url_entry) { $urls[] = (string) $url_entry->loc; }
        wp_send_json_success(array('urls' => $urls));
    }

    public function crawl_url() {
        check_ajax_referer('strikebot_admin', 'nonce');
        if (!current_user_can('manage_options')) { wp_send_json_error(array('message' => 'Unauthorized')); }
        $url = esc_url_raw($_POST['url'] ?? '');
        if (empty($url)) { wp_send_json_error(array('message' => 'URL is required')); }
        $response = wp_remote_get($url, array('timeout' => 30, 'user-agent' => 'Mozilla/5.0 (compatible; Strikebot/1.0)'));
        if (is_wp_error($response)) { wp_send_json_error(array('message' => 'Failed to fetch URL: ' . $response->get_error_message())); }
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code !== 200) { wp_send_json_error(array('message' => 'URL returned status code: ' . $status_code)); }
        $body = wp_remote_retrieve_body($response);
        if (empty($body)) { wp_send_json_error(array('message' => 'No content received from URL')); }
        $content = $this->extract_text_from_html($body);
        if (empty($content)) { wp_send_json_error(array('message' => 'No text content could be extracted from page')); }
        wp_send_json_success(array('content' => $content, 'content_length' => strlen($content), 'url' => $url));
    }

    private function extract_text_from_html($html) {
        $html = preg_replace('/<script[^>]*>.*?<\\/script>/is', '', $html);
        $html = preg_replace('/<style[^>]*>.*?<\\/style>/is', '', $html);
        $html = preg_replace('/<noscript[^>]*>.*?<\\/noscript>/is', '', $html);
        $html = preg_replace('/<nav[^>]*>.*?<\\/nav>/is', '', $html);
        $main_content = '';
        if (preg_match('/<main[^>]*>(.*?)<\\/main>/is', $html, $matches)) { $main_content = $matches[1]; }
        elseif (preg_match('/<article[^>]*>(.*?)<\\/article>/is', $html, $matches)) { $main_content = $matches[1]; }
        $text_html = !empty($main_content) ? $main_content : $html;
        $text = strip_tags($text_html);
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        $text = preg_replace('/[ \\t]+/', ' ', $text);
        $text = preg_replace('/\\n\\s*\\n\\s*\\n+/', "\\n\\n", $text);
        return trim($text);
    }

    public function debug_context() {
        check_ajax_referer('strikebot_admin', 'nonce');
        if (!current_user_can('manage_options')) { wp_send_json_error(array('message' => 'Unauthorized')); }
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';
        $items = $wpdb->get_results("SELECT id, name, type, LENGTH(content) as content_length, LEFT(content, 500) as content_preview FROM $table ORDER BY created_at DESC");
        $context = $this->get_knowledge_context('test query');
        wp_send_json_success(array('items_count' => count($items), 'items' => $items, 'context_length' => strlen($context), 'context_preview' => substr($context, 0, 2000), 'full_context' => $context));
    }

    public function clear_history() {
        check_ajax_referer('strikebot_admin', 'nonce');
        if (!current_user_can('manage_options')) { wp_send_json_error(array('message' => 'Unauthorized')); }
        global $wpdb;
        $wpdb->query("TRUNCATE TABLE " . $wpdb->prefix . "strikebot_chat_history");
        wp_send_json_success(array('message' => 'Chat history cleared'));
    }

    public function reset_knowledge() {
        check_ajax_referer('strikebot_admin', 'nonce');
        if (!current_user_can('manage_options')) { wp_send_json_error(array('message' => 'Unauthorized')); }
        global $wpdb;
        $wpdb->query("TRUNCATE TABLE " . $wpdb->prefix . "strikebot_knowledge");
        wp_send_json_success(array('message' => 'Knowledge base reset'));
    }
}

Strikebot::get_instance();`,

  'uninstall.php': `<?php
if (!defined('WP_UNINSTALL_PLUGIN')) { exit; }
global $wpdb;
$tables = array($wpdb->prefix . 'strikebot_knowledge', $wpdb->prefix . 'strikebot_chat_history', $wpdb->prefix . 'strikebot_usage');
foreach ($tables as $table) { $wpdb->query("DROP TABLE IF EXISTS $table"); }
$options = array('strikebot_settings', 'strikebot_api_key', 'strikebot_api_endpoint', 'strikebot_model');
foreach ($options as $option) { delete_option($option); }
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%_transient_strikebot_%'");
$wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%_transient_timeout_strikebot_%'");
wp_clear_scheduled_hook('strikebot_auto_retrain');
wp_clear_scheduled_hook('strikebot_cleanup');
$upload_dir = wp_upload_dir();
$strikebot_dir = $upload_dir['basedir'] . '/strikebot';
if (is_dir($strikebot_dir)) {
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($strikebot_dir, RecursiveDirectoryIterator::SKIP_DOTS), RecursiveIteratorIterator::CHILD_FIRST);
    foreach ($files as $fileinfo) { $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink'); $todo($fileinfo->getRealPath()); }
    rmdir($strikebot_dir);
}
wp_cache_flush();`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const config: ChatbotConfig = body.config;

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration is required' },
        { status: 400 }
      );
    }

    // Create the plugin files
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk) => chunks.push(chunk));

    // Sanitize config for embedding in PHP
    const sanitizedConfig = {
      ...config,
      apiKey: config.apiKey, // Will be encrypted in production
    };

    const configJson = JSON.stringify(sanitizedConfig).replace(/'/g, "\\'");

    // Add main plugin file
    const mainPluginContent = pluginTemplates['strikebot.php']
      .replace('{{CHATBOT_NAME}}', config.name)
      .replace('{{CONFIG_JSON}}', configJson);

    archive.append(mainPluginContent, { name: 'strikebot/strikebot.php' });

    // Add uninstall file
    archive.append(pluginTemplates['uninstall.php'], { name: 'strikebot/uninstall.php' });

    // Read and add template files from the file system
    const templateDir = path.join(process.cwd(), 'src/lib/plugin-template');

    // Add admin templates
    const adminTemplates = ['dashboard.php', 'knowledge.php', 'appearance.php', 'settings.php'];
    for (const template of adminTemplates) {
      try {
        const content = fs.readFileSync(
          path.join(templateDir, 'templates/admin', template),
          'utf-8'
        );
        archive.append(content, { name: `strikebot/templates/admin/${template}` });
      } catch {
        // If file doesn't exist, create a placeholder
        archive.append(`<?php if (!defined('ABSPATH')) exit; ?>`, {
          name: `strikebot/templates/admin/${template}`,
        });
      }
    }

    // Add widget template
    try {
      const widgetContent = fs.readFileSync(
        path.join(templateDir, 'templates/widget.php'),
        'utf-8'
      );
      archive.append(widgetContent, { name: 'strikebot/templates/widget.php' });
    } catch {
      // Inline widget template
      const widgetTemplate = generateWidgetTemplate(config);
      archive.append(widgetTemplate, { name: 'strikebot/templates/widget.php' });
    }

    // Add CSS files
    try {
      const adminCss = fs.readFileSync(
        path.join(templateDir, 'assets/css/admin.css'),
        'utf-8'
      );
      archive.append(adminCss, { name: 'strikebot/assets/css/admin.css' });
    } catch {
      archive.append(generateAdminCss(), { name: 'strikebot/assets/css/admin.css' });
    }

    try {
      const widgetCss = fs.readFileSync(
        path.join(templateDir, 'assets/css/widget.css'),
        'utf-8'
      );
      archive.append(widgetCss, { name: 'strikebot/assets/css/widget.css' });
    } catch {
      archive.append(generateWidgetCss(), { name: 'strikebot/assets/css/widget.css' });
    }

    // Add JS files
    try {
      const adminJs = fs.readFileSync(
        path.join(templateDir, 'assets/js/admin.js'),
        'utf-8'
      );
      archive.append(adminJs, { name: 'strikebot/assets/js/admin.js' });
    } catch {
      archive.append(generateAdminJs(), { name: 'strikebot/assets/js/admin.js' });
    }

    try {
      const widgetJs = fs.readFileSync(
        path.join(templateDir, 'assets/js/widget.js'),
        'utf-8'
      );
      archive.append(widgetJs, { name: 'strikebot/assets/js/widget.js' });
    } catch {
      archive.append(generateWidgetJs(), { name: 'strikebot/assets/js/widget.js' });
    }

    // Add readme
    archive.append(generateReadme(config), { name: 'strikebot/readme.txt' });

    await archive.finalize();

    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="strikebot-${config.name.toLowerCase().replace(/\s+/g, '-')}.zip"`,
      },
    });
  } catch (error) {
    console.error('Error generating plugin:', error);
    return NextResponse.json(
      { error: 'Failed to generate plugin' },
      { status: 500 }
    );
  }
}

function generateWidgetTemplate(config: ChatbotConfig): string {
  return `<?php
if (!defined('ABSPATH')) exit;
$settings = get_option('strikebot_settings');
$theme = $settings['theme'] ?? array();
$widget = $settings['widget'] ?? array();
$name = $settings['name'] ?? 'Chatbot';
$position = $widget['position'] ?? 'bottom-right';
$mode = $theme['mode'] ?? 'light';
$primaryColor = $theme['primaryColor'] ?? '#3B82F6';
$secondaryColor = $theme['secondaryColor'] ?? '#1E40AF';
$backgroundColor = $mode === 'dark' ? '#1F2937' : '#FFFFFF';
$textColor = $mode === 'dark' ? '#F9FAFB' : '#1F2937';
$iconUrl = $widget['iconUrl'] ?? '';
$welcomeMessage = $widget['welcomeMessage'] ?? 'Hello! How can I help you today?';
$placeholder = $widget['placeholder'] ?? 'Type your message...';
?>
<div id="strikebot-widget" class="strikebot-widget strikebot-<?php echo esc_attr($position); ?> strikebot-<?php echo esc_attr($mode); ?>" style="--sb-primary: <?php echo esc_attr($primaryColor); ?>; --sb-secondary: <?php echo esc_attr($secondaryColor); ?>; --sb-bg: <?php echo esc_attr($backgroundColor); ?>; --sb-text: <?php echo esc_attr($textColor); ?>;">
    <div id="strikebot-chat" class="strikebot-chat hidden">
        <div class="strikebot-chat-header">
            <div class="strikebot-chat-avatar"><?php if ($iconUrl): ?><img src="<?php echo esc_url($iconUrl); ?>" alt=""><?php else: ?><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg><?php endif; ?></div>
            <div class="strikebot-chat-info"><span class="strikebot-chat-name"><?php echo esc_html($name); ?></span><span class="strikebot-chat-status">Online</span></div>
            <button class="strikebot-chat-close"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
        </div>
        <div class="strikebot-chat-messages" id="strikebot-messages">
            <div class="strikebot-message strikebot-message-bot"><div class="strikebot-message-avatar"><?php if ($iconUrl): ?><img src="<?php echo esc_url($iconUrl); ?>" alt=""><?php else: ?><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg><?php endif; ?></div><div class="strikebot-message-content"><?php echo esc_html($welcomeMessage); ?></div></div>
        </div>
        <div class="strikebot-chat-input"><input type="text" id="strikebot-input" placeholder="<?php echo esc_attr($placeholder); ?>" autocomplete="off" style="<?php echo $mode === 'dark' ? 'color: #ffffff !important;' : ''; ?>"><button id="strikebot-send"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div>
        <div class="strikebot-powered-by">Powered by Strikebot</div>
    </div>
    <button id="strikebot-toggle" class="strikebot-toggle"><span class="strikebot-toggle-icon strikebot-toggle-open"><?php if ($iconUrl): ?><img src="<?php echo esc_url($iconUrl); ?>" alt=""><?php else: ?><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg><?php endif; ?></span><span class="strikebot-toggle-icon strikebot-toggle-close hidden"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></span></button>
</div>`;
}

function generateAdminCss(): string {
  return `.strikebot-admin{max-width:1400px;margin:20px auto;padding-right:20px}.strikebot-card{background:#fff;border:1px solid #ddd;border-radius:8px;padding:20px;margin-bottom:20px}.strikebot-card h2{margin-top:0;margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid #eee;font-size:16px}.strikebot-dashboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:30px}.strikebot-stat{text-align:center}.strikebot-stat-value{font-size:36px;font-weight:600;color:#1e3a8a}.strikebot-stat-label{color:#666;margin-bottom:10px}.strikebot-progress{background:#e5e7eb;border-radius:10px;height:10px;overflow:hidden;margin-top:10px}.strikebot-progress-bar{background:linear-gradient(90deg,#3b82f6,#1e40af);height:100%;border-radius:10px}.strikebot-form-group{margin-bottom:20px}.strikebot-form-group label{display:block;margin-bottom:6px;font-weight:500;color:#374151}.strikebot-form-group input,.strikebot-form-group textarea,.strikebot-form-group select{width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:14px}.strikebot-tabs{display:flex;gap:5px;margin-bottom:20px;border-bottom:1px solid #e5e7eb;padding-bottom:10px}.strikebot-tab{padding:8px 16px;background:none;border:none;border-radius:6px;cursor:pointer;font-size:13px;color:#666}.strikebot-tab.active{background:#3b82f6;color:#fff}.strikebot-tab-content{display:none}.strikebot-tab-content.active{display:block}.hidden{display:none!important}`;
}

function generateWidgetCss(): string {
  return `.strikebot-widget{--sb-primary:#3b82f6;--sb-secondary:#1e40af;--sb-bg:#fff;--sb-text:#1f2937;position:fixed;bottom:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}.strikebot-bottom-right{right:20px}.strikebot-bottom-left{left:20px}.strikebot-toggle{width:60px;height:60px;border-radius:50%;background:var(--sb-primary);border:none;cursor:pointer;box-shadow:0 10px 40px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;transition:transform .3s ease}.strikebot-toggle:hover{transform:scale(1.1)}.strikebot-toggle-icon{width:28px;height:28px;color:#fff;display:flex;align-items:center;justify-content:center}.strikebot-toggle-icon img{width:100%;height:100%;object-fit:cover;border-radius:50%}.strikebot-toggle-icon svg{width:100%;height:100%}.strikebot-toggle-icon.hidden{display:none}.strikebot-chat{position:absolute;bottom:80px;width:380px;max-width:calc(100vw - 40px);background:var(--sb-bg);border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.15);display:flex;flex-direction:column;overflow:hidden;transition:opacity .3s ease,transform .3s ease}.strikebot-bottom-right .strikebot-chat{right:0}.strikebot-bottom-left .strikebot-chat{left:0}.strikebot-chat.hidden{opacity:0;transform:translateY(20px) scale(.95);pointer-events:none}.strikebot-chat-header{background:var(--sb-primary);color:#fff;padding:16px;display:flex;align-items:center;gap:12px}.strikebot-chat-avatar{width:44px;height:44px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden}.strikebot-chat-avatar img{width:100%;height:100%;object-fit:cover}.strikebot-chat-avatar svg{width:24px;height:24px}.strikebot-chat-info{flex:1}.strikebot-chat-name{display:block;font-weight:600;font-size:16px}.strikebot-chat-status{font-size:13px;opacity:.8;display:flex;align-items:center;gap:5px}.strikebot-chat-status::before{content:'';width:8px;height:8px;background:#4ade80;border-radius:50%}.strikebot-chat-close{width:32px;height:32px;background:rgba(255,255,255,.1);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}.strikebot-chat-close:hover{background:rgba(255,255,255,.2)}.strikebot-chat-close svg{width:20px;height:20px;color:#fff}.strikebot-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;min-height:300px;max-height:400px}.strikebot-message{display:flex;gap:10px;max-width:85%;animation:messageIn .3s ease}@keyframes messageIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.strikebot-message-bot{align-self:flex-start}.strikebot-message-user{align-self:flex-end;flex-direction:row-reverse}.strikebot-message-avatar{width:32px;height:32px;border-radius:50%;background:var(--sb-primary);flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden}.strikebot-message-avatar img{width:100%;height:100%;object-fit:cover}.strikebot-message-avatar svg{width:16px;height:16px;color:#fff}.strikebot-message-user .strikebot-message-avatar{display:none}.strikebot-message-content{padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.5;color:var(--sb-text)}.strikebot-message-bot .strikebot-message-content{background:#f3f4f6;border-bottom-left-radius:4px}.strikebot-dark .strikebot-message-bot .strikebot-message-content{background:#374151}.strikebot-message-user .strikebot-message-content{background:var(--sb-primary);color:#fff;border-bottom-right-radius:4px}.strikebot-typing{display:flex;gap:4px;padding:12px 16px}.strikebot-typing span{width:8px;height:8px;background:#9ca3af;border-radius:50%;animation:typing 1.4s infinite}.strikebot-typing span:nth-child(2){animation-delay:.2s}.strikebot-typing span:nth-child(3){animation-delay:.4s}@keyframes typing{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}.strikebot-chat-input{padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:10px;background:var(--sb-bg)}.strikebot-dark .strikebot-chat-input{border-top-color:#374151}.strikebot-chat-input input{flex:1;padding:12px 16px;border:1px solid #e5e7eb;border-radius:24px;font-size:14px;outline:none;background:#f9fafb;color:var(--sb-text)}.strikebot-dark .strikebot-chat-input input{background:#374151;border-color:#4b5563}.strikebot-chat-input input:focus{border-color:var(--sb-primary);box-shadow:0 0 0 3px rgba(59,130,246,.1)}#strikebot-send{width:44px;height:44px;border-radius:50%;background:var(--sb-primary);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s ease}#strikebot-send:hover{transform:scale(1.05);background:var(--sb-secondary)}#strikebot-send:disabled{opacity:.5;cursor:not-allowed}#strikebot-send svg{width:20px;height:20px;color:#fff}.strikebot-powered-by{text-align:center;padding:8px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb}.strikebot-dark .strikebot-powered-by{border-top-color:#374151}.strikebot-dark{--sb-bg:#1f2937;--sb-text:#f9fafb}@media (max-width:480px){.strikebot-widget{bottom:10px}.strikebot-bottom-right{right:10px}.strikebot-bottom-left{left:10px}.strikebot-chat{width:calc(100vw - 20px);bottom:70px}.strikebot-toggle{width:54px;height:54px}}`;
}

function generateAdminJs(): string {
  return `(function($){'use strict';$('.strikebot-tab').on('click',function(){const tab=$(this).data('tab');$('.strikebot-tab').removeClass('active');$(this).addClass('active');$('.strikebot-tab-content').removeClass('active');$('#tab-'+tab).addClass('active')});$('#strikebot-sitemap-form').on('submit',function(e){e.preventDefault();const url=$('#sitemap-url').val();const $btn=$(this).find('button[type="submit"]');$btn.prop('disabled',true).text('Crawling...');$.ajax({url:strikebotAdmin.ajaxUrl,method:'POST',data:{action:'strikebot_crawl_sitemap',nonce:strikebotAdmin.nonce,url:url},success:function(response){if(response.success){const $results=$('#sitemap-results');const $list=$results.find('.strikebot-url-list');$list.empty();response.data.urls.forEach(function(url){$list.append('<div class="strikebot-url-item"><input type="checkbox" class="sitemap-url-checkbox" value="'+url+'" checked><span>'+url+'</span></div>')});$results.removeClass('hidden')}else{alert(response.data.message||'Error')}},complete:function(){$btn.prop('disabled',false).text('Crawl Sitemap')}})});$('#strikebot-text-form').on('submit',function(e){e.preventDefault();const name=$('#text-name').val();const content=$('#text-content').val();$.ajax({url:strikebotAdmin.ajaxUrl,method:'POST',data:{action:'strikebot_save_knowledge',nonce:strikebotAdmin.nonce,type:'text',name:name,content:content},success:function(response){if(response.success){alert('Text added!');location.reload()}else{alert(response.data.message||'Error')}}})});$('#strikebot-qa-form').on('submit',function(e){e.preventDefault();const question=$('#qa-question').val();const answer=$('#qa-answer').val();$.ajax({url:strikebotAdmin.ajaxUrl,method:'POST',data:{action:'strikebot_save_knowledge',nonce:strikebotAdmin.nonce,type:'qa',name:question,content:'Q: '+question+'\\nA: '+answer},success:function(response){if(response.success){alert('Q&A added!');location.reload()}else{alert(response.data.message||'Error')}}})});$('.strikebot-delete-item').on('click',function(){if(!confirm('Delete this item?'))return;const id=$(this).data('id');const $row=$(this).closest('tr');$.ajax({url:strikebotAdmin.ajaxUrl,method:'POST',data:{action:'strikebot_delete_knowledge',nonce:strikebotAdmin.nonce,id:id},success:function(response){if(response.success){$row.fadeOut()}else{alert(response.data.message||'Error')}}})});$('#select-icon').on('click',function(e){e.preventDefault();const frame=wp.media({title:'Select Chatbot Icon',button:{text:'Use this image'},multiple:false});frame.on('select',function(){const attachment=frame.state().get('selection').first().toJSON();$('#icon-url').val(attachment.url);$('.strikebot-icon-preview').css('background-image','url('+attachment.url+')').find('.dashicons').hide();$('#remove-icon').removeClass('hidden')});frame.open()});$('#remove-icon').on('click',function(){$('#icon-url').val('');$('.strikebot-icon-preview').css('background-image','none').find('.dashicons').show();$(this).addClass('hidden')});$('#strikebot-appearance-form').on('submit',function(e){e.preventDefault();const formData=$(this).serializeArray();const data={action:'strikebot_save_settings',nonce:strikebotAdmin.nonce};formData.forEach(function(item){data[item.name]=item.value});$.ajax({url:strikebotAdmin.ajaxUrl,method:'POST',data:data,success:function(response){if(response.success){alert('Settings saved!')}else{alert(response.data.message||'Error')}}})})})(jQuery);`;
}

function generateWidgetJs(): string {
  return `(function(){'use strict';function generateSessionId(){return'sb_'+Math.random().toString(36).substr(2,9)+'_'+Date.now()}function getSessionId(){let sessionId=sessionStorage.getItem('strikebot_session');if(!sessionId){sessionId=generateSessionId();sessionStorage.setItem('strikebot_session',sessionId)}return sessionId}const sessionId=getSessionId();const widget=document.getElementById('strikebot-widget');const chat=document.getElementById('strikebot-chat');const toggle=document.getElementById('strikebot-toggle');const closeBtn=document.querySelector('.strikebot-chat-close');const messages=document.getElementById('strikebot-messages');const input=document.getElementById('strikebot-input');const sendBtn=document.getElementById('strikebot-send');const toggleOpen=document.querySelector('.strikebot-toggle-open');const toggleClose=document.querySelector('.strikebot-toggle-close');let isOpen=false;let isLoading=false;function toggleChat(){isOpen=!isOpen;chat.classList.toggle('hidden',!isOpen);toggleOpen.classList.toggle('hidden',isOpen);toggleClose.classList.toggle('hidden',!isOpen);if(isOpen){input.focus()}}function addMessage(content,isUser=false){const messageDiv=document.createElement('div');messageDiv.className='strikebot-message '+(isUser?'strikebot-message-user':'strikebot-message-bot');let avatarHtml='';if(!isUser){const settings=window.strikebotWidget?.settings||{};const iconUrl=settings.widget?.iconUrl||'';if(iconUrl){avatarHtml='<div class="strikebot-message-avatar"><img src="'+iconUrl+'" alt=""></div>'}else{avatarHtml='<div class="strikebot-message-avatar"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></div>'}}messageDiv.innerHTML=avatarHtml+'<div class="strikebot-message-content">'+escapeHtml(content)+'</div>';messages.appendChild(messageDiv);messages.scrollTop=messages.scrollHeight}function addTypingIndicator(){const typingDiv=document.createElement('div');typingDiv.className='strikebot-message strikebot-message-bot';typingDiv.id='typing-indicator';const settings=window.strikebotWidget?.settings||{};const iconUrl=settings.widget?.iconUrl||'';let avatarHtml='';if(iconUrl){avatarHtml='<div class="strikebot-message-avatar"><img src="'+iconUrl+'" alt=""></div>'}else{avatarHtml='<div class="strikebot-message-avatar"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></div>'}typingDiv.innerHTML=avatarHtml+'<div class="strikebot-message-content strikebot-typing"><span></span><span></span><span></span></div>';messages.appendChild(typingDiv);messages.scrollTop=messages.scrollHeight}function removeTypingIndicator(){const indicator=document.getElementById('typing-indicator');if(indicator){indicator.remove()}}function escapeHtml(text){const div=document.createElement('div');div.textContent=text;return div.innerHTML}async function sendMessage(){const message=input.value.trim();if(!message||isLoading){return}isLoading=true;sendBtn.disabled=true;input.value='';addMessage(message,true);addTypingIndicator();try{const formData=new FormData();formData.append('action','strikebot_chat');formData.append('nonce',strikebotWidget.nonce);formData.append('message',message);formData.append('session_id',sessionId);const response=await fetch(strikebotWidget.ajaxUrl,{method:'POST',body:formData});const data=await response.json();removeTypingIndicator();if(data.success){addMessage(data.data.response)}else{addMessage(data.data?.message||'Sorry, I encountered an error.')}}catch(error){console.error('Strikebot error:',error);removeTypingIndicator();addMessage('Sorry, I encountered an error.')}finally{isLoading=false;sendBtn.disabled=false;input.focus()}}toggle.addEventListener('click',toggleChat);closeBtn.addEventListener('click',toggleChat);sendBtn.addEventListener('click',sendMessage);input.addEventListener('keypress',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&isOpen){toggleChat()}});document.addEventListener('click',function(e){if(isOpen&&!widget.contains(e.target)){toggleChat()}})})();`;
}

function generateReadme(config: ChatbotConfig): string {
  return `=== Strikebot - ${config.name} ===
Contributors: strikebot
Tags: chatbot, ai, customer support, live chat
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later

AI-powered chatbot for your website.

== Description ==

Strikebot is an AI-powered chatbot that helps you provide instant customer support on your website.

Features:
* AI-powered responses using ${config.model}
* Knowledge Base training (sitemaps, URLs, files, text, Q&A)
* Customizable appearance
* Usage tracking and limits
* Clean uninstall

== Installation ==

1. Upload the plugin folder to /wp-content/plugins/
2. Activate the plugin through the 'Plugins' menu
3. Go to Strikebot in the admin menu to configure

== Configuration ==

This plugin comes pre-configured with the following limits:
* ${config.limits.messageCreditsPerMonth} messages per month
* ${config.limits.storageLimitMB >= 1 ? config.limits.storageLimitMB + ' MB' : (config.limits.storageLimitMB * 1024) + ' KB'} storage
* ${config.limits.linkTrainingLimit === null ? 'Unlimited' : config.limits.linkTrainingLimit} training links

== Changelog ==

= 1.0.0 =
* Initial release
`;
}
