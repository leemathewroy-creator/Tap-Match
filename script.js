
// ==========================================
// 1. GAME SETTINGS - Dito naka-set ang basic settings at variables ng game.
// ==========================================

// Listahan ng fruit icons na puwedeng lumabas sa game board.
const icons = [
    "🍎", "🍌", "🍇", "🍓", "🍒",
    "🍊", "🍉", "🥝", "🍍", "🥑",
    "🥥", "🍑", "🍐", "🍋", "🫐",
    "🍈", "🥭", "🍅", "🥕", "🌽"
];

// Maximum number ng fruits na puwedeng ilagay sa collection bar.
const MAX_SLOTS = 7;

// Mga variables na nagtatago ng game data at current progress ng player.
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
// 2. CONNECT HTML ELEMENTS - Kinukuha rito ang HTML elements para magamit ng JavaScript.
// ==========================================

// Kinukuha ang mga elements gamit ang kanilang ID sa HTML.
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
// 3. LEVEL SETTINGS - Dito naka-set ang rules na nagbabago depende sa level.
// ==========================================

// Pare-pareho ang time limit ng bawat level: 5 minutes o 300 seconds.
function getLevelTime() {
    return 300;
}

// Kinukuha kung ilang hints ang available depende sa current level.
function getLevelHints() {
    return Math.max(4 - level, 0);
}

// Dinadagdagan ang number of fruit icons habang tumataas ang level.
function getActiveIcons() {

    const numberOfIcons = Math.min(
        10 + ((level - 1) * 2),
        icons.length
    );

    return icons.slice(0, numberOfIcons);

}

// Tinutukoy kung ilang copies ang bawat fruit icon.
// Nadadagdagan ang copies pagkatapos ng Level 10.
function getCopiesPerIcon() {

    return 3 * (1 + Math.floor((level - 1) / 10));

}


// ==========================================
// 4. BEST SCORE SYSTEM - Nagse-save at nag-a-update ng highest score gamit ang localStorage.
// ==========================================

// Kinukuha ang dating best score na naka-save sa browser.
let bestScore =
    Number(localStorage.getItem("tapMatchBest")) || 0;

// Ipinapakita ang saved best score sa scoreboard.
bestScoreDisplay.textContent = bestScore;

// Chine-check kung mas mataas ang current score kaysa sa best score.
function updateBestScore() {

    if (score > bestScore) {

        bestScore = score;

        // Sine-save ang bagong best score sa browser.
        localStorage.setItem(
            "tapMatchBest",
            bestScore
        );

        // Ina-update ang best score na nakikita sa screen.
        bestScoreDisplay.textContent = bestScore;

    }

}


// ==========================================
// 5. BACKGROUND MUSIC - Dito kinokontrol ang background music ng game.
// ==========================================

if (backgroundMusic) {

    // Inuulit ang music at hinaan ang volume para hindi masyadong malakas.
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.25;

}

// Function para patugtugin ang background music.
function startBackgroundMusic() {

    if (!soundEnabled || !backgroundMusic) return;

    backgroundMusic.play().catch(() => {

        console.log("Waiting for player interaction.");

    });

}

// Function para i-pause ang background music.
function stopBackgroundMusic() {

    if (backgroundMusic) {
        backgroundMusic.pause();
    }

}


// ==========================================
// 6. SOUND EFFECT SYSTEM - Gumagawa ng sound effects para sa iba't ibang actions sa game.
// ==========================================

// Dito naka-store ang audio system na ginagamit para gumawa ng sounds.
let audioContext = null;

// Inihahanda ang audio system para makapag-play ng sound effects.
function initializeAudio() {

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    // Ina-activate ulit ang audio kapag naka-suspend ito.
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

}

