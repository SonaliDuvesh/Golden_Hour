const canvas = document.getElementById("snake-canvas");
const ctx = canvas.getContext("2d");
const scoreVal = document.getElementById("score-val");
const highScoreVal = document.getElementById("high-score-val");
const restartBtn = document.getElementById("btn-restart");
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem("snake-high-score") || 0;
let gameStarted = false;
let lastTime = 0;
let accumulator = 0;
let stepInterval = 100;
let animationFrameId = null;
let moveStepCount = 0;
highScoreVal.textContent = highScore;
function initGame() {
    moveStepCount = 0;
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    dx = 1;
    dy = 0;
    score = 0;
    scoreVal.textContent = score;
    spawnFood();
    const difficultySelect = document.getElementById("difficulty-select");
    const difficultyPanel = document.getElementById("difficulty-panel");
    const difficultyLbl = document.getElementById("difficulty-lbl");
    const speedVal = difficultySelect.value;
    if (speedVal === "easy") {
        stepInterval = 185;
    } else if (speedVal === "hard") {
        stepInterval = 60;
    } else {
        stepInterval = 105;
    }
    difficultyLbl.textContent = speedVal.charAt(0).toUpperCase() + speedVal.slice(1);
    difficultyPanel.style.display = "none";
    gameStarted = true;
    restartBtn.textContent = "Restart Game";
    if (window.retroAudio) {
        window.retroAudio.playSFX('click');
    }
    lastTime = 0;
    accumulator = 0;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
}
function spawnFood() {
    while (true) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
        let onSnake = false;
        for (let cell of snake) {
            if (cell.x === food.x && cell.y === food.y) {
                onSnake = true;
                break;
            }
        }
        if (!onSnake) break;
    }
}
function gameLoop(timestamp) {
    if (!gameStarted) return;
    if (!lastTime) {
        lastTime = timestamp;
    }
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    const cappedDt = Math.min(dt, 100);
    accumulator += cappedDt;
    while (accumulator >= stepInterval) {
        updateSnake();
        if (checkCollision()) {
            endGame();
            return;
        }
        accumulator -= stepInterval;
    }
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}
function updateSnake() {
    moveStepCount++;
    if (window.retroAudio) {
        window.retroAudio.playSFX(moveStepCount % 2 === 0 ? 'tick' : 'tock');
    }
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreVal.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreVal.textContent = highScore;
            localStorage.setItem("snake-high-score", highScore);
        }
        if (window.retroAudio) {
            window.retroAudio.playSFX('pop');
        }
        spawnFood();
    } else {
        snake.pop();
    }
}
function checkCollision() {
    const head = snake[0];
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            return true;
        }
    }
    return false;
}
function endGame() {
    gameStarted = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (window.retroAudio) {
        window.retroAudio.playSFX('crash');
        setTimeout(() => {
            window.retroAudio.playSFX('lose');
        }, 150);
    }
    const difficultyPanel = document.getElementById("difficulty-panel");
    difficultyPanel.style.display = "flex";
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f87171";
    ctx.font = "bold 24px var(--font-sans), sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 15px var(--font-sans), sans-serif";
    ctx.fillText("Press Start/Restart to play again", canvas.width / 2, canvas.height / 2 + 20);
    restartBtn.textContent = "Start Game";
}
function draw() {
    for (let r = 0; r < tileCount; r++) {
        for (let c = 0; c < tileCount; c++) {
            ctx.fillStyle = (r + c) % 2 === 0 ? "#0f172a" : "#1e293b";
            ctx.fillRect(c * gridSize, r * gridSize, gridSize, gridSize);
        }
    }
    ctx.save();
    ctx.shadowColor = "rgba(239, 68, 68, 0.4)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;
    const foodCenterX = food.x * gridSize + gridSize / 2;
    const foodCenterY = food.y * gridSize + gridSize / 2;
    const foodRadius = gridSize / 2 - 2;
    const foodGrad = ctx.createRadialGradient(
        foodCenterX - 2, foodCenterY - 2, 1,
        foodCenterX, foodCenterY, foodRadius
    );
    foodGrad.addColorStop(0, "#f87171");
    foodGrad.addColorStop(0.8, "#ef4444");
    foodGrad.addColorStop(1, "#b91c1c");
    ctx.fillStyle = foodGrad;
    ctx.beginPath();
    ctx.arc(foodCenterX, foodCenterY, foodRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "#34d399";
    ctx.beginPath();
    ctx.ellipse(foodCenterX + 3, foodCenterY - 7, 2, 4, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    snake.forEach((cell, index) => {
        ctx.save();
        const x = cell.x * gridSize;
        const y = cell.y * gridSize;
        const radius = gridSize / 2;
        ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        const segGrad = ctx.createRadialGradient(
            x + radius - 3, y + radius - 3, 2,
            x + radius, y + radius, radius
        );
        if (index === 0) {
            segGrad.addColorStop(0, "#a5f3fc");
            segGrad.addColorStop(0.7, "#0ea5e9");
            segGrad.addColorStop(1, "#0369a1");
            ctx.fillStyle = segGrad;
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, gridSize - 2, gridSize - 2, 6);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            let eyeX1, eyeY1, eyeX2, eyeY2;
            if (dx === 1) {
                eyeX1 = x + 14; eyeY1 = y + 5;
                eyeX2 = x + 14; eyeY2 = y + 15;
            } else if (dx === -1) {
                eyeX1 = x + 6; eyeY1 = y + 5;
                eyeX2 = x + 6; eyeY2 = y + 15;
            } else if (dy === 1) {
                eyeX1 = x + 5; eyeY1 = y + 14;
                eyeX2 = x + 15; eyeY2 = y + 14;
            } else {
                eyeX1 = x + 5; eyeY1 = y + 6;
                eyeX2 = x + 15; eyeY2 = y + 6;
            }
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, 2.5, 0, Math.PI * 2);
            ctx.arc(eyeX2, eyeY2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#020617";
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, 1, 0, Math.PI * 2);
            ctx.arc(eyeX2, eyeY2, 1, 0, Math.PI * 2);
            ctx.fill();
        } else {
            segGrad.addColorStop(0, "#86efac");
            segGrad.addColorStop(0.7, "#10b981");
            segGrad.addColorStop(1, "#047857");
            ctx.fillStyle = segGrad;
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, gridSize - 4, gridSize - 4, 4);
            ctx.fill();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x + radius - 2, y + radius - 2, radius - 4, Math.PI, Math.PI * 1.5);
            ctx.stroke();
        }
        ctx.restore();
    });
}
ctx.fillStyle = "#0f172a";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "#38bdf8";
ctx.font = "bold 20px var(--font-sans), sans-serif";
ctx.textAlign = "center";
ctx.fillText("Snake Game", canvas.width / 2, canvas.height / 2 - 20);
ctx.fillStyle = "#94a3b8";
ctx.font = "600 14px var(--font-sans), sans-serif";
ctx.fillText("Click 'Start Game' below to begin!", canvas.width / 2, canvas.height / 2 + 10);
restartBtn.addEventListener("click", initGame);
window.addEventListener("keydown", e => {
    if (!gameStarted) return;
    const oldDx = dx;
    const oldDy = dy;
    switch(e.key) {
        case "ArrowUp":
        case "w":
        case "W":
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case "ArrowDown":
        case "s":
        case "S":
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case "ArrowRight":
        case "d":
        case "D":
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
    if ((dx !== oldDx || dy !== oldDy) && window.retroAudio) {
        window.retroAudio.playSFX('turn');
    }
});