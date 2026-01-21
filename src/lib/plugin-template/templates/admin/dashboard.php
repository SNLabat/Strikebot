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
    <div class="strikebot-card" style="margin-top: 20px;">
        <h2>Chatbot Configuration</h2>
        <p class="description">Customize how your chatbot behaves and responds to users.</p>
        
        <div style="margin-top: 20px;">
            <label style="display: block; font-weight: 600; margin-bottom: 8px;">Instructions</label>
            <textarea
                id="strikebot_instructions_textarea"
                rows="8"
                placeholder="Add custom instructions for how your chatbot should behave, respond, or sound.

Examples:
- Always be professional and concise
- Use a friendly, helpful tone
- Focus on helping customers find product information
- If you don't know something, politely say so"
                style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; font-size: 14px; line-height: 1.5; box-sizing: border-box; resize: vertical;"
            ><?php echo esc_textarea($settings['instructions'] ?? ''); ?></textarea>
            <p style="margin-top: 8px; font-size: 13px; color: #6b7280;">
                These instructions guide how your chatbot responds. Be specific about tone, style, and behavior preferences.
            </p>
        </div>

        <?php if ($hasRemoveBrandingAddon): ?>
        <div style="margin-top: 20px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600;">
                <input
                    type="checkbox"
                    id="strikebot_remove_branding_checkbox"
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
            <button type="button" class="button button-primary button-large" onclick="strikebotSaveConfig()">Save Configuration</button>
            <span id="strikebot_config_status" style="margin-left: 12px; font-size: 14px; font-weight: 500;"></span>
        </div>
    </div>

    <script type="text/javascript">
    function strikebotSaveConfig() {
        console.log('strikebotSaveConfig called');
        
        var statusEl = document.getElementById('strikebot_config_status');
        var instructionsEl = document.getElementById('strikebot_instructions_textarea');
        var brandingEl = document.getElementById('strikebot_remove_branding_checkbox');
        
        var instructions = instructionsEl ? instructionsEl.value : '';
        var removeBranding = brandingEl ? brandingEl.checked : false;
        
        console.log('Instructions length:', instructions.length);
        console.log('Remove branding:', removeBranding);
        
        statusEl.innerHTML = '<span style="color: #059669;">Saving...</span>';
        
        var ajaxUrl = '<?php echo admin_url('admin-ajax.php'); ?>';
        var nonce = '<?php echo wp_create_nonce('strikebot_admin'); ?>';
        
        console.log('AJAX URL:', ajaxUrl);
        console.log('Nonce:', nonce);
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', ajaxUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                console.log('Response status:', xhr.status);
                console.log('Response text:', xhr.responseText);
                
                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        console.log('Parsed response:', response);
                        
                        if (response.success) {
                            statusEl.innerHTML = '<span style="color: #059669;">✓ Configuration saved!</span>';
                            setTimeout(function() {
                                statusEl.innerHTML = '';
                            }, 4000);
                        } else {
                            var errorMsg = response.data && response.data.message ? response.data.message : 'Failed to save';
                            statusEl.innerHTML = '<span style="color: #dc2626;">✗ ' + errorMsg + '</span>';
                        }
                    } catch (e) {
                        console.error('Parse error:', e);
                        statusEl.innerHTML = '<span style="color: #dc2626;">✗ Invalid response from server</span>';
                    }
                } else {
                    statusEl.innerHTML = '<span style="color: #dc2626;">✗ Request failed (status ' + xhr.status + ')</span>';
                }
            }
        };
        
        xhr.onerror = function() {
            console.error('XHR error');
            statusEl.innerHTML = '<span style="color: #dc2626;">✗ Network error</span>';
        };
        
        var data = 'action=strikebot_save_chatbot_config' +
                   '&nonce=' + encodeURIComponent(nonce) +
                   '&instructions=' + encodeURIComponent(instructions) +
                   '&removeBranding=' + (removeBranding ? '1' : '0');
        
        console.log('Sending request...');
        xhr.send(data);
    }
    console.log('Strikebot config script loaded');
    </script>

    <!-- Analytics Section -->
    <div class="strikebot-card" style="margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>Analytics</h2>
            <div style="display: flex; gap: 8px; align-items: center;">
                <div style="display: flex; gap: 4px; align-items: center; margin-right: 8px; padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">
                    <input type="email" id="analytics-email-input" placeholder="Email address" style="border: none; padding: 4px 8px; font-size: 13px; min-width: 200px; background: transparent; outline: none;">
                    <button type="button" class="button button-small" onclick="strikebotEmailAnalytics()" style="margin: 0; padding: 4px 12px; height: auto; font-size: 13px;">Email</button>
                </div>
                <button type="button" class="button" onclick="strikebotExportAnalytics('csv')" style="margin-right: 8px;">Export CSV</button>
                <button type="button" class="button" onclick="strikebotExportAnalytics('json')">Export JSON</button>
            </div>
        </div>
        <div id="strikebot-analytics-email-status" style="margin-bottom: 10px;"></div>
        <div id="strikebot-analytics-content">
            <p style="text-align: center; color: #666; padding: 20px;">Loading analytics...</p>
        </div>
    </div>

    <!-- Chat Logs Section -->
    <div class="strikebot-card" style="margin-top: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>Chat Logs</h2>
            <div style="display: flex; gap: 8px; align-items: center;">
                <div style="display: flex; gap: 4px; align-items: center; margin-right: 8px; padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: #f9fafb;">
                    <input type="email" id="logs-email-input" placeholder="Email address" style="border: none; padding: 4px 8px; font-size: 13px; min-width: 200px; background: transparent; outline: none;">
                    <button type="button" class="button button-small" onclick="strikebotEmailLogs()" style="margin: 0; padding: 4px 12px; height: auto; font-size: 13px;">Email</button>
                </div>
                <button type="button" class="button" onclick="strikebotExportLogs('csv')" style="margin-right: 8px;">Export CSV</button>
                <button type="button" class="button" onclick="strikebotExportLogs('json')">Export JSON</button>
            </div>
        </div>
        <div id="strikebot-logs-email-status" style="margin-bottom: 10px;"></div>
        <div id="strikebot-chat-logs-content">
            <p style="text-align: center; color: #666; padding: 20px;">Loading chat logs...</p>
        </div>
        <div id="strikebot-logs-pagination" style="margin-top: 20px; text-align: center;"></div>
    </div>

    <script type="text/javascript">
    var currentLogsPage = 1;

    function strikebotLoadAnalytics() {
        var ajaxUrl = '<?php echo admin_url('admin-ajax.php'); ?>';
        var nonce = '<?php echo wp_create_nonce('strikebot_admin'); ?>';
        var contentEl = document.getElementById('strikebot-analytics-content');

        var xhr = new XMLHttpRequest();
        xhr.open('POST', ajaxUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        var data = response.data;
                        var html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">';
                        
                        html += '<div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">';
                        html += '<div style="font-size: 32px; font-weight: 600; color: #3b82f6;">' + data.total_sessions + '</div>';
                        html += '<div style="color: #6b7280; margin-top: 8px;">Total Sessions</div>';
                        html += '</div>';
                        
                        html += '<div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">';
                        html += '<div style="font-size: 32px; font-weight: 600; color: #10b981;">' + data.total_messages + '</div>';
                        html += '<div style="color: #6b7280; margin-top: 8px;">Total Messages</div>';
                        html += '</div>';
                        
                        html += '<div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">';
                        html += '<div style="font-size: 32px; font-weight: 600; color: #f59e0b;">' + data.messages_today + '</div>';
                        html += '<div style="color: #6b7280; margin-top: 8px;">Messages Today</div>';
                        html += '</div>';
                        
                        html += '<div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">';
                        html += '<div style="font-size: 32px; font-weight: 600; color: #8b5cf6;">' + data.messages_week + '</div>';
                        html += '<div style="color: #6b7280; margin-top: 8px;">Messages This Week</div>';
                        html += '</div>';
                        
                        html += '<div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">';
                        html += '<div style="font-size: 32px; font-weight: 600; color: #ec4899;">' + data.avg_messages_per_session + '</div>';
                        html += '<div style="color: #6b7280; margin-top: 8px;">Avg per Session</div>';
                        html += '</div>';
                        
                        html += '</div>';
                        
                        // Daily messages chart (simple text representation)
                        if (data.daily_messages && data.daily_messages.length > 0) {
                            html += '<h3 style="margin-top: 30px; margin-bottom: 15px;">Messages Per Day (Last 30 Days)</h3>';
                            html += '<div style="background: #f9fafb; padding: 15px; border-radius: 8px; max-height: 300px; overflow-y: auto;">';
                            html += '<table style="width: 100%; border-collapse: collapse;">';
                            html += '<thead><tr style="border-bottom: 2px solid #e5e7eb;"><th style="text-align: left; padding: 10px;">Date</th><th style="text-align: right; padding: 10px;">Messages</th></tr></thead>';
                            html += '<tbody>';
                            for (var i = data.daily_messages.length - 1; i >= 0; i--) {
                                var day = data.daily_messages[i];
                                html += '<tr style="border-bottom: 1px solid #e5e7eb;">';
                                html += '<td style="padding: 10px;">' + day.date + '</td>';
                                html += '<td style="text-align: right; padding: 10px;">' + day.count + '</td>';
                                html += '</tr>';
                            }
                            html += '</tbody></table>';
                            html += '</div>';
                        }
                        
                        contentEl.innerHTML = html;
                    } else {
                        contentEl.innerHTML = '<p style="color: #dc2626;">Failed to load analytics</p>';
                    }
                } catch (e) {
                    console.error('Error loading analytics:', e);
                    contentEl.innerHTML = '<p style="color: #dc2626;">Error loading analytics</p>';
                }
            }
        };
        
        xhr.send('action=strikebot_get_analytics&nonce=' + encodeURIComponent(nonce));
    }

    function strikebotLoadLogs(page) {
        var ajaxUrl = '<?php echo admin_url('admin-ajax.php'); ?>';
        var nonce = '<?php echo wp_create_nonce('strikebot_admin'); ?>';
        var contentEl = document.getElementById('strikebot-chat-logs-content');
        var paginationEl = document.getElementById('strikebot-logs-pagination');

        var xhr = new XMLHttpRequest();
        xhr.open('POST', ajaxUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        var data = response.data;
                        currentLogsPage = data.page;
                        
                        if (data.logs && data.logs.length > 0) {
                            var html = '<div style="max-height: 600px; overflow-y: auto;">';
                            
                            for (var i = 0; i < data.logs.length; i++) {
                                var log = data.logs[i];
                                html += '<div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #f9fafb;">';
                                html += '<div style="display: flex; justify-content: space-between; margin-bottom: 10px;">';
                                html += '<div><strong>Session:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 12px;">' + log.session_id + '</code></div>';
                                html += '<div><strong>Messages:</strong> ' + log.message_count + ' | <strong>Last:</strong> ' + log.last_message + '</div>';
                                html += '</div>';
                                
                                html += '<div style="background: white; padding: 10px; border-radius: 6px; max-height: 200px; overflow-y: auto;">';
                                for (var j = 0; j < log.messages.length; j++) {
                                    var msg = log.messages[j];
                                    var roleClass = msg.role === 'user' ? 'user' : 'assistant';
                                    var bgColor = msg.role === 'user' ? '#e0f2fe' : '#f3f4f6';
                                    html += '<div style="margin-bottom: 8px; padding: 8px; background: ' + bgColor + '; border-radius: 4px;">';
                                    html += '<div style="font-size: 11px; color: #666; margin-bottom: 4px;"><strong>' + msg.role.toUpperCase() + '</strong> - ' + msg.created_at + '</div>';
                                    html += '<div style="font-size: 13px;">' + escapeHtml(msg.content.substring(0, 200)) + (msg.content.length > 200 ? '...' : '') + '</div>';
                                    html += '</div>';
                                }
                                html += '</div>';
                                html += '</div>';
                            }
                            
                            html += '</div>';
                            contentEl.innerHTML = html;
                            
                            // Pagination
                            if (data.total_pages > 1) {
                                var pagHtml = '<div style="display: flex; justify-content: center; gap: 10px; align-items: center;">';
                                if (data.page > 1) {
                                    pagHtml += '<button type="button" class="button" onclick="strikebotLoadLogs(' + (data.page - 1) + ')">Previous</button>';
                                }
                                pagHtml += '<span>Page ' + data.page + ' of ' + data.total_pages + ' (' + data.total + ' sessions)</span>';
                                if (data.page < data.total_pages) {
                                    pagHtml += '<button type="button" class="button" onclick="strikebotLoadLogs(' + (data.page + 1) + ')">Next</button>';
                                }
                                pagHtml += '</div>';
                                paginationEl.innerHTML = pagHtml;
                            } else {
                                paginationEl.innerHTML = '';
                            }
                        } else {
                            contentEl.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No chat logs found.</p>';
                            paginationEl.innerHTML = '';
                        }
                    } else {
                        contentEl.innerHTML = '<p style="color: #dc2626;">Failed to load chat logs</p>';
                    }
                } catch (e) {
                    console.error('Error loading logs:', e);
                    contentEl.innerHTML = '<p style="color: #dc2626;">Error loading chat logs</p>';
                }
            }
        };
        
        xhr.send('action=strikebot_get_chat_logs&nonce=' + encodeURIComponent(nonce) + '&page=' + page + '&per_page=10');
    }

    function strikebotExportLogs(format) {
        var ajaxUrl = '<?php echo admin_url('admin-ajax.php'); ?>';
        var nonce = '<?php echo wp_create_nonce('strikebot_admin'); ?>';
        window.location.href = ajaxUrl + '?action=strikebot_export_logs&nonce=' + encodeURIComponent(nonce) + '&format=' + format;
    }

    function strikebotExportAnalytics(format) {
        var ajaxUrl = '<?php echo admin_url('admin-ajax.php'); ?>';
        var nonce = '<?php echo wp_create_nonce('strikebot_admin'); ?>';
        window.location.href = ajaxUrl + '?action=strikebot_export_analytics&nonce=' + encodeURIComponent(nonce) + '&format=' + format;
    }

    function strikebotEmailLogs() {
        var emailInput = document.getElementById('logs-email-input');
        var statusEl = document.getElementById('strikebot-logs-email-status');
        var email = emailInput.value.trim();
        
        if (!email) {
            statusEl.innerHTML = '<span style="color: #dc2626;">Please enter an email address</span>';
            return;
        }
        
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            statusEl.innerHTML = '<span style="color: #dc2626;">Please enter a valid email address</span>';
            return;
        }
        
        statusEl.innerHTML = '<span style="color: #059669;">Sending email...</span>';
        
        var ajaxUrl = '<?php echo admin_url('admin-ajax.php'); ?>';
        var nonce = '<?php echo wp_create_nonce('strikebot_admin'); ?>';
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', ajaxUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            statusEl.innerHTML = '<span style="color: #059669;">✓ ' + response.data.message + '</span>';
                            emailInput.value = '';
                            setTimeout(function() {
                                statusEl.innerHTML = '';
                            }, 5000);
                        } else {
                            statusEl.innerHTML = '<span style="color: #dc2626;">✗ ' + (response.data && response.data.message ? response.data.message : 'Failed to send email') + '</span>';
                        }
                    } catch (e) {
                        console.error('Parse error:', e);
                        statusEl.innerHTML = '<span style="color: #dc2626;">✗ Invalid response from server</span>';
                    }
                } else {
                    statusEl.innerHTML = '<span style="color: #dc2626;">✗ Request failed (status ' + xhr.status + ')</span>';
                }
            }
        };
        
        xhr.onerror = function() {
            statusEl.innerHTML = '<span style="color: #dc2626;">✗ Network error</span>';
        };
        
        xhr.send('action=strikebot_email_logs&nonce=' + encodeURIComponent(nonce) + '&email=' + encodeURIComponent(email));
    }

    function strikebotEmailAnalytics() {
        var emailInput = document.getElementById('analytics-email-input');
        var statusEl = document.getElementById('strikebot-analytics-email-status');
        var email = emailInput.value.trim();
        
        if (!email) {
            statusEl.innerHTML = '<span style="color: #dc2626;">Please enter an email address</span>';
            return;
        }
        
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            statusEl.innerHTML = '<span style="color: #dc2626;">Please enter a valid email address</span>';
            return;
        }
        
        statusEl.innerHTML = '<span style="color: #059669;">Sending email...</span>';
        
        var ajaxUrl = '<?php echo admin_url('admin-ajax.php'); ?>';
        var nonce = '<?php echo wp_create_nonce('strikebot_admin'); ?>';
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', ajaxUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.success) {
                            statusEl.innerHTML = '<span style="color: #059669;">✓ ' + response.data.message + '</span>';
                            emailInput.value = '';
                            setTimeout(function() {
                                statusEl.innerHTML = '';
                            }, 5000);
                        } else {
                            statusEl.innerHTML = '<span style="color: #dc2626;">✗ ' + (response.data && response.data.message ? response.data.message : 'Failed to send email') + '</span>';
                        }
                    } catch (e) {
                        console.error('Parse error:', e);
                        statusEl.innerHTML = '<span style="color: #dc2626;">✗ Invalid response from server</span>';
                    }
                } else {
                    statusEl.innerHTML = '<span style="color: #dc2626;">✗ Request failed (status ' + xhr.status + ')</span>';
                }
            }
        };
        
        xhr.onerror = function() {
            statusEl.innerHTML = '<span style="color: #dc2626;">✗ Network error</span>';
        };
        
        xhr.send('action=strikebot_email_analytics&nonce=' + encodeURIComponent(nonce) + '&email=' + encodeURIComponent(email));
    }

    // Allow Enter key to trigger email send
    document.addEventListener('DOMContentLoaded', function() {
        var logsEmailInput = document.getElementById('logs-email-input');
        var analyticsEmailInput = document.getElementById('analytics-email-input');
        
        if (logsEmailInput) {
            logsEmailInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    strikebotEmailLogs();
                }
            });
        }
        
        if (analyticsEmailInput) {
            analyticsEmailInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    strikebotEmailAnalytics();
                }
            });
        }
    });

    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Load data on page load
    strikebotLoadAnalytics();
    strikebotLoadLogs(1);
    </script>

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
