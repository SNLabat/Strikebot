<?php
if (!defined('ABSPATH')) exit;

$settings = get_option('strikebot_settings');
$admin_theme = get_option('strikebot_admin_theme', 'light');
$admin_theme_class = $admin_theme === 'dark' ? 'strikebot-dark-mode' : '';

global $wpdb;
$table = $wpdb->prefix . 'strikebot_knowledge';
$items = $wpdb->get_results("SELECT * FROM $table ORDER BY created_at DESC");

$storage_used = $wpdb->get_var("SELECT SUM(LENGTH(content)) FROM $table") ?? 0;
$storage_limit = ($settings['limits']['storageLimitMB'] ?? 0.4) * 1024 * 1024;

$link_count = $wpdb->get_var("SELECT COUNT(*) FROM $table WHERE type IN ('url', 'sitemap')");
$link_limit = $settings['limits']['linkTrainingLimit'];
?>

<div class="wrap strikebot-admin <?php echo esc_attr($admin_theme_class); ?>">
    <h1>Knowledge Base</h1>
    <p class="description">Train your chatbot by adding content from various sources. The chatbot will use this information to answer questions.</p>

    <!-- Storage Info -->
    <div class="strikebot-storage-info">
        <strong>Storage:</strong> <?php echo size_format($storage_used); ?> / <?php echo size_format($storage_limit); ?>
        <?php if ($link_limit !== null): ?>
        | <strong>Links:</strong> <?php echo $link_count; ?> / <?php echo $link_limit; ?>
        <?php endif; ?>
    </div>

    <div class="strikebot-knowledge-layout">
        <!-- Add Knowledge Form -->
        <div class="strikebot-knowledge-form strikebot-card">
            <h2>Add Knowledge</h2>

            <div class="strikebot-tabs">
                <button class="strikebot-tab active" data-tab="sitemap">Sitemap</button>
                <button class="strikebot-tab" data-tab="url">Website URL</button>
                <button class="strikebot-tab" data-tab="file">File Upload</button>
                <button class="strikebot-tab" data-tab="text">Text</button>
                <button class="strikebot-tab" data-tab="qa">Q&A</button>
            </div>

            <!-- Sitemap Tab -->
            <div class="strikebot-tab-content active" id="tab-sitemap">
                <form id="strikebot-sitemap-form">
                    <div class="strikebot-form-group">
                        <label for="sitemap-url">Sitemap URL</label>
                        <input type="url" id="sitemap-url" placeholder="https://example.com/sitemap.xml" required>
                    </div>
                    <button type="submit" class="button button-primary">Crawl Sitemap</button>
                </form>
                <div id="sitemap-results" class="strikebot-results hidden">
                    <h4>Found URLs:</h4>
                    <div class="strikebot-url-list"></div>
                    <button id="crawl-selected" class="button button-primary">Crawl Selected URLs</button>
                </div>
            </div>

            <!-- URL Tab -->
            <div class="strikebot-tab-content" id="tab-url">
                <form id="strikebot-url-form">
                    <div class="strikebot-form-group">
                        <label for="page-url">Website URL</label>
                        <input type="url" id="page-url" placeholder="https://example.com/page" required>
                    </div>
                    <div class="strikebot-form-group">
                        <label for="url-name">Name (optional)</label>
                        <input type="text" id="url-name" placeholder="Page name">
                    </div>
                    <button type="submit" class="button button-primary">Crawl URL</button>
                </form>
            </div>

            <!-- File Tab -->
            <div class="strikebot-tab-content" id="tab-file">
                <form id="strikebot-file-form">
                    <div class="strikebot-form-group">
                        <label for="file-upload">Upload File</label>
                        <input type="file" id="file-upload" accept=".txt,.pdf,.doc,.docx" required>
                        <p class="description">Supported formats: TXT, PDF, DOC, DOCX</p>
                    </div>
                    <div class="strikebot-form-group">
                        <label for="file-name">Name (optional)</label>
                        <input type="text" id="file-name" placeholder="Document name">
                    </div>
                    <button type="submit" class="button button-primary">Upload & Process</button>
                </form>
            </div>

            <!-- Text Tab -->
            <div class="strikebot-tab-content" id="tab-text">
                <form id="strikebot-text-form">
                    <div class="strikebot-form-group">
                        <label for="text-name">Name</label>
                        <input type="text" id="text-name" placeholder="Knowledge item name" required>
                    </div>
                    <div class="strikebot-form-group">
                        <label for="text-content">Content</label>
                        <textarea id="text-content" rows="10" placeholder="Paste your text content here..." required></textarea>
                    </div>
                    <button type="submit" class="button button-primary">Add Text</button>
                </form>
            </div>

            <!-- Q&A Tab -->
            <div class="strikebot-tab-content" id="tab-qa">
                <form id="strikebot-qa-form">
                    <div class="strikebot-form-group">
                        <label for="qa-question">Question</label>
                        <input type="text" id="qa-question" placeholder="What is your return policy?" required>
                    </div>
                    <div class="strikebot-form-group">
                        <label for="qa-answer">Answer</label>
                        <textarea id="qa-answer" rows="5" placeholder="We offer a 30-day return policy..." required></textarea>
                    </div>
                    <button type="submit" class="button button-primary">Add Q&A</button>
                </form>
            </div>
        </div>

        <!-- Knowledge List -->
        <div class="strikebot-knowledge-list strikebot-card">
            <h2>Knowledge Items (<?php echo count($items); ?>)</h2>

            <?php if (empty($items)): ?>
                <div class="strikebot-empty">
                    <span class="dashicons dashicons-database"></span>
                    <p>No knowledge items yet. Add some content to train your chatbot.</p>
                </div>
            <?php else: ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Added</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($items as $item): 
                            $content_length = strlen($item->content);
                            $has_content = $content_length > 0;
                            $preview = $has_content ? esc_attr(substr($item->content, 0, 100)) . ($content_length > 100 ? '...' : '') : 'No content';
                        ?>
                        <tr data-id="<?php echo esc_attr($item->id); ?>">
                            <td>
                                <?php echo esc_html($item->name); ?>
                                <?php if (!$has_content): ?>
                                <span style="color: red; font-size: 11px;"> (empty)</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <span class="strikebot-badge strikebot-badge-<?php echo esc_attr($item->type); ?>">
                                    <?php echo esc_html(ucfirst($item->type)); ?>
                                </span>
                            </td>
                            <td title="<?php echo $preview; ?>"><?php echo size_format($content_length); ?></td>
                            <td><?php echo human_time_diff(strtotime($item->created_at), current_time('timestamp')) . ' ago'; ?></td>
                            <td>
                                <button class="button button-small strikebot-view-item" data-id="<?php echo esc_attr($item->id); ?>" title="Content: <?php echo $content_length; ?> bytes">View</button>
                                <button class="button button-small button-link-delete strikebot-delete-item" data-id="<?php echo esc_attr($item->id); ?>">Delete</button>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- View Modal -->
