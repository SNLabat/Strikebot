<?php
/**
 * Plugin Name: Fullscreen Chatbot
 * Plugin URI: https://example.com
 * Description: A fullscreen OpenAI-powered chatbot for your WordPress site with sidebar, dark mode, and chat history
 * Version: 3.2.0
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
        register_setting('fullscreen_chatbot_settings_group', $this->option_name, array(
            'sanitize_callback' => array($this, 'sanitize_settings')
        ));
    }

    /**
     * Preset accent colors: name => [primary_hex, secondary_hex for gradient]
     */
    public static function get_accent_presets() {
        return array(
            'purple'  => array('#667eea', '#764ba2'),
            'red'     => array('#ef4444', '#b91c1c'),
            'blue'    => array('#3b82f6', '#1d4ed8'),
            'orange'  => array('#f97316', '#c2410c'),
            'green'   => array('#22c55e', '#15803d'),
            'teal'    => array('#14b8a6', '#0d9488'),
            'pink'    => array('#ec4899', '#be185d'),
            'indigo'  => array('#6366f1', '#4338ca'),
        );
    }

    public function sanitize_settings($input) {
        if (!is_array($input)) {
            return $input;
        }
        $presets = self::get_accent_presets();
        if (isset($input['accent_mode'])) {
            $input['accent_mode'] = ($input['accent_mode'] === 'custom') ? 'custom' : 'preset';
        }
        if (isset($input['accent_preset']) && !isset($presets[$input['accent_preset']])) {
            $input['accent_preset'] = 'purple';
        }
        if (!empty($input['accent_hex'])) {
            $hex = sanitize_hex_color($input['accent_hex']);
            $input['accent_hex'] = $hex ? $hex : '#667eea';
        }
        return $input;
    }

    /**
     * Get resolved accent hex pair [primary, secondary] from saved settings.
     */
    public function get_accent_colors() {
        $settings = get_option($this->option_name, array());
        $presets = self::get_accent_presets();
        $mode = $settings['accent_mode'] ?? 'preset';
        if ($mode === 'custom' && !empty($settings['accent_hex'])) {
            $primary = $settings['accent_hex'];
            $secondary = $this->darken_hex($primary, 0.85);
            return array($primary, $secondary);
        }
        $preset = $settings['accent_preset'] ?? 'purple';
        return $presets[$preset] ?? $presets['purple'];
    }

    private function darken_hex($hex, $factor) {
        $hex = ltrim($hex, '#');
        if (strlen($hex) !== 6) {
            return $hex;
        }
        $r = max(0, min(255, round(hexdec(substr($hex, 0, 2)) * $factor)));
        $g = max(0, min(255, round(hexdec(substr($hex, 2, 2)) * $factor)));
        $b = max(0, min(255, round(hexdec(substr($hex, 4, 2)) * $factor)));
        return '#' . sprintf('%02x%02x%02x', $r, $g, $b);
    }

    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'toplevel_page_fullscreen-chatbot' && $hook !== 'strikebot_page_fullscreen-chatbot') {
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
                    <tr>
                        <th scope="row">
                            <label><?php esc_html_e('Theme / Accent Color', 'fullscreen-chatbot'); ?></label>
                        </th>
                        <td>
                            <p class="description" style="margin-bottom: 12px;">Customize the send button, user message bubbles, and bot accent (e.g. icon).</p>
                            <fieldset class="chatbot-accent-settings">
                                <label>
                                    <input type="radio" name="<?php echo esc_attr($this->option_name); ?>[accent_mode]" value="preset" <?php checked(($settings['accent_mode'] ?? 'preset'), 'preset'); ?>>
                                    <?php esc_html_e('Preset color', 'fullscreen-chatbot'); ?>
                                </label>
                                <label style="margin-left: 16px;">
                                    <input type="radio" name="<?php echo esc_attr($this->option_name); ?>[accent_mode]" value="custom" <?php checked($settings['accent_mode'] ?? '', 'custom'); ?>>
                                    <?php esc_html_e('Custom color (hex / eyedropper)', 'fullscreen-chatbot'); ?>
                                </label>
                            </fieldset>
                            <div class="chatbot-accent-presets" style="margin-top: 12px;">
                                <span style="display: inline-block; margin-right: 8px; vertical-align: middle;"><?php esc_html_e('Preset:', 'fullscreen-chatbot'); ?></span>
                                <?php
                                $presets = $this->get_accent_presets();
                                $current_preset = $settings['accent_preset'] ?? 'purple';
                                foreach ($presets as $key => $colors):
                                    $primary = $colors[0];
                                    $title = ucfirst($key);
                                ?>
                                    <label class="chatbot-preset-swatch" title="<?php echo esc_attr($title); ?>" style="display: inline-flex; align-items: center; margin-right: 4px; margin-bottom: 8px; cursor: pointer; vertical-align: middle;">
                                        <input type="radio" name="<?php echo esc_attr($this->option_name); ?>[accent_preset]" value="<?php echo esc_attr($key); ?>" <?php checked($current_preset, $key); ?>>
                                        <span class="preset-color-box" style="width: 28px; height: 28px; border-radius: 6px; margin-left: 4px; background: linear-gradient(135deg, <?php echo esc_attr($primary); ?> 0%, <?php echo esc_attr($colors[1]); ?> 100%); border: 2px solid <?php echo $current_preset === $key ? '#1f2937' : 'transparent'; ?>; box-sizing: border-box;"></span>
                                    </label>
                                <?php endforeach; ?>
                            </div>
                            <div class="chatbot-accent-custom" style="margin-top: 12px; display: <?php echo (isset($settings['accent_mode']) && $settings['accent_mode'] === 'custom') ? 'block' : 'none'; ?>;">
                                <label style="display: inline-flex; align-items: center; gap: 10px;">
                                    <span><?php esc_html_e('Custom color:', 'fullscreen-chatbot'); ?></span>
                                    <input type="color"
                                           id="accent_color_picker"
                                           name="<?php echo esc_attr($this->option_name); ?>[accent_hex]"
                                           value="<?php echo esc_attr($settings['accent_hex'] ?? '#667eea'); ?>"
                                           style="width: 48px; height: 36px; padding: 2px; cursor: pointer; border-radius: 6px;">
                                    <input type="text"
                                           id="accent_hex_input"
                                           value="<?php echo esc_attr($settings['accent_hex'] ?? '#667eea'); ?>"
                                           pattern="^#[0-9A-Fa-f]{6}$"
                                           maxlength="7"
                                           placeholder="#667eea"
                                           style="width: 90px; font-family: monospace;">
                                </label>
                                <p class="description"><?php esc_html_e('Use the color box for eyedropper (browser support) or enter a hex code.', 'fullscreen-chatbot'); ?></p>
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
            list($accent_primary, $accent_secondary) = $this->get_accent_colors();
            $accent_css = sprintf(
                ":root { --accent-primary: %s !important; --accent-secondary: %s !important; --accent-gradient: linear-gradient(135deg, %s 0%%, %s 100%%) !important; }\n",
                esc_attr($accent_primary),
                esc_attr($accent_secondary),
                esc_attr($accent_primary),
                esc_attr($accent_secondary)
            );

            wp_enqueue_style(
                'fullscreen-chatbot-style',
                plugin_dir_url(__FILE__) . 'chatbot-style.css',
                array(),
                '3.2.0'
            );
            wp_add_inline_style('fullscreen-chatbot-style', $accent_css);

            wp_enqueue_script(
                'fullscreen-chatbot-script',
                plugin_dir_url(__FILE__) . 'chatbot-script.js',
                array('jquery'),
                '3.2.0',
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
        $base_system_prompt = $settings['system_prompt'] ?? 'You are a helpful assistant.';

        if (empty($api_key)) {
            wp_send_json_error(array('message' => 'API key not configured'));
            return;
        }

        // Get conversation history from the request
        $history = json_decode(stripslashes($_POST['history'] ?? '[]'), true);
        if (!is_array($history)) {
            $history = array();
        }

        // Get knowledge base context and build enhanced system prompt
        $knowledge_context = $this->get_knowledge_context($message);
        $system_prompt = $this->build_system_prompt($base_system_prompt, $knowledge_context);

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

    /**
     * Get knowledge context from Strikebot knowledge base
     */
    private function get_knowledge_context($query) {
        global $wpdb;
        $table = $wpdb->prefix . 'strikebot_knowledge';

        // Check if the table exists (Strikebot might not be installed)
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'") === $table;
        if (!$table_exists) {
            return '';
        }

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
                $content_to_add = substr($content_to_add, 0, $max_per_item) . "\n[Content truncated - " . strlen($item->content) . " bytes total...]";
            }

            $item_content = "\n\n---\n" . $type_label . "\n" . $content_to_add;
            $new_length = strlen($context) + strlen($item_content);

            if ($new_length > $max_chars) {
                $remaining = $max_chars - strlen($context);
                if ($remaining > 200) {
                    $context .= substr($item_content, 0, $remaining) . "\n[Truncated...]";
                    $items_included++;
                }
                break;
            }

            $context .= $item_content;
            $items_included++;
        }

        error_log('Fullscreen Chatbot: Built context with ' . $items_included . ' items, ' . strlen($context) . ' characters');
        return $context;
    }

    /**
     * Build enhanced system prompt with knowledge context
     */
    private function build_system_prompt($base_prompt, $knowledge_context) {
        $prompt = $base_prompt;

        if (!empty($knowledge_context)) {
            $prompt .= "\n\nYou have access to the following knowledge base. Use this information to answer questions accurately:\n" . $knowledge_context;
            $prompt .= "\n\nIf you don't know the answer based on the knowledge base provided, say so politely.";
        }

        return $prompt;
    }
}

// Initialize the plugin
new FullscreenChatbot();
