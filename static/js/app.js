// Philosopher AI — Frontend Application
(function() {
    'use strict';

    // DOM Elements
    const chatArea = document.getElementById('chatArea');
    const messagesContainer = document.getElementById('messagesContainer');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const resetBtn = document.getElementById('resetBtn');
    const suggestions = document.querySelectorAll('.suggestion');

    let isProcessing = false;

    // Auto-resize textarea
    function autoResize() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
    }

    // Enable/disable send button
    function updateSendButton() {
        sendBtn.disabled = !messageInput.value.trim() || isProcessing;
    }

    // Create message bubble
    function createMessage(content, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'philosopher-message'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = isUser ? '👤' : '🏛️';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        if (isUser) {
            bubble.textContent = content;
        } else {
            bubble.innerHTML = content;
        }
        
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper';
        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        
        messageDiv.appendChild(wrapper);
        return messageDiv;
    }

    // Create typing indicator
    function createTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'message philosopher-message typing-indicator-msg';
        div.id = 'typingIndicator';
        div.innerHTML = `
            <div class="message-wrapper">
                <div class="message-avatar">🏛️</div>
                <div class="message-bubble typing-bubble">
                    <div class="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                    <span class="typing-text">The philosopher contemplates...</span>
                </div>
            </div>
        `;
        return div;
    }

    // Scroll to bottom
    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // Send message
    async function sendMessage(text) {
        const message = text || messageInput.value.trim();
        if (!message || isProcessing) return;

        isProcessing = true;
        messageInput.value = '';
        autoResize();
        updateSendButton();

        // Hide welcome
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // Add user message
        const userMsg = createMessage(message, true);
        messagesContainer.appendChild(userMsg);
        scrollToBottom();

        // Add typing indicator
        const typingIndicator = createTypingIndicator();
        messagesContainer.appendChild(typingIndicator);
        scrollToBottom();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Remove typing indicator
            typingIndicator.remove();

            if (response.ok) {
                const aiMsg = createMessage(data.response, false);
                messagesContainer.appendChild(aiMsg);
            } else {
                const errorMsg = createMessage(
                    '<em>The philosopher pauses, lost in thought... Please try again.</em>', 
                    false
                );
                messagesContainer.appendChild(errorMsg);
            }
        } catch (error) {
            typingIndicator.remove();
            const errorMsg = createMessage(
                '<em>A moment of silence falls. The philosopher will return shortly...</em>', 
                false
            );
            messagesContainer.appendChild(errorMsg);
        }

        isProcessing = false;
        updateSendButton();
        scrollToBottom();
        messageInput.focus();
    }

    // Reset conversation
    async function resetConversation() {
        try {
            await fetch('/reset', { method: 'POST' });
            messagesContainer.innerHTML = '';
            if (welcomeMessage) {
                welcomeMessage.style.display = '';
            }
            messageInput.value = '';
            autoResize();
            messageInput.focus();
        } catch (error) {
            console.error('Reset failed:', error);
        }
    }

    // Event Listeners
    messageInput.addEventListener('input', () => {
        autoResize();
        updateSendButton();
    });

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', () => sendMessage());
    resetBtn.addEventListener('click', resetConversation);

    suggestions.forEach(btn => {
        btn.addEventListener('click', () => {
            sendMessage(btn.dataset.prompt);
        });
    });

    // Focus input on load
    messageInput.focus();
})();
