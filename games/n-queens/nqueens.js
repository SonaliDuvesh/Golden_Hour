const chessboard = document.getElementById("chessboard");
const nSelect = document.getElementById("n-select");
const clearBtn = document.getElementById("btn-clear");
const statusBox = document.getElementById("status-box");
const progressIndicator = document.getElementById("queens-progress");
const checkBtn = document.getElementById("btn-check");
const hintBtn = document.getElementById("btn-hint");
const nextBtn = document.getElementById("btn-next");
const restartBtn = document.getElementById("btn-restart");
const gameControls = document.getElementById("game-controls");
const solvedControls = document.getElementById("solved-controls");
let N = parseInt(nSelect.value);
let queens = [];
let conflicts = new Set();
let isSolved = false;
function initBoard() {
    N = parseInt(nSelect.value);
    queens = [];
    conflicts.clear();
    isSolved = false;
    chessboard.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    chessboard.style.gridTemplateRows = `repeat(${N}, 1fr)`;
    chessboard.innerHTML = "";
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const cell = document.createElement("div");
            const isDark = (r + c) % 2 === 1;
            cell.className = `chess-cell ${isDark ? "chess-cell-dark" : "chess-cell-light"}`;
            cell.id = `cell-${r}-${c}`;
            cell.addEventListener("click", () => handleCellClick(r, c));
            chessboard.appendChild(cell);
        }
    }
    if (gameControls) gameControls.style.display = "flex";
    if (solvedControls) solvedControls.style.display = "none";
    updateUI();
}
function handleCellClick(r, c) {
    if (isSolved) return;
    document.querySelectorAll(".chess-cell-hint").forEach(cell => {
        cell.classList.remove("chess-cell-hint");
    });
    const existingIndex = queens.findIndex(q => q.r === r && q.c === c);
    if (existingIndex > -1) {
        queens.splice(existingIndex, 1);
        if (window.retroAudio) {
            window.retroAudio.playSFX('click');
        }
    } else {
        if (queens.length >= N) {
            statusBox.textContent = `Remove a queen before placing another!`;
            if (window.retroAudio) {
                window.retroAudio.playSFX('click');
            }
            return;
        }
        queens.push({ r, c });
        if (window.retroAudio) {
            window.retroAudio.playSFX('flip');
        }
    }
    checkConflicts();
    updateUI();
}
function checkConflicts() {
    conflicts.clear();
    for (let i = 0; i < queens.length; i++) {
        for (let j = i + 1; j < queens.length; j++) {
            const q1 = queens[i];
            const q2 = queens[j];
            if (
                q1.r === q2.r ||
                q1.c === q2.c ||
                Math.abs(q1.r - q2.r) === Math.abs(q1.c - q2.c)
            ) {
                conflicts.add(`${q1.r}-${q1.c}`);
                conflicts.add(`${q2.r}-${q2.c}`);
            }
        }
    }
}
function updateUI() {
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const cell = document.getElementById(`cell-${r}-${c}`);
            if (cell) {
                cell.textContent = "";
                cell.classList.remove("chess-cell-conflict", "chess-cell-threatened");
            }
        }
    }
    queens.forEach(q => {
        const cell = document.getElementById(`cell-${q.r}-${q.c}`);
        if (cell) {
            cell.textContent = "👑";
            if (conflicts.has(`${q.r}-${q.c}`)) {
                cell.classList.add("chess-cell-conflict");
            }
        }
    });
    if (progressIndicator) {
        progressIndicator.textContent = `Queens Placed: ${queens.length} / ${N}`;
    }
    if (queens.length === 0) {
        statusBox.textContent = `Place ${N} queens on the board without conflicts.`;
    } else if (conflicts.size > 0) {
        statusBox.textContent = `Conflicts detected! Queens are attacking each other.`;
    } else {
        statusBox.textContent = `Placed ${queens.length} of ${N} queens. No conflicts so far.`;
    }
}
function backtrackSolve(startQueens) {
    const boardState = Array(N).fill(-1);
    for (let q of startQueens) {
        boardState[q.r] = q.c;
    }
    function isSafe(row, col) {
        for (let r = 0; r < N; r++) {
            if (boardState[r] !== -1 && r !== row) {
                const c = boardState[r];
                if (c === col || Math.abs(r - row) === Math.abs(c - col)) {
                    return false;
                }
            }
        }
        return true;
    }
    function solve(row) {
        if (row === N) {
            return true;
        }
        if (boardState[row] !== -1) {
            return solve(row + 1);
        }
        for (let col = 0; col < N; col++) {
            let colUsed = false;
            for (let r = 0; r < N; r++) {
                if (boardState[r] === col) {
                    colUsed = true;
                    break;
                }
            }
            if (colUsed) continue;
            if (isSafe(row, col)) {
                boardState[row] = col;
                if (solve(row + 1)) return true;
                boardState[row] = -1;
            }
        }
        return false;
    }
    const success = solve(0);
    return success ? boardState : null;
}
function handleCheckSolution() {
    if (queens.length < N) {
        statusBox.textContent = `Place all ${N} queens.`;
        if (window.retroAudio) {
            window.retroAudio.playSFX('click');
        }
        return;
    }
    if (conflicts.size > 0) {
        statusBox.textContent = `Some queens are attacking each other.`;
        if (window.retroAudio) {
            window.retroAudio.playSFX('lose');
        }
        return;
    }
    isSolved = true;
    statusBox.textContent = `Puzzle Solved! 🎉`;
    if (window.retroAudio) {
        window.retroAudio.playSFX('win');
    }
    if (gameControls) gameControls.style.display = "none";
    if (solvedControls) solvedControls.style.display = "flex";
}
function handleHint() {
    if (isSolved) return;
    document.querySelectorAll(".chess-cell-hint").forEach(cell => {
        cell.classList.remove("chess-cell-hint");
    });
    if (conflicts.size > 0) {
        statusBox.textContent = "Resolve conflicts first to get a valid hint!";
        if (window.retroAudio) {
            window.retroAudio.playSFX('click');
        }
        return;
    }
    const sol = backtrackSolve(queens);
    if (!sol) {
        statusBox.textContent = "No solution possible from this configuration. Remove some queens.";
        if (window.retroAudio) {
            window.retroAudio.playSFX('click');
        }
        return;
    }
    let hintRow = -1;
    for (let r = 0; r < N; r++) {
        if (!queens.some(q => q.r === r)) {
            hintRow = r;
            break;
        }
    }
    if (hintRow !== -1) {
        const hintCol = sol[hintRow];
        const cell = document.getElementById(`cell-${hintRow}-${hintCol}`);
        if (cell) {
            cell.classList.add("chess-cell-hint");
            statusBox.textContent = `Hint: Try placing a queen at row ${hintRow + 1}, column ${hintCol + 1}.`;
            if (window.retroAudio) {
                window.retroAudio.playSFX('flip');
            }
        }
    } else {
        statusBox.textContent = "All queens placed! Click Check Solution to finish.";
    }
}
function handleNextPuzzle() {
    let nextN = 8;
    if (N === 4) nextN = 6;
    else if (N === 6) nextN = 8;
    else if (N === 8) nextN = 4;
    nSelect.value = nextN.toString();
    initBoard();
}
nSelect.addEventListener("change", initBoard);
clearBtn.addEventListener("click", () => {
    queens = [];
    conflicts.clear();
    document.querySelectorAll(".chess-cell-hint").forEach(cell => {
        cell.classList.remove("chess-cell-hint");
    });
    updateUI();
});
if (checkBtn) checkBtn.addEventListener("click", handleCheckSolution);
if (hintBtn) hintBtn.addEventListener("click", handleHint);
if (nextBtn) nextBtn.addEventListener("click", handleNextPuzzle);
if (restartBtn) restartBtn.addEventListener("click", initBoard);
initBoard();