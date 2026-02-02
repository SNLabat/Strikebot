<?php
/**
 * Plugin Name: Fullscreen Chatbot
 * Plugin URI: https://example.com
 * Description: A fullscreen OpenAI-powered chatbot for your WordPress site with sidebar, dark mode, and chat history
 * Version: 3.1.0
 * Author: Your Name
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class FullscreenChatbot {

    private $option_name = 'fullscreen_chatbot_settings';

    public function __construct() {
        // Admin hooks
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));

        // Frontend hooks
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('template_redirect', array($this, 'check_chatbot_page'));

        // AJAX handler
        add_action('wp_ajax_chatbot_message', array($this, 'handle_chatbot_message'));
        add_action('wp_ajax_nopriv_chatbot_message', array($this, 'handle_chatbot_message'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'Fullscreen Chatbot Settings',
            'Chatbot',
            'manage_options',
            'fullscreen-chatbot',
            array($this, 'settings_page'),
            'dashicons-format-chat',
            30
        );
    }

    public function register_settings() {
        register_setting('fullscreen_chatbot_settings_group', $this->option_name);
    }

    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'toplevel_page_fullscreen-chatbot') {
            return;
        }
        wp_enqueue_media();
        wp_enqueue_script(
            'fullscreen-chatbot-admin',
            plugin_dir_url(__FILE__) . 'admin-script.js',
            array('jquery'),
            '3.1.0',
            true
        );
    }

    public function settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Get all pages
        $pages = get_pages();
        $settings = get_option($this->option_name, array());

        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('fullscreen_chatbot_settings_group');
                ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="api_key">OpenAI API Key</label>
                        </th>
                        <td>
                            <input type="password"
                                   id="api_key"
                                   name="<?php echo $this->option_name; ?>[api_key]"
                                   value="<?php echo esc_attr($settings['api_key'] ?? ''); ?>"
                                   class="regular-text"
                                   autocomplete="off">
                            <p class="description">Enter your OpenAI API key (starts with sk-...)</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="model">OpenAI Model</label>
                        </th>
                        <td>
                            <select id="model" name="<?php echo $this->option_name; ?>[model]" class="regular-text">
                                <option value="gpt-4o" <?php selected($settings['model'] ?? '', 'gpt-4o'); ?>>GPT-4o (Recommended)</option>
                                <option value="gpt-4o-mini" <?php selected($settings['model'] ?? '', 'gpt-4o-mini'); ?>>GPT-4o Mini</option>
                                <option value="gpt-4-turbo" <?php selected($settings['model'] ?? '', 'gpt-4-turbo'); ?>>GPT-4 Turbo</option>
                                <option value="gpt-4" <?php selected($settings['model'] ?? '', 'gpt-4'); ?>>GPT-4</option>
                                <option value="gpt-3.5-turbo" <?php selected($settings['model'] ?? '', 'gpt-3.5-turbo'); ?>>GPT-3.5 Turbo</option>
                            </select>
                            <p class="description">Select the OpenAI model to use for chat responses</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="chatbot_page">Chatbot Page</label>
                        </th>
                        <td>
                            <select id="chatbot_page" name="<?php echo $this->option_name; ?>[page_id]" class="regular-text">
                                <option value="">-- Select a Page --</option>
                                <?php foreach ($pages as $page): ?>
                                    <option value="<?php echo $page->ID; ?>" <?php selected($settings['page_id'] ?? '', $page->ID); ?>>
                                        <?php echo esc_html($page->post_title); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <p class="description">Select which page should display the fullscreen chatbot</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="system_prompt">System Prompt (Optional)</label>
                        </th>
                        <td>
                            <textarea id="system_prompt"
                                      name="<?php echo $this->option_name; ?>[system_prompt]"
                                      rows="5"
                                      class="large-text"><?php echo esc_textarea($settings['system_prompt'] ?? 'You are a helpful assistant.'); ?></textarea>
                            <p class="description">Customize the AI's behavior and personality</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label>Header Logo</label>
                        </th>
                        <td>
                            <div class="chatbot-logo-upload">
                                <input type="hidden"
                                       id="header_logo"
                                       name="<?php echo $this->option_name; ?>[header_logo]"
                                       value="<?php echo esc_attr($settings['header_logo'] ?? ''); ?>">
                                <button type="button" class="button upload-logo-button" data-target="header_logo">
                                    <?php echo ($settings['header_logo'] ?? '') ? 'Change Logo' : 'Upload Logo'; ?>
                                </button>
                                <button type="button" class="button remove-logo-button" data-target="header_logo" style="<?php echo ($settings['header_logo'] ?? '') ? '' : 'display:none;'; ?>">
                                    Remove Logo
                                </button>
                                <div class="logo-preview" style="margin-top: 10px;">
                                    <?php if (!empty($settings['header_logo'])): ?>
                                        <img src="<?php echo esc_url($settings['header_logo']); ?>" style="max-width: 200px; height: auto;">
                                    <?php endif; ?>
                                </div>
                                <p class="description">Logo displayed in the chatbot header (recommended: 200px wide)</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label>Chat Icon</label>
                        </th>
                        <td>
                            <div class="chatbot-logo-upload">
                                <input type="hidden"
                                       id="chat_icon"
                                       name="<?php echo $this->option_name; ?>[chat_icon]"
                                       value="<?php echo esc_attr($settings['chat_icon'] ?? ''); ?>">
                                <button type="button" class="button upload-logo-button" data-target="chat_icon">
                                    <?php echo ($settings['chat_icon'] ?? '') ? 'Change Icon' : 'Upload Icon'; ?>
                                </button>
                                <button type="button" class="button remove-logo-button" data-target="chat_icon" style="<?php echo ($settings['chat_icon'] ?? '') ? '' : 'display:none;'; ?>">
                                    Remove Icon
                                </button>
                                <div class="logo-preview" style="margin-top: 10px;">
                                    <?php if (!empty($settings['chat_icon'])): ?>
                                        <img src="<?php echo esc_url($settings['chat_icon']); ?>" style="max-width: 100px; height: auto;">
                                    <?php endif; ?>
                                </div>
                                <p class="description">Icon shown in chat messages (recommended: 40px x 40px)</p>
                            </div>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    public function check_chatbot_page() {
        $settings = get_option($this->option_name, array());
        $page_id = $settings['page_id'] ?? '';

        if (is_page($page_id) && !empty($page_id)) {
            add_filter('template_include', array($this, 'load_chatbot_template'));
        }
    }

    public function load_chatbot_template($template) {
        return plugin_dir_path(__FILE__) . 'chatbot-template.php';
    }

    public function enqueue_scripts() {
        $settings = get_option($this->option_name, array());
        $page_id = $settings['page_id'] ?? '';

        if (is_page($page_id) && !empty($page_id)) {
            wp_enqueue_style(
                'fullscreen-chatbot-style',
                plugin_dir_url(__FILE__) . 'chatbot-style.css',
                array(),
                '3.1.0'
            );

            wp_enqueue_script(
                'fullscreen-chatbot-script',
                plugin_dir_url(__FILE__) . 'chatbot-script.js',
                array('jquery'),
                '3.1.0',
                true
            );

            wp_localize_script('fullscreen-chatbot-script', 'chatbotAjax', array(
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('chatbot_nonce'),
                'headerLogo' => $settings['header_logo'] ?? '',
                'chatIcon' => $settings['chat_icon'] ?? ''
            ));
        }
    }

    public function handle_chatbot_message() {
        check_ajax_referer('chatbot_nonce', 'nonce');

        $message = sanitize_text_field($_POST['message'] ?? '');

        if (empty($message)) {
            wp_send_json_error(array('message' => 'Message cannot be empty'));
            return;
        }

        $settings = get_option($this->option_name, array());
        $api_key = $settings['api_key'] ?? '';
        $model = $settings['model'] ?? 'gpt-4o';
        $system_prompt = $settings['system_prompt'] ?? 'You are a helpful assistant.';

        if (empty($api_key)) {
            wp_send_json_error(array('message' => 'API key not configured'));
            return;
        }

        // Get conversation history from the request
        $history = json_decode(stripslashes($_POST['history'] ?? '[]'), true);
        if (!is_array($history)) {
            $history = array();
        }

        // Build messages array
        $messages = array(
            array('role' => 'system', 'content' => $system_prompt)
        );

        // Add history
        foreach ($history as $msg) {
            if (isset($msg['role']) && isset($msg['content'])) {
                $messages[] = array(
                    'role' => $msg['role'],
                    'content' => $msg['content']
                );
            }
        }

        // Add current message
        $messages[] = array('role' => 'user', 'content' => $message);

        // Call OpenAI API
        $response = wp_remote_post('https://api.openai.com/v1/chat/completions', array(
            'timeout' => 60,
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $api_key
            ),
            'body' => json_encode(array(
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 1000
            ))
        ));

        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => 'Failed to connect to OpenAI: ' . $response->get_error_message()));
            return;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (isset($body['error'])) {
            wp_send_json_error(array('message' => 'OpenAI Error: ' . ($body['error']['message'] ?? 'Unknown error')));
            return;
        }

        if (isset($body['choices'][0]['message']['content'])) {
            wp_send_json_success(array(
                'message' => $body['choices'][0]['message']['content']
            ));
        } else {
            wp_send_json_error(array('message' => 'Invalid response from OpenAI'));
        }
    }
}

// Initialize the plugin
new FullscreenChatbot();