<div id="strikebot-view-modal" class="strikebot-modal hidden">
    <div class="strikebot-modal-content">
        <span class="strikebot-modal-close">&times;</span>
        <h2 id="modal-title"></h2>
        <div id="modal-content"></div>
    </div>
</div>

<!-- Debug Info (collapse by default) -->
<div class="strikebot-card" style="margin-top: 20px;">
    <details>
        <summary style="cursor: pointer; font-weight: bold; padding: 10px;">Debug Info (click to expand)</summary>
        <div style="padding: 15px; background: #f9f9f9; border-radius: 4px; margin-top: 10px;">
            <p><strong>AJAX URL:</strong> <?php echo admin_url('admin-ajax.php'); ?></p>
            <p><strong>Nonce:</strong> <?php echo wp_create_nonce('strikebot_admin'); ?></p>
            <p><strong>Table:</strong> <?php echo $wpdb->prefix; ?>strikebot_knowledge</p>
            <p><strong>Total Items:</strong> <?php echo count($items); ?></p>
            <p><strong>Items with content:</strong> <?php 
                $with_content = 0;
                foreach ($items as $item) {
                    if (strlen($item->content) > 0) $with_content++;
                }
                echo $with_content;
            ?></p>
            
            <h4 style="margin-top: 15px;">Content by Type:</h4>
            <?php
            $by_type = array();
            foreach ($items as $item) {
                $type = $item->type;
                if (!isset($by_type[$type])) {
                    $by_type[$type] = array('count' => 0, 'total_bytes' => 0, 'empty' => 0);
                }
                $by_type[$type]['count']++;
                $by_type[$type]['total_bytes'] += strlen($item->content);
                if (strlen($item->content) == 0) {
                    $by_type[$type]['empty']++;
                }
            }
            ?>
            <table class="widefat" style="font-size: 12px; margin-bottom: 15px;">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Count</th>
                        <th>Total Content</th>
                        <th>Empty Items</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($by_type as $type => $stats): ?>
                    <tr>
                        <td><strong><?php echo esc_html(ucfirst($type)); ?></strong></td>
                        <td><?php echo $stats['count']; ?></td>
                        <td><?php echo size_format($stats['total_bytes']); ?></td>
                        <td><?php echo $stats['empty']; ?></td>
                        <td>
                            <?php if ($stats['empty'] == $stats['count']): ?>
                                <span style="color: red;">⚠️ ALL EMPTY - Content not being saved!</span>
                            <?php elseif ($stats['empty'] > 0): ?>
                                <span style="color: orange;">⚠️ Some empty items</span>
                            <?php else: ?>
                                <span style="color: green;">✓ All have content</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
            <h4>Raw Database Content Preview:</h4>
            <table class="widefat" style="font-size: 12px;">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Content Length</th>
                        <th>Content Preview (first 200 chars)</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($items as $item): 
                        $content_len = strlen($item->content);
                        $is_empty = $content_len == 0;
                    ?>
                    <tr style="<?php echo $is_empty ? 'background: #ffe0e0;' : ''; ?>">
                        <td><?php echo $item->id; ?></td>
                        <td><?php echo esc_html(substr($item->name, 0, 50)); ?></td>
                        <td><?php echo esc_html($item->type); ?></td>
                        <td>
                            <?php echo $content_len; ?> bytes
                            <?php if ($is_empty): ?>
                                <span style="color: red;">(EMPTY!)</span>
                            <?php endif; ?>
                        </td>
                        <td style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            <?php if ($is_empty): ?>
                                <span style="color: red;">No content saved</span>
                            <?php else: ?>
                                <?php echo esc_html(substr($item->content, 0, 200)); ?>
                                <?php if ($content_len > 200) echo '...'; ?>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
            <h4 style="margin-top: 15px;">Test AJAX Endpoints:</h4>
            <button type="button" id="test-ajax-endpoint" class="button">Test get_knowledge Endpoint</button>
            <button type="button" id="test-context-endpoint" class="button" style="margin-left: 10px;">Test Context Builder</button>
            <div id="ajax-test-result" style="margin-top: 10px; padding: 10px; background: #fff; border: 1px solid #ddd; display: none;"></div>
        </div>
    </details>
