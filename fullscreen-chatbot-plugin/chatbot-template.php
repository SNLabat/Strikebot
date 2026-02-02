<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php wp_title('|', true, 'right'); ?></title>
    <?php wp_head(); ?>
</head>
<body class="chatbot-fullscreen" data-theme="light">
    <div id="chatbot-container">
        <!-- Sidebar -->
        <div id="chatbot-sidebar">
            <div class="sidebar-header">
                <button id="new-chat-btn" class="new-chat-button">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    New Chat
                </button>
            </div>

            <div class="sidebar-chats" id="chat-history">
                <!-- Chat history will be populated here -->
            </div>

            <div class="sidebar-footer">
                <button id="theme-toggle" class="theme-toggle-btn">
                    <svg class="sun-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="4" stroke="currentColor" stroke-width="2"/>
                        <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <svg class="moon-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: none;">
                        <path d="M17 10.5C16.1 13.5 13.3 15.8 10 15.8C6.1 15.8 3 12.7 3 8.8C3 5.5 5.3 2.7 8.3 1.8C8.1 2.3 8 2.9 8 3.5C8 6.5 10.5 9 13.5 9C14.1 9 14.7 8.9 15.2 8.7C16.3 9.7 17 11 17 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="theme-label">Dark Mode</span>
                </button>
            </div>
        </div>

        <button id="sidebar-toggle" class="sidebar-toggle-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>

        <!-- Main Chat Area -->
        <div id="chatbot-main">
            <div id="chatbot-header">
                <div id="header-logo-container">
                    <!-- Logo will be inserted by JavaScript if configured -->
                </div>
                <button id="close-chat" aria-label="Close chat">×</button>
            </div>

            <div id="chatbot-messages">
                <div class="message bot-message">
                    <div class="message-icon" id="bot-icon-template">
                        <!-- Icon will be inserted by JavaScript if configured -->
                    </div>
                    <div class="message-content">
                        <p>Hello! How can I help you today?</p>
                    </div>
                </div>
            </div>

            <div id="chatbot-input-area">
                <form id="chatbot-form">
                    <div class="input-wrapper">
                        <input
                            type="text"
                            id="chatbot-input"
                            placeholder="Type your message..."
                            autocomplete="off"
                            required
                        >
                    </div>
                    <button type="submit" id="chatbot-send">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 10L18 2L10 18L8 11L2 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </form>
            </div>

            <div id="chatbot-loading" style="display: none;">
                <div class="message-icon" id="loading-icon-template">
                    <!-- Icon will be inserted by JavaScript if configured -->
                </div>
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    </div>
    <?php wp_footer(); ?>
</body>
</html>
