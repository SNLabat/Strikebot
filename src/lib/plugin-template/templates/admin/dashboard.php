<?php
if (!defined('ABSPATH')) exit;

$settings = get_option('strikebot_settings');
if (!is_array($settings)) {
    $settings = array();
}

// Ensure instructions and removeBranding fields exist (for backwards compatibility)
if (!isset($settings['instructions'])) {
    $settings['instructions'] = '';
}
if (!isset($settings['removeBranding'])) {
    $settings['removeBranding'] = false;
}

$config = json_decode(STRIKEBOT_CONFIG, true);

global $wpdb;
$usage_table = $wpdb->prefix . 'strikebot_usage';
$month = date('Y-m');
$usage = $wpdb->get_row($wpdb->prepare("SELECT * FROM $usage_table WHERE month = %s", $month));
$message_count = $usage ? $usage->message_count : 0;
$message_limit = $settings['limits']['messageCreditsPerMonth'] ?? 10000;

// Add extra messages from add-ons
$addOns = $settings['addOns'] ?? array();
$extra_messages = 0;
foreach ($addOns as $addOn) {
    if ($addOn['type'] === 'extra_messages' && isset($addOn['value'])) {
        $extra_messages += $addOn['value'];
    }
}
$total_message_limit = $message_limit + $extra_messages;

$knowledge_table = $wpdb->prefix . 'strikebot_knowledge';
$knowledge_count = $wpdb->get_var("SELECT COUNT(*) FROM $knowledge_table");
$storage_used = $wpdb->get_var("SELECT SUM(LENGTH(content)) FROM $knowledge_table") ?? 0;
$storage_limit = ($settings['limits']['storageLimitMB'] ?? 50) * 1024 * 1024;

// Tier info
$tier_names = array(
    'starter' => 'Starter',
    'professional' => 'Professional',
    'business' => 'Business',
    'enterprise' => 'Enterprise'
);
$tier = $settings['tier'] ?? 'starter';
$tier_name = $tier_names[$tier] ?? ucfirst($tier);
$billing_period = $settings['billingPeriod'] ?? 'monthly';
?>

