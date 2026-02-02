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

    // Decode HTML entities so markdown like [text](url) is recognized even if brackets were encoded
    function decodeHtmlEntities(str) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = str;
        return textarea.value;
    }

    // Normalize URL for href and escape " for attribute
    function normalizeHref(url) {
        const a = document.createElement('a');
        a.href = url;
        return a.href.replace(/"/g, '&quot;');
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
                const safeHref = normalizeHref(url.trim());
                linkMap[placeholder] = '<a href="' + safeHref + '" target="_blank" rel="noopener noreferrer" class="strikebot-link">' + escapedLinkText.innerHTML + '</a>';
                linkCounter++;
                return placeholder;
            }
        );

        // Now escape all remaining HTML to prevent XSS
        const div = document.createElement('div');
        div.textContent = processedText;
        let escapedText = div.innerHTML;

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
                const safeHref = normalizeHref(href);
                return '<a href="' + safeHref + '" target="_blank" rel="noopener noreferrer" class="strikebot-link">' + url + '</a>' + suffix;
            }
        );

        escapedText = escapedText.replace(
            /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)[.,;:!?'")\]]*/gi,
            function(match) {
                const { core: email, suffix } = trimTrailingPunctuation(match);
                return '<a href="mailto:' + email + '" class="strikebot-link strikebot-link-email">' + email + '</a>' + suffix;
            }
        );

        escapedText = escapedText.replace(
            /((\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b)[.,;:!?'")\]]*/g,
            function(match) {
                const { core: phone, suffix } = trimTrailingPunctuation(match);
                const cleanPhone = phone.replace(/[^\d+]/g, '');
                return '<a href="tel:' + cleanPhone + '" class="strikebot-link strikebot-link-phone">' + phone + '</a>' + suffix;
            }
        );

        // Restore markdown links last so their href URLs are never matched by the plain-URL regex
        const placeholders = Object.keys(linkMap).sort();
        for (let i = 0; i < placeholders.length; i++) {
            escapedText = escapedText.split(placeholders[i]).join(linkMap[placeholders[i]]);
        }

        return escapedText;
    }

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

        const contentDiv = document.createElement('div');
        contentDiv.className = 'strikebot-message-content';

        // For bot messages, linkify the content. For user messages, keep as plain text
        if (!isUser) {
            contentDiv.innerHTML = linkify(content);
        } else {
            contentDiv.textContent = content;
        }

        messageDiv.appendChild(contentDiv);
        if (avatarHtml) {
            messageDiv.insertAdjacentHTML('afterbegin', avatarHtml);
        }

        messages.appendChild(messageDiv);

        // Add rating buttons for bot messages
        if (!isUser) {
            addRatingButtons(contentDiv);
        }

        messages.scrollTop = messages.scrollHeight;
    }

    // Add rating buttons to bot message
    function addRatingButtons(messageElement) {
        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'strikebot-rating';
        ratingDiv.innerHTML =
            '<button class="strikebot-rating-btn strikebot-rating-up" data-rating="positive" title="Helpful" aria-label="This was helpful">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>' +
            '</svg>' +
            '</button>' +
            '<button class="strikebot-rating-btn strikebot-rating-down" data-rating="negative" title="Not helpful" aria-label="This was not helpful">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>' +
            '</svg>' +
            '</button>';

        messageElement.appendChild(ratingDiv);

        // Add click handlers
        ratingDiv.querySelectorAll('.strikebot-rating-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const rating = this.dataset.rating;
                submitRating(rating);

                // Visual feedback
                this.classList.add('strikebot-rating-selected');
                ratingDiv.querySelectorAll('.strikebot-rating-btn').forEach(function(b) {
                    b.disabled = true;
                });
            });
        });
    }

    // Submit rating to server
    function submitRating(rating) {
        const formData = new FormData();
        formData.append('action', 'strikebot_rate_message');
        formData.append('nonce', strikebotWidget.nonce);
        formData.append('session_id', sessionId);
        formData.append('rating', rating);

        fetch(strikebotWidget.ajaxUrl, {
            method: 'POST',
            body: formData
        }).then(function(response) {
            return response.json();
        }).then(function(data) {
            if (!data.success) {
                console.error('Failed to save rating:', data.data?.message);
            }
        }).catch(function(error) {
            console.error('Rating submission error:', error);
        });
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
