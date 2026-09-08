const canvas = document.getElementById("hangman-canvas");
const ctx = canvas.getContext("2d");
const wordDisplay = document.getElementById("word-display");
const statusBox = document.getElementById("status-box");
const remainingTriesVal = document.getElementById("remaining-tries");
const keyboard = document.getElementById("keyboard");
const restartBtn = document.getElementById("btn-restart");
const WORDS = [
    "JAVASCRIPT", "PYTHON", "PROGRAMMING", "DEVELOPER",
    "INTERNET", "HTML", "CSS", "DATABASE", "ALGORITHM",
    "GALAXY", "RAINBOW", "SHADOW", "VOLCANO", "HORIZON"
];
let selectedWord = "";
let guessedLetters = new Set();
let remainingTries = 6;
let gameOver = false;
function initGame() {
    selectedWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    guessedLetters.clear();
    remainingTries = 6;
    gameOver = false;
    remainingTriesVal.textContent = remainingTries;
    statusBox.textContent = `Remaining attempts: ${remainingTries}`;
    statusBox.style.color = "var(--text-primary)";
    drawHangman();
    buildWordDisplay();
    buildKeyboard();
}
function buildWordDisplay() {
    wordDisplay.innerHTML = "";
    selectedWord.split("").forEach(char => {
        const slot = document.createElement("div");
        slot.className = "letter-slot";
        if (guessedLetters.has(char)) {
            slot.textContent = char;
        } else {
            slot.textContent = "";
        }
        wordDisplay.appendChild(slot);
    });
}
function buildKeyboard() {
    keyboard.innerHTML = "";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    letters.split("").forEach(letter => {
        const btn = document.createElement("button");
        btn.className = "key-btn";
        btn.id = `key-${letter}`;
        btn.textContent = letter;
        btn.addEventListener("click", () => handleGuess(letter));
        keyboard.appendChild(btn);
    });
}
function handleGuess(letter) {
    if (gameOver || guessedLetters.has(letter)) return;
    guessedLetters.add(letter);
    const keyBtn = document.getElementById(`key-${letter}`);
    if (keyBtn) keyBtn.disabled = true;
    if (selectedWord.includes(letter)) {
        buildWordDisplay();
        checkWin();
    } else {
        remainingTries--;
        remainingTriesVal.textContent = remainingTries;
        drawHangman();
        checkLose();
    }
}
function checkWin() {
    const won = selectedWord.split("").every(char => guessedLetters.has(char));
    if (won) {
        gameOver = true;
        statusBox.textContent = "🎉 Correct! You won the game!";
        statusBox.style.color = "var(--accent-green)";
        disableAllKeys();
    }
}
function checkLose() {
    if (remainingTries <= 0) {
        gameOver = true;
        statusBox.textContent = `💥 Game Over! The word was: ${selectedWord}`;
        statusBox.style.color = "var(--accent-red)";
        disableAllKeys();
        wordDisplay.innerHTML = "";
        selectedWord.split("").forEach(char => {
            const slot = document.createElement("div");
            slot.className = "letter-slot";
            slot.textContent = char;
            if (!guessedLetters.has(char)) {
                slot.style.color = "var(--accent-red)";
                slot.style.borderBottomColor = "var(--accent-red)";
            }
            wordDisplay.appendChild(slot);
        });
    }
}
function disableAllKeys() {
    document.querySelectorAll(".key-btn").forEach(btn => {
        btn.disabled = true;
    });
}
function drawHangman() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "var(--text-primary)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(20, 200);
    ctx.lineTo(120, 200);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(50, 200);
    ctx.lineTo(50, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(50, 20);
    ctx.lineTo(130, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(130, 20);
    ctx.lineTo(130, 50);
    ctx.stroke();
    const errors = 6 - remainingTries;
    if (errors >= 1) {
        ctx.beginPath();
        ctx.arc(130, 65, 15, 0, Math.PI * 2);
        ctx.stroke();
    }
    if (errors >= 2) {
        ctx.beginPath();
        ctx.moveTo(130, 80);
        ctx.lineTo(130, 130);
        ctx.stroke();
    }
    if (errors >= 3) {
        ctx.beginPath();
        ctx.moveTo(130, 95);
        ctx.lineTo(105, 115);
        ctx.stroke();
    }
    if (errors >= 4) {
        ctx.beginPath();
        ctx.moveTo(130, 95);
        ctx.lineTo(155, 115);
        ctx.stroke();
    }
    if (errors >= 5) {
        ctx.beginPath();
        ctx.moveTo(130, 130);
        ctx.lineTo(105, 170);
        ctx.stroke();
    }
    if (errors >= 6) {
        ctx.beginPath();
        ctx.moveTo(130, 130);
        ctx.lineTo(155, 170);
        ctx.stroke();
    }
}
window.addEventListener("keydown", e => {
    if (gameOver) return;
    const letter = e.key.toUpperCase();
    if (letter.length === 1 && letter >= "A" && letter <= "Z") {
        const btn = document.getElementById(`key-${letter}`);
        if (btn && !btn.disabled) {
            handleGuess(letter);
        }
    }
});
restartBtn.addEventListener("click", initGame);
initGame();