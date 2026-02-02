jQuery(document).ready(function($) {
    let mediaUploader;

    // Theme / Accent color: show custom row when "Custom" is selected
    $('input[name*="[accent_mode]"]').on('change', function() {
        var isCustom = $(this).filter(':checked').val() === 'custom';
        $('.chatbot-accent-custom').toggle(isCustom);
    });

    // Sync color picker and hex text input
    $('#accent_color_picker').on('input change', function() {
        $('#accent_hex_input').val(this.value);
    });
    $('#accent_hex_input').on('input change', function() {
        var val = $(this).val();
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            $('#accent_color_picker').val(val);
        }
    });

    // Handle logo upload
    $('.upload-logo-button').on('click', function(e) {
        e.preventDefault();

        const button = $(this);
        const targetId = button.data('target');
        const targetInput = $('#' + targetId);
        const previewContainer = button.closest('.chatbot-logo-upload').find('.logo-preview');
        const removeButton = button.siblings('.remove-logo-button');

        // If the uploader already exists, reopen it
        if (mediaUploader) {
            mediaUploader.open();
            return;
        }

        // Create the media uploader
        mediaUploader = wp.media({
            title: 'Choose Logo',
            button: {
                text: 'Use this image'
            },
            multiple: false,
            library: {
                type: 'image'
            }
        });

        // When an image is selected
        mediaUploader.on('select', function() {
            const attachment = mediaUploader.state().get('selection').first().toJSON();

            // Set the URL in the hidden input
            targetInput.val(attachment.url);

            // Update the preview
            previewContainer.html('<img src="' + attachment.url + '" style="max-width: 200px; height: auto;">');

            // Update button text
            button.text(targetId === 'header_logo' ? 'Change Logo' : 'Change Icon');

            // Show remove button
            removeButton.show();
        });

        // Open the uploader
        mediaUploader.open();
    });

    // Handle logo removal
    $('.remove-logo-button').on('click', function(e) {
        e.preventDefault();

        const button = $(this);
        const targetId = button.data('target');
        const targetInput = $('#' + targetId);
        const previewContainer = button.closest('.chatbot-logo-upload').find('.logo-preview');
        const uploadButton = button.siblings('.upload-logo-button');

        // Clear the input
        targetInput.val('');

        // Clear the preview
        previewContainer.html('');

        // Update button text
        uploadButton.text(targetId === 'header_logo' ? 'Upload Logo' : 'Upload Icon');

        // Hide remove button
        button.hide();
    });
});
