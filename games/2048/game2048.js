const gridContainer = document.getElementById("grid-container");
const scoreVal = document.getElementById("score-val");
const highScoreVal = document.getElementById("high-score-val");
const restartBtn = document.getElementById("btn-restart");
let grid = [];
let score = 0;
let highScore = localStorage.getItem("2048-high-score") || 0;
let gameOver = false;
let won = false;
highScoreVal.textContent = highScore;
function initGame() {
    grid = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    score = 0;
    scoreVal.textContent = score;
    gameOver = false;
    won = false;
    addRandomTile();
    addRandomTile();
    renderBoard();
    if (window.retroAudio) {
        window.retroAudio.playSFX('click');
    }
}
function addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) {
                emptyCells.push({ r, c });
            }
        }
    }
    if (emptyCells.length > 0) {
        const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
}
let lastScore = 0;
function renderBoard() {
    gridContainer.innerHTML = "";
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const cell = document.createElement("div");
            const val = grid[r][c];
            cell.className = "grid-cell";
            if (val > 0) {
                cell.textContent = val;
                if (val <= 2048) {
                    cell.classList.add(`tile-${val}`);
                } else {
                    cell.classList.add("tile-super");
                }
            }
            gridContainer.appendChild(cell);
        }
    }
}
function slide(row) {
    let arr = row.filter(val => val !== 0);
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr[i + 1] = 0;
            if (arr[i] === 2048 && !won) {
                won = true;
                if (window.retroAudio) {
                    window.retroAudio.playSFX('win');
                }
                setTimeout(() => alert("🎉 You reached 2048! Can you go further?"), 100);
            }
        }
    }
    arr = arr.filter(val => val !== 0);
    while (arr.length < 4) {
        arr.push(0);
    }
    return arr;
}
function transpose(matrix) {
    let transposed = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            transposed[c][r] = matrix[r][c];
        }
    }
    return transposed;
}
function moveLeft() {
    let changed = false;
    for (let r = 0; r < 4; r++) {
        const orig = [...grid[r]];
        grid[r] = slide(grid[r]);
        if (grid[r].some((val, idx) => val !== orig[idx])) {
            changed = true;
        }
    }
    return changed;
}
function moveRight() {
    let changed = false;
    for (let r = 0; r < 4; r++) {
        const orig = [...grid[r]];
        grid[r] = slide(grid[r].reverse()).reverse();
        if (grid[r].some((val, idx) => val !== orig[idx])) {
            changed = true;
        }
    }
    return changed;
}
function moveUp() {
    let transposed = transpose(grid);
    let changed = false;
    for (let r = 0; r < 4; r++) {
        const orig = [...transposed[r]];
        transposed[r] = slide(transposed[r]);
        if (transposed[r].some((val, idx) => val !== orig[idx])) {
            changed = true;
        }
    }
    grid = transpose(transposed);
    return changed;
}
function moveDown() {
    let transposed = transpose(grid);
    let changed = false;
    for (let r = 0; r < 4; r++) {
        const orig = [...transposed[r]];
        transposed[r] = slide(transposed[r].reverse()).reverse();
        if (transposed[r].some((val, idx) => val !== orig[idx])) {
            changed = true;
        }
    }
    grid = transpose(transposed);
    return changed;
}
function handleInput(dir) {
    if (gameOver) return;
    lastScore = score;
    let moved = false;
    if (dir === "left") moved = moveLeft();
    else if (dir === "right") moved = moveRight();
    else if (dir === "up") moved = moveUp();
    else if (dir === "down") moved = moveDown();
    if (moved) {
        addRandomTile();
        scoreVal.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreVal.textContent = highScore;
            localStorage.setItem("2048-high-score", highScore);
        }
        if (window.retroAudio) {
            if (score > lastScore) {
                window.retroAudio.playSFX('pop');
            } else {
                window.retroAudio.playSFX('flip');
            }
        }
        renderBoard();
        checkGameOver();
    }
}
function checkGameOver() {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) return;
        }
    }
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (r < 3 && grid[r][c] === grid[r + 1][c]) return;
            if (c < 3 && grid[r][c] === grid[r][c + 1]) return;
        }
    }
    gameOver = true;
    if (window.retroAudio) {
        window.retroAudio.playSFX('lose');
    }
    setTimeout(() => alert("💥 Game Over! No moves left."), 100);
}
window.addEventListener("keydown", e => {
    switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
            e.preventDefault();
            handleInput("left");
            break;
        case "ArrowRight":
        case "d":
        case "D":
            e.preventDefault();
            handleInput("right");
            break;
        case "ArrowUp":
        case "w":
        case "W":
            e.preventDefault();
            handleInput("up");
            break;
        case "ArrowDown":
        case "s":
        case "S":
            e.preventDefault();
            handleInput("down");
            break;
    }
});
restartBtn.addEventListener("click", initGame);
initGame();