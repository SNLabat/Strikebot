/**
 * Strikebot Admin JavaScript
 */
(function($) {
    'use strict';

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
        $btn.prop('disabled', true).text('Crawling ' + urls.length + ' URLs...');

        let processed = 0;
        let saved = 0;
        let failed = 0;
        const errors = [];

        urls.forEach(function(url) {
            $.ajax({
                url: strikebotAdmin.ajaxUrl,
                method: 'POST',
                data: {
                    action: 'strikebot_crawl_url',
                    nonce: strikebotAdmin.nonce,
                    url: url
                },
                success: function(response) {
                    if (response.success && response.data.content) {
                        // Save the content with metadata indicating it's from sitemap crawl
                        $.ajax({
                            url: strikebotAdmin.ajaxUrl,
                            method: 'POST',
                            data: {
                                action: 'strikebot_save_knowledge',
                                nonce: strikebotAdmin.nonce,
                                type: 'url',
                                name: url,
                                content: response.data.content,
                                metadata: JSON.stringify({ from_sitemap: true, crawled_url: url })
                            },
                            success: function(saveResponse) {
                                if (!saveResponse.success) {
                                    failed++;
                                    const errorMsg = saveResponse.data ? saveResponse.data.message : 'Unknown error';
                                    errors.push(url + ': ' + errorMsg);
                                    console.error('Failed to save URL:', url, saveResponse.data);
                                } else {
                                    saved++;
                                    console.log('Successfully saved URL:', url);
                                }
                            },
                            error: function(xhr, status, error) {
                                failed++;
                                errors.push(url + ': ' + error);
                                console.error('Error saving URL:', url, error);
                            }
                        });
                    } else {
                        failed++;
                        const errorMsg = response.data ? response.data.message : 'No content retrieved';
                        errors.push(url + ': ' + errorMsg);
                        console.error('Failed to crawl URL:', url, response);
                    }
                },
                error: function(xhr, status, error) {
                    failed++;
                    errors.push(url + ': Crawl error - ' + error);
                    console.error('Error crawling URL:', url, error);
                },
                complete: function() {
                    processed++;
                    if (processed === urls.length) {
                        $btn.prop('disabled', false).text('Crawl Selected URLs');
                        let message = 'Crawl complete! Saved: ' + saved + ', Failed: ' + failed + ' out of ' + urls.length + ' URLs.';
                        if (failed > 0 && errors.length > 0) {
                            message += '\n\nFirst few errors:\n' + errors.slice(0, 5).join('\n');
                        }
                        alert(message);
                        location.reload();
                    }
                }
            });
        });
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
                        fileSize: file.size
                    })
                },
                success: function(response) {
                    if (response.success) {
                        alert('File uploaded successfully!');
                        location.reload();
                    } else {
                        alert(response.data.message || 'Error uploading file');
                    }
                },
                error: function() {
                    alert('Error uploading file');
                },
                complete: function() {
                    $btn.prop('disabled', false).text(originalText);
                }
            });
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

        // Show modal with loading state
        $('#modal-title').text(name);
        $('#modal-content').html('<p>Loading...</p>');
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
            dataType: 'json',
            timeout: 30000,
            success: function(response) {
                console.log('View response:', response);
                if (response && response.success && response.data) {
                    const content = response.data.content || 'No content available';
                    const itemName = response.data.name || name;
                    $('#modal-title').text(itemName);
                    // Escape HTML and preserve whitespace
                    const escapedContent = $('<div>').text(content).html();
                    $('#modal-content').html('<pre style="white-space: pre-wrap; max-height: 500px; overflow-y: auto; padding: 15px; background: #f5f5f5; border-radius: 4px;">' + escapedContent + '</pre>');
                } else {
                    const errorMsg = (response && response.data && response.data.message) ? response.data.message : 'Could not load content';
                    console.error('Failed to load content:', response);
                    $('#modal-content').html('<p style="color: red;">Error: ' + errorMsg + '</p>');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', status, error, xhr.responseText);
                let errorMsg = 'Please check console for details';
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response && response.data && response.data.message) {
                        errorMsg = response.data.message;
                    }
                } catch (e) {
                    // If response isn't JSON, use the status/error
                    errorMsg = error || status || 'Unknown error';
                }
                $('#modal-content').html('<p style="color: red;">Error loading content: ' + errorMsg + '</p>');
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

})(jQuery);
