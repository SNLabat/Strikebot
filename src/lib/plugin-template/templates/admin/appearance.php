<?php
if (!defined('ABSPATH')) exit;

$settings = get_option('strikebot_settings');
$theme = $settings['theme'] ?? array();
$widget = $settings['widget'] ?? array();
$admin_theme = get_option('strikebot_admin_theme', 'light');
$admin_theme_class = $admin_theme === 'dark' ? 'strikebot-dark-mode' : '';
?>

<div class="wrap strikebot-admin <?php echo esc_attr($admin_theme_class); ?>">
    <h1>Appearance Settings</h1>
    <p class="description">Customize how your chatbot looks and feels.</p>

    <form id="strikebot-appearance-form" class="strikebot-form">
        <div class="strikebot-appearance-layout">
            <!-- Settings Panel -->
            <div class="strikebot-settings-panel strikebot-card">
                <h2>Chatbot Name & Icon</h2>

                <div class="strikebot-form-group">
                    <label for="chatbot-name">Chatbot Name</label>
                    <input type="text" id="chatbot-name" name="name" value="<?php echo esc_attr($settings['name'] ?? ''); ?>">
                </div>

                <div class="strikebot-form-group">
                    <label>Chatbot Icon</label>
                    <div class="strikebot-icon-selector">
                        <div class="strikebot-icon-preview" style="background-image: url('<?php echo esc_url($widget['iconUrl'] ?? ''); ?>')">
                            <?php if (empty($widget['iconUrl'])): ?>
                            <span class="dashicons dashicons-format-chat"></span>
                            <?php endif; ?>
                        </div>
                        <button type="button" id="select-icon" class="button">Select from Media Library</button>
                        <button type="button" id="remove-icon" class="button<?php echo empty($widget['iconUrl']) ? ' hidden' : ''; ?>">Remove</button>
                        <input type="hidden" id="icon-url" name="widget[iconUrl]" value="<?php echo esc_attr($widget['iconUrl'] ?? ''); ?>">
                    </div>
                </div>

                <h2>Theme Colors</h2>

                <div class="strikebot-form-group">
                    <label for="primary-color">Primary Color</label>
                    <div class="strikebot-color-input">
                        <input type="color" id="primary-color" name="theme[primaryColor]" value="<?php echo esc_attr($theme['primaryColor'] ?? '#3B82F6'); ?>">
                        <input type="text" class="color-hex" value="<?php echo esc_attr($theme['primaryColor'] ?? '#3B82F6'); ?>">
                    </div>
                </div>

                <div class="strikebot-form-group">
                    <label for="secondary-color">Secondary Color</label>
                    <div class="strikebot-color-input">
                        <input type="color" id="secondary-color" name="theme[secondaryColor]" value="<?php echo esc_attr($theme['secondaryColor'] ?? '#1E40AF'); ?>">
                        <input type="text" class="color-hex" value="<?php echo esc_attr($theme['secondaryColor'] ?? '#1E40AF'); ?>">
                    </div>
                </div>

                <div class="strikebot-form-group">
                    <label>Display Mode</label>
                    <div class="strikebot-mode-selector">
                        <label class="strikebot-mode-option<?php echo ($theme['mode'] ?? 'light') === 'light' ? ' active' : ''; ?>">
                            <input type="radio" name="theme[mode]" value="light" <?php checked(($theme['mode'] ?? 'light'), 'light'); ?>>
                            <span class="dashicons dashicons-admin-appearance"></span>
                            Light Mode
                        </label>
                        <label class="strikebot-mode-option<?php echo ($theme['mode'] ?? 'light') === 'dark' ? ' active' : ''; ?>">
                            <input type="radio" name="theme[mode]" value="dark" <?php checked(($theme['mode'] ?? 'light'), 'dark'); ?>>
                            <span class="dashicons dashicons-admin-appearance"></span>
                            Dark Mode
                        </label>
                    </div>
                </div>

                <h2>Widget Settings</h2>

                <div class="strikebot-form-group">
                    <label for="welcome-message">Welcome Message</label>
                    <textarea id="welcome-message" name="widget[welcomeMessage]" rows="3"><?php echo esc_textarea($widget['welcomeMessage'] ?? ''); ?></textarea>
                </div>

                <div class="strikebot-form-group">
                    <label for="placeholder">Input Placeholder</label>
                    <input type="text" id="placeholder" name="widget[placeholder]" value="<?php echo esc_attr($widget['placeholder'] ?? ''); ?>">
                </div>

                <div class="strikebot-form-group">
                    <label>Widget Position</label>
                    <div class="strikebot-position-selector">
                        <label class="strikebot-position-option<?php echo ($widget['position'] ?? 'bottom-right') === 'bottom-right' ? ' active' : ''; ?>">
                            <input type="radio" name="widget[position]" value="bottom-right" <?php checked(($widget['position'] ?? 'bottom-right'), 'bottom-right'); ?>>
                            <div class="strikebot-position-preview">
                                <span class="strikebot-dot bottom-right"></span>
                            </div>
                            Bottom Right
                        </label>
                        <label class="strikebot-position-option<?php echo ($widget['position'] ?? 'bottom-right') === 'bottom-left' ? ' active' : ''; ?>">
                            <input type="radio" name="widget[position]" value="bottom-left" <?php checked(($widget['position'] ?? 'bottom-right'), 'bottom-left'); ?>>
                            <div class="strikebot-position-preview">
                                <span class="strikebot-dot bottom-left"></span>
                            </div>
                            Bottom Left
                        </label>
                    </div>
                </div>

                <div class="strikebot-form-group">
                    <label>
                        <input type="checkbox" name="widget[hideWidget]" value="1" <?php checked(!empty($widget['hideWidget'])); ?>>
                        <span style="font-weight: normal;">Temporarily hide chat widget from website</span>
                    </label>
                    <p class="description" style="margin-left: 24px;">Check this to hide the chat widget without deactivating the plugin. Useful for maintenance or testing.</p>
                </div>

                <div class="strikebot-form-actions">
                    <button type="submit" class="button button-primary button-large">Save Changes</button>
                </div>
            </div>

            <!-- Preview Panel -->
            <div class="strikebot-preview-panel">
                <h2>Live Preview</h2>
                <div class="strikebot-preview-frame" id="preview-frame">
                    <div class="strikebot-preview-chat">
                        <div class="preview-header">
                            <div class="preview-avatar"></div>
                            <div class="preview-info">
                                <span class="preview-name"><?php echo esc_html($settings['name'] ?? 'Chatbot'); ?></span>
                                <span class="preview-status">Online</span>
                            </div>
                        </div>
                        <div class="preview-messages">
                            <div class="preview-message bot">
                                <div class="preview-message-avatar"></div>
                                <div class="preview-message-content"><?php echo esc_html($widget['welcomeMessage'] ?? 'Hello!'); ?></div>
                            </div>
                            <div class="preview-message user">
                                <div class="preview-message-content">Hi, I have a question</div>
                            </div>
                        </div>
                        <div class="preview-input">
                            <input type="text" placeholder="<?php echo esc_attr($widget['placeholder'] ?? 'Type a message...'); ?>" disabled>
                            <button disabled>
                                <span class="dashicons dashicons-arrow-right-alt2"></span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>
