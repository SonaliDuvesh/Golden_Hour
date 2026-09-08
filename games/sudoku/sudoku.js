const boardElement = document.getElementById("sudoku-board");
const diffSelect = document.getElementById("difficulty-select");
const checkBtn = document.getElementById("btn-check");
const restartBtn = document.getElementById("btn-restart");
const statusBox = document.getElementById("status-box");
const baseBoard = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
];
let solvedGrid = [];
let currentGrid = [];
function generatePuzzle() {
    const mapping = {};
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = [...numbers].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 9; i++) {
        mapping[numbers[i]] = shuffled[i];
    }
    solvedGrid = baseBoard.map(row => row.map(val => mapping[val]));
    const diff = diffSelect.value;
    let cellsToClear = 30;
    if (diff === "medium") cellsToClear = 42;
    if (diff === "hard") cellsToClear = 54;
    currentGrid = solvedGrid.map(row => [...row]);
    let cleared = 0;
    while (cleared < cellsToClear) {
        const r = Math.floor(Math.random() * 9);
        const c = Math.floor(Math.random() * 9);
        if (currentGrid[r][c] !== "") {
            currentGrid[r][c] = "";
            cleared++;
        }
    }
    renderBoard();
    statusBox.textContent = "Puzzle generated! Fill the empty cells.";
    statusBox.style.color = "var(--text-primary)";
}
function renderBoard() {
    boardElement.innerHTML = "";
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const input = document.createElement("input");
            input.type = "text";
            input.maxLength = 1;
            input.className = "sudoku-cell";
            input.id = `cell-${r}-${c}`;
            if (r === 0) input.classList.add("border-top-thick");
            if (c === 0) input.classList.add("border-left-thick");
            if (r % 3 === 2) input.classList.add("border-bottom-thick");
            if (c % 3 === 2) input.classList.add("border-right-thick");
            const val = currentGrid[r][c];
            if (val !== "") {
                input.value = val;
                input.readOnly = true;
                input.classList.add("cell-prefilled");
            } else {
                input.addEventListener("input", (e) => {
                    const cleanVal = e.target.value.replace(/[^1-9]/g, "");
                    e.target.value = cleanVal;
                    currentGrid[r][c] = cleanVal !== "" ? parseInt(cleanVal) : "";
                    input.classList.remove("cell-error", "cell-correct");
                });
            }
            boardElement.appendChild(input);
        }
    }
}
function checkSolution() {
    let hasError = false;
    let isComplete = true;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const input = document.getElementById(`cell-${r}-${c}`);
            if (currentGrid[r][c] === "") {
                isComplete = false;
                input.classList.remove("cell-error", "cell-correct");
            } else if (currentGrid[r][c] !== solvedGrid[r][c]) {
                hasError = true;
                input.classList.add("cell-error");
                input.classList.remove("cell-correct");
            } else {
                input.classList.add("cell-correct");
                input.classList.remove("cell-error");
            }
        }
    }
    if (!isComplete) {
        statusBox.textContent = "Board is incomplete. Fill all cells to verify!";
        statusBox.style.color = "var(--accent-yellow)";
    } else if (hasError) {
        statusBox.textContent = "There are incorrect numbers. Review red cells!";
        statusBox.style.color = "var(--accent-red)";
    } else {
        statusBox.textContent = "🎉 Outstanding! Sudoku solved correctly!";
        statusBox.style.color = "var(--accent-green)";
    }
}
diffSelect.addEventListener("change", generatePuzzle);
checkBtn.addEventListener("click", checkSolution);
restartBtn.addEventListener("click", generatePuzzle);
generatePuzzle();