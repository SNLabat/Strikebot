jQuery(document).ready(function($) {
    let conversationHistory = [];
    let chatSessions = JSON.parse(localStorage.getItem('chatbot_sessions') || '[]');
    let currentSessionId = Date.now();

    const messagesContainer = $('#chatbot-messages');
    const chatForm = $('#chatbot-form');
    const chatInput = $('#chatbot-input');
    const sendButton = $('#chatbot-send');
    const loadingIndicator = $('#chatbot-loading');
    const closeButton = $('#close-chat');
    const sidebar = $('#chatbot-sidebar');
    const sidebarToggle = $('#sidebar-toggle');
    const themeToggle = $('#theme-toggle');
    const newChatBtn = $('#new-chat-btn');
    const chatHistory = $('#chat-history');

    // Initialize
    initializeLogos();
    initializeTheme();
    renderChatHistory();

    // Handle form submission
    chatForm.on('submit', function(e) {
        e.preventDefault();

        const message = chatInput.val().trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');

        // Clear input
        chatInput.val('');

        // Disable input while processing
        setInputState(false);

        // Show loading indicator
        loadingIndicator.show();
        scrollToBottom();

        // Add user message to history
        conversationHistory.push({
            role: 'user',
            content: message
        });

        // Send to backend
        $.ajax({
            url: chatbotAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'chatbot_message',
                message: message,
                history: JSON.stringify(conversationHistory.slice(-10)), // Last 10 messages for context
                nonce: chatbotAjax.nonce
            },
            success: function(response) {
                loadingIndicator.hide();

                if (response.success) {
                    const botMessage = response.data.message;
                    addMessage(botMessage, 'bot');

                    // Add bot message to history
                    conversationHistory.push({
                        role: 'assistant',
                        content: botMessage
                    });
                } else {
                    addMessage('Error: ' + (response.data.message || 'Failed to get response'), 'error');
                }

                setInputState(true);
                chatInput.focus();
            },
            error: function(xhr, status, error) {
                loadingIndicator.hide();
                addMessage('Network error: Unable to connect to server. Please try again.', 'error');
                setInputState(true);
                chatInput.focus();
            }
        });
    });

    // Initialize logos
    function initializeLogos() {
        // Set header logo
        if (chatbotAjax.headerLogo) {
            $('#header-logo-container').html(`<img src="${chatbotAjax.headerLogo}" alt="Logo" class="header-logo">`);
        } else {
            $('#header-logo-container').html('<h1>Chat Support</h1>');
        }

        // Set chat icon for initial message and loading indicator
        const iconHtml = chatbotAjax.chatIcon
            ? `<img src="${chatbotAjax.chatIcon}" alt="AI">`
            : 'AI';

        $('#bot-icon-template').html(iconHtml);
        $('#loading-icon-template').html(iconHtml);
    }

    // Add message to chat
    function addMessage(text, type) {
        const messageClass = type === 'user' ? 'user-message' : (type === 'error' ? 'bot-message error-message' : 'bot-message');

        let iconHtml = '';
        if (type === 'user') {
            iconHtml = '<div class="message-icon">U</div>';
        } else {
            const iconContent = chatbotAjax.chatIcon
                ? `<img src="${chatbotAjax.chatIcon}" alt="AI">`
                : 'AI';
            iconHtml = `<div class="message-icon">${iconContent}</div>`;
        }

        const messageEl = $('<div class="message ' + messageClass + '">' + iconHtml + '<div class="message-content"><p></p></div></div>');
        if (type === 'user') {
            messageEl.find('.message-content p').text(text);
        } else {
            messageEl.find('.message-content p').html(linkify(text));
        }
        messagesContainer.append(messageEl);
        scrollToBottom();
    }

    // Scroll to bottom of messages
    function scrollToBottom() {
        messagesContainer.animate({
            scrollTop: messagesContainer[0].scrollHeight
        }, 300);
    }

    // Enable/disable input
    function setInputState(enabled) {
        chatInput.prop('disabled', !enabled);
        sendButton.prop('disabled', !enabled);
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Decode HTML entities so markdown like [text](url) is recognized even if brackets were encoded
    function decodeHtmlEntities(str) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = str;
        return textarea.value;
    }

    // Normalize URL for href (browser will escape as needed when we set attribute via string)
    function normalizeHref(url) {
        const a = document.createElement('a');
        a.href = url;
        return a.href;
    }

    // Linkify text - convert markdown links [text](url), URLs, emails, and phone numbers to clickable links
    function linkify(text) {
        if (!text || typeof text !== 'string') return '';
        let processedText = decodeHtmlEntities(text);
        let linkMap = {};
        let linkCounter = 0;

        // First, extract and convert markdown-style links [text](url) BEFORE HTML escaping
        // Allow optional space between ] and ( for robustness
        processedText = processedText.replace(
            /\[([^\]]*)\](\s*)\(([^)]+)\)/g,
            function(match, linkText, space, url) {
                const placeholder = '___LINK_PLACEHOLDER_' + linkCounter + '___';
                const escapedLinkText = document.createElement('div');
                escapedLinkText.textContent = linkText;
                const safeHref = normalizeHref(url.trim()).replace(/"/g, '&quot;');
                linkMap[placeholder] = '<a href="' + safeHref + '" target="_blank" rel="noopener noreferrer" class="chatbot-link">' + escapedLinkText.innerHTML + '</a>';
                linkCounter++;
                return placeholder;
            }
        );

        // Now escape all remaining HTML to prevent XSS
        let escapedText = escapeHtml(processedText);

        // Trim trailing sentence punctuation so it isn't inside the link
        function trimTrailingPunctuation(s) {
            const m = s.match(/^(.+?)([.,;:!?'")\]]+)$/);
            return m ? { core: m[1], suffix: m[2] } : { core: s, suffix: '' };
        }

        // Convert plain URLs, emails, and phones BEFORE restoring markdown links,
        // so we never replace URLs that are already inside href="..."
        escapedText = escapedText.replace(
            /(\b(https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?'")\]])[.,;:!?'")\]]*/gi,
            function(match) {
                const { core: url, suffix } = trimTrailingPunctuation(match);
                let href = url;
                if (!url.match(/^https?:\/\//i)) {
                    href = 'http://' + url;
                }
                const safeHref = normalizeHref(href).replace(/"/g, '&quot;');
                return '<a href="' + safeHref + '" target="_blank" rel="noopener noreferrer" class="chatbot-link">' + url + '</a>' + suffix;
            }
        );

        escapedText = escapedText.replace(
            /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)[.,;:!?'")\]]*/gi,
            function(match) {
                const { core: email, suffix } = trimTrailingPunctuation(match);
                return '<a href="mailto:' + email + '" class="chatbot-link chatbot-link-email">' + email + '</a>' + suffix;
            }
        );

        escapedText = escapedText.replace(
            /((\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b)[.,;:!?'")\]]*/g,
            function(match) {
                const { core: phone, suffix } = trimTrailingPunctuation(match);
                const cleanPhone = phone.replace(/[^\d+]/g, '');
                return '<a href="tel:' + cleanPhone + '" class="chatbot-link chatbot-link-phone">' + phone + '</a>' + suffix;
            }
        );

        // Restore markdown links last so their href URLs are never matched by the plain-URL regex
        const placeholders = Object.keys(linkMap).sort();
        for (let i = 0; i < placeholders.length; i++) {
            escapedText = escapedText.split(placeholders[i]).join(linkMap[placeholders[i]]);
        }

        return escapedText;
    }

    // Sidebar toggle
    sidebarToggle.on('click', function() {
        sidebar.toggleClass('collapsed');
    });

    // Theme toggle
    themeToggle.on('click', function() {
        const currentTheme = $('body').attr('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        $('body').attr('data-theme', newTheme);
        localStorage.setItem('chatbot_theme', newTheme);
        updateThemeToggleButton(newTheme);
    });

    // New chat button
    newChatBtn.on('click', function() {
        if (conversationHistory.length > 0) {
            saveCurrentSession();
        }
        startNewChat();
    });

    // Initialize theme
    function initializeTheme() {
        const savedTheme = localStorage.getItem('chatbot_theme') || 'light';
        $('body').attr('data-theme', savedTheme);
        updateThemeToggleButton(savedTheme);
    }

    // Update theme toggle button
    function updateThemeToggleButton(theme) {
        if (theme === 'dark') {
            $('.sun-icon').hide();
            $('.moon-icon').show();
            $('.theme-label').text('Light Mode');
        } else {
            $('.sun-icon').show();
            $('.moon-icon').hide();
            $('.theme-label').text('Dark Mode');
        }
    }

    // Save current session
    function saveCurrentSession() {
        const firstMessage = conversationHistory.find(msg => msg.role === 'user');
        const title = firstMessage ? firstMessage.content.substring(0, 30) + '...' : 'New Chat';

        const session = {
            id: currentSessionId,
            title: title,
            messages: conversationHistory,
            timestamp: Date.now()
        };

        const existingIndex = chatSessions.findIndex(s => s.id === currentSessionId);
        if (existingIndex >= 0) {
            chatSessions[existingIndex] = session;
        } else {
            chatSessions.unshift(session);
        }

        // Keep only last 20 sessions
        chatSessions = chatSessions.slice(0, 20);
        localStorage.setItem('chatbot_sessions', JSON.stringify(chatSessions));
        renderChatHistory();
    }

    // Start new chat
    function startNewChat() {
        conversationHistory = [];
        currentSessionId = Date.now();
        messagesContainer.html(`
            <div class="message bot-message">
                <div class="message-icon">${chatbotAjax.chatIcon ? '<img src="' + chatbotAjax.chatIcon + '" alt="AI">' : 'AI'}</div>
                <div class="message-content">
                    <p>Hello! How can I help you today?</p>
                </div>
            </div>
        `);
        chatInput.focus();
        renderChatHistory();
    }

    // Delete a chat session
    function deleteSession(sessionId, e) {
        if (e) e.stopPropagation();
        if (!confirm('Delete this chat?')) return;
        chatSessions = chatSessions.filter(s => s.id !== sessionId);
        localStorage.setItem('chatbot_sessions', JSON.stringify(chatSessions));
        if (currentSessionId === sessionId) {
            startNewChat();
        } else {
            renderChatHistory();
        }
    }

    // Render chat history
    function renderChatHistory() {
        chatHistory.empty();
        chatSessions.forEach(session => {
            const isActive = session.id === currentSessionId;
            const preview = session.messages.length > 1 ?
                session.messages[session.messages.length - 1].content.substring(0, 40) + '...' :
                'No messages yet';

            const chatItem = $(`
                <div class="chat-item ${isActive ? 'active' : ''}" data-session-id="${session.id}">
                    <div class="chat-item-content">
                        <div class="chat-item-title">${escapeHtml(session.title)}</div>
                        <div class="chat-item-preview">${escapeHtml(preview)}</div>
                    </div>
                    <button type="button" class="chat-item-delete" aria-label="Delete chat" title="Delete chat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            `);

            chatItem.on('click', function(e) {
                if (!$(e.target).closest('.chat-item-delete').length) {
                    loadSession(session.id);
                }
            });

            chatItem.find('.chat-item-delete').on('click', function(e) {
                deleteSession(session.id, e);
            });

            chatHistory.append(chatItem);
        });
    }

    // Load session
    function loadSession(sessionId) {
        const session = chatSessions.find(s => s.id === sessionId);
        if (!session) return;

        if (conversationHistory.length > 0 && currentSessionId !== sessionId) {
            saveCurrentSession();
        }

        currentSessionId = sessionId;
        conversationHistory = [...session.messages];

        messagesContainer.empty();
        conversationHistory.forEach(msg => {
            addMessage(msg.content, msg.role === 'user' ? 'user' : 'bot');
        });

        renderChatHistory();
        chatInput.focus();
    }

    // Auto-save on new messages
    const originalAddMessage = addMessage;

    // Handle close button
    closeButton.on('click', function() {
        if (conversationHistory.length > 0) {
            saveCurrentSession();
        }
        if (confirm('Are you sure you want to close the chat?')) {
            window.history.back();
        }
    });

    // Focus input on load
    chatInput.focus();

    // Handle Enter key
    chatInput.on('keypress', function(e) {
        if (e.which === 13 && !e.shiftKey) {
            e.preventDefault();
            chatForm.submit();
        }
    });

    // Save session on page unload
    $(window).on('beforeunload', function() {
        if (conversationHistory.length > 0) {
            saveCurrentSession();
        }
    });
});
