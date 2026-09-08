const boardElement = document.getElementById("memory-board");
const movesValElement = document.getElementById("moves-val");
const statusBox = document.getElementById("status-box");
const restartBtn = document.getElementById("btn-restart");
const EMOJIS = ["🦊", "🐰", "🐯", "🐼", "🦁", "🐸", "🐵", "🐷"];
let cards = [];
let flippedCards = [];
let moves = 0;
let lockBoard = false;
let matchedPairs = 0;
function initGame() {
    const doubleEmojis = [...EMOJIS, ...EMOJIS];
    doubleEmojis.sort(() => Math.random() - 0.5);
    cards = doubleEmojis.map((emoji, idx) => ({
        id: idx,
        emoji,
        flipped: false,
        matched: false
    }));
    flippedCards = [];
    moves = 0;
    matchedPairs = 0;
    lockBoard = false;
    movesValElement.textContent = moves;
    statusBox.textContent = "Flip two cards to find matching emoji pairs!";
    statusBox.style.color = "var(--text-primary)";
    if (window.retroAudio) {
        window.retroAudio.playSFX('click');
    }
    renderBoard();
}
function renderBoard() {
    boardElement.innerHTML = "";
    cards.forEach(card => {
        const cardElement = document.createElement("div");
        cardElement.className = "memory-card";
        cardElement.id = `card-${card.id}`;
        cardElement.innerHTML = `
            <div class="card-face card-back">❓</div>
            <div class="card-face card-front">${card.emoji}</div>
        `;
        cardElement.addEventListener("click", () => handleCardClick(card));
        boardElement.appendChild(cardElement);
    });
}
function handleCardClick(card) {
    if (lockBoard || card.flipped || card.matched) return;
    const cardEl = document.getElementById(`card-${card.id}`);
    cardEl.classList.add("flipped");
    card.flipped = true;
    if (window.retroAudio) {
        window.retroAudio.playSFX('flip');
    }
    flippedCards.push(card);
    if (flippedCards.length === 2) {
        moves++;
        movesValElement.textContent = moves;
        checkMatch();
    }
}
function checkMatch() {
    const [c1, c2] = flippedCards;
    if (c1.emoji === c2.emoji) {
        c1.matched = true;
        c2.matched = true;
        document.getElementById(`card(` + c1.id + `)`);
        document.getElementById(`card-${c1.id}`).classList.add("card-matched");
        document.getElementById(`card-${c2.id}`).classList.add("card-matched");
        matchedPairs++;
        flippedCards = [];
        if (matchedPairs === EMOJIS.length) {
            statusBox.textContent = `🎉 Congratulations! Cleared in ${moves} moves!`;
            statusBox.style.color = "var(--accent-green)";
            if (window.retroAudio) {
                window.retroAudio.playSFX('win');
            }
        } else {
            statusBox.textContent = "✨ Match found! Keep going!";
            statusBox.style.color = "var(--accent-blue)";
            if (window.retroAudio) {
                window.retroAudio.playSFX('pop');
            }
        }
    } else {
        lockBoard = true;
        statusBox.textContent = "❌ Mismatch! Try again.";
        statusBox.style.color = "var(--accent-red)";
        if (window.retroAudio) {
            window.retroAudio.playSFX('lose');
        }
        setTimeout(() => {
            const cardEl1 = document.getElementById(`card-${c1.id}`);
            const cardEl2 = document.getElementById(`card-${c2.id}`);
            cardEl1.classList.remove("flipped");
            cardEl2.classList.remove("flipped");
            c1.flipped = false;
            c2.flipped = false;
            flippedCards = [];
            lockBoard = false;
            statusBox.textContent = "Flip two cards to find matching emoji pairs!";
            statusBox.style.color = "var(--text-primary)";
        }, 1000);
    }
}
restartBtn.addEventListener("click", initGame);
initGame();