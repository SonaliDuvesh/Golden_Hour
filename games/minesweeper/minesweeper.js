const boardElement = document.getElementById("mines-board");
const minesCountElement = document.getElementById("mines-count");
const timerValElement = document.getElementById("timer-val");
const restartBtn = document.getElementById("btn-restart");
const difficultySelect = document.getElementById("difficulty-select");
let ROWS = 9;
let COLS = 9;
let MINES = 10;
let board = [];
let firstClick = true;
let gameOver = false;
let flagCount = 0;
let timerInterval = null;
let timeElapsed = 0;
function updateDifficulty() {
    const diff = difficultySelect.value;
    if (diff === "easy") {
        ROWS = 9;
        COLS = 9;
        MINES = 10;
    } else if (diff === "medium") {
        ROWS = 16;
        COLS = 16;
        MINES = 40;
    } else if (diff === "hard") {
        ROWS = 16;
        COLS = 30;
        MINES = 99;
    }
}
function initGame() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timeElapsed = 0;
    timerValElement.textContent = "0";
    updateDifficulty();
    board = [];
    firstClick = true;
    gameOver = false;
    flagCount = 0;
    minesCountElement.textContent = MINES;
    boardElement.style.gridTemplateColumns = `repeat(${COLS}, 36px)`;
    boardElement.style.gridTemplateRows = `repeat(${ROWS}, 36px)`;
    boardElement.innerHTML = "";
    for (let r = 0; r < ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < COLS; c++) {
            board[r][c] = {
                r,
                c,
                mine: false,
                revealed: false,
                flagged: false,
                adjMines: 0
            };
            const cell = document.createElement("div");
            cell.className = "mine-cell";
            cell.id = `cell-${r}-${c}`;
            cell.addEventListener("click", () => handleLeftClick(r, c));
            cell.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                handleRightClick(r, c);
            });
            boardElement.appendChild(cell);
        }
    }
}
function startTimer() {
    timerInterval = setInterval(() => {
        timeElapsed++;
        timerValElement.textContent = timeElapsed;
    }, 1000);
}
function placeMines(excludeR, excludeC) {
    let placed = 0;
    const totalCells = ROWS * COLS;
    const isHard = (difficultySelect.value === "hard");
    while (placed < MINES) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        const isNeighbor = Math.abs(r - excludeR) <= 1 && Math.abs(c - excludeC) <= 1;
        if (!board[r][c].mine && !isNeighbor) {
            board[r][c].mine = true;
            placed++;
        }
    }
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!board[r][c].mine) {
                board[r][c].adjMines = countAdjacentMines(r, c);
            }
        }
    }
}
function countAdjacentMines(r, c) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                if (board[nr][nc].mine) count++;
            }
        }
    }
    return count;
}
function handleLeftClick(r, c) {
    if (gameOver || board[r][c].revealed || board[r][c].flagged) return;
    if (firstClick) {
        firstClick = false;
        placeMines(r, c);
        startTimer();
    }
    revealCell(r, c);
    if (!gameOver) {
        checkWinState();
    }
}
function handleRightClick(r, c) {
    if (gameOver || board[r][c].revealed) return;
    const cell = board[r][c];
    cell.flagged = !cell.flagged;
    const cellEl = document.getElementById(`cell-${r}-${c}`);
    if (cell.flagged) {
        cellEl.textContent = "🚩";
        cellEl.classList.add("mine-cell-flagged");
        flagCount++;
    } else {
        cellEl.textContent = "";
        cellEl.classList.remove("mine-cell-flagged");
        flagCount--;
    }
    minesCountElement.textContent = Math.max(0, MINES - flagCount);
    if (window.retroAudio) {
        window.retroAudio.playSFX('click');
    }
}
function revealCell(startR, startC) {
    const queue = [[startR, startC]];
    const startCell = board[startR][startC];
    if (startCell.mine) {
        startCell.revealed = true;
        const cellEl = document.getElementById(`cell-${startR}-${startC}`);
        cellEl.classList.add("mine-cell-revealed", "mine-cell-mine");
        cellEl.textContent = "💥";
        endGame(false);
        return;
    }
    startCell.revealed = true;
    if (window.retroAudio) {
        window.retroAudio.playSFX('flip');
    }
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        const cell = board[r][c];
        const cellEl = document.getElementById(`cell-${r}-${c}`);
        cellEl.classList.add("mine-cell-revealed");
        if (cell.adjMines > 0) {
            cellEl.textContent = cell.adjMines;
            cellEl.classList.add(`num-${cell.adjMines}`);
        } else {
            cellEl.textContent = "";
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        const neighbor = board[nr][nc];
                        if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
                            neighbor.revealed = true;
                            queue.push([nr, nc]);
                        }
                    }
                }
            }
        }
    }
}
function endGame(won) {
    gameOver = true;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c].mine) {
                const cellEl = document.getElementById(`cell-${r}-${c}`);
                if (!won) {
                    if (!board[r][c].revealed) {
                        cellEl.textContent = "💣";
                        cellEl.style.background = "#ef4444";
                    }
                } else {
                    cellEl.textContent = "🚩";
                    cellEl.style.background = "#10b981";
                }
            }
        }
    }
    if (won) {
        minesCountElement.textContent = "Win! 🎉";
        if (window.retroAudio) {
            window.retroAudio.playSFX('win');
        }
    } else {
        minesCountElement.textContent = "Boom! Game Over 💥";
        if (window.retroAudio) {
            window.retroAudio.playSFX('lose');
        }
    }
}
function checkWinState() {
    let unrevealedSafeCells = 0;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!board[r][c].mine && !board[r][c].revealed) {
                unrevealedSafeCells++;
            }
        }
    }
    if (unrevealedSafeCells === 0) {
        endGame(true);
    }
}
restartBtn.addEventListener("click", initGame);
difficultySelect.addEventListener("change", initGame);
initGame();