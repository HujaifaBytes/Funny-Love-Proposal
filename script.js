document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // --- DOM Elements ---
    const homeScreen = document.getElementById('homeScreen');
    const gameUi = document.getElementById('gameUi');
    const pauseModal = document.getElementById('pauseModal');
    const gameOverModal = document.getElementById('gameOverModal');
    const codingQuestionModal = document.getElementById('codingQuestionModal');

    const highScoreDisplay = document.getElementById('highScoreDisplay');
    const playerNameInput = document.getElementById('playerName');
    const maleBtn = document.getElementById('maleBtn');
    const femaleBtn = document.getElementById('femaleBtn');
    const startGameBtn = document.getElementById('startGameBtn');
    const sensitivitySlider = document.getElementById('sensitivity');
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    const musicNameDisplay = document.getElementById('musicName');
    const prevMusicBtn = document.getElementById('prevMusicBtn');
    const nextMusicBtn = document.getElementById('nextMusicBtn');
    
    const scoreDisplay = document.getElementById('score');
    const dangerLevelDisplay = document.getElementById('dangerLevel');
    const livesDisplay = document.getElementById('lives');
    const pauseBtn = document.getElementById('pauseBtn');
    const quitBtn = document.getElementById('quitBtn');

    // --- Game State Variables ---
    let gameState = 'home'; // home, playing, paused, gameOver, question
    let score = 0;
    let lives = 3;
    let dangerLevel = 1;
    let isSoundEnabled = true;
    let user = { name: '', gender: '' };
    
    // --- Asset Loading ---
    const assets = {};
    const assetSources = {
        player: 'assets/player.png',
        enemy: 'assets/enemy.png',
        bullet: 'assets/bullet.png',
        background: 'assets/background.png',
        explosionSound: 'assets/explosion.wav',
        laserSound: 'assets/laser.wav',
        music: {
            "Sound 1 (Default)": 'assets/background_music.wav',
            "Sound 2 (SLAVA!)": 'assets/background_music3.mp3',
            "Sound 3 (One Kiss)": 'assets/background_music2.mp3'
        }
    };
    
    let assetsLoaded = 0;
    const totalAssets = Object.keys(assetSources).length - 1 + Object.keys(assetSources.music).length;

    function loadAssets() {
        // Images
        assets.player = new Image(); assets.player.src = assetSources.player; assets.player.onload = assetLoaded;
        assets.enemy = new Image(); assets.enemy.src = assetSources.enemy; assets.enemy.onload = assetLoaded;
        assets.bullet = new Image(); assets.bullet.src = assetSources.bullet; assets.bullet.onload = assetLoaded;
        assets.background = new Image(); assets.background.src = assetSources.background; assets.background.onload = assetLoaded;

        // Sounds
        assets.explosionSound = new Audio(assetSources.explosionSound); assets.explosionSound.oncanplaythrough = assetLoaded;
        assets.laserSound = new Audio(assetSources.laserSound); assets.laserSound.oncanplaythrough = assetLoaded;
        
        assets.music = {};
        for (const key in assetSources.music) {
            assets.music[key] = new Audio(assetSources.music[key]);
            assets.music[key].loop = true;
            assets.music[key].oncanplaythrough = assetLoaded;
        }
    }
    
    function assetLoaded() {
        assetsLoaded++;
        if (assetsLoaded >= totalAssets) {
            // All assets loaded, enable start button
            startGameBtn.disabled = false;
        }
    }
    
    let currentMusic;
    const musicKeys = Object.keys(assetSources.music);
    let currentMusicIndex = 0;

    // --- Game Objects ---
    const player = {
        x: canvas.width / 2 - 32,
        y: canvas.height - 100,
        width: 64,
        height: 64,
        speed: 6,
        dx: 0,
        dy: 0
    };

    let bullets = [];
    let enemies = [];
    const enemyBaseSpeed = 3.5;

    // --- Coding Questions ---
    const codingQuestions = [
        { q: "What is `console.log(2 + '2')`?", o: ["4", "22", "Error", "NaN"], a: "22" },
        { q: "Which keyword defines a variable?", o: ["var", "let", "const", "All of these"], a: "All of these" },
        { q: "How do you start a for loop?", o: ["for i = 0", "for (i=0;...)", "loop(i=0)", "for.each"], a: "for (i=0;...)" }
    ];

    // --- Event Listeners ---
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    startGameBtn.addEventListener('click', startGame);
    quitBtn.addEventListener('click', () => changeState('home'));
    pauseBtn.addEventListener('click', togglePause);
    
    maleBtn.addEventListener('click', () => selectGender('Male'));
    femaleBtn.addEventListener('click', () => selectGender('Female'));
    playerNameInput.addEventListener('input', checkCanStart);
    soundToggleBtn.addEventListener('click', toggleSound);
    prevMusicBtn.addEventListener('click', () => changeMusic(-1));
    nextMusicBtn.addEventListener('click', () => changeMusic(1));

    // --- State Management ---
    function changeState(newState) {
        gameState = newState;
        // Hide all screens
        [homeScreen, gameUi, pauseModal, gameOverModal, codingQuestionModal].forEach(s => s.classList.add('hidden'));

        if (currentMusic) currentMusic.pause();

        switch (gameState) {
            case 'home':
                homeScreen.classList.remove('hidden');
                resetGame();
                break;
            case 'playing':
                gameUi.classList.remove('hidden');
                if (isSoundEnabled) playMusic();
                break;
            case 'paused':
                gameUi.classList.remove('hidden');
                pauseModal.classList.remove('hidden');
                break;
            case 'gameOver':
                gameOverModal.classList.remove('hidden');
                break;
            case 'question':
                gameUi.classList.remove('hidden');
                showCodingQuestion();
                break;
        }
    }

    // --- Home Screen Logic ---
    function selectGender(gender) {
        user.gender = gender;
        maleBtn.classList.toggle('selected', gender === 'Male');
        femaleBtn.classList.toggle('selected', gender === 'Female');
        checkCanStart();
    }

    function checkCanStart() {
        user.name = playerNameInput.value.trim();
        startGameBtn.disabled = !(user.name && user.gender);
    }

    // --- Sound and Music ---
    function toggleSound() {
        isSoundEnabled = !isSoundEnabled;
        soundToggleBtn.textContent = `Sound: ${isSoundEnabled ? 'ON' : 'OFF'}`;
        if (!isSoundEnabled && currentMusic) {
            currentMusic.pause();
        } else if (isSoundEnabled && gameState === 'playing') {
            playMusic();
        }
    }

    function playSound(sound) {
        if (isSoundEnabled) {
            sound.currentTime = 0;
            sound.play();
        }
    }

    function changeMusic(direction) {
        currentMusicIndex = (currentMusicIndex + direction + musicKeys.length) % musicKeys.length;
        musicNameDisplay.textContent = musicKeys[currentMusicIndex];
    }
    
    function playMusic() {
        if (currentMusic) currentMusic.pause();
        currentMusic = assets.music[musicKeys[currentMusicIndex]];
        if (isSoundEnabled) currentMusic.play();
    }

    // --- Game Setup ---
    function startGame() {
        player.speed = parseInt(sensitivitySlider.value) * 2;
        resetGame();
        changeState('playing');
        gameLoop();
    }

    function resetGame() {
        score = 0;
        lives = 3;
        dangerLevel = 1;
        player.x = canvas.width / 2 - 32;
        player.y = canvas.height - 100;
        enemies = [];
        bullets = [];
        spawnEnemies(8);
        updateUI();
    }

    function spawnEnemies(count) {
        for (let i = 0; i < count; i++) {
            enemies.push({
                x: Math.random() * (canvas.width - 64),
                y: Math.random() * 150 + 50,
                width: 64,
                height: 64,
                speed: 1,
                behavior: 'normal',
                diveTargetY: 0
            });
        }
    }

    // --- Game Loop ---
    let lastTime = 0;
    let difficultyTimer = 0;
    let diveTimer = 0;
    let questionTimer = 0;

    function gameLoop(timestamp) {
        if (gameState !== 'playing') return;
        
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        difficultyTimer += deltaTime;
        diveTimer += deltaTime;
        questionTimer += deltaTime;

        if (difficultyTimer > 30000) {
            dangerLevel++;
            difficultyTimer = 0;
        }

        if (diveTimer > 5000) {
            const normalEnemies = enemies.filter(e => e.behavior === 'normal');
            if (normalEnemies.length > 0) {
                const divingEnemy = normalEnemies[Math.floor(Math.random() * normalEnemies.length)];
                divingEnemy.behavior = 'diving';
            }
            diveTimer = 0;
        }

        if (questionTimer > 35000) {
            changeState('question');
            questionTimer = 0;
        }

        update();
        draw();

        requestAnimationFrame(gameLoop);
    }
    
    function update() {
        // Player movement
        player.x += player.dx;
        player.y += player.dy;
        if (player.x < 0) player.x = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
        if (player.y < 0) player.y = 0;
        if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

        // Bullet movement
        bullets.forEach((bullet, index) => {
            bullet.y -= bullet.speed;
            if (bullet.y < 0) bullets.splice(index, 1);
        });

        // Enemy movement
        const currentEnemySpeed = enemyBaseSpeed + (dangerLevel * 0.5);
        enemies.forEach((enemy, eIndex) => {
            if (enemy.behavior === 'normal') {
                enemy.x += enemy.speed * currentEnemySpeed;
                if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                    enemy.speed *= -1;
                    enemy.y += 30;
                }
            } else { // Diving
                enemy.y += currentEnemySpeed * 1.5;
            }
            if (enemy.y > canvas.height) {
                enemies.splice(eIndex, 1);
                spawnEnemies(1);
            }

            // Collision: Bullets and Enemies
            bullets.forEach((bullet, bIndex) => {
                if (isColliding(bullet, enemy)) {
                    playSound(assets.explosionSound);
                    score += 10;
                    enemies.splice(eIndex, 1);
                    bullets.splice(bIndex, 1);
                    spawnEnemies(1);
                }
            });

            // Collision: Player and Enemies
            if (isColliding(player, enemy)) {
                lives--;
                if (lives <= 0) {
                    changeState('gameOver');
                }
                enemies.splice(eIndex, 1);
                spawnEnemies(1);
            }
        });
        updateUI();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw player
        ctx.drawImage(assets.player, player.x, player.y, player.width, player.height);
        // Draw bullets
        bullets.forEach(bullet => ctx.drawImage(assets.bullet, bullet.x, bullet.y, bullet.width, bullet.height));
        // Draw enemies
        enemies.forEach(enemy => ctx.drawImage(assets.enemy, enemy.x, enemy.y, enemy.width, enemy.height));
    }
    
    function updateUI() {
        scoreDisplay.textContent = `Score: ${score}`;
        dangerLevelDisplay.textContent = `DANGER LEVEL: ${dangerLevel}`;
        livesDisplay.textContent = '❤️'.repeat(lives);
    }
    
    // --- Utility Functions ---
    function isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    // --- Input Handling ---
    function handleKeyDown(e) {
        if (gameState === 'playing') {
            if (e.key === 'ArrowLeft' || e.key === 'a') player.dx = -player.speed;
            if (e.key === 'ArrowRight' || e.key === 'd') player.dx = player.speed;
            if (e.key === 'ArrowUp' || e.key === 'w') player.dy = -player.speed;
            if (e.key === 'ArrowDown' || e.key === 's') player.dy = player.speed;
            if (e.key === ' ' && bullets.length < 5) shoot();
            if (e.key === 'p') togglePause();
        } else if (gameState === 'paused' && e.key === 'p') {
            togglePause();
        } else if (gameState === 'gameOver' && e.key === 'Enter') {
            changeState('home');
        }
    }
    
    function handleKeyUp(e) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') player.dx = 0;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'ArrowDown' || e.key === 's') player.dy = 0;
    }

    function shoot() {
        playSound(assets.laserSound);
        bullets.push({
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 20,
            speed: 10
        });
    }

    function togglePause() {
        if (gameState === 'playing') {
            changeState('paused');
        } else if (gameState === 'paused') {
            changeState('playing');
            requestAnimationFrame(gameLoop);
        }
    }

    // --- Coding Question Logic ---
    function showCodingQuestion() {
        const questionData = codingQuestions[Math.floor(Math.random() * codingQuestions.length)];
        const questionText = document.getElementById('questionText');
        const optionsContainer = document.getElementById('optionsContainer');
        const feedbackText = document.getElementById('feedbackText');

        questionText.textContent = questionData.q;
        optionsContainer.innerHTML = '';
        feedbackText.textContent = '';
        feedbackText.className = '';

        questionData.o.forEach(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText;
            button.onclick = () => checkAnswer(optionText, questionData.a);
            optionsContainer.appendChild(button);
        });

        codingQuestionModal.classList.remove('hidden');
    }

    function checkAnswer(selected, correct) {
        const feedbackText = document.getElementById('feedbackText');
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.childNodes.forEach(btn => btn.disabled = true); // Disable buttons

        if (selected === correct) {
            feedbackText.textContent = 'Correct!';
            feedbackText.classList.add('correct');
            score += 50; // Bonus for correct answer
        } else {
            feedbackText.textContent = 'Wrong!';
            feedbackText.classList.add('incorrect');
        }
        
        updateUI();

        setTimeout(() => {
            changeState('playing');
            requestAnimationFrame(gameLoop);
        }, 2000);
    }
    
    // --- Initial Load ---
    function initialize() {
        startGameBtn.disabled = true;
        loadAssets();
        changeState('home');
    }

    initialize();
});
