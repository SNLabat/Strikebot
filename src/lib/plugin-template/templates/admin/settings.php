<?php
if (!defined('ABSPATH')) exit;

$settings = get_option('strikebot_settings');
$api_key = get_option('strikebot_api_key');
$api_endpoint = get_option('strikebot_api_endpoint');
$model = get_option('strikebot_model');
$admin_theme = get_option('strikebot_admin_theme', 'light');
$admin_theme_class = $admin_theme === 'dark' ? 'strikebot-dark-mode' : '';
?>

<div class="wrap strikebot-admin <?php echo esc_attr($admin_theme_class); ?>">
    <h1>Settings</h1>

    <form id="strikebot-settings-form" class="strikebot-form">
        <div class="strikebot-settings-grid">
            <!-- API Settings -->
            <div class="strikebot-card">
                <h2>API Configuration</h2>
                <p class="description">Configure your AI model API settings. These settings are pre-configured based on your plan.</p>

                <div class="strikebot-form-group">
                    <label for="api-key">API Key</label>
                    <input type="password" id="api-key" name="api_key" value="<?php echo esc_attr($api_key); ?>">
                    <p class="description">Your API key is stored securely and encrypted.</p>
                </div>

                <div class="strikebot-form-group">
                    <label for="api-endpoint">API Endpoint</label>
                    <input type="url" id="api-endpoint" name="api_endpoint" value="<?php echo esc_attr($api_endpoint); ?>" readonly>
                    <p class="description">The API endpoint is locked to your plan configuration.</p>
                </div>

                <div class="strikebot-form-group">
                    <label for="model">AI Model</label>
                    <input type="text" id="model" name="model" value="<?php echo esc_attr($model); ?>" readonly>
                    <p class="description">The AI model is locked to your plan configuration.</p>
                </div>
            </div>

            <!-- Plan Limits -->
            <div class="strikebot-card">
                <h2>Plan Limits</h2>
                <p class="description">These limits are set by your plan and cannot be changed.</p>

                <div class="strikebot-limits-grid">
                    <div class="strikebot-limit-item">
                        <span class="strikebot-limit-label">Messages/Month</span>
                        <span class="strikebot-limit-value"><?php echo number_format($settings['limits']['messageCreditsPerMonth'] ?? 50); ?></span>
                    </div>
                    <div class="strikebot-limit-item">
                        <span class="strikebot-limit-label">Storage Limit</span>
                        <span class="strikebot-limit-value">
                            <?php
                            $storage = $settings['limits']['storageLimitMB'] ?? 0.4;
                            echo $storage >= 1 ? $storage . ' MB' : ($storage * 1024) . ' KB';
                            ?>
                        </span>
                    </div>
                    <div class="strikebot-limit-item">
                        <span class="strikebot-limit-label">Training Links</span>
                        <span class="strikebot-limit-value">
                            <?php echo ($settings['limits']['linkTrainingLimit'] ?? null) === null ? 'Unlimited' : $settings['limits']['linkTrainingLimit']; ?>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Features -->
            <div class="strikebot-card">
                <h2>Enabled Features</h2>
                <p class="description">Features available with your plan.</p>

                <div class="strikebot-features-list">
                    <div class="strikebot-feature-item <?php echo ($settings['features']['apiAccess'] ?? false) ? 'enabled' : 'disabled'; ?>">
                        <span class="dashicons <?php echo ($settings['features']['apiAccess'] ?? false) ? 'dashicons-yes-alt' : 'dashicons-no'; ?>"></span>
                        <span>API Access</span>
                    </div>
                    <div class="strikebot-feature-item <?php echo ($settings['features']['analytics'] ?? 'none') !== 'none' ? 'enabled' : 'disabled'; ?>">
                        <span class="dashicons <?php echo ($settings['features']['analytics'] ?? 'none') !== 'none' ? 'dashicons-yes-alt' : 'dashicons-no'; ?>"></span>
                        <span>Analytics (<?php echo ucfirst($settings['features']['analytics'] ?? 'none'); ?>)</span>
                    </div>
                    <div class="strikebot-feature-item <?php echo ($settings['features']['autoRetrain'] ?? false) ? 'enabled' : 'disabled'; ?>">
                        <span class="dashicons <?php echo ($settings['features']['autoRetrain'] ?? false) ? 'dashicons-yes-alt' : 'dashicons-no'; ?>"></span>
                        <span>Auto Retrain</span>
                    </div>
                    <div class="strikebot-feature-item enabled">
                        <span class="dashicons dashicons-yes-alt"></span>
                        <span>Model Access: <?php echo ucfirst($settings['features']['modelAccess'] ?? 'limited'); ?></span>
                    </div>
                </div>
            </div>

            <!-- Danger Zone -->
            <div class="strikebot-card strikebot-danger-zone">
                <h2>Danger Zone</h2>
                <p class="description">Irreversible actions. Be careful!</p>

                <div class="strikebot-danger-actions">
                    <div class="strikebot-danger-action">
                        <div>
                            <strong>Clear Chat History</strong>
                            <p>Delete all chat conversation history.</p>
                        </div>
                        <button type="button" id="clear-history" class="button button-secondary">Clear History</button>
                    </div>
                    <div class="strikebot-danger-action">
                        <div>
                            <strong>Reset Knowledge Base</strong>
                            <p>Delete all knowledge base items.</p>
                        </div>
                        <button type="button" id="reset-knowledge" class="button button-secondary">Reset Knowledge</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="strikebot-form-actions">
            <button type="submit" class="button button-primary button-large">Save Settings</button>
        </div>
    </form>
</div>
