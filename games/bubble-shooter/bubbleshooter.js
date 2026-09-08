const canvas = document.getElementById("bubble-canvas");
const ctx = canvas.getContext("2d");
const scoreVal = document.getElementById("score-val");
const restartBtn = document.getElementById("btn-restart");
const BUBBLE_RADIUS = 16;
const BUBBLE_DIA = BUBBLE_RADIUS * 2;
const ROWS = 12;
const COLS = 11;
const COLORS = ["#38bdf8", "#34d399", "#f87171", "#c084fc", "#fbbf24"];
let grid = [];
let score = 0;
let mouseX = canvas.width / 2;
let mouseY = 0;
let currentBubble = null;
let nextBubbleColor = "";
let bullet = null;
let isShooting = false;
let gameOver = false;
let gameWon = false;
let snapAnimation = null;
let popEffects = [];
let fallingBubbles = [];
let particles = [];
function initGame() {
    grid = [];
    for (let r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < COLS; c++) {
            if (r < 5) {
                grid[r][c] = COLORS[Math.floor(Math.random() * COLORS.length)];
            } else {
                grid[r][c] = null;
            }
        }
    }
    score = 0;
    scoreVal.textContent = score;
    gameOver = false;
    gameWon = false;
    isShooting = false;
    bullet = null;
    snapAnimation = null;
    popEffects = [];
    fallingBubbles = [];
    particles = [];
    nextBubbleColor = getRandomBoardColor();
    spawnNextBubble();
}
function getRandomBoardColor() {
    const activeColors = new Set();
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r] && grid[r][c]) {
                activeColors.add(grid[r][c]);
            }
        }
    }
    let colorArray = Array.from(activeColors);
    if (colorArray.length === 0) {
        colorArray = [...COLORS];
    } 
    else if (colorArray.length === 1) {
        const remainingColor = colorArray[0];
        COLORS.forEach(c => {
            if (c !== remainingColor) {
                colorArray.push(c);
            }
        });
    }
    return colorArray[Math.floor(Math.random() * colorArray.length)];
}
function spawnNextBubble() {
    currentBubble = {
        x: canvas.width / 2,
        y: canvas.height - 30,
        color: nextBubbleColor
    };
    nextBubbleColor = getRandomBoardColor();
}
function getCellCoords(r, c) {
    const xOffset = (r % 2 === 1) ? BUBBLE_RADIUS : 0;
    const x = c * BUBBLE_DIA + BUBBLE_RADIUS + xOffset;
    const y = r * (BUBBLE_DIA - 4) + BUBBLE_RADIUS;
    return { x, y };
}
function drawBubble(x, y, color, radiusScale = 1, opacity = 1) {
    if (!color) return;
    ctx.save();
    ctx.globalAlpha = opacity;
    const r = BUBBLE_RADIUS * radiusScale;
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.1, r - 0.5), 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    const shadingGrad = ctx.createRadialGradient(
        x - r * 0.3, y - r * 0.3, r * 0.05,
        x, y, r
    );
    shadingGrad.addColorStop(0, "rgba(255, 255, 255, 0.65)");
    shadingGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.15)");
    shadingGrad.addColorStop(0.7, "rgba(0, 0, 0, 0)");
    shadingGrad.addColorStop(1, "rgba(0, 0, 0, 0.45)");
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.1, r - 0.5), 0, Math.PI * 2);
    ctx.fillStyle = shadingGrad;
    ctx.fill();
    const specularGrad = ctx.createRadialGradient(
        x - r * 0.35, y - r * 0.35, 0,
        x - r * 0.35, y - r * 0.35, r * 0.25
    );
    specularGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    specularGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = specularGrad;
    ctx.fill();
    ctx.restore();
}
function draw() {
    const bgGrad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 50,
        canvas.width / 2, canvas.height / 2, canvas.height
    );
    bgGrad.addColorStop(0, "#1e1b4b");
    bgGrad.addColorStop(1, "#07070b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c]) {
                const { x, y } = getCellCoords(r, c);
                drawBubble(x, y, grid[r][c]);
            }
        }
    }
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
    });
    if (snapAnimation) {
        const t = snapAnimation.progress;
        const x = snapAnimation.startX + (snapAnimation.endX - snapAnimation.startX) * t;
        const y = snapAnimation.startY + (snapAnimation.endY - snapAnimation.startY) * t;
        drawBubble(x, y, snapAnimation.color);
    }
    popEffects.forEach(pop => {
        const ratio = pop.life / pop.maxLife;
        const radiusScale = 1.0 + (1.0 - ratio) * 0.8;
        const opacity = ratio;
        drawBubble(pop.x, pop.y, pop.color, radiusScale, opacity);
    });
    fallingBubbles.forEach(fall => {
        drawBubble(fall.x, fall.y, fall.color);
    });
    if (!gameOver && currentBubble && !snapAnimation) {
        const dx = mouseX - canvas.width / 2;
        const dy = mouseY - (canvas.height - 30);
        const angle = Math.atan2(dy, dx);
        ctx.save();
        ctx.shadowColor = "rgba(56, 189, 248, 0.4)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height, 42, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height, 28, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        const lineLen = 220;
        const numDots = 9;
        ctx.save();
        for (let i = 1; i <= numDots; i++) {
            const dist = (i / numDots) * lineLen;
            const dotX = canvas.width / 2 + Math.cos(angle) * dist;
            const dotY = canvas.height - 30 + Math.sin(angle) * dist;
            const dotOpacity = 0.5 * (1 - dist / lineLen);
            ctx.beginPath();
            ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${dotOpacity})`;
            ctx.fill();
        }
        ctx.restore();
        drawBubble(currentBubble.x, currentBubble.y, currentBubble.color);
        ctx.save();
        ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(30, canvas.height - 30, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        drawBubble(30, canvas.height - 30, nextBubbleColor);
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("NEXT", 30, canvas.height - 58);
    }
    if (isShooting && bullet) {
        drawBubble(bullet.x, bullet.y, bullet.color);
    }
    if (gameOver) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = "center";
        if (gameWon) {
            ctx.fillStyle = "#34d399";
            ctx.font = "bold 28px sans-serif";
            ctx.fillText("You Win!", canvas.width / 2, canvas.height / 2 - 20);
        } else {
            ctx.fillStyle = "#f87171";
            ctx.font = "bold 28px sans-serif";
            ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
        }
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 15);
    }
}
function update() {
    if (gameOver) return;
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.08;
        p.alpha -= 0.035;
        p.size *= 0.95;
        if (p.alpha <= 0 || p.size < 0.5) {
            particles.splice(i, 1);
        }
    }
    popEffects.forEach((pop, index) => {
        pop.life--;
        if (pop.life <= 0) {
            popEffects.splice(index, 1);
        }
    });
    fallingBubbles.forEach((fall, index) => {
        fall.dy += 0.25;
        fall.x += fall.dx;
        fall.y += fall.dy;
        if (Math.random() < 0.3) {
            particles.push({
                x: fall.x,
                y: fall.y,
                dx: (Math.random() - 0.5) * 0.3,
                dy: (Math.random() - 0.5) * 0.3,
                color: fall.color,
                size: Math.random() * 2 + 1,
                alpha: 0.5
            });
        }
        if (fall.y - BUBBLE_RADIUS > canvas.height) {
            fallingBubbles.splice(index, 1);
        }
    });
    if (snapAnimation) {
        snapAnimation.progress += 0.25;
        if (snapAnimation.progress >= 1) {
            const { r, c, color } = snapAnimation;
            grid[r][c] = color;
            snapAnimation = null;
            resolveGridMatch(r, c, color);
        }
        return;
    }
    if (isShooting && bullet) {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
        if (Math.random() < 0.6) {
            particles.push({
                x: bullet.x,
                y: bullet.y,
                dx: (Math.random() - 0.5) * 0.8,
                dy: (Math.random() - 0.5) * 0.8,
                color: bullet.color,
                size: Math.random() * 3 + 2,
                alpha: 0.8
            });
        }
        if (bullet.x - BUBBLE_RADIUS <= 0) {
            bullet.x = BUBBLE_RADIUS;
            bullet.dx = -bullet.dx;
            if (window.retroAudio) {
                window.retroAudio.playSFX('tick');
            }
        } else if (bullet.x + BUBBLE_RADIUS >= canvas.width) {
            bullet.x = canvas.width - BUBBLE_RADIUS;
            bullet.dx = -bullet.dx;
            if (window.retroAudio) {
                window.retroAudio.playSFX('tock');
            }
        }
        if (bullet.y - BUBBLE_RADIUS <= 0) {
            startSnapAnimation(bullet);
            return;
        }
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c]) {
                    const { x, y } = getCellCoords(r, c);
                    const dist = Math.hypot(bullet.x - x, bullet.y - y);
                    if (dist < BUBBLE_DIA - 4) {
                        startSnapAnimation(bullet);
                        return;
                    }
                }
            }
        }
    }
}
function startSnapAnimation(bulletBubble) {
    let bestR = 0;
    let bestC = 0;
    let minDist = Infinity;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (!grid[r][c]) {
                const { x, y } = getCellCoords(r, c);
                const dist = Math.hypot(bulletBubble.x - x, bulletBubble.y - y);
                if (dist < minDist) {
                    minDist = dist;
                    bestR = r;
                    bestC = c;
                }
            }
        }
    }
    const targetCoords = getCellCoords(bestR, bestC);
    snapAnimation = {
        r: bestR,
        c: bestC,
        startX: bulletBubble.x,
        startY: bulletBubble.y,
        endX: targetCoords.x,
        endY: targetCoords.y,
        color: bulletBubble.color,
        progress: 0
    };
    isShooting = false;
    bullet = null;
}
function resolveGridMatch(r, c, color) {
    const matches = getMatches(r, c, color);
    if (matches.length >= 3) {
        matches.forEach(({ r: mr, c: mc }) => {
            const coords = getCellCoords(mr, mc);
            popEffects.push({
                x: coords.x,
                y: coords.y,
                color: grid[mr][mc],
                life: 8,
                maxLife: 8
            });
            const numParticles = 8;
            for (let i = 0; i < numParticles; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1.5 + Math.random() * 2.5;
                particles.push({
                    x: coords.x,
                    y: coords.y,
                    dx: Math.cos(angle) * speed,
                    dy: Math.sin(angle) * speed - 0.5,
                    color: grid[mr][mc],
                    size: Math.random() * 4 + 2,
                    alpha: 1.0
                });
            }
            grid[mr][mc] = null;
        });
        score += matches.length * 10;
        scoreVal.textContent = score;
        if (window.retroAudio) {
            window.retroAudio.playSFX('pop');
        }
        dropFloatingBubles();
    }
    let hasBubbles = false;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c]) {
                hasBubbles = true;
                break;
            }
        }
        if (hasBubbles) break;
    }
    if (!hasBubbles) {
        gameOver = true;
        gameWon = true;
        currentBubble = null;
        bullet = null;
        isShooting = false;
        if (window.retroAudio) {
            window.retroAudio.playSFX('win');
        }
    } else {
        for (let col = 0; col < COLS; col++) {
            if (grid[ROWS - 1][col]) {
                gameOver = true;
                currentBubble = null;
                bullet = null;
                isShooting = false;
                if (window.retroAudio) {
                    window.retroAudio.playSFX('lose');
                }
                break;
            }
        }
    }
    if (!gameOver) {
        spawnNextBubble();
    }
}
function getMatches(startR, startC, targetColor) {
    const queue = [{ r: startR, c: startC }];
    const visited = new Set();
    visited.add(`${startR},${startC}`);
    const matches = [];
    while (queue.length > 0) {
        const { r, c } = queue.shift();
        matches.push({ r, c });
        const neighbors = getNeighbors(r, c);
        neighbors.forEach(({ nr, nc }) => {
            const key = `${nr},${nc}`;
            if (!visited.has(key) && grid[nr][nc] === targetColor) {
                visited.add(key);
                queue.push({ r: nr, c: nc });
            }
        });
    }
    return matches;
}
function getNeighbors(r, c) {
    const list = [];
    const isOdd = (r % 2 === 1);
    const offsets = isOdd ? [
        { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
        { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
        { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
    ] : [
        { dr: -1, dc: -1 }, { dr: -1, dc: 0 },
        { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
        { dr: 1, dc: -1 }, { dr: 1, dc: 0 }
    ];
    offsets.forEach(({ dr, dc }) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            list.push({ nr, nc });
        }
    });
    return list;
}
function dropFloatingBubles() {
    const connected = Array(ROWS).fill(null).map(() => Array(COLS).fill(false));
    const queue = [];
    for (let c = 0; c < COLS; c++) {
        if (grid[0][c]) {
            connected[0][c] = true;
            queue.push({ r: 0, c });
        }
    }
    while (queue.length > 0) {
        const { r, c } = queue.shift();
        const neighbors = getNeighbors(r, c);
        neighbors.forEach(({ nr, nc }) => {
            if (grid[nr][nc] && !connected[nr][nc]) {
                connected[nr][nc] = true;
                queue.push({ r: nr, c: nc });
            }
        });
    }
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (grid[r][c] && !connected[r][c]) {
                const coords = getCellCoords(r, c);
                fallingBubbles.push({
                    x: coords.x,
                    y: coords.y,
                    dx: (Math.random() - 0.5) * 3,
                    dy: -1 - Math.random() * 2,
                    color: grid[r][c]
                });
                grid[r][c] = null;
                score += 5;
            }
        }
    }
    scoreVal.textContent = score;
}
canvas.addEventListener("click", (e) => {
    if (gameOver || isShooting || !currentBubble || snapAnimation) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
    mouseX = clickX;
    mouseY = clickY;
    const dx = mouseX - canvas.width / 2;
    const dy = mouseY - (canvas.height - 30);
    const len = Math.hypot(dx, dy);
    if (dy >= 0) return;
    bullet = {
        x: canvas.width / 2,
        y: canvas.height - 30,
        dx: (dx / len) * 11,
        dy: (dy / len) * 11,
        color: currentBubble.color
    };
    isShooting = true;
    currentBubble = null;
    if (window.retroAudio) {
        window.retroAudio.playSFX('click');
    }
});
restartBtn.addEventListener("click", initGame);
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
initGame();
gameLoop();