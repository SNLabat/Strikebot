<?php
if (!defined('ABSPATH')) exit;

$settings = get_option('strikebot_settings');

global $wpdb;
$table = $wpdb->prefix . 'strikebot_knowledge';
$items = $wpdb->get_results("SELECT * FROM $table ORDER BY created_at DESC");

$storage_used = $wpdb->get_var("SELECT SUM(LENGTH(content)) FROM $table") ?? 0;
$storage_limit = ($settings['limits']['storageLimitMB'] ?? 0.4) * 1024 * 1024;

$link_count = $wpdb->get_var("SELECT COUNT(*) FROM $table WHERE type IN ('url', 'sitemap')");
$link_limit = $settings['limits']['linkTrainingLimit'];
?>

<div class="wrap strikebot-admin">
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
                        <?php foreach ($items as $item): ?>
                        <tr data-id="<?php echo esc_attr($item->id); ?>">
                            <td><?php echo esc_html($item->name); ?></td>
                            <td>
                                <span class="strikebot-badge strikebot-badge-<?php echo esc_attr($item->type); ?>">
                                    <?php echo esc_html(ucfirst($item->type)); ?>
                                </span>
                            </td>
                            <td><?php echo size_format(strlen($item->content)); ?></td>
                            <td><?php echo human_time_diff(strtotime($item->created_at), current_time('timestamp')) . ' ago'; ?></td>
                            <td>
                                <button class="button button-small strikebot-view-item" data-id="<?php echo esc_attr($item->id); ?>">View</button>
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
