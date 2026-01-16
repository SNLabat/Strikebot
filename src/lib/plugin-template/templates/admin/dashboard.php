<?php
if (!defined('ABSPATH')) exit;

$settings = get_option('strikebot_settings');
$config = json_decode(STRIKEBOT_CONFIG, true);

global $wpdb;
$usage_table = $wpdb->prefix . 'strikebot_usage';
$month = date('Y-m');
$usage = $wpdb->get_row($wpdb->prepare("SELECT * FROM $usage_table WHERE month = %s", $month));
$message_count = $usage ? $usage->message_count : 0;
$message_limit = $settings['limits']['messageCreditsPerMonth'] ?? 50;

$knowledge_table = $wpdb->prefix . 'strikebot_knowledge';
$knowledge_count = $wpdb->get_var("SELECT COUNT(*) FROM $knowledge_table");
$storage_used = $wpdb->get_var("SELECT SUM(LENGTH(content)) FROM $knowledge_table") ?? 0;
$storage_limit = ($settings['limits']['storageLimitMB'] ?? 0.4) * 1024 * 1024;
?>

<div class="wrap strikebot-admin">
    <h1><?php echo esc_html($settings['name'] ?? 'Strikebot'); ?> Dashboard</h1>

    <div class="strikebot-dashboard">
        <!-- Usage Stats -->
        <div class="strikebot-card">
            <h2>Usage This Month</h2>
            <div class="strikebot-stat">
                <div class="strikebot-stat-value"><?php echo number_format($message_count); ?></div>
                <div class="strikebot-stat-label">of <?php echo number_format($message_limit); ?> messages</div>
                <div class="strikebot-progress">
                    <div class="strikebot-progress-bar" style="width: <?php echo min(100, ($message_count / $message_limit) * 100); ?>%"></div>
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
