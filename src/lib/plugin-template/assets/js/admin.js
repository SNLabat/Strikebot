/**
 * Strikebot Admin JavaScript
 */
(function($) {
    'use strict';

    console.log('Strikebot Admin JS loaded');

    // Helper function: Normalize URL for duplicate detection (matches PHP normalize_url function)
    function normalizeUrl(url) {
        if (!url) return '';

        try {
            const urlObj = new URL(url);

            // Remove www. prefix
            let host = urlObj.hostname.toLowerCase();
            if (host.startsWith('www.')) {
                host = host.substring(4);
            }

            // Remove trailing slash from path
            let path = urlObj.pathname;
            if (path.endsWith('/') && path.length > 1) {
                path = path.slice(0, -1);
            }

            // Rebuild URL without query/fragment
            const normalized = urlObj.protocol + '//' + host + path;
            return normalized.toLowerCase();
        } catch (e) {
            // Fallback for invalid URLs
            return url.toLowerCase().replace(/\/$/, '').replace(/^www\./, '');
        }
    }

    // Helper function: Remove duplicate URLs before crawling
    function deduplicateUrls(urlList) {
        const seen = new Map(); // Map normalized URL to original URL
        const unique = [];
        const duplicates = [];

        urlList.forEach(url => {
            const normalized = normalizeUrl(url);
            if (!seen.has(normalized)) {
                seen.set(normalized, url);
                unique.push(url);
            } else {
                const originalUrl = seen.get(normalized);
                duplicates.push({
                    url: url,
                    normalized: normalized,
                    conflictsWith: originalUrl
                });
            }
        });

        if (duplicates.length > 0) {
            console.group('🔍 Pre-crawl Duplicate Detection');
            console.log('Found ' + duplicates.length + ' duplicate URLs in sitemap:');
            duplicates.forEach((dup, index) => {
                console.log((index + 1) + '. ' + dup.url);
                console.log('   Normalized: ' + dup.normalized);
                console.log('   Conflicts with: ' + dup.conflictsWith);
            });
            console.groupEnd();
        }

        return unique;
    }

    // Theme Toggle
    $('#strikebot-theme-toggle').on('click', function() {
        const $toggle = $(this);
        const currentTheme = $toggle.data('theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        const $admin = $('.strikebot-admin');
        
        // Update UI immediately for instant feedback
        if (newTheme === 'dark') {
            $admin.addClass('strikebot-dark-mode');
            $toggle.find('.dashicons').removeClass('dashicons-moon').addClass('dashicons-sun');
            $toggle.find('span:last').text('Light Mode');
        } else {
            $admin.removeClass('strikebot-dark-mode');
            $toggle.find('.dashicons').removeClass('dashicons-sun').addClass('dashicons-moon');
            $toggle.find('span:last').text('Dark Mode');
        }
        $toggle.data('theme', newTheme);
        
        // Save preference
        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_save_admin_theme',
                nonce: strikebotAdmin.nonce,
                theme: newTheme
            },
            success: function(response) {
                if (!response.success) {
                    console.error('Failed to save theme preference');
                }
            }
        });
    });

    // Tab functionality
    $('.strikebot-tab').on('click', function() {
        const tab = $(this).data('tab');

        $('.strikebot-tab').removeClass('active');
        $(this).addClass('active');

        $('.strikebot-tab-content').removeClass('active');
        $('#tab-' + tab).addClass('active');
    });

    // Sitemap form
    $('#strikebot-sitemap-form').on('submit', function(e) {
        e.preventDefault();

        const url = $('#sitemap-url').val();
        const $btn = $(this).find('button[type="submit"]');
        const originalText = $btn.text();

        $btn.prop('disabled', true).text('Crawling...');

        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_crawl_sitemap',
                nonce: strikebotAdmin.nonce,
                url: url
            },
            success: function(response) {
                if (response.success) {
                    const $results = $('#sitemap-results');
                    const $list = $results.find('.strikebot-url-list');

                    // Deduplicate URLs before displaying
                    const originalCount = response.data.urls.length;
                    const uniqueUrls = deduplicateUrls(response.data.urls);
                    const duplicatesFound = originalCount - uniqueUrls.length;

                    $list.empty();

                    // Show deduplication message if duplicates were found
                    if (duplicatesFound > 0) {
                        $list.append(
                            '<div class="strikebot-info-message" style="background: #fff3cd; padding: 12px; margin-bottom: 12px; border-radius: 4px; border-left: 4px solid #ffc107;">' +
                                '<strong>Note:</strong> Found ' + duplicatesFound + ' duplicate URL' + (duplicatesFound > 1 ? 's' : '') + ' in sitemap (already filtered out). ' +
                                'Showing ' + uniqueUrls.length + ' unique URLs.' +
                            '</div>'
                        );
                    }

                    uniqueUrls.forEach(function(url) {
                        $list.append(
                            '<div class="strikebot-url-item">' +
                                '<input type="checkbox" class="sitemap-url-checkbox" value="' + url + '" checked>' +
                                '<span>' + url + '</span>' +
                            '</div>'
                        );
                    });

                    $results.removeClass('hidden');
                } else {
                    alert(response.data.message || 'Error crawling sitemap');
                }
            },
            error: function() {
                alert('Error crawling sitemap');
            },
            complete: function() {
                $btn.prop('disabled', false).text(originalText);
            }
        });
    });

    // Crawl selected URLs from sitemap
    $('#crawl-selected').on('click', function() {
        const urls = [];
        $('.sitemap-url-checkbox:checked').each(function() {
            urls.push($(this).val());
        });

        if (urls.length === 0) {
            alert('Please select at least one URL');
            return;
        }

        const $btn = $(this);
        $btn.prop('disabled', true).text('Crawling 0/' + urls.length + ' URLs...');

        let completed = 0;
        let saved = 0;
        let failed = 0;
        let skipped = 0;
        const errors = [];
        const skipped_urls = [];
        
        function updateStatus() {
            let statusText = 'Processing ' + completed + '/' + urls.length + ' (Saved: ' + saved;
            if (skipped > 0) statusText += ', Skipped: ' + skipped;
            if (failed > 0) statusText += ', Failed: ' + failed;
            statusText += ')';
            $btn.text(statusText);
        }
        
        function checkComplete() {
            if (completed === urls.length) {
                $btn.prop('disabled', false).text('Crawl Selected URLs');

                // Build detailed copyable report
                let message = 'CRAWL COMPLETE REPORT\n';
                message += '='.repeat(60) + '\n\n';
                message += 'SUMMARY:\n';
                message += '  Saved: ' + saved + '\n';
                message += '  Skipped (duplicates): ' + skipped + '\n';
                message += '  Failed: ' + failed + '\n';
                message += '  Total: ' + urls.length + '\n';

                if (skipped > 0 && skipped_urls.length > 0) {
                    message += '\n' + '='.repeat(60) + '\n';
                    message += 'DUPLICATE URLs (' + skipped_urls.length + '):\n';
                    message += '='.repeat(60) + '\n';
                    skipped_urls.forEach(function(item, index) {
                        message += (index + 1) + '. ' + item + '\n';
                    });
                }

                if (failed > 0 && errors.length > 0) {
                    message += '\n' + '='.repeat(60) + '\n';
                    message += 'ERRORS (' + errors.length + '):\n';
                    message += '='.repeat(60) + '\n';
                    errors.forEach(function(item, index) {
                        message += (index + 1) + '. ' + item + '\n';
                    });
                }

                message += '\n' + '='.repeat(60) + '\n';
                message += 'Generated: ' + new Date().toLocaleString() + '\n';

                // Show copyable modal
                showCopyableReport('Crawl Complete', message);

                if (saved > 0) {
                    setTimeout(function() {
                        location.reload();
                    }, 500);
                }
            }
        }

        // Show copyable report modal
        function showCopyableReport(title, content) {
            const modal = $('<div class="strikebot-modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 999999; display: flex; align-items: center; justify-content: center;"></div>');
            const modalContent = $('<div class="strikebot-modal" style="background: white; border-radius: 8px; width: 90%; max-width: 700px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"></div>');

            modalContent.html(
                '<div class="strikebot-modal-header" style="padding: 20px; border-bottom: 1px solid #ddd; display: flex; align-items: center; justify-content: space-between;">' +
                    '<h3 style="margin: 0; font-size: 18px;">' + title + '</h3>' +
                    '<button class="strikebot-modal-close" style="background: none; border: none; font-size: 28px; cursor: pointer; color: #666; line-height: 1; padding: 0; width: 30px; height: 30px;">&times;</button>' +
                '</div>' +
                '<div class="strikebot-modal-body" style="padding: 20px; flex: 1; overflow: auto;">' +
                    '<textarea readonly class="strikebot-report-text" style="width: 100%; height: 400px; font-family: Monaco, Consolas, monospace; font-size: 12px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; resize: vertical; background: #f8f9fa;">' + content + '</textarea>' +
                '</div>' +
                '<div class="strikebot-modal-footer" style="padding: 20px; border-top: 1px solid #ddd; display: flex; gap: 10px; justify-content: flex-end;">' +
                    '<button class="button button-primary strikebot-copy-btn">📋 Copy to Clipboard</button>' +
                    '<button class="button strikebot-close-btn">Close</button>' +
                '</div>'
            );
            modal.append(modalContent);
            $('body').append(modal);

            // Copy button
            modal.find('.strikebot-copy-btn').on('click', function() {
                const textarea = modal.find('textarea')[0];
                textarea.select();
                textarea.setSelectionRange(0, 99999); // For mobile
                try {
                    document.execCommand('copy');
                    $(this).html('✓ Copied!').prop('disabled', true);
                    setTimeout(function() {
                        modal.find('.strikebot-copy-btn').html('📋 Copy to Clipboard').prop('disabled', false);
                    }, 2000);
                } catch (err) {
                    alert('Failed to copy. Please select and copy manually.');
                }
            });

            // Close buttons
            modal.find('.strikebot-modal-close, .strikebot-close-btn').on('click', function() {
                modal.remove();
            });

            // Close on overlay click
            modal.on('click', function(e) {
                if ($(e.target).hasClass('strikebot-modal-overlay')) {
                    modal.remove();
                }
            });

            // ESC key to close
            $(document).on('keydown.strikebot-modal', function(e) {
                if (e.key === 'Escape') {
                    modal.remove();
                    $(document).off('keydown.strikebot-modal');
                }
            });
        }

        // Log all URLs with their normalized versions before starting
        console.group('📋 URLs to Crawl (' + urls.length + ' total)');
        urls.forEach((url, index) => {
            console.log((index + 1) + '. ' + url + ' → ' + normalizeUrl(url));
        });
        console.groupEnd();

        // Process URLs sequentially to avoid overwhelming the server
        function processUrl(index) {
            if (index >= urls.length) {
                return;
            }

            const url = urls[index];
            console.log('🔄 Crawling URL ' + (index + 1) + '/' + urls.length + ':', url);
            
            $.ajax({
                url: strikebotAdmin.ajaxUrl,
                method: 'POST',
                timeout: 30000,
                data: {
                    action: 'strikebot_crawl_url',
                    nonce: strikebotAdmin.nonce,
                    url: url
                },
                success: function(response) {
                    console.log('Crawl response for', url, ':', response);
                    
                    if (response && response.success && response.data && response.data.content) {
                        const content = response.data.content;
                        console.log('Content length for', url, ':', content.length);
                        
                        // Save the content
                        $.ajax({
                            url: strikebotAdmin.ajaxUrl,
                            method: 'POST',
                            timeout: 60000,
                            data: {
                                action: 'strikebot_save_knowledge',
                                nonce: strikebotAdmin.nonce,
                                type: 'url',
                                name: url,
                                content: content,
                                metadata: JSON.stringify({ from_sitemap: true, crawled_url: url, content_length: content.length })
                            },
                            success: function(saveResponse) {
                                console.log('Save response for', url, ':', saveResponse);
                                
                                if (saveResponse && saveResponse.success) {
                                    saved++;
                                    console.log('Successfully saved:', url);
                                } else {
                                    // Check if it's a duplicate
                                    if (saveResponse && saveResponse.data && saveResponse.data.is_duplicate) {
                                        skipped++;

                                        // Get detailed duplicate information
                                        let duplicateInfo = url + '\n';
                                        if (saveResponse.data.debug) {
                                            const debug = saveResponse.data.debug;
                                            duplicateInfo += '  → Normalized to: ' + (debug.attempted_normalized || 'N/A') + '\n';
                                            duplicateInfo += '  → Conflicts with: ' + (debug.existing_name || 'N/A') + ' (ID: ' + (debug.existing_id || 'N/A') + ')';
                                        } else {
                                            duplicateInfo += '  → Reason: ' + (saveResponse.data.message || 'Already exists');
                                        }

                                        skipped_urls.push(duplicateInfo);
                                        console.warn('❌ DUPLICATE:', url, saveResponse.data.debug || saveResponse.data.message);
                                    } else {
                                        failed++;
                                        const errorMsg = (saveResponse && saveResponse.data && saveResponse.data.message) ? saveResponse.data.message : 'Unknown save error';
                                        errors.push(url + ': ' + errorMsg);
                                        console.error('Save failed for', url, ':', errorMsg);
                                    }
                                }
                            },
                            error: function(xhr, status, error) {
                                failed++;
                                errors.push(url + ': Save error - ' + (error || status));
                                console.error('Save AJAX error for', url, ':', status, error);
                            },
                            complete: function() {
                                completed++;
                                updateStatus();
                                checkComplete();
                                // Process next URL
                                processUrl(index + 1);
                            }
                        });
                    } else {
                        failed++;
                        const errorMsg = (response && response.data && response.data.message) ? response.data.message : 'No content retrieved';
                        errors.push(url + ': ' + errorMsg);
                        console.error('Crawl failed for', url, ':', errorMsg);
                        completed++;
                        updateStatus();
                        checkComplete();
                        processUrl(index + 1);
                    }
                },
                error: function(xhr, status, error) {
                    failed++;
                    errors.push(url + ': Crawl error - ' + (error || status));
                    console.error('Crawl AJAX error for', url, ':', status, error);
                    completed++;
                    updateStatus();
                    checkComplete();
                    processUrl(index + 1);
                }
            });
        }
        
        // Start processing URLs sequentially (one at a time to avoid duplicates)
        processUrl(0);
    });

    // URL form
    $('#strikebot-url-form').on('submit', function(e) {
        e.preventDefault();

        const url = $('#page-url').val();
        const name = $('#url-name').val() || url;
        const $btn = $(this).find('button[type="submit"]');
        const originalText = $btn.text();

        $btn.prop('disabled', true).text('Crawling...');

        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_crawl_url',
                nonce: strikebotAdmin.nonce,
                url: url
            },
            success: function(response) {
                if (response.success) {
                    // Save the content
                    $.ajax({
                        url: strikebotAdmin.ajaxUrl,
                        method: 'POST',
                        data: {
                            action: 'strikebot_save_knowledge',
                            nonce: strikebotAdmin.nonce,
                            type: 'url',
                            name: name,
                            content: response.data.content
                        },
                        success: function(saveResponse) {
                            if (saveResponse.success) {
                                alert('URL crawled and saved successfully!');
                                location.reload();
                            } else {
                                const errorMsg = saveResponse.data && saveResponse.data.message ? saveResponse.data.message : 'Error saving content';
                                if (saveResponse.data && saveResponse.data.is_duplicate) {
                                    alert('This URL already exists in the knowledge base.\n\n' + errorMsg);
                                } else {
                                    alert('Error saving content: ' + errorMsg);
                                }
                            }
                        }
                    });
                } else {
                    alert(response.data.message || 'Error crawling URL');
                }
            },
            error: function() {
                alert('Error crawling URL');
            },
            complete: function() {
                $btn.prop('disabled', false).text(originalText);
            }
        });
    });

    // File upload form
    $('#strikebot-file-form').on('submit', function(e) {
        e.preventDefault();

        const fileInput = document.getElementById('file-upload');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select a file');
            return;
        }

        const name = $('#file-name').val() || file.name;
        const $btn = $(this).find('button[type="submit"]');
        const originalText = $btn.text();

        $btn.prop('disabled', true).text('Processing...');

        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            
            console.log('File content loaded:', {
                name: name,
                contentLength: content.length,
                contentPreview: content.substring(0, 200)
            });

            if (!content || content.length === 0) {
                alert('Error: File appears to be empty');
                $btn.prop('disabled', false).text(originalText);
                return;
            }

            $btn.text('Saving ' + Math.round(content.length / 1024) + ' KB...');

            $.ajax({
                url: strikebotAdmin.ajaxUrl,
                method: 'POST',
                data: {
                    action: 'strikebot_save_knowledge',
                    nonce: strikebotAdmin.nonce,
                    type: 'file',
                    name: name,
                    content: content,
                    metadata: JSON.stringify({
                        fileType: file.type,
                        fileSize: file.size,
                        originalLength: content.length
                    })
                },
                timeout: 60000, // 60 second timeout for large files
                success: function(response, textStatus, xhr) {
                    console.log('Save response:', response);
                    
                    if (response === 0 || response === '0') {
                        alert('Error: AJAX endpoint not found. Please regenerate and reinstall the plugin.');
                        return;
                    }
                    
                    if (response && response.success) {
                        alert('File uploaded successfully! ID: ' + (response.data ? response.data.id : 'unknown'));
                        location.reload();
                    } else {
                        const errorMsg = (response && response.data && response.data.message) ? response.data.message : 'Unknown error saving file';
                        alert('Error: ' + errorMsg);
                        console.error('Save failed:', response);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('AJAX error saving file:', { status: status, error: error, response: xhr.responseText });
                    let errorMsg = 'Error uploading file: ';
                    if (status === 'timeout') {
                        errorMsg += 'Request timed out. File may be too large.';
                    } else if (xhr.status === 413) {
                        errorMsg += 'File too large. Server rejected the upload.';
                    } else {
                        errorMsg += (error || status || 'Unknown error');
                    }
                    alert(errorMsg);
                },
                complete: function() {
                    $btn.prop('disabled', false).text(originalText);
                }
            });
        };
        
        reader.onerror = function(e) {
            console.error('FileReader error:', e);
            alert('Error reading file. Please try again.');
            $btn.prop('disabled', false).text(originalText);
        };

        reader.readAsText(file);
    });

    // Text form
    $('#strikebot-text-form').on('submit', function(e) {
        e.preventDefault();

        const name = $('#text-name').val();
        const content = $('#text-content').val();
        const $btn = $(this).find('button[type="submit"]');
        const originalText = $btn.text();

        $btn.prop('disabled', true).text('Saving...');

        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_save_knowledge',
                nonce: strikebotAdmin.nonce,
                type: 'text',
                name: name,
                content: content
            },
            success: function(response) {
                if (response.success) {
                    alert('Text added successfully!');
                    location.reload();
                } else {
                    alert(response.data.message || 'Error saving text');
                }
            },
            error: function() {
                alert('Error saving text');
            },
            complete: function() {
                $btn.prop('disabled', false).text(originalText);
            }
        });
    });

    // Q&A form
    $('#strikebot-qa-form').on('submit', function(e) {
        e.preventDefault();

        const question = $('#qa-question').val();
        const answer = $('#qa-answer').val();
        const $btn = $(this).find('button[type="submit"]');
        const originalText = $btn.text();

        $btn.prop('disabled', true).text('Saving...');

        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_save_knowledge',
                nonce: strikebotAdmin.nonce,
                type: 'qa',
                name: question,
                content: 'Q: ' + question + '\nA: ' + answer,
                metadata: JSON.stringify({
                    question: question,
                    answer: answer
                })
            },
            success: function(response) {
                if (response.success) {
                    alert('Q&A added successfully!');
                    location.reload();
                } else {
                    alert(response.data.message || 'Error saving Q&A');
                }
            },
            error: function() {
                alert('Error saving Q&A');
            },
            complete: function() {
                $btn.prop('disabled', false).text(originalText);
            }
        });
    });

    // Delete knowledge item
    $('.strikebot-delete-item').on('click', function() {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }

        const id = $(this).data('id');
        const $row = $(this).closest('tr');

        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_delete_knowledge',
                nonce: strikebotAdmin.nonce,
                id: id
            },
            success: function(response) {
                if (response.success) {
                    $row.fadeOut(300, function() {
                        $(this).remove();
                    });
                } else {
                    alert(response.data.message || 'Error deleting item');
                }
            },
            error: function() {
                alert('Error deleting item');
            }
        });
    });

    // Modal
    const $modal = $('#strikebot-view-modal');

    // Use delegated event handler for dynamically added rows
    $(document).on('click', '.strikebot-view-item', function() {
        const id = $(this).data('id');
        const $row = $(this).closest('tr');
        const name = $row.find('td:first').text();

        console.log('Viewing item:', { id: id, name: name });
        console.log('AJAX URL:', strikebotAdmin.ajaxUrl);
        console.log('Nonce:', strikebotAdmin.nonce);

        // Show modal with loading state
        $('#modal-title').text(name);
        $('#modal-content').html('<p>Loading content for ID: ' + id + '...</p>');
        $modal.removeClass('hidden');

        // Fetch content from server
        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_get_knowledge',
                nonce: strikebotAdmin.nonce,
                id: id
            },
            timeout: 30000,
            success: function(response, textStatus, xhr) {
                console.log('Raw response:', xhr.responseText);
                console.log('Parsed response:', response);
                
                // Handle WordPress returning 0 or -1 for failed AJAX
                if (response === 0 || response === '0' || response === -1 || response === '-1') {
                    $('#modal-content').html('<p style="color: red;"><strong>Error:</strong> AJAX endpoint not found or permission denied. Please regenerate and reinstall the plugin.</p>');
                    return;
                }
                
                // Try to parse if string
                let data = response;
                if (typeof response === 'string') {
                    try {
                        data = JSON.parse(response);
                    } catch (e) {
                        $('#modal-content').html('<p style="color: red;"><strong>Error:</strong> Invalid response format. Raw response: <code>' + response.substring(0, 500) + '</code></p>');
                        return;
                    }
                }
                
                if (data && data.success && data.data) {
                    const content = data.data.content || 'No content available';
                    const itemName = data.data.name || name;
                    $('#modal-title').text(itemName);
                    // Escape HTML and preserve whitespace
                    const escapedContent = $('<div>').text(content).html();
                    const contentLength = content.length;
                    $('#modal-content').html(
                        '<p style="margin-bottom: 10px; color: #666; font-size: 12px;">Content length: ' + contentLength.toLocaleString() + ' characters</p>' +
                        '<pre style="white-space: pre-wrap; max-height: 500px; overflow-y: auto; padding: 15px; background: #f5f5f5; border-radius: 4px; font-size: 13px;">' + escapedContent + '</pre>'
                    );
                } else {
                    const errorMsg = (data && data.data && data.data.message) ? data.data.message : 'Could not load content';
                    console.error('Failed to load content:', data);
                    $('#modal-content').html('<p style="color: red;"><strong>Error:</strong> ' + errorMsg + '</p><p style="font-size: 12px; color: #666;">Check browser console for details.</p>');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', { status: status, error: error, responseText: xhr.responseText, statusCode: xhr.status });
                let errorMsg = 'Request failed';
                
                if (xhr.status === 0) {
                    errorMsg = 'Network error - check your connection';
                } else if (xhr.status === 403) {
                    errorMsg = 'Permission denied (403)';
                } else if (xhr.status === 404) {
                    errorMsg = 'AJAX endpoint not found (404)';
                } else if (xhr.status === 500) {
                    errorMsg = 'Server error (500) - check server logs';
                } else if (status === 'timeout') {
                    errorMsg = 'Request timed out';
                } else {
                    errorMsg = 'Error: ' + (error || status || 'Unknown');
                }
                
                $('#modal-content').html(
                    '<p style="color: red;"><strong>' + errorMsg + '</strong></p>' +
                    '<p style="font-size: 12px; color: #666;">Status: ' + xhr.status + ' | ' + status + '</p>' +
                    '<p style="font-size: 12px; color: #666;">This usually means you need to regenerate and reinstall the plugin.</p>'
                );
            }
        });
    });

    $('.strikebot-modal-close, .strikebot-modal').on('click', function(e) {
        if (e.target === this) {
            $modal.addClass('hidden');
        }
    });

    // Appearance form
    $('#strikebot-appearance-form').on('submit', function(e) {
        e.preventDefault();

        const formData = $(this).serializeArray();
        const data = {
            action: 'strikebot_save_settings',
            nonce: strikebotAdmin.nonce
        };

        formData.forEach(function(item) {
            data[item.name] = item.value;
        });

        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: data,
            success: function(response) {
                if (response.success) {
                    alert('Settings saved successfully!');
                } else {
                    alert(response.data.message || 'Error saving settings');
                }
            },
            error: function() {
                alert('Error saving settings');
            }
        });
    });

    // Media Library for icon selection
    $('#select-icon').on('click', function(e) {
        e.preventDefault();

        const frame = wp.media({
            title: 'Select Chatbot Icon',
            button: {
                text: 'Use this image'
            },
            multiple: false
        });

        frame.on('select', function() {
            const attachment = frame.state().get('selection').first().toJSON();
            $('#icon-url').val(attachment.url);
            $('.strikebot-icon-preview')
                .css('background-image', 'url(' + attachment.url + ')')
                .find('.dashicons').hide();
            $('#remove-icon').removeClass('hidden');
            updatePreview();
        });

        frame.open();
    });

    $('#remove-icon').on('click', function() {
        $('#icon-url').val('');
        $('.strikebot-icon-preview')
            .css('background-image', 'none')
            .find('.dashicons').show();
        $(this).addClass('hidden');
        updatePreview();
    });

    // Color sync
    $('input[type="color"]').on('input', function() {
        $(this).siblings('.color-hex').val($(this).val());
        updatePreview();
    });

    $('.color-hex').on('input', function() {
        $(this).siblings('input[type="color"]').val($(this).val());
        updatePreview();
    });

    // Mode selector
    $('.strikebot-mode-option input').on('change', function() {
        $('.strikebot-mode-option').removeClass('active');
        $(this).closest('.strikebot-mode-option').addClass('active');
        updatePreview();
    });

    // Position selector
    $('.strikebot-position-option input').on('change', function() {
        $('.strikebot-position-option').removeClass('active');
        $(this).closest('.strikebot-position-option').addClass('active');
    });

    // Update preview
    function updatePreview() {
        const primaryColor = $('#primary-color').val();
        const mode = $('input[name="theme[mode]"]:checked').val();

        $('.preview-header, .preview-message.user .preview-message-content, .preview-input button')
            .css('background', primaryColor);
        $('.preview-message-avatar').css('background', primaryColor);

        if (mode === 'dark') {
            $('.strikebot-preview-chat').css('background', '#1f2937');
            $('.preview-messages, .preview-input').css('border-color', '#374151');
            $('.preview-message.bot .preview-message-content').css('background', '#374151');
        } else {
            $('.strikebot-preview-chat').css('background', '#fff');
            $('.preview-messages, .preview-input').css('border-color', '#e5e7eb');
            $('.preview-message.bot .preview-message-content').css('background', '#f3f4f6');
        }
    }

    // Settings form
    $('#strikebot-settings-form').on('submit', function(e) {
        e.preventDefault();

        const apiKey = $('#api-key').val();

        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_save_settings',
                nonce: strikebotAdmin.nonce,
                api_key: apiKey
            },
            success: function(response) {
                if (response.success) {
                    alert('Settings saved successfully!');
                } else {
                    alert(response.data.message || 'Error saving settings');
                }
            },
            error: function() {
                alert('Error saving settings');
            }
        });
    });

    // Danger zone actions
    $('#clear-history').on('click', function() {
        if (!confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
            return;
        }

        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_clear_history',
                nonce: strikebotAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    alert('Chat history cleared!');
                } else {
                    alert(response.data.message || 'Error clearing history');
                }
            }
        });
    });

    $('#reset-knowledge').on('click', function() {
        if (!confirm('Are you sure you want to delete ALL knowledge base items? This cannot be undone.')) {
            return;
        }

        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_reset_knowledge',
                nonce: strikebotAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    alert('Knowledge base reset!');
                    location.reload();
                } else {
                    alert(response.data.message || 'Error resetting knowledge base');
                }
            }
        });
    });

    // Chatbot Configuration is handled via inline script in dashboard.php

})(jQuery);
