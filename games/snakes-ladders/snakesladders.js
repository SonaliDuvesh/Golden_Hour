const board = document.getElementById("board");
const rollBtn = document.getElementById("btn-roll");
const diceElement = document.getElementById("dice-element");
const turnIndicator = document.getElementById("turn-indicator");
const statusBox = document.getElementById("status-box");
const ladders = {
    3: 38,
    8: 31,
    28: 84,
    58: 77,
    71: 91,
    75: 96
};
const snakes = {
    97: 78,
    95: 56,
    88: 24,
    62: 18,
    48: 26,
    36: 6
};
let playerPos = 0;
let cpuPos = 0;
let currentTurn = "player";
let isRolling = false;
let gameActive = true;
const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const restartBtn = document.getElementById("btn-restart");
function initBoard() {
    board.innerHTML = "";
    for (let r = 9; r >= 0; r--) {
        const cells = [];
        for (let c = 0; c < 10; c++) {
            let num;
            if (r % 2 === 1) {
                num = (r * 10) + (10 - c);
            } else {
                num = (r * 10) + (c + 1);
            }
            cells.push(num);
        }
        cells.forEach(num => {
            const cell = document.createElement("div");
            cell.className = `cell ${num % 2 === 0 ? "cell-even" : "cell-odd"}`;
            cell.id = `cell-${num}`;
            let html = `<span class="cell-number">${num}</span>`;
            if (ladders[num]) {
                cell.classList.add("cell-ladder");
                html += `<span class="cell-effect">▲ to ${ladders[num]}</span>`;
            } else if (snakes[num]) {
                cell.classList.add("cell-snake");
                html += `<span class="cell-effect">▼ to ${snakes[num]}</span>`;
            }
            html += `<div class="tokens-container" id="tokens-${num}"></div>`;
            cell.innerHTML = html;
            board.appendChild(cell);
        });
    }
    updateTokens();
}
function updateTokens() {
    document.querySelectorAll(".token").forEach(t => t.remove());
    if (playerPos === 0) {
        const pSlot = document.getElementById("p1-start-slot");
        if (pSlot) {
            const pToken = document.createElement("div");
            pToken.className = "token token-p1";
            pToken.title = "Player";
            pSlot.appendChild(pToken);
        }
    } else {
        const pContainer = document.getElementById(`tokens-${playerPos}`);
        if (pContainer) {
            const pToken = document.createElement("div");
            pToken.className = "token token-p1";
            pToken.title = "Player";
            pContainer.appendChild(pToken);
        }
    }
    if (cpuPos === 0) {
        const cSlot = document.getElementById("cpu-start-slot");
        if (cSlot) {
            const cToken = document.createElement("div");
            cToken.className = "token token-cpu";
            cToken.title = "Computer";
            cSlot.appendChild(cToken);
        }
    } else {
        const cContainer = document.getElementById(`tokens-${cpuPos}`);
        if (cContainer) {
            const cToken = document.createElement("div");
            cToken.className = "token token-cpu";
            cToken.title = "Computer";
            cContainer.appendChild(cToken);
        }
    }
}
async function rollDice() {
    return new Promise(resolve => {
        let rolls = 0;
        const interval = setInterval(() => {
            const tempVal = Math.floor(Math.random() * 6);
            diceElement.textContent = diceFaces[tempVal];
            rolls++;
            if (window.retroAudio) {
                window.retroAudio.playSFX('click');
            }
            if (rolls > 8) {
                clearInterval(interval);
                const finalVal = Math.floor(Math.random() * 6) + 1;
                diceElement.textContent = diceFaces[finalVal - 1];
                resolve(finalVal);
            }
        }, 60);
    });
}
async function animateMovement(player, from, to) {
    if (from === to) return;
    const direction = to > from ? 1 : -1;
    let current = from;
    while (current !== to) {
        current += direction;
        if (player === "player") {
            playerPos = current;
        } else {
            cpuPos = current;
        }
        updateTokens();
        if (window.retroAudio) {
            window.retroAudio.playSFX('flip');
        }
        await delay(200);
    }
}
async function handleTurn() {
    if (isRolling || !gameActive) return;
    isRolling = true;
    if (currentTurn === "player") {
        rollBtn.disabled = true;
        statusBox.textContent = "Rolling dice...";
        diceElement.classList.add("dice-rolling");
        const roll = await rollDice();
        diceElement.classList.remove("dice-rolling");
        statusBox.textContent = `You rolled a ${roll}!`;
        await delay(600);
        if (playerPos === 0) {
            if (roll === 1) {
                statusBox.textContent = "You rolled a 1 and entered the board!";
                await animateMovement("player", 0, 1);
                await delay(400);
            } else {
                statusBox.textContent = `You rolled a ${roll}. Need a 1 to enter the board!`;
                if (window.retroAudio) {
                    window.retroAudio.playSFX('click');
                }
                await delay(1000);
            }
        } else {
            let target = playerPos + roll;
            if (target <= 100) {
                await animateMovement("player", playerPos, target);
                await delay(400);
                if (ladders[playerPos]) {
                    statusBox.textContent = `Ladder! You climbed from ${playerPos} to ${ladders[playerPos]}!`;
                    await animateMovement("player", playerPos, ladders[playerPos]);
                    if (window.retroAudio) {
                        window.retroAudio.playSFX('win');
                    }
                    await delay(600);
                } else if (snakes[playerPos]) {
                    statusBox.textContent = `Oops! Snake bit you. You slid from ${playerPos} to ${snakes[playerPos]}!`;
                    await animateMovement("player", playerPos, snakes[playerPos]);
                    if (window.retroAudio) {
                        window.retroAudio.playSFX('lose');
                    }
                    await delay(600);
                }
            } else {
                statusBox.textContent = `Rolled ${roll}. Needed exactly ${100 - playerPos} to win!`;
                if (window.retroAudio) {
                    window.retroAudio.playSFX('click');
                }
                await delay(1000);
            }
        }
        if (playerPos === 100) {
            statusBox.textContent = "🎉 Congratulations! You reached 100 and won!";
            turnIndicator.textContent = "You Won!";
            turnIndicator.style.color = "var(--accent-green)";
            if (window.retroAudio) {
                window.retroAudio.playSFX('win');
            }
            gameActive = false;
            isRolling = false;
            rollBtn.disabled = true;
            rollBtn.style.display = "none";
            if (restartBtn) restartBtn.style.display = "block";
            return;
        }
        currentTurn = "cpu";
        turnIndicator.textContent = "Computer's Turn...";
        turnIndicator.style.color = "var(--accent-red)";
        isRolling = false;
        await delay(1000);
        handleTurn();
    } else {
        statusBox.textContent = "Computer is rolling...";
        diceElement.classList.add("dice-rolling");
        const roll = await rollDice();
        diceElement.classList.remove("dice-rolling");
        statusBox.textContent = `Computer rolled a ${roll}!`;
        await delay(600);
        if (cpuPos === 0) {
            if (roll === 1) {
                statusBox.textContent = "Computer rolled a 1 and entered the board!";
                await animateMovement("cpu", 0, 1);
                await delay(400);
            } else {
                statusBox.textContent = `Computer rolled a ${roll}. Needs a 1 to enter the board.`;
                if (window.retroAudio) {
                    window.retroAudio.playSFX('click');
                }
                await delay(1000);
            }
        } else {
            let target = cpuPos + roll;
            if (target <= 100) {
                await animateMovement("cpu", cpuPos, target);
                await delay(400);
                if (ladders[cpuPos]) {
                    statusBox.textContent = `Computer found a ladder! Climbed to ${ladders[cpuPos]}!`;
                    await animateMovement("cpu", cpuPos, ladders[cpuPos]);
                    if (window.retroAudio) {
                        window.retroAudio.playSFX('win');
                    }
                    await delay(600);
                } else if (snakes[cpuPos]) {
                    statusBox.textContent = `Haha! Computer was bitten by a snake and slid to ${snakes[cpuPos]}!`;
                    await animateMovement("cpu", cpuPos, snakes[cpuPos]);
                    if (window.retroAudio) {
                        window.retroAudio.playSFX('lose');
                    }
                    await delay(600);
                }
            } else {
                statusBox.textContent = `Computer rolled ${roll}. Needed exactly ${100 - cpuPos} to win.`;
                if (window.retroAudio) {
                    window.retroAudio.playSFX('click');
                }
                await delay(1000);
            }
        }
        if (cpuPos === 100) {
            statusBox.textContent = "💥 Game Over! Computer reached 100 and won.";
            turnIndicator.textContent = "Computer Won!";
            if (window.retroAudio) {
                window.retroAudio.playSFX('lose');
            }
            gameActive = false;
            isRolling = false;
            rollBtn.disabled = true;
            rollBtn.style.display = "none";
            if (restartBtn) restartBtn.style.display = "block";
            return;
        }
        currentTurn = "player";
        turnIndicator.textContent = "Your Turn!";
        turnIndicator.style.color = "var(--accent-blue)";
        rollBtn.disabled = false;
        isRolling = false;
    }
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function resetGame() {
    playerPos = 0;
    cpuPos = 0;
    currentTurn = "player";
    isRolling = false;
    gameActive = true;
    rollBtn.style.display = "block";
    rollBtn.disabled = false;
    if (restartBtn) restartBtn.style.display = "none";
    diceElement.textContent = "🎲";
    turnIndicator.textContent = "Your Turn!";
    turnIndicator.style.color = "var(--accent-blue)";
    statusBox.textContent = "Roll a 1 to enter the board!";
    updateTokens();
}
rollBtn.addEventListener("click", () => {
    if (currentTurn === "player" && !isRolling && gameActive) {
        handleTurn();
    }
});
if (restartBtn) {
    restartBtn.addEventListener("click", resetGame);
}
initBoard();