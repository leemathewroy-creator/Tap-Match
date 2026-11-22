
// ==========================================
// 1. GAME SETTINGS
// ==========================================

const icons = [
    "🍎", "🍌", "🍇", "🍓", "🍒",
    "🍊", "🍉", "🥝", "🍍", "🥑",
    "🥥", "🍑", "🍐", "🍋", "🫐",
    "🍈", "🥭", "🍅", "🥕", "🌽"
];

const MAX_SLOTS = 7;

let board = [];
let collection = [];

let level = 1;
let moves = 0;
let seconds = 0;
let timeLeft = 300;
let score = 0;
let combo = 0;
let hintsLeft = 3;

let gameOver = false;
let gameStarted = false;
let soundEnabled = true;
let changingLevel = false;

let timerInterval = null;
let hintTimeout = null;
let levelTimeout = null;


// ==========================================
// 2. CONNECT HTML ELEMENTS
// ==========================================

const gameBoard = document.getElementById("gameBoard");
const collectionBar = document.getElementById("collectionBar");

const levelDisplay = document.getElementById("level");
const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");
const remainingDisplay = document.getElementById("remaining");
const hintsDisplay = document.getElementById("hints");

const scoreDisplay = document.getElementById("score");
const bestScoreDisplay = document.getElementById("bestScore");
const comboDisplay = document.getElementById("combo");

const statusMessage = document.getElementById("statusMessage");

const endScreen = document.getElementById("endScreen");
const endTitle = document.getElementById("endTitle");
const endDescription = document.getElementById("endDescription");

const hintBtn = document.getElementById("hintBtn");
const soundBtn = document.getElementById("soundBtn");
const restartBtn = document.getElementById("restartBtn");

const backgroundMusic = document.getElementById("backgroundMusic");

const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const gameContent = document.getElementById("gameContent");


// ==========================================
// 3. LEVEL SETTINGS
// ==========================================

// Every level has the same 5-minute time limit.

function getLevelTime() {
    return 300;
}

// Number of hints available per level.

function getLevelHints() {
    return Math.max(4 - level, 0);
}

// Number of different fruits increases per level.

function getActiveIcons() {

    const numberOfIcons = Math.min(
        10 + ((level - 1) * 2),
        icons.length
    );

    return icons.slice(0, numberOfIcons);

}

// Number of copies per fruit.
// Increases after Level 10.

function getCopiesPerIcon() {

    return 3 * (1 + Math.floor((level - 1) / 10));

}


// ==========================================
// 4. BEST SCORE SYSTEM
// ==========================================

let bestScore =
    Number(localStorage.getItem("tapMatchBest")) || 0;

bestScoreDisplay.textContent = bestScore;

function updateBestScore() {

    if (score > bestScore) {

        bestScore = score;

        localStorage.setItem(
            "tapMatchBest",
            bestScore
        );

        bestScoreDisplay.textContent = bestScore;

    }

}


// ==========================================
// 5. BACKGROUND MUSIC
// ==========================================

if (backgroundMusic) {

    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.25;

}

function startBackgroundMusic() {

    if (!soundEnabled || !backgroundMusic) return;

    backgroundMusic.play().catch(() => {

        console.log("Waiting for player interaction.");

    });

}

function stopBackgroundMusic() {

    if (backgroundMusic) {
        backgroundMusic.pause();
    }

}


// ==========================================
// 6. SOUND EFFECT SYSTEM
// ==========================================

let audioContext = null;

function initializeAudio() {

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

}

function playSound(type) {

    if (!soundEnabled) return;

    try {

        initializeAudio();

        if (!audioContext) return;

        const sounds = {

            tap: [400],

            match: [523, 659, 784],

            hint: [500, 650],

            win: [523, 659, 784, 1046],

            lose: [350, 260, 180],

            restart: [392, 523, 659]

        };

        const notes = sounds[type] || sounds.tap;

        notes.forEach((frequency, index) => {

            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            const now =
                audioContext.currentTime + (index * 0.12);

            oscillator.type = "sine";
            oscillator.frequency.value = frequency;

            gain.gain.setValueAtTime(0.001, now);

            gain.gain.linearRampToValueAtTime(
                0.12,
                now + 0.025
            );

            gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + 0.3
            );

            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            oscillator.start(now);
            oscillator.stop(now + 0.3);

        });

    } catch (error) {

        console.log("Sound is unavailable.");

    }

}


// ==========================================
// 7. SOUND ON/OFF BUTTON
// ==========================================

