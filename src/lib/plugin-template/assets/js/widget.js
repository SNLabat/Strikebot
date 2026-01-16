/**
 * Strikebot Widget JavaScript
 */
(function() {
    'use strict';

    // Generate unique session ID
    function generateSessionId() {
        return 'sb_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    // Get or create session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('strikebot_session');
        if (!sessionId) {
            sessionId = generateSessionId();
            sessionStorage.setItem('strikebot_session', sessionId);
        }
        return sessionId;
    }

    const sessionId = getSessionId();

    // DOM Elements
    const widget = document.getElementById('strikebot-widget');
    const chat = document.getElementById('strikebot-chat');
    const toggle = document.getElementById('strikebot-toggle');
    const closeBtn = document.querySelector('.strikebot-chat-close');
    const messages = document.getElementById('strikebot-messages');
    const input = document.getElementById('strikebot-input');
    const sendBtn = document.getElementById('strikebot-send');
    const toggleOpen = document.querySelector('.strikebot-toggle-open');
    const toggleClose = document.querySelector('.strikebot-toggle-close');

    // State
    let isOpen = false;
    let isLoading = false;

    // Toggle chat
    function toggleChat() {
        isOpen = !isOpen;
        chat.classList.toggle('hidden', !isOpen);
        toggleOpen.classList.toggle('hidden', isOpen);
        toggleClose.classList.toggle('hidden', !isOpen);

        if (isOpen) {
            input.focus();
        }
    }

    // Add message to chat
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'strikebot-message ' + (isUser ? 'strikebot-message-user' : 'strikebot-message-bot');

        let avatarHtml = '';
        if (!isUser) {
            const settings = window.strikebotWidget?.settings || {};
            const iconUrl = settings.widget?.iconUrl || '';

            if (iconUrl) {
                avatarHtml = '<div class="strikebot-message-avatar"><img src="' + iconUrl + '" alt=""></div>';
            } else {
                avatarHtml = '<div class="strikebot-message-avatar">' +
                    '<svg viewBox="0 0 24 24" fill="currentColor">' +
                    '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>' +
                    '</svg></div>';
            }
        }

        messageDiv.innerHTML = avatarHtml +
            '<div class="strikebot-message-content">' + escapeHtml(content) + '</div>';

        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    // Add typing indicator
    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'strikebot-message strikebot-message-bot';
        typingDiv.id = 'typing-indicator';

        const settings = window.strikebotWidget?.settings || {};
        const iconUrl = settings.widget?.iconUrl || '';

        let avatarHtml = '';
        if (iconUrl) {
            avatarHtml = '<div class="strikebot-message-avatar"><img src="' + iconUrl + '" alt=""></div>';
        } else {
            avatarHtml = '<div class="strikebot-message-avatar">' +
                '<svg viewBox="0 0 24 24" fill="currentColor">' +
                '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>' +
                '</svg></div>';
        }

        typingDiv.innerHTML = avatarHtml +
            '<div class="strikebot-message-content strikebot-typing">' +
            '<span></span><span></span><span></span>' +
            '</div>';

        messages.appendChild(typingDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Send message
    async function sendMessage() {
        const message = input.value.trim();

        if (!message || isLoading) {
            return;
        }

        isLoading = true;
        sendBtn.disabled = true;
        input.value = '';

        // Add user message
        addMessage(message, true);

        // Add typing indicator
        addTypingIndicator();

        try {
            const formData = new FormData();
            formData.append('action', 'strikebot_chat');
            formData.append('nonce', strikebotWidget.nonce);
            formData.append('message', message);
            formData.append('session_id', sessionId);

            const response = await fetch(strikebotWidget.ajaxUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            removeTypingIndicator();

            if (data.success) {
                addMessage(data.data.response);
            } else {
                addMessage(data.data?.message || 'Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            console.error('Strikebot error:', error);
            removeTypingIndicator();
            addMessage('Sorry, I encountered an error. Please try again.');
        } finally {
            isLoading = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    // Event listeners
    toggle.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    sendBtn.addEventListener('click', sendMessage);

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Close on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isOpen) {
            toggleChat();
        }
    });

    // Close when clicking outside
    document.addEventListener('click', function(e) {
        if (isOpen && !widget.contains(e.target)) {
            toggleChat();
        }
    });

})();