// Function na ginagamit para mag-play ng iba't ibang sound effects.
function playSound(type) {

    if (!soundEnabled) return;

    try {

        initializeAudio();

        if (!audioContext) return;

        // Mga sound frequency para sa bawat action sa game.
        const sounds = {

            tap: [400],

            match: [523, 659, 784],

            hint: [500, 650],

            win: [523, 659, 784, 1046],

            lose: [350, 260, 180],

            restart: [392, 523, 659]

        };

        // Pinipili ang sound na tugma sa action na nangyari.
        const notes = sounds[type] || sounds.tap;

        notes.forEach((frequency, index) => {

            // Gumagawa ng sound wave at nagse-set ng volume nito.
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            const now =
                audioContext.currentTime + (index * 0.12);

            // Itinatakda ang type at frequency ng sound.
            oscillator.type = "sine";
            oscillator.frequency.value = frequency;

            // Dahan-dahang pinapalakas ang sound.
            gain.gain.setValueAtTime(0.001, now);

            gain.gain.linearRampToValueAtTime(
                0.12,
                now + 0.025
            );

            // Dahan-dahang hina-hinaan ang sound hanggang mawala.
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                now + 0.3
            );

            // Kinokonekta ang sound sa audio output ng device.
            oscillator.connect(gain);
            gain.connect(audioContext.destination);

            // Pinapatugtog ang sound at itinatakda kung kailan ito titigil.
            oscillator.start(now);
            oscillator.stop(now + 0.3);

        });

    } catch (error) {

        console.log("Sound is unavailable.");

    }

}


// ==========================================
// 7. SOUND ON/OFF BUTTON - Ito ang nagko-control kung naka-on o naka-off ang sounds at background music.
// ==========================================

soundBtn.addEventListener("click", function() {

    // Binabaliktad ang sound setting kapag pinindot ang button.
    soundEnabled = !soundEnabled;

    if (soundEnabled) {

        // Ipinapakita na naka-on ang sound.
        soundBtn.textContent = "🔊 SOUND ON";

        initializeAudio();
        startBackgroundMusic();
        playSound("tap");

    } else {

        // Ipinapakita na naka-off ang sound.
        soundBtn.textContent = "🔇 SOUND OFF";

        stopBackgroundMusic();

    }

});


// ==========================================
// 8. SHUFFLE FUNCTION - Hinahalo ang order ng fruit icons para random ang position nila sa game board.
// ==========================================

// Random na inaayos ang position ng items sa array.
function shuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        // Pinagpapalit ang position ng dalawang items.
        [array[i], array[j]] = [array[j], array[i]];

    }

    return array;

}


// ==========================================
// 9. START GAME - Nire-reset ang important game values at sinisimulan ang unang level.
// ==========================================

function startGame() {

    // Tinatanggal ang mga dating timer at timeout para walang mag-overlap.
    clearInterval(timerInterval);
    clearTimeout(hintTimeout);
    clearTimeout(levelTimeout);

    // Ibinabalik sa starting values ang level, score, at combo.
    level = 1;
    score = 0;
    combo = 0;

    changingLevel = false;

    // Ina-update ang scoreboard.
    scoreDisplay.textContent = "0";
    comboDisplay.textContent = "x0";

    // Sinisimulan ang first level.
    startLevel();

}


// ==========================================
// 10. START NEW LEVEL - Gumagawa ng bagong set ng fruit icons at nire-reset ang values para sa bagong level.
// ==========================================

function startLevel() {

    // Tinatanggal ang dating timer at hint timeout.
    clearInterval(timerInterval);
    clearTimeout(hintTimeout);

    // Ibinabalik sa normal ang game status.
    gameOver = false;
    gameStarted = false;
    changingLevel = false;

    // Nire-reset ang moves at iba pang values para sa bagong level.
    moves = 0;
    seconds = 0;

    collection = [];

    timeLeft = getLevelTime();
    hintsLeft = getLevelHints();

    // Kinukuha kung ilang fruit icons at copies ang gagamitin sa level.
    const activeIcons = getActiveIcons();
    const copies = getCopiesPerIcon();

    // Nililinis ang board bago gumawa ng bagong set ng fruits.
    board = [];

    // Gumagawa ng copies ng bawat fruit icon at nilalagyan ng unique ID.
    activeIcons.forEach((icon, index) => {

        for (let i = 0; i < copies; i++) {

            board.push({

                id: index * copies + i + 1,
                symbol: icon

            });

        }

    });

    // Hinahalo ang position ng mga fruits para random ang arrangement.
    shuffle(board);

    // Ina-update ang information na makikita sa scoreboard.
    levelDisplay.textContent = level;
    movesDisplay.textContent = "0";

    scoreDisplay.textContent = score;
    comboDisplay.textContent = "x" + combo;

    bestScoreDisplay.textContent = bestScore;

    timerDisplay.textContent = formatTime(timeLeft);

    hintsDisplay.textContent = hintsLeft;
    hintBtn.textContent = "💡 HINT (" + hintsLeft + ")";

    remainingDisplay.textContent = board.length;

    // Itinatago ang end screen kapag nagsimula ang bagong level.
    endScreen.style.display = "none";

    // Nagpapakita ng message para sa current level.
    statusMessage.textContent =
        "Level " + level + "! Match three identical icons!";

    // Ipinapakita ang bagong game board at collection bar.
    renderBoard();
    renderCollection();

}