soundBtn.addEventListener("click", function() {

    soundEnabled = !soundEnabled;

    if (soundEnabled) {

        soundBtn.textContent = "🔊 SOUND ON";

        initializeAudio();
        startBackgroundMusic();
        playSound("tap");

    } else {

        soundBtn.textContent = "🔇 SOUND OFF";

        stopBackgroundMusic();

    }

});


// ==========================================
// 8. SHUFFLE FUNCTION
// ==========================================

function shuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];

    }

    return array;

}


// ==========================================
// 9. START GAME
// ==========================================

function startGame() {

    clearInterval(timerInterval);
    clearTimeout(hintTimeout);
    clearTimeout(levelTimeout);

    level = 1;
    score = 0;
    combo = 0;

    changingLevel = false;

    scoreDisplay.textContent = "0";
    comboDisplay.textContent = "x0";

    startLevel();

}


// ==========================================
// 10. START NEW LEVEL
// ==========================================

function startLevel() {

    clearInterval(timerInterval);
    clearTimeout(hintTimeout);

    gameOver = false;
    gameStarted = false;
    changingLevel = false;

    moves = 0;
    seconds = 0;

    collection = [];

    timeLeft = getLevelTime();
    hintsLeft = getLevelHints();

    const activeIcons = getActiveIcons();
    const copies = getCopiesPerIcon();

    board = [];

    activeIcons.forEach((icon, index) => {

        for (let i = 0; i < copies; i++) {

            board.push({

                id: index * copies + i + 1,
                symbol: icon

            });

        }

    });

    shuffle(board);

    levelDisplay.textContent = level;
    movesDisplay.textContent = "0";

    scoreDisplay.textContent = score;
    comboDisplay.textContent = "x" + combo;

    bestScoreDisplay.textContent = bestScore;

    timerDisplay.textContent = formatTime(timeLeft);

    hintsDisplay.textContent = hintsLeft;
    hintBtn.textContent = "💡 HINT (" + hintsLeft + ")";

    remainingDisplay.textContent = board.length;

    endScreen.style.display = "none";

    statusMessage.textContent =
        "Level " + level + "! Match three identical icons!";

    renderBoard();
    renderCollection();

}


// ==========================================
// 11. TIMER FORMAT
// ==========================================

function formatTime(time) {

    const minutes = Math.floor(time / 60);
    const remainingSeconds = time % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );

}


// ==========================================
// 12. COUNTDOWN TIMER
// ==========================================

function startTimer() {

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        if (gameOver || changingLevel) return;

        timeLeft--;

        timerDisplay.textContent = formatTime(timeLeft);

        if (timeLeft === 30) {

            statusMessage.textContent =
                "⚠️ Hurry up! Only 30 seconds left!";

        }

        if (timeLeft <= 0) {

            timeLeft = 0;

            timerDisplay.textContent = "00:00";

            endGame(false, "TIME'S UP! ⏰");

        }

    }, 1000);

}


// ==========================================
// 13. DISPLAY GAME BOARD
// ==========================================

function renderBoard() {

    gameBoard.innerHTML = "";

    board.forEach(tile => {

        const button = document.createElement("button");

        button.classList.add("tile");

        button.textContent = tile.symbol;

        button.dataset.id = tile.id;

        button.addEventListener("click", function() {

            selectTile(tile.id);

        });

        gameBoard.appendChild(button);

    });

    remainingDisplay.textContent = board.length;

}


// ==========================================
// 14. SELECT FRUIT TILE
// ==========================================

function selectTile(id) {

    if (gameOver || changingLevel) return;

    const selectedTile = board.find(
        tile => tile.id === id
    );

    if (!selectedTile) return;

    // Start timer on the first fruit tap.

    if (!gameStarted) {

        initializeAudio();
        startBackgroundMusic();

        startTimer();

        gameStarted = true;

    }

    playSound("tap");

    moves++;

    movesDisplay.textContent = moves;

    board = board.filter(
        tile => tile.id !== id
    );

    collection.push(selectedTile.symbol);

    renderBoard();
    renderCollection();

    checkTripleMatch();

}


// ==========================================
// 15. DISPLAY COLLECTION
// ==========================================

function renderCollection() {

    collectionBar.innerHTML = "";

    for (let i = 0; i < MAX_SLOTS; i++) {

        const slot = document.createElement("div");

        slot.classList.add("slot");

        if (collection[i]) {

            slot.textContent = collection[i];

        }

        collectionBar.appendChild(slot);

    }

}


// ==========================================
// 16. CHECK TRIPLE MATCH
// ==========================================

