/**
 * Strikebot Admin JavaScript
 */
(function($) {
    'use strict';

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

                    $list.empty();
                    response.data.urls.forEach(function(url) {
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
        const errors = [];
        
        function updateStatus() {
            $btn.text('Processing ' + completed + '/' + urls.length + ' (Saved: ' + saved + ', Failed: ' + failed + ')');
        }
        
        function checkComplete() {
            if (completed === urls.length) {
                $btn.prop('disabled', false).text('Crawl Selected URLs');
                let message = 'Crawl complete!\n\nSaved: ' + saved + '\nFailed: ' + failed + '\nTotal: ' + urls.length;
                if (failed > 0 && errors.length > 0) {
                    message += '\n\nErrors:\n' + errors.slice(0, 10).join('\n');
                }
                alert(message);
                if (saved > 0) {
                    location.reload();
                }
            }
        }
        
        // Process URLs sequentially to avoid overwhelming the server
        function processUrl(index) {
            if (index >= urls.length) {
                return;
            }
            
            const url = urls[index];
            console.log('Crawling URL ' + (index + 1) + '/' + urls.length + ':', url);
            
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
                                    failed++;
                                    const errorMsg = (saveResponse && saveResponse.data && saveResponse.data.message) ? saveResponse.data.message : 'Unknown save error';
                                    errors.push(url + ': ' + errorMsg);
                                    console.error('Save failed for', url, ':', errorMsg);
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
        
        // Start processing - do 3 URLs in parallel for speed
        processUrl(0);
        processUrl(1);
        processUrl(2);
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
                                alert(saveResponse.data.message || 'Error saving content');
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

    // Chatbot configuration form
    $('#strikebot-config-form').on('submit', function(e) {
        e.preventDefault();

        const instructions = $('#chatbot-instructions').val();
        const removeBranding = $('#remove-branding').is(':checked');
        const $status = $('#config-save-status');

        $.ajax({
            url: strikebotAdmin.ajaxUrl,
            method: 'POST',
            data: {
                action: 'strikebot_save_settings',
                nonce: strikebotAdmin.nonce,
                instructions: instructions,
                removeBranding: removeBranding ? 'true' : 'false'
            },
            success: function(response) {
                if (response.success) {
                    $status.fadeIn().delay(2000).fadeOut();
                } else {
                    alert(response.data.message || 'Error saving configuration');
                }
            },
            error: function() {
                alert('Error saving configuration');
            }
        });
    });

})(jQuery);
