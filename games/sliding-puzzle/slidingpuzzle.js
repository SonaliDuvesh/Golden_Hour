const boardElement = document.getElementById("puzzle-board");
const movesValElement = document.getElementById("moves-val");
const statusBox = document.getElementById("status-box");
const restartBtn = document.getElementById("btn-restart");
let tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
let moves = 0;
let gameOver = false;
function initGame() {
    tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    moves = 0;
    gameOver = false;
    movesValElement.textContent = moves;
    statusBox.textContent = "Click tiles next to the empty slot to slide them.";
    statusBox.style.color = "var(--text-primary)";
    if (window.retroAudio) {
        window.retroAudio.playSFX('click');
    }
    shuffleBoard();
    renderBoard();
}
function shuffleBoard() {
    let emptyIndex = 8;
    for (let i = 0; i < 150; i++) {
        const row = Math.floor(emptyIndex / 3);
        const col = emptyIndex % 3;
        const neighbors = [];
        if (row > 0) neighbors.push(emptyIndex - 3);
        if (row < 2) neighbors.push(emptyIndex + 3);
        if (col > 0) neighbors.push(emptyIndex - 1);
        if (col < 2) neighbors.push(emptyIndex + 1);
        const swapIndex = neighbors[Math.floor(Math.random() * neighbors.length)];
        tiles[emptyIndex] = tiles[swapIndex];
        tiles[swapIndex] = 0;
        emptyIndex = swapIndex;
    }
}
function renderBoard() {
    boardElement.innerHTML = "";
    tiles.forEach((val, idx) => {
        const tile = document.createElement("div");
        if (val === 0) {
            tile.className = "puzzle-tile puzzle-tile-empty";
        } else {
            tile.className = "puzzle-tile";
            tile.textContent = val;
            tile.addEventListener("click", () => handleTileClick(idx));
        }
        boardElement.appendChild(tile);
    });
}
function handleTileClick(idx) {
    if (gameOver) return;
    const emptyIdx = tiles.indexOf(0);
    const r1 = Math.floor(idx / 3);
    const c1 = idx % 3;
    const r2 = Math.floor(emptyIdx / 3);
    const c2 = emptyIdx % 3;
    const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
    if (dist === 1) {
        tiles[emptyIdx] = tiles[idx];
        tiles[idx] = 0;
        moves++;
        movesValElement.textContent = moves;
        if (window.retroAudio) {
            window.retroAudio.playSFX('flip');
        }
        renderBoard();
        checkWin();
    }
}
function checkWin() {
    const solved = tiles.every((val, idx) => {
        if (idx === 8) return val === 0;
        return val === idx + 1;
    });
    if (solved) {
        gameOver = true;
        statusBox.textContent = `🎉 Congratulations! Solved in ${moves} moves!`;
        statusBox.style.color = "var(--accent-green)";
        if (window.retroAudio) {
            window.retroAudio.playSFX('win');
        }
    }
}
restartBtn.addEventListener("click", initGame);
initGame();