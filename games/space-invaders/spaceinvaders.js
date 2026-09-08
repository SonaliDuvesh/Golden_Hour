const canvas = document.getElementById("invaders-canvas");
const ctx = canvas.getContext("2d");
const scoreVal = document.getElementById("score-val");
const livesVal = document.getElementById("lives-val");
const restartBtn = document.getElementById("btn-restart");
let player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 30,
    width: 30,
    height: 15,
    speed: 4,
    dx: 0
};
let score = 0;
let lives = 3;
let gameOver = false;
let gameWon = false;
let gameStarted = false;
let bullets = [];
let enemyBullets = [];
let invaders = [];
let invaderDirection = 1;
let invaderSpeed = 1;
let invaderStepDown = 10;
let lastInvaderShotTime = 0;
const keys = {};
function initGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    gameWon = false;
    gameStarted = true;
    bullets = [];
    enemyBullets = [];
    scoreVal.textContent = score;
    livesVal.textContent = lives;
    player.x = canvas.width / 2 - 15;
    invaders = [];
    const rows = 4;
    const cols = 6;
    const startX = 50;
    const startY = 40;
    const spacingX = 45;
    const spacingY = 30;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            invaders.push({
                x: startX + c * spacingX,
                y: startY + r * spacingY,
                width: 24,
                height: 16,
                active: true
            });
        }
    }
    invaderDirection = 1;
    invaderSpeed = 0.8;
    restartBtn.textContent = "Restart Game";
}
function drawPlayer() {
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.closePath();
    ctx.fill();
}
function drawInvaders() {
    ctx.fillStyle = "#f87171";
    invaders.forEach(inv => {
        if (inv.active) {
            ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
            ctx.fillStyle = "#090d16";
            ctx.fillRect(inv.x + 4, inv.y + 4, 3, 3);
            ctx.fillRect(inv.x + 17, inv.y + 4, 3, 3);
            ctx.fillStyle = "#f87171";
        }
    });
}
function drawBullets() {
    ctx.fillStyle = "#34d399";
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, 3, 10);
    });
    ctx.fillStyle = "#fbbf24";
    enemyBullets.forEach(b => {
        ctx.fillRect(b.x, b.y, 3, 10);
    });
}
function update() {
    if (!gameStarted || gameOver || gameWon) return;
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        player.x -= player.speed;
    }
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        player.x += player.speed;
    }
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    bullets.forEach((b, index) => {
        b.y -= 6;
        if (b.y < 0) {
            bullets.splice(index, 1);
        }
    });
    enemyBullets.forEach((b, index) => {
        b.y += 3;
        if (b.y > canvas.height) {
            enemyBullets.splice(index, 1);
        }
        if (
            b.x > player.x &&
            b.x < player.x + player.width &&
            b.y > player.y &&
            b.y < player.y + player.height
        ) {
            enemyBullets.splice(index, 1);
            lives--;
            livesVal.textContent = lives;
            if (lives <= 0) {
                gameOver = true;
            }
        }
    });
    let hitWall = false;
    invaders.forEach(inv => {
        if (inv.active) {
            inv.x += invaderSpeed * invaderDirection;
            if (inv.x <= 0 || inv.x + inv.width >= canvas.width) {
                hitWall = true;
            }
        }
    });
    if (hitWall) {
        invaderDirection *= -1;
        invaders.forEach(inv => {
            if (inv.active) {
                inv.y += invaderStepDown;
                if (inv.y + inv.height >= player.y) {
                    gameOver = true;
                }
            }
        });
    }
    const now = Date.now();
    if (now - lastInvaderShotTime > 1500) {
        const activeInvaders = invaders.filter(i => i.active);
        if (activeInvaders.length > 0) {
            const randomInvader = activeInvaders[Math.floor(Math.random() * activeInvaders.length)];
            enemyBullets.push({
                x: randomInvader.x + randomInvader.width / 2,
                y: randomInvader.y + randomInvader.height
            });
            lastInvaderShotTime = now;
        }
    }
    bullets.forEach((b, bIndex) => {
        invaders.forEach(inv => {
            if (inv.active && b.x > inv.x && b.x < inv.x + inv.width && b.y > inv.y && b.y < inv.y + inv.height) {
                inv.active = false;
                bullets.splice(bIndex, 1);
                score += 10;
                scoreVal.textContent = score;
                invaderSpeed += 0.05;
            }
        });
    });
    if (invaders.every(inv => !inv.active)) {
        gameWon = true;
    }
}
function draw() {
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (gameStarted) {
        drawPlayer();
        drawInvaders();
        drawBullets();
    } else {
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Space Invaders", canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px sans-serif";
        ctx.fillText("Click 'Start Game' below to play", canvas.width / 2, canvas.height / 2 + 10);
    }
    if (gameOver) {
        ctx.fillStyle = "rgba(9, 13, 22, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f87171";
        ctx.font = "bold 26px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "16px sans-serif";
        ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 + 15);
    }
    if (gameWon) {
        ctx.fillStyle = "rgba(9, 13, 22, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#34d399";
        ctx.font = "bold 26px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Victory! You Won!", canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "16px sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 15);
    }
}
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
window.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
    }
    if (e.key === " " && gameStarted && !gameOver && !gameWon) {
        if (bullets.length < 3) {
            bullets.push({
                x: player.x + player.width / 2 - 1.5,
                y: player.y
            });
        }
    }
});
window.addEventListener("keyup", e => {
    keys[e.key] = false;
});
restartBtn.addEventListener("click", initGame);
gameLoop();