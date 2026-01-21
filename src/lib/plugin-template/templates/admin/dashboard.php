<?php
if (!defined('ABSPATH')) exit;

$settings = get_option('strikebot_settings');
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
            <a href="<?php echo admin_url('admin.php?page=strikebot-knowledge'); ?>" class="button button-primary">Manage Knowledge Base</a>
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
                <?php if (($settings['limits']['aiActionsPerAgent'] ?? 0) > 0): ?>
                <div class="strikebot-feature">
                    <span class="dashicons dashicons-yes-alt"></span>
                    <span><?php echo $settings['limits']['aiActionsPerAgent']; ?> AI actions</span>
                </div>
                <?php endif; ?>
                <?php if (($settings['features']['integrations'] ?? false)): ?>
                <div class="strikebot-feature">
                    <span class="dashicons dashicons-yes-alt"></span>
                    <span>Integrations enabled</span>
                </div>
                <?php endif; ?>
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
