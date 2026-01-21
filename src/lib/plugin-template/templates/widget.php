<?php
if (!defined('ABSPATH')) exit;

$settings = get_option('strikebot_settings');
$theme = $settings['theme'] ?? array();
$widget = $settings['widget'] ?? array();
$name = $settings['name'] ?? 'Chatbot';
$addOns = $settings['addOns'] ?? array();

$position = $widget['position'] ?? 'bottom-right';
$mode = $theme['mode'] ?? 'light';
$primaryColor = $theme['primaryColor'] ?? '#3B82F6';
$secondaryColor = $theme['secondaryColor'] ?? '#1E40AF';
$backgroundColor = $mode === 'dark' ? '#1F2937' : '#FFFFFF';
$textColor = $mode === 'dark' ? '#F9FAFB' : '#1F2937';
$iconUrl = $widget['iconUrl'] ?? '';
$welcomeMessage = $widget['welcomeMessage'] ?? 'Hello! How can I help you today?';
$placeholder = $widget['placeholder'] ?? 'Type your message...';

// Check if branding removal is enabled (either via add-on or setting)
$removeBranding = false;
if (is_array($addOns)) {
    foreach ($addOns as $addOn) {
        if (is_array($addOn) && isset($addOn['type']) && $addOn['type'] === 'remove_branding') {
            $removeBranding = true;
            break;
        }
    }
}
// Also check the removeBranding setting (can be toggled in dashboard if add-on is active)
if ($removeBranding && isset($settings['removeBranding'])) {
    $removeBranding = (bool) $settings['removeBranding'];
}
?>

<div id="strikebot-widget"
     class="strikebot-widget strikebot-<?php echo esc_attr($position); ?> strikebot-<?php echo esc_attr($mode); ?>"
     data-position="<?php echo esc_attr($position); ?>"
     style="--sb-primary: <?php echo esc_attr($primaryColor); ?>;
            --sb-secondary: <?php echo esc_attr($secondaryColor); ?>;
            --sb-bg: <?php echo esc_attr($backgroundColor); ?>;
            --sb-text: <?php echo esc_attr($textColor); ?>;">

    <!-- Chat Window -->
    <div id="strikebot-chat" class="strikebot-chat hidden">
        <!-- Header -->
        <div class="strikebot-chat-header">
            <div class="strikebot-chat-avatar">
                <?php if ($iconUrl): ?>
                    <img src="<?php echo esc_url($iconUrl); ?>" alt="<?php echo esc_attr($name); ?>">
                <?php else: ?>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                <?php endif; ?>
            </div>
            <div class="strikebot-chat-info">
                <span class="strikebot-chat-name"><?php echo esc_html($name); ?></span>
                <span class="strikebot-chat-status">Online</span>
            </div>
            <button class="strikebot-chat-close" aria-label="Close chat">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        </div>

        <!-- Messages -->
        <div class="strikebot-chat-messages" id="strikebot-messages">
            <div class="strikebot-message strikebot-message-bot">
                <div class="strikebot-message-avatar">
                    <?php if ($iconUrl): ?>
                        <img src="<?php echo esc_url($iconUrl); ?>" alt="">
                    <?php else: ?>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                    <?php endif; ?>
                </div>
                <div class="strikebot-message-content">
                    <?php echo esc_html($welcomeMessage); ?>
                </div>
            </div>
        </div>

        <!-- Input -->
        <div class="strikebot-chat-input">
            <input type="text"
                   id="strikebot-input"
                   placeholder="<?php echo esc_attr($placeholder); ?>"
                   autocomplete="off"
                   style="<?php echo $mode === 'dark' ? 'color: #ffffff !important;' : ''; ?>">
            <button id="strikebot-send" aria-label="Send message">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
            </button>
        </div>

        <!-- Powered By -->
        <?php if (!$removeBranding): ?>
        <div class="strikebot-powered-by">
            Powered by Strikebot
        </div>
        <?php endif; ?>
    </div>

    <!-- Toggle Button -->
    <button id="strikebot-toggle" class="strikebot-toggle" aria-label="Open chat">
        <span class="strikebot-toggle-icon strikebot-toggle-open">
            <?php if ($iconUrl): ?>
                <img src="<?php echo esc_url($iconUrl); ?>" alt="">
            <?php else: ?>
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
            <?php endif; ?>
        </span>
        <span class="strikebot-toggle-icon strikebot-toggle-close hidden">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </span>
    </button>
</div>