<?php
$admin_theme = get_option('strikebot_admin_theme', 'light'); // Default to light
$admin_theme_class = $admin_theme === 'dark' ? 'strikebot-dark-mode' : '';
?>
<div class="wrap strikebot-admin <?php echo esc_attr($admin_theme_class); ?>">
    <div class="strikebot-admin-header">
        <h1><?php echo esc_html($settings['name'] ?? 'Strikebot'); ?> Dashboard</h1>
        <button type="button" class="strikebot-theme-toggle" id="strikebot-theme-toggle" data-theme="<?php echo esc_attr($admin_theme); ?>">
            <span class="dashicons dashicons-<?php echo $admin_theme === 'dark' ? 'sun' : 'moon'; ?>"></span>
            <span><?php echo $admin_theme === 'dark' ? 'Light Mode' : 'Dark Mode'; ?></span>
        </button>
    </div>

    <div class="strikebot-dashboard">
        <!-- Usage Stats -->
        <div class="strikebot-card">
            <h2>Usage This Month</h2>
            <div class="strikebot-stat">
                <div class="strikebot-stat-value"><?php echo number_format($message_count); ?></div>
                <div class="strikebot-stat-label">
                    of <?php echo number_format($total_message_limit); ?> messages
                    <?php if ($extra_messages > 0): ?>
                        <span style="color: #10b981; font-size: 0.875em;">
                            (<?php echo number_format($message_limit); ?> + <?php echo number_format($extra_messages); ?> extra)
                        </span>
                    <?php endif; ?>
                </div>
                <div class="strikebot-progress">
                    <div class="strikebot-progress-bar" style="width: <?php echo min(100, ($message_count / $total_message_limit) * 100); ?>%"></div>
                </div>
            </div>
        </div>

        <!-- Storage Stats -->
        <div class="strikebot-card">
            <h2>Storage Used</h2>
            <div class="strikebot-stat">
                <div class="strikebot-stat-value"><?php echo size_format($storage_used); ?></div>
                <div class="strikebot-stat-label">of <?php echo size_format($storage_limit); ?></div>
                <div class="strikebot-progress">
                    <div class="strikebot-progress-bar" style="width: <?php echo min(100, ($storage_used / $storage_limit) * 100); ?>%"></div>
                </div>
            </div>
        </div>

        <!-- Knowledge Base -->
        <div class="strikebot-card">
            <h2>Knowledge Base</h2>
            <div class="strikebot-stat">
                <div class="strikebot-stat-value"><?php echo number_format($knowledge_count); ?></div>
                <div class="strikebot-stat-label">items</div>
            </div>
            <div style="text-align: center; margin-top: 1rem;">
                <a href="<?php echo admin_url('admin.php?page=strikebot-knowledge'); ?>" class="button button-primary">Manage Knowledge Base</a>
            </div>
        </div>

        <!-- Plan Info -->
        <div class="strikebot-card strikebot-plan-card">
            <h2>Plan Details</h2>
            <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                <div style="font-size: 1.25rem; font-weight: 600; color: #f97316; margin-bottom: 0.25rem;">
                    <?php echo esc_html($tier_name); ?> Plan
                </div>
                <div style="font-size: 0.875rem; color: #6b7280;">
                    Billed <?php echo esc_html($billing_period); ?>
                </div>
            </div>

            <?php if (!empty($addOns)): ?>
            <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb;">
                <div style="font-weight: 600; margin-bottom: 0.5rem; color: #374151;">Active Add-Ons</div>
                <?php foreach ($addOns as $addOn): ?>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem; padding: 0.5rem; background: #fef3c7; border-radius: 0.375rem;">
                    <span class="dashicons dashicons-star-filled" style="color: #f59e0b;"></span>
                    <span style="color: #92400e; font-weight: 500;"><?php echo esc_html($addOn['name']); ?></span>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>

            <div class="strikebot-plan-features">
                <div class="strikebot-feature">
                    <span class="dashicons dashicons-yes-alt"></span>
                    <span><?php echo number_format($message_limit); ?> messages/month</span>
                </div>
                <div class="strikebot-feature">
                    <span class="dashicons dashicons-yes-alt"></span>
                    <span><?php echo size_format($storage_limit); ?> storage</span>
                </div>
                <?php if (($settings['features']['apiAccess'] ?? false)): ?>
                <div class="strikebot-feature">
                    <span class="dashicons dashicons-yes-alt"></span>
                    <span>API access</span>
                </div>
                <?php endif; ?>
                <?php if (($settings['features']['analytics'] ?? 'none') !== 'none'): ?>
                <div class="strikebot-feature">
                    <span class="dashicons dashicons-yes-alt"></span>
                    <span><?php echo ucfirst($settings['features']['analytics']); ?> analytics</span>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Chatbot Configuration -->
    <div class="strikebot-card" style="margin-top: 20px;">
        <h2>Chatbot Configuration</h2>
        <p class="description">Customize how your chatbot behaves and responds to users.</p>
        
        <div class="strikebot-form-group" style="margin-top: 20px;">
            <label for="chatbot-instructions-field" style="display: block; font-weight: 600; margin-bottom: 8px;">Instructions</label>
            <textarea
                id="chatbot-instructions-field"
                rows="8"
                placeholder="Add custom instructions for how your chatbot should behave, respond, or sound.&#10;&#10;Examples:&#10;- Always be professional and concise&#10;- Use a friendly, helpful tone&#10;- Focus on helping customers find product information&#10;- If you don't know something, politely say so"
                style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; font-size: 14px; line-height: 1.5; box-sizing: border-box; resize: vertical;"
            ><?php echo esc_textarea($settings['instructions'] ?? ''); ?></textarea>
            <p style="margin-top: 8px; font-size: 13px; color: #6b7280;">
                These instructions guide how your chatbot responds. Be specific about tone, style, and behavior preferences.
            </p>
        </div>

        <?php
        // Check if remove branding add-on is active
        $hasRemoveBrandingAddon = false;
        if (is_array($addOns)) {
            foreach ($addOns as $addOn) {
                if (is_array($addOn) && isset($addOn['type']) && $addOn['type'] === 'remove_branding') {
                    $hasRemoveBrandingAddon = true;
                    break;
                }
            }
        }
        ?>

        <?php if ($hasRemoveBrandingAddon): ?>
        <div class="strikebot-form-group" style="margin-top: 20px;">
            <label for="remove-branding-field" style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600;">
                <input
                    type="checkbox"
                    id="remove-branding-field"
                    <?php checked($settings['removeBranding'] ?? false); ?>
                    style="width: 18px; height: 18px; cursor: pointer;"
                />
                <span>Remove "Powered by Strikebot" branding</span>
            </label>
            <p style="margin-top: 8px; margin-left: 26px; font-size: 13px; color: #6b7280;">
                Hide the "Powered by Strikebot" text from your chatbot widget.
            </p>
        </div>
        <?php endif; ?>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <button type="button" class="button button-primary button-large" id="save-chatbot-config-btn">Save Configuration</button>
            <span id="chatbot-config-status" style="margin-left: 12px; font-size: 14px; font-weight: 500;"></span>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="strikebot-quick-actions">
        <h2>Quick Actions</h2>
        <div class="strikebot-actions-grid">
            <a href="<?php echo admin_url('admin.php?page=strikebot-knowledge'); ?>" class="strikebot-action-card">
                <span class="dashicons dashicons-database"></span>
                <span>Add Knowledge</span>
            </a>
            <a href="<?php echo admin_url('admin.php?page=strikebot-appearance'); ?>" class="strikebot-action-card">
                <span class="dashicons dashicons-admin-appearance"></span>
                <span>Customize Appearance</span>
            </a>
            <a href="<?php echo admin_url('admin.php?page=strikebot-settings'); ?>" class="strikebot-action-card">
                <span class="dashicons dashicons-admin-settings"></span>
                <span>Settings</span>
            </a>
            <a href="<?php echo home_url(); ?>" target="_blank" class="strikebot-action-card">
                <span class="dashicons dashicons-visibility"></span>
                <span>View on Site</span>
            </a>
        </div>
    </div>
</div>
