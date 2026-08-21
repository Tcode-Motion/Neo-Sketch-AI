/**
 * NeoSketch AI QuickDraw Game Engine
 * Features: Dynamic Canvas, Particle Trails, AI Challenge Prompts, Real-time Scoring & Evaluation
 */

(function() {
    const CHALLENGE_PROMPTS = [
        { name: "Cyber Rocket 🚀", keywords: ["triangle", "oval", "flame", "cylinder"], targetStrokes: 18 },
        { name: "Neon Sunset 🌅", keywords: ["circle", "horizon", "waves", "mountain"], targetStrokes: 15 },
        { name: "Coffee Cup ☕", keywords: ["cylinder", "handle", "steam", "oval"], targetStrokes: 12 },
        { name: "Cyber Dragon 🐉", keywords: ["curve", "horns", "wings", "spikes"], targetStrokes: 24 },
        { name: "Cute Robot 🤖", keywords: ["square", "antenna", "eyes", "circle"], targetStrokes: 16 },
        { name: "Lotus Flower 🪷", keywords: ["petal", "curves", "center", "leaf"], targetStrokes: 20 },
        { name: "Sports Car 🏎️", keywords: ["wheels", "chassis", "spoiler", "windshield"], targetStrokes: 22 },
        { name: "Neon Cat 🐱", keywords: ["ears", "whiskers", "tail", "face"], targetStrokes: 14 }
    ];

    // State Variables
    let currentPrompt = null;
    let isGameActive = false;
    let timerSeconds = 30;
    let timerInterval = null;
    let score = 0;
    let streak = 0;
    let currentTool = 'brush'; // 'brush', 'rainbow', 'eraser'
    let currentColor = '#ffffff';
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

    // Resize Canvas Support
    function resizeCanvas() {
        const rect = paintCanvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Save current canvas content
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = paintCanvas.width;
        tempCanvas.height = paintCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(paintCanvas, 0, 0);

        paintCanvas.width = rect.width * dpr;
        paintCanvas.height = rect.height * dpr;
        particleCanvas.width = rect.width * dpr;
        particleCanvas.height = rect.height * dpr;

        ctx.scale(dpr, dpr);
        pCtx.scale(dpr, dpr);

        ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Sound Synthesizer (Web Audio API)
    const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;
    function playBeep(freq = 440, type = 'sine', duration = 0.15) {
        if (!audioCtx) return;
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (_) {}
    }

    // Game Lifecycle
    function startGame() {
        isGameActive = true;
        timerSeconds = 30;
        strokesCount = 0;
        history = [];
        clearCanvas();

        // Pick Random Prompt
        currentPrompt = CHALLENGE_PROMPTS[Math.floor(Math.random() * CHALLENGE_PROMPTS.length)];
        targetPromptEl.textContent = currentPrompt.name;

        gameOverlay.style.display = 'none';
        updateStats();

        playBeep(523.25, 'triangle', 0.2); // High C

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timerSeconds--;
            timerEl.textContent = `${timerSeconds}s`;

            if (timerSeconds <= 5) {
                timerEl.style.color = '#ff4757';
                playBeep(330, 'square', 0.1);
            } else {
                timerEl.style.color = '#ff9f43';
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

            overlayEmoji.textContent = '🎉';
            overlayTitle.textContent = `Masterpiece! (+${roundScore} pts)`;
            overlayDesc.textContent = `Great sketch of ${currentPrompt.name}! AI Recognition: ${accuracyScore}%. Streak is now ${streak}!`;
            startChallengeBtn.textContent = 'Next Challenge 🚀';
            playBeep(880, 'sine', 0.3);
            createConfettiParticles();
        } else {
            streak = 0;
            updateStats();

            overlayEmoji.textContent = '⏰';
            overlayTitle.textContent = "Time's Up!";
            overlayDesc.textContent = `You were sketching ${currentPrompt?.name || 'prompt'}. Give it another shot to build your streak!`;
            startChallengeBtn.textContent = 'Try Again 🔄';
            playBeep(220, 'sawtooth', 0.3);
        }

        gameOverlay.style.display = 'flex';
    }

    function evaluateDrawing() {
        if (!isGameActive) return;

        // Dynamic stroke density evaluation
        const target = currentPrompt.targetStrokes;
        const ratio = Math.min(1.0, strokesCount / target);
        const percent = Math.floor(ratio * 100);

        evalPercent.textContent = `${percent}%`;
        evalBar.style.width = `${percent}%`;

        if (percent >= 75 && timerSeconds > 0) {
            evalBar.style.background = 'linear-gradient(135deg, #00f2fe 0%, #38ef7d 100%)';
        }
    }

    function submitDrawing() {
        if (!isGameActive) return;
        if (strokesCount < 5) {
            alert('Draw a little more before submitting to the AI evaluator!');
            return;
        }
        endGame(true);
    }

    function updateStats() {
        timerEl.textContent = `${timerSeconds}s`;
        scoreEl.textContent = `${score} pts`;
        streakEl.textContent = `Streak: ${streak}`;
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
        for (let i = 0; i < 3; i++) {
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
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: particleCanvas.width / (window.devicePixelRatio * 2),
                y: particleCanvas.height / (window.devicePixelRatio * 2),
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12 - 4,
                size: Math.random() * 7 + 4,
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

    // Canvas Pointer Drawing Handlers
    function getPointerPos(e) {
        const rect = paintCanvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function startDraw(e) {
        if (!isGameActive) return;
        saveState();
        isDrawing = true;
        const pos = getPointerPos(e);
        lastX = pos.x;
        lastY = pos.y;
    }

    function draw(e) {
        if (!isDrawing || !isGameActive) return;
        const pos = getPointerPos(e);

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);

        if (currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = brushSize * 2;
            ctx.stroke();
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineWidth = brushSize;

            if (currentTool === 'rainbow') {
                hue = (hue + 2) % 360;
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

    // Touch Events (Mobile Support)
    paintCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, { passive: false });
    paintCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, { passive: false });
    paintCanvas.addEventListener('touchend', stopDraw);

    // UI Event Listeners
    startChallengeBtn.addEventListener('click', startGame);
    submitBtn.addEventListener('click', submitDrawing);
    undoBtn.addEventListener('click', undo);
    clearBtn.addEventListener('click', clearCanvas);

    brushSizeInput.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value, 10);
    });

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
