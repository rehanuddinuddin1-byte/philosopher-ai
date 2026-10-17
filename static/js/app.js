// Philosopher AI — Multi-Mind & Arena Debate Engine
(function() {
    'use strict';

    // State
    let currentPhilosopher = 'socrates';
    let currentCadence = 'ancient';
    let isProcessing = false;
    let philosophersData = {};

    // DOM Elements
    const tabDialogue = document.getElementById('tabDialogue');
    const tabArena = document.getElementById('tabArena');
    const dialogueView = document.getElementById('dialogueView');
    const arenaView = document.getElementById('arenaView');
    const cadenceSelect = document.getElementById('cadenceSelect');
    const cadenceGroup = document.getElementById('cadenceGroup');
    const resetBtn = document.getElementById('resetBtn');

    // Dialogue Elements
    const philChips = document.querySelectorAll('.phil-chip');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const welcomeAvatar = document.getElementById('welcomeAvatar');
    const welcomeName = document.getElementById('welcomeName');
    const welcomeEra = document.getElementById('welcomeEra');
    const welcomeDesc = document.getElementById('welcomeDesc');
    const chatArea = document.getElementById('chatArea');
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const suggestions = document.querySelectorAll('.suggestion');

    // Arena Elements
    const arenaPhil1 = document.getElementById('arenaPhil1');
    const arenaPhil2 = document.getElementById('arenaPhil2');
    const arenaRounds = document.getElementById('arenaRounds');
    const arenaTopic = document.getElementById('arenaTopic');
    const startArenaBtn = document.getElementById('startArenaBtn');
    const arenaStream = document.getElementById('arenaStream');
    const topicPresets = document.querySelectorAll('.topic-preset');

    // Fetch Philosopher Meta
    async function loadPhilosopherData() {
        try {
            const res = await fetch('/api/philosophers');
            philosophersData = await res.json();
        } catch (e) {
            console.error('Error fetching philosophers metadata:', e);
        }
    }
    loadPhilosopherData();

    // Mode Switching
    tabDialogue.addEventListener('click', () => {
        tabDialogue.classList.add('active');
        tabArena.classList.remove('active');
        dialogueView.classList.add('active-view');
        arenaView.classList.remove('active-view');
        cadenceGroup.style.display = 'flex';
        resetBtn.style.display = 'flex';
    });

    tabArena.addEventListener('click', () => {
        tabArena.classList.add('active');
        tabDialogue.classList.remove('active');
        arenaView.classList.add('active-view');
        dialogueView.classList.remove('active-view');
        cadenceGroup.style.display = 'flex';
        resetBtn.style.display = 'none';
    });

    // Cadence Change
    cadenceSelect.addEventListener('change', (e) => {
        currentCadence = e.target.value;
    });

    // Philosopher Selection
    philChips.forEach(chip => {
        chip.addEventListener('click', () => {
            philChips.forEach(c => c.classList.remove('selected'));
            chip.classList.add('selected');
            currentPhilosopher = chip.dataset.key;
            updateWelcomeCard(currentPhilosopher);
        });
    });

    function updateWelcomeCard(key) {
        if (!philosophersData[key]) return;
        const p = philosophersData[key];
        welcomeAvatar.textContent = p.avatar;
        welcomeName.textContent = p.name;
        welcomeEra.textContent = p.era;
        welcomeDesc.textContent = `${p.core_philosophy} Examining timeless truths and contemporary global affairs.`;
    }

    // Auto-resize input
    function autoResize() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';
        sendBtn.disabled = !messageInput.value.trim() || isProcessing;
    }
    messageInput.addEventListener('input', autoResize);

    // Dialogue Messaging
    function createMessage(content, isUser, philName, avatar) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'philosopher-message'}`;

        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper';

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.textContent = isUser ? '👤' : (avatar || '🏛️');

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        if (!isUser) {
            const author = document.createElement('div');
            author.className = 'bubble-author';
            author.textContent = philName || 'Philosopher';
            bubble.appendChild(author);
        }

        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'bubble-body';
        if (isUser) {
            bodyDiv.textContent = content;
        } else {
            bodyDiv.innerHTML = content;
        }
        bubble.appendChild(bodyDiv);

        wrapper.appendChild(avatarDiv);
        wrapper.appendChild(bubble);
        messageDiv.appendChild(wrapper);
        return messageDiv;
    }

    function createTypingIndicator(philName, avatar) {
        const div = document.createElement('div');
        div.className = 'message philosopher-message typing-indicator-msg';
        div.id = 'typingIndicator';
        div.innerHTML = `
            <div class="message-wrapper">
                <div class="message-avatar">${avatar || '🏛️'}</div>
                <div class="message-bubble typing-bubble">
                    <div class="typing-indicator">
                        <span></span><span></span><span></span>
                    </div>
                    <span class="typing-text">${philName || 'The philosopher'} contemplates the cosmos...</span>
                </div>
            </div>
        `;
        return div;
    }

    function scrollToBottom() {
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    async function sendDialogue(text) {
        const message = text || messageInput.value.trim();
        if (!message || isProcessing) return;

        isProcessing = true;
        messageInput.value = '';
        autoResize();

        if (welcomeMessage) welcomeMessage.style.display = 'none';

        const userMsg = createMessage(message, true);
        messagesContainer.appendChild(userMsg);
        scrollToBottom();

        const pData = philosophersData[currentPhilosopher] || { name: 'Philosopher', avatar: '🏛️' };
        const typing = createTypingIndicator(pData.name, pData.avatar);
        messagesContainer.appendChild(typing);
        scrollToBottom();

        try {
            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    philosopher: currentPhilosopher,
                    style: currentCadence
                })
            });

            typing.remove();
            const data = await res.json();

            if (res.ok) {
                const aiMsg = createMessage(data.response, false, data.philosopher, data.avatar);
                messagesContainer.appendChild(aiMsg);
            } else {
                const err = createMessage(
                    `<em>${data.error || 'The philosopher pauses in deep meditation.'}</em>`,
                    false,
                    pData.name,
                    pData.avatar
                );
                messagesContainer.appendChild(err);
            }
        } catch (e) {
            typing.remove();
            const err = createMessage(
                `<em>A moment of silence falls across the chamber. Please try once more.</em>`,
                false,
                pData.name,
                pData.avatar
            );
            messagesContainer.appendChild(err);
        }

        isProcessing = false;
        autoResize();
        scrollToBottom();
        messageInput.focus();
    }

    // Arena Debate Runner
    async function runArenaDebate() {
        const topic = arenaTopic.value.trim();
        const p1 = arenaPhil1.value;
        const p2 = arenaPhil2.value;
        const rounds = arenaRounds.value;

        if (!topic) {
            arenaTopic.focus();
            return;
        }
        if (p1 === p2) {
            alert('Please select two distinct philosophical champions to clash in the Arena.');
            return;
        }

        startArenaBtn.disabled = true;
        startArenaBtn.textContent = 'Debate in Progress...';
        arenaStream.innerHTML = `
            <div class="arena-loading">
                <div class="arena-clash-loader">⚔️</div>
                <h3>The Disputants Have Taken the Forum</h3>
                <p>Generating clash over: <em>"${topic}"</em>...</p>
            </div>
        `;

        try {
            const res = await fetch('/arena/debate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic,
                    philosopher1: p1,
                    philosopher2: p2,
                    rounds: rounds,
                    style: currentCadence
                })
            });

            const data = await res.json();

            if (!res.ok) {
                arenaStream.innerHTML = `<div class="arena-error">Error: ${data.error || 'The disputation was halted.'}</div>`;
                startArenaBtn.disabled = false;
                startArenaBtn.textContent = 'Commence Debate';
                return;
            }

            // Render debate clashes
            arenaStream.innerHTML = `
                <div class="debate-meta-header">
                    <span class="topic-tag">Arena Topic</span>
                    <h2>"${data.topic}"</h2>
                </div>
                <div class="debate-timeline" id="debateTimeline"></div>
            `;

            const timeline = document.getElementById('debateTimeline');
            data.debate.forEach((clash, idx) => {
                const clashCard = document.createElement('div');
                clashCard.className = `clash-card clash-${clash.key}`;
                clashCard.innerHTML = `
                    <div class="clash-badge">Round ${clash.round}</div>
                    <div class="clash-header">
                        <span class="clash-avatar">${clash.avatar}</span>
                        <div class="clash-names">
                            <h4>${clash.speaker}</h4>
                        </div>
                    </div>
                    <div class="clash-text">${clash.text}</div>
                `;
                timeline.appendChild(clashCard);
            });

        } catch (e) {
            arenaStream.innerHTML = `<div class="arena-error">Encountered an interruption during the debate: ${e.message}</div>`;
        }

        startArenaBtn.disabled = false;
        startArenaBtn.textContent = 'Commence Debate';
    }

    // Reset Dialogue
    resetBtn.addEventListener('click', async () => {
        try {
            await fetch('/reset', { method: 'POST' });
            messagesContainer.innerHTML = '';
            if (welcomeMessage) welcomeMessage.style.display = '';
            messageInput.value = '';
            autoResize();
            messageInput.focus();
        } catch (e) {
            console.error('Reset error:', e);
        }
    });

    // Key listeners
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendDialogue();
        }
    });

    sendBtn.addEventListener('click', () => sendDialogue());

    suggestions.forEach(s => {
        s.addEventListener('click', () => sendDialogue(s.dataset.prompt));
    });

    topicPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            arenaTopic.value = preset.dataset.topic;
            runArenaDebate();
        });
    });

    startArenaBtn.addEventListener('click', runArenaDebate);

})();