// ==========================================
// 11. TIMER FORMAT - Ginagawang minutes at seconds ang time para madaling basahin sa screen.
// ==========================================

function formatTime(time) {

    // Kinukuha ang minutes at remaining seconds.
    const minutes = Math.floor(time / 60);
    const remainingSeconds = time % 60;

    // Ginagawang 00:00 format ang timer.
    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );

}


// ==========================================
// 12. COUNTDOWN TIMER - Pinapababa ang remaining time bawat second at tinatapos ang game kapag ubos na ang oras.
// ==========================================

function startTimer() {

    // Tinatanggal muna ang dating timer para hindi magkaroon ng dalawang timer.
    clearInterval(timerInterval);

    // Gumagana ang timer kada isang second.
    timerInterval = setInterval(() => {

        if (gameOver || changingLevel) return;

        // Binabawasan ang remaining time.
        timeLeft--;

        // Ina-update ang timer na makikita sa screen.
        timerDisplay.textContent = formatTime(timeLeft);

        // Nagpapakita ng warning kapag 30 seconds na lang ang natitira.
        if (timeLeft === 30) {

            statusMessage.textContent =
                "⚠️ Hurry up! Only 30 seconds left!";

        }

        // Kapag naubos ang oras, matatapos ang game.
        if (timeLeft <= 0) {

            timeLeft = 0;

            timerDisplay.textContent = "00:00";

            endGame(false, "TIME'S UP! ⏰");

        }

    }, 1000);

}


// ==========================================
// 13. DISPLAY GAME BOARD - Ipinapakita ang fruit icons sa game board at nilalagyan ang bawat isa ng click function.
// ==========================================

// Nililinis muna ang board, tapos ipinapakita ulit ang lahat ng fruit na natitira.
function renderBoard() {

    gameBoard.innerHTML = "";

    // Isa-isang ginagawa at ipinapakita ang fruit icons sa board.
    board.forEach(tile => {

        const button = document.createElement("button");

        // Nilalagyan ng tile class para ma-apply ang CSS design.
        button.classList.add("tile");

        // Ipinapakita ang fruit icon sa button.
        button.textContent = tile.symbol;

        // Nilalagay ang unique ID ng bawat fruit.
        button.dataset.id = tile.id;

        // Kapag pinindot ang fruit, tatawagin ang selectTile function.
        button.addEventListener("click", function() {

            selectTile(tile.id);

        });

        // Idinadagdag ang fruit button sa game board.
        gameBoard.appendChild(button);

    });

    // Ina-update ang bilang ng remaining fruits.
    remainingDisplay.textContent = board.length;

}


// ==========================================
// 14. SELECT FRUIT TILE - Hinahandle ang pagpili ng fruit ng player at inililipat ito sa collection bar.
// ==========================================

// Function na tinatawag kapag pinindot ng player ang isang fruit sa board.
function selectTile(id) {

    // Hindi puwedeng pumili habang tapos ang game o nagbabago ang level.
    if (gameOver || changingLevel) return;

    // Hinahanap ang fruit na pinili gamit ang unique ID nito.
    const selectedTile = board.find(
        tile => tile.id === id
    );

    if (!selectedTile) return;

    // Magsisimula ang timer kapag unang pumili ng fruit ang player.
    if (!gameStarted) {

        initializeAudio();
        startBackgroundMusic();

        startTimer();

        gameStarted = true;

    }

    // Nagpe-play ng tap sound kapag pumili ng fruit.
    playSound("tap");

    // Dinadagdagan ang number of moves.
    moves++;

    movesDisplay.textContent = moves;

    // Tinatanggal ang napiling fruit mula sa game board.
    board = board.filter(
        tile => tile.id !== id
    );

    // Nilalagay ang napiling fruit sa collection bar.
    collection.push(selectedTile.symbol);

    // Ina-update ang game board at collection bar.
    renderBoard();
    renderCollection();

    // Chine-check kung may tatlong magkakaparehong fruits.
    checkTripleMatch();

}