</div>

<script>
jQuery(document).ready(function($) {
    $('#test-ajax-endpoint').on('click', function() {
        var $result = $('#ajax-test-result');
        $result.show().html('Testing...');
        
        // Get the first item ID
        var firstId = $('tr[data-id]').first().data('id');
        if (!firstId) {
            $result.html('<span style="color: red;">No items to test with</span>');
            return;
        }
        
        console.log('Testing AJAX with ID:', firstId);
        console.log('AJAX URL:', strikebotAdmin.ajaxUrl);
        console.log('Nonce:', strikebotAdmin.nonce);
        
        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_get_knowledge',
                nonce: strikebotAdmin.nonce,
                id: firstId
            },
            success: function(response) {
                console.log('Test response:', response);
                if (response === 0 || response === '0') {
                    $result.html('<span style="color: red;"><strong>FAILED:</strong> Endpoint returned 0. The get_knowledge AJAX action is not registered. Please regenerate the plugin.</span>');
                } else if (response && response.success) {
                    var contentPreview = response.data.content ? response.data.content.substring(0, 200) : 'No content';
                    $result.html('<span style="color: green;"><strong>SUCCESS!</strong></span><br>Name: ' + response.data.name + '<br>Content length: ' + (response.data.content ? response.data.content.length : 0) + '<br>Preview: ' + contentPreview);
                } else {
                    $result.html('<span style="color: red;"><strong>FAILED:</strong> ' + (response.data ? response.data.message : 'Unknown error') + '</span><br>Raw response: ' + JSON.stringify(response));
                }
            },
            error: function(xhr, status, error) {
                console.log('Test error:', xhr, status, error);
                $result.html('<span style="color: red;"><strong>AJAX ERROR:</strong> ' + status + ' - ' + error + '</span><br>Response: ' + xhr.responseText);
            }
        });
    });
    
    $('#test-context-endpoint').on('click', function() {
        var $result = $('#ajax-test-result');
        $result.show().html('Testing context builder...');
        
        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_debug_context',
                nonce: strikebotAdmin.nonce
            },
            success: function(response) {
                console.log('Context debug response:', response);
                if (response && response.success && response.data) {
                    var d = response.data;
                    var html = '<span style="color: green;"><strong>SUCCESS!</strong></span><br>';
                    html += '<strong>Items in database:</strong> ' + d.items_count + '<br>';
                    html += '<strong>Context length:</strong> ' + d.context_length + ' characters<br><br>';
                    
                    html += '<strong>Items breakdown:</strong><br>';
                    if (d.items && d.items.length > 0) {
                        d.items.forEach(function(item) {
                            html += '- [' + item.type + '] ' + item.name + ': ' + item.content_length + ' bytes';
                            if (item.content_length == 0) {
                                html += ' <span style="color: red;">(EMPTY!)</span>';
                            }
                            html += '<br>';
                        });
                    }
                    
                    html += '<br><strong>Context preview (first 1000 chars):</strong><br>';
                    html += '<pre style="background: #f5f5f5; padding: 10px; max-height: 300px; overflow: auto; white-space: pre-wrap;">' + (d.context_preview || 'No context built').substring(0, 1000) + '</pre>';
                    
                    $result.html(html);
                } else {
                    $result.html('<span style="color: red;"><strong>FAILED:</strong> ' + (response.data ? response.data.message : 'Unknown error') + '</span>');
                }
            },
            error: function(xhr, status, error) {
                $result.html('<span style="color: red;"><strong>AJAX ERROR:</strong> ' + status + ' - ' + error + '</span>');
            }
        });
    });
});
</script>