function checkTripleMatch() {

    let matched = false;

    for (const icon of getActiveIcons()) {

        let count = collection.filter(
            item => item === icon
        ).length;

        while (count >= 3) {

            let removed = 0;

            collection = collection.filter(item => {

                if (item === icon && removed < 3) {

                    removed++;

                    return false;

                }

                return true;

            });

            score += 100;
            combo++;

            matched = true;

            count -= 3;

            playSound("match");

            statusMessage.textContent =
                "Great! " + icon + " MATCHED! +100 POINTS!";

        }

    }

    if (matched) {

        scoreDisplay.textContent = score;
        comboDisplay.textContent = "x" + combo;

        updateBestScore();

        renderCollection();

    }

    if (board.length === 0 && collection.length === 0) {

        nextLevel();

        return;

    }

    if (collection.length >= MAX_SLOTS) {

        endGame(false, "GAME OVER!");

        return;

    }

    if (!matched) {

        statusMessage.textContent =
            "Keep going! Find three matching icons!";

    }

}


// ==========================================
// 17. NEXT LEVEL SYSTEM
// ==========================================

function nextLevel() {

    if (gameOver || changingLevel) return;

    changingLevel = true;

    clearInterval(timerInterval);
    clearTimeout(hintTimeout);

    timerInterval = null;
    hintTimeout = null;

    playSound("win");

    level++;

    statusMessage.textContent =
        "🎉 LEVEL COMPLETED! GET READY FOR LEVEL " + level + "!";

    levelTimeout = setTimeout(() => {

        startLevel();

    }, 1800);

}


// ==========================================
// 18. LIMITED HINT SYSTEM
// ==========================================

function showHint() {

    if (gameOver || changingLevel) return;

    if (hintsLeft <= 0) {

        statusMessage.textContent =
            "No hints left! Complete this level without help!";

        return;

    }

    const hintIcon = getActiveIcons().find(icon => {

        const inCollection = collection.filter(
            item => item === icon
        ).length;

        const inBoard = board.filter(
            tile => tile.symbol === icon
        ).length;

        return inCollection + inBoard >= 3 && inBoard > 0;

    });

    if (!hintIcon) {

        statusMessage.textContent =
            "No matching hint available!";

        return;

    }

    hintsLeft--;

    hintsDisplay.textContent = hintsLeft;

    hintBtn.textContent =
        "💡 HINT (" + hintsLeft + ")";

    clearTimeout(hintTimeout);

    document.querySelectorAll(".hint-highlight")
        .forEach(tile => {
            tile.classList.remove("hint-highlight");
        });

    const matchingTiles = board.filter(
        tile => tile.symbol === hintIcon
    );

    matchingTiles.forEach(tile => {

        const element = gameBoard.querySelector(
            `[data-id="${tile.id}"]`
        );

        if (element) {

            element.classList.add("hint-highlight");

        }

    });

    playSound("hint");

    statusMessage.textContent =
        "Find " + hintIcon + " to complete your match!";

    hintTimeout = setTimeout(() => {

        document.querySelectorAll(".hint-highlight")
            .forEach(tile => {
                tile.classList.remove("hint-highlight");
            });

    }, 3000);

}

hintBtn.addEventListener("click", showHint);


// ==========================================
// 19. END GAME
// ==========================================

function endGame(won, message) {

    if (gameOver) return;

    gameOver = true;

    clearInterval(timerInterval);
    clearTimeout(hintTimeout);
    clearTimeout(levelTimeout);

    timerInterval = null;

    updateBestScore();

    endScreen.style.display = "flex";

    if (won) {

        endTitle.textContent = "YOU WIN! 🎉";

        endDescription.textContent =
            "Amazing! You completed all levels! Final Score: " +
            score;

        playSound("win");

    } else {

        endTitle.textContent = message || "GAME OVER!";

        endDescription.textContent =
            "You reached Level " + level +
            "! Final Score: " + score;

        playSound("lose");

    }

    statusMessage.textContent =
        "Game finished! Try again!";

}


// ==========================================
// 20. RESTART GAME
// ==========================================

function restartGame() {

    clearInterval(timerInterval);
    clearTimeout(hintTimeout);
    clearTimeout(levelTimeout);

    playSound("restart");

    startGame();

}

restartBtn.addEventListener("click", restartGame);


// ==========================================
// 21. START SCREEN BUTTON
// ==========================================

startBtn.addEventListener("click", function() {

    // Hide the welcome screen.
    startScreen.style.display = "none";

    // Show the actual game.
    gameContent.style.display = "flex";

    // Start music after player interaction.
    initializeAudio();
    startBackgroundMusic();

    // Initialize a fresh game.
    startGame();

});