// ==========================================
// 15. DISPLAY COLLECTION - Ipinapakita sa collection bar ang mga fruit na napili ng player.
// ==========================================

// Ina-update ang collection bar para makita ang mga napiling fruit sa tamang slots.
function renderCollection() {

    // Nililinis muna ang dating laman ng collection bar.
    collectionBar.innerHTML = "";

    // Gumagawa ng seven slots para sa selected fruits.
    for (let i = 0; i < MAX_SLOTS; i++) {

        const slot = document.createElement("div");

        slot.classList.add("slot");

        // Kung may fruit sa slot, ipapakita ito.
        if (collection[i]) {

            slot.textContent = collection[i];

        }

        // Idinadagdag ang slot sa collection bar.
        collectionBar.appendChild(slot);

    }

}


// ==========================================
// 16. CHECK TRIPLE MATCH - Chine-check kung may tatlong magkakaparehong fruit sa collection para makakuha ng points.
// ==========================================

// Hinahanap kung may tatlong magkakaparehong fruit at tinatanggal ang matched fruits sa collection.
function checkTripleMatch() {

    let matched = false;

    // Chine-check ang bawat available fruit icon.
    for (const icon of getActiveIcons()) {

        // Binibilang kung ilang beses lumabas ang fruit sa collection.
        let count = collection.filter(
            item => item === icon
        ).length;

        // Kapag may tatlo o higit pang magkakapareho, mag-a-activate ang match.
        while (count >= 3) {

            let removed = 0;

            // Tinatanggal ang tatlong magkakaparehong fruits sa collection.
            collection = collection.filter(item => {

                if (item === icon && removed < 3) {

                    removed++;

                    return false;

                }

                return true;

            });

            // Nagdadagdag ng 100 points at 1 combo kapag may match.
            score += 100;
            combo++;

            matched = true;

            count -= 3;

            // Nagpe-play ng matching sound.
            playSound("match");

            // Nagpapakita ng message kapag successful ang match.
            statusMessage.textContent =
                "Great! " + icon + " MATCHED! +100 POINTS!";

        }

    }

    // Kapag may match, ina-update ang score, combo, at best score.
    if (matched) {

        scoreDisplay.textContent = score;
        comboDisplay.textContent = "x" + combo;

        updateBestScore();

        renderCollection();

    }

    // Kapag wala nang natitirang fruit sa board at collection, lilipat sa next level.
    if (board.length === 0 && collection.length === 0) {

        nextLevel();

        return;

    }

    // Kapag napuno ang seven slots, matatapos ang game.
    if (collection.length >= MAX_SLOTS) {

        endGame(false, "GAME OVER!");

        return;

    }

    // Kapag wala pang match, magpapakita ng encouragement message.
    if (!matched) {

        statusMessage.textContent =
            "Keep going! Find three matching icons!";

    }

}


// ==========================================
// 17. NEXT LEVEL SYSTEM - Lumilipat sa next level kapag naubos na ang lahat ng fruit sa board at collection.
// ==========================================

function nextLevel() {

    // Iniiwasan na ma-trigger nang maraming beses ang next level.
    if (gameOver || changingLevel) return;

    changingLevel = true;

    // Tinitigil ang timer at hint timeout.
    clearInterval(timerInterval);
    clearTimeout(hintTimeout);

    timerInterval = null;
    hintTimeout = null;

    // Nagpe-play ng winning sound.
    playSound("win");

    // Dinadagdagan ang current level.
    level++;

    // Nagpapakita ng message bago magsimula ang next level.
    statusMessage.textContent =
        "🎉 LEVEL COMPLETED! GET READY FOR LEVEL " + level + "!";

    // May short delay bago i-load ang bagong level.
    levelTimeout = setTimeout(() => {

        startLevel();

    }, 1800);

}


// ==========================================
// 18. LIMITED HINT SYSTEM - Nagbibigay ng clue kung anong fruit ang puwedeng i-match gamit ang limited hints.
// ==========================================

