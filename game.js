/**
 * NeoSketch AI QuickDraw Game Engine (v2.0)
 * Immediate Challenge Initialization, Canvas Scaling & Sound Synthesizer
 */

(function() {
    const CHALLENGE_PROMPTS = [
        { name: "Cyber Rocket 🚀", keywords: ["triangle", "oval", "flame", "cylinder"], targetStrokes: 16 },
        { name: "Neon Sunset 🌅", keywords: ["circle", "horizon", "waves", "mountain"], targetStrokes: 14 },
        { name: "Coffee Cup ☕", keywords: ["cylinder", "handle", "steam", "oval"], targetStrokes: 12 },
        { name: "Cyber Dragon 🐉", keywords: ["curve", "horns", "wings", "spikes"], targetStrokes: 22 },
        { name: "Cute Robot 🤖", keywords: ["square", "antenna", "eyes", "circle"], targetStrokes: 15 },
        { name: "Lotus Flower 🪷", keywords: ["petal", "curves", "center", "leaf"], targetStrokes: 18 },
        { name: "Sports Car 🏎️", keywords: ["wheels", "chassis", "spoiler", "windshield"], targetStrokes: 20 },
        { name: "Neon Cat 🐱", keywords: ["ears", "whiskers", "tail", "face"], targetStrokes: 14 }
    ];

    // Game State
    let currentPrompt = CHALLENGE_PROMPTS[0];
    let isGameActive = false;
    let timerSeconds = 30;
    let timerInterval = null;
    let score = 0;
    let streak = 0;
    let currentTool = 'brush'; // 'brush', 'rainbow', 'eraser'
    let currentColor = '#38ef7d';
    let brushSize = 8;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let strokesCount = 0;
    let history = [];
    let particles = [];
    let hue = 0;

    // DOM Elements
    const paintCanvas = document.getElementById('paintCanvas');
    const particleCanvas = document.getElementById('particleCanvas');
    if (!paintCanvas || !particleCanvas) return;

    const ctx = paintCanvas.getContext('2d');
    const pCtx = particleCanvas.getContext('2d');

    const targetPromptEl = document.getElementById('targetPrompt');
    const timerEl = document.getElementById('gameTimer');
    const scoreEl = document.getElementById('gameScore');
    const streakEl = document.getElementById('gameStreak');
    const evalBar = document.getElementById('evalBar');
    const evalPercent = document.getElementById('evalPercentage');

    const gameOverlay = document.getElementById('gameOverlay');
    const overlayEmoji = document.getElementById('overlayEmoji');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayDesc = document.getElementById('overlayDesc');
    const startChallengeBtn = document.getElementById('startChallengeBtn');

    const toolBtns = document.querySelectorAll('.tool-btn');
    const colorDots = document.querySelectorAll('.color-dot');
    const brushSizeInput = document.getElementById('brushSize');
    const undoBtn = document.getElementById('undoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const submitBtn = document.getElementById('submitDrawingBtn');

    // Immediate Initialization on Page Load
    function initializePrompt() {
        const randomIndex = Math.floor(Math.random() * CHALLENGE_PROMPTS.length);
        currentPrompt = CHALLENGE_PROMPTS[randomIndex];
        if (targetPromptEl) {
            targetPromptEl.textContent = currentPrompt.name;
        }
        if (evalPercent) evalPercent.textContent = "0%";
        if (evalBar) evalBar.style.width = "0%";
    }
    initializePrompt();

    // Canvas Sizing & HiDPI Support
    function resizeCanvas() {
        const rect = paintCanvas.parentElement.getBoundingClientRect();
        const width = Math.max(300, Math.floor(rect.width));
        const height = Math.max(300, Math.floor(rect.height));

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = paintCanvas.width;
        tempCanvas.height = paintCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (paintCanvas.width > 0 && paintCanvas.height > 0) {
            tempCtx.drawImage(paintCanvas, 0, 0);
        }

        paintCanvas.width = width;
        paintCanvas.height = height;
        particleCanvas.width = width;
        particleCanvas.height = height;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (tempCanvas.width > 0 && tempCanvas.height > 0) {
            ctx.drawImage(tempCanvas, 0, 0, width, height);
        }
    }

    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 50);

    // Web Audio Sound Synthesizer
    let audioCtx = null;
    function playBeep(freq = 440, type = 'sine', duration = 0.15) {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (_) {}
    }

    // Start Challenge Handler
    function startGame() {
        isGameActive = true;
        timerSeconds = 30;
        strokesCount = 0;
        history = [];
        clearCanvas();

        initializePrompt();

        if (gameOverlay) {
            gameOverlay.style.display = 'none';
        }
        updateStats();

        playBeep(523.25, 'triangle', 0.2); // High C

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timerSeconds--;
            if (timerEl) {
                timerEl.textContent = `${timerSeconds}s`;
                if (timerSeconds <= 5) {
                    timerEl.style.color = '#ff4757';
                    playBeep(330, 'square', 0.1);
                } else {
                    timerEl.style.color = '#ff9f43';
                }
            }

            if (timerSeconds <= 0) {
                endGame(false);
            }
        }, 1000);
    }

    function endGame(isWon) {
        isGameActive = false;
        clearInterval(timerInterval);

        if (isWon) {
            const timeBonus = timerSeconds * 15;
            const accuracyScore = Math.min(100, Math.floor((strokesCount / currentPrompt.targetStrokes) * 100));
            const roundScore = 300 + timeBonus + accuracyScore * 2;
            
            score += roundScore;
            streak++;
            updateStats();

            if (overlayEmoji) overlayEmoji.textContent = '🎉';
            if (overlayTitle) overlayTitle.textContent = `Masterpiece! (+${roundScore} pts)`;
            if (overlayDesc) overlayDesc.textContent = `Great sketch of ${currentPrompt.name}! AI Recognition: ${accuracyScore}%. Streak is now ${streak}!`;
            if (startChallengeBtn) startChallengeBtn.textContent = 'Next Challenge 🚀';
            playBeep(880, 'sine', 0.3);
            createConfettiParticles();
        } else {
            streak = 0;
            updateStats();

            if (overlayEmoji) overlayEmoji.textContent = '⏰';
            if (overlayTitle) overlayTitle.textContent = "Time's Up!";
            if (overlayDesc) overlayDesc.textContent = `You were sketching ${currentPrompt?.name || 'prompt'}. Give it another shot to build your streak!`;
            if (startChallengeBtn) startChallengeBtn.textContent = 'Try Again 🔄';
            playBeep(220, 'sawtooth', 0.3);
        }

        if (gameOverlay) {
            gameOverlay.style.display = 'flex';
        }
    }

    function evaluateDrawing() {
        if (!isGameActive && strokesCount === 0) return;

        const target = currentPrompt.targetStrokes || 15;
        const ratio = Math.min(1.0, strokesCount / target);
        const percent = Math.floor(ratio * 100);

        if (evalPercent) evalPercent.textContent = `${percent}%`;
        if (evalBar) {
            evalBar.style.width = `${percent}%`;
            if (percent >= 75) {
                evalBar.style.background = 'linear-gradient(135deg, #00f2fe 0%, #38ef7d 100%)';
            }
        }
    }

    function submitDrawing() {
        if (!isGameActive) {
            startGame();
            return;
        }
        if (strokesCount < 4) {
            alert('Draw a little more before submitting to the AI evaluator!');
            return;
        }
        endGame(true);
    }

    function updateStats() {
        if (timerEl) timerEl.textContent = `${timerSeconds}s`;
        if (scoreEl) scoreEl.textContent = `${score} pts`;
        if (streakEl) streakEl.textContent = `Streak: ${streak}`;
    }

    function saveState() {
        if (history.length > 20) history.shift();
        history.push(ctx.getImageData(0, 0, paintCanvas.width, paintCanvas.height));
    }

    function undo() {
        if (history.length > 0) {
            const prevState = history.pop();
            ctx.putImageData(prevState, 0, 0);
            strokesCount = Math.max(0, strokesCount - 2);
            evaluateDrawing();
        }
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
        strokesCount = 0;
        evaluateDrawing();
    }

    // Particle Trail Effects
    function addParticle(x, y, color) {
        for (let i = 0; i < 2; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: Math.random() * 4 + 2,
                color: color,
                alpha: 1
            });
        }
    }

    function createConfettiParticles() {
        const colors = ['#38ef7d', '#00f2fe', '#ff007f', '#ffe600', '#9d4edd'];
        for (let i = 0; i < 70; i++) {
            particles.push({
                x: particleCanvas.width / 2,
                y: particleCanvas.height / 2,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.5) * 14 - 3,
                size: Math.random() * 6 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1.5
            });
        }
    }

    function renderParticles() {
        pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;

            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }

            pCtx.save();
            pCtx.globalAlpha = Math.min(1, p.alpha);
            pCtx.fillStyle = p.color;
            pCtx.beginPath();
            pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            pCtx.fill();
            pCtx.restore();
        }

        requestAnimationFrame(renderParticles);
    }
    requestAnimationFrame(renderParticles);

    // Pointer Event Handlers
    function getPointerPos(e) {
        const rect = paintCanvas.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
        return {
            x: (clientX - rect.left) * (paintCanvas.width / rect.width),
            y: (clientY - rect.top) * (paintCanvas.height / rect.height)
        };
    }

    function startDraw(e) {
        if (!isGameActive) {
            startGame();
        }
        saveState();
        isDrawing = true;
        const pos = getPointerPos(e);
        lastX = pos.x;
        lastY = pos.y;
    }

    function draw(e) {
        if (!isDrawing) return;
        const pos = getPointerPos(e);

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);

        if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = brushSize * 2.5;
            ctx.stroke();
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineWidth = brushSize;

            if (currentTool === 'rainbow') {
                hue = (hue + 3) % 360;
                const rainbowColor = `hsl(${hue}, 100%, 60%)`;
                ctx.strokeStyle = rainbowColor;
                ctx.shadowColor = rainbowColor;
                ctx.shadowBlur = 10;
                addParticle(pos.x, pos.y, rainbowColor);
            } else {
                ctx.strokeStyle = currentColor;
                ctx.shadowColor = currentColor;
                ctx.shadowBlur = 6;
                addParticle(pos.x, pos.y, currentColor);
            }
            ctx.stroke();
        }

        lastX = pos.x;
        lastY = pos.y;
        strokesCount++;
        evaluateDrawing();
    }

    function stopDraw() {
        if (!isDrawing) return;
        isDrawing = false;
        ctx.shadowBlur = 0;
    }

    // Mouse Events
    paintCanvas.addEventListener('mousedown', startDraw);
    paintCanvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    // Touch Events for Mobile
    paintCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, { passive: false });
    paintCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });
    paintCanvas.addEventListener('touchend', stopDraw);

    // UI Event Listeners
    if (startChallengeBtn) startChallengeBtn.addEventListener('click', startGame);
    if (submitBtn) submitBtn.addEventListener('click', submitDrawing);
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (clearBtn) clearBtn.addEventListener('click', clearCanvas);

    if (brushSizeInput) {
        brushSizeInput.addEventListener('input', (e) => {
            brushSize = parseInt(e.target.value, 10);
        });
    }

    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toolBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });

    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            currentColor = dot.dataset.color;
            if (currentTool === 'eraser') {
                currentTool = 'brush';
                toolBtns.forEach(b => b.classList.toggle('active', b.dataset.tool === 'brush'));
            }
        });
    });
})();