// Pinapakita o hina-highlight ang fruit na makakatulong para makabuo ng match.
function showHint() {

    if (gameOver || changingLevel) return;

    // Chine-check kung may available pang hints ang player.
    if (hintsLeft <= 0) {

        statusMessage.textContent =
            "No hints left! Complete this level without help!";

        return;

    }

    // Hinahanap ang fruit na may sapat na copies para makabuo ng match.
    const hintIcon = getActiveIcons().find(icon => {

        const inCollection = collection.filter(
            item => item === icon
        ).length;

        const inBoard = board.filter(
            tile => tile.symbol === icon
        ).length;

        return inCollection + inBoard >= 3 && inBoard > 0;

    });

    // Kapag walang puwedeng i-match, magpapakita ng message.
    if (!hintIcon) {

        statusMessage.textContent =
            "No matching hint available!";

        return;

    }

    // Binabawasan ang available hints kapag gumamit ang player.
    hintsLeft--;

    hintsDisplay.textContent = hintsLeft;

    hintBtn.textContent =
        "💡 HINT (" + hintsLeft + ")";

    // Tinatanggal muna ang dating highlight sa game board.
    clearTimeout(hintTimeout);

    document.querySelectorAll(".hint-highlight")
        .forEach(tile => {
            tile.classList.remove("hint-highlight");
        });

    // Kinukuha ang mga fruit na kapareho ng hint icon.
    const matchingTiles = board.filter(
        tile => tile.symbol === hintIcon
    );

    // Hinahighlight ang mga matching fruits para makita ng player.
    matchingTiles.forEach(tile => {

        const element = gameBoard.querySelector(
            `[data-id="${tile.id}"]`
        );

        if (element) {

            element.classList.add("hint-highlight");

        }

    });

    // Nagpe-play ng hint sound.
    playSound("hint");

    // Nagpapakita kung anong fruit ang dapat hanapin.
    statusMessage.textContent =
        "Find " + hintIcon + " to complete your match!";

    // Tinatanggal ang highlight pagkatapos ng 3 seconds.
    hintTimeout = setTimeout(() => {

        document.querySelectorAll(".hint-highlight")
            .forEach(tile => {
                tile.classList.remove("hint-highlight");
            });

    }, 3000);

}

// Kapag pinindot ang Hint button, tatawagin ang showHint function.
hintBtn.addEventListener("click", showHint);


// ==========================================
// 19. END GAME - Tinatapos ang game at ipinapakita ang final result ng player.
// ==========================================

// Ipinapakita ang final result kapag nanalo ang player o natapos ang game.
function endGame(won, message) {

    if (gameOver) return;

    gameOver = true;

    // Tinitigil ang timer at iba pang running timeouts.
    clearInterval(timerInterval);
    clearTimeout(hintTimeout);
    clearTimeout(levelTimeout);

    timerInterval = null;

    // Sine-save ang best score kung may bagong highest score.
    updateBestScore();

    // Ipinapakita ang end game screen.
    endScreen.style.display = "flex";

    // Kapag nanalo ang player, ipapakita ang winning message.
    if (won) {

        endTitle.textContent = "YOU WIN! 🎉";

        endDescription.textContent =
            "Amazing! You completed all levels! Final Score: " +
            score;

        playSound("win");

    } else {

        // Kapag natalo o naubusan ng oras, ipapakita ang game over message.
        endTitle.textContent = message || "GAME OVER!";

        endDescription.textContent =
            "You reached Level " + level +
            "! Final Score: " + score;

        playSound("lose");

    }

    // Nagpapakita ng final message sa status area.
    statusMessage.textContent =
        "Game finished! Try again!";

}


// ==========================================
// 20. RESTART GAME - Nire-reset ang game para makapaglaro ulit mula Level 1.
// ==========================================

function restartGame() {

    // Tinatanggal ang dating timer at timeouts.
    clearInterval(timerInterval);
    clearTimeout(hintTimeout);
    clearTimeout(levelTimeout);

    // Nagpe-play ng restart sound.
    playSound("restart");

    // Sinisimulan ulit ang game mula sa first level.
    startGame();

}

// Kapag pinindot ang Restart button, tatawagin ang restartGame function.
restartBtn.addEventListener("click", restartGame);


// ==========================================
// 21. START SCREEN BUTTON - Hinahandle ang Start Game button para maitago ang welcome screen at ipakita ang game.
// ==========================================

startBtn.addEventListener("click", function() {

    // Itinatago ang welcome screen kapag pinindot ang Start Game.
    startScreen.style.display = "none";

    // Ipinapakita ang actual game interface.
    gameContent.style.display = "flex";

    // Sinisimulan ang background music pagkatapos ng interaction ng player.
    initializeAudio();
    startBackgroundMusic();

    // Sinisimulan ang bagong game mula sa unang level.
    startGame();

});
