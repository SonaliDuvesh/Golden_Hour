const CHARACTER_STICKERS = [
    "charaters/char1.png",
    "charaters/char2.png",
    "charaters/char3.png",
    "charaters/char4.png",
    "charaters/char5.png",
    "charaters/char6.png",
    "charaters/char7.png",
    "charaters/char8.png",
    "charaters/char9.png",
    "charaters/char10.png",
    "charaters/char11.png",
    "charaters/char12.png",
    "charaters/char13.png",
    "charaters/char14.png",
    "charaters/char15.png",
    "charaters/char16.png",
    "charaters/char17.png",
    "charaters/char18.png",
    "charaters/char19.png",
    "charaters/char20.png",
    "charaters/char21.png"
];
const games = [
    {
        id: "snake",
        title: "Snake",
        emoji: "🐍",
        desc: "Grow your snake and eat food while avoiding self-collision or hitting the walls.",
        color: "#86efac"
    },
    {
        id: "snakes-ladders",
        title: "Snakes & Ladders",
        emoji: "🎲",
        desc: "Roll the dice, climb the ladders, and race the computer to square 100.",
        color: "#c084fc"
    },
    {
        id: "bubble-shooter",
        title: "Bubble Shooter",
        emoji: "🔮",
        desc: "Aim, match same-color bubbles, and clear them out with beautiful popping physics.",
        color: "#67e8f9"
    },
    {
        id: "n-queens",
        title: "N-Queens Solver",
        emoji: "👑",
        desc: "Solve the classic chessboard puzzle manually or watch the backtracking AI solve it.",
        color: "#fef08a"
    },
    {
        id: "minesweeper",
        title: "Minesweeper",
        emoji: "💣",
        desc: "Identify the mine fields, flag suspected spots, and clear the safe cells.",
        color: "#fca5a5"
    },
    {
        id: "hangman",
        title: "Hangman",
        emoji: "🪓",
        desc: "Crack the secret word letter by letter before your attempts run out.",
        color: "#cbd5e1"
    },
    {
        id: "sudoku",
        title: "Sudoku",
        emoji: "🔢",
        desc: "Solve the 9x9 board with digits 1-9 across rows, columns, and 3x3 blocks.",
        color: "#93c5fd"
    },
    {
        id: "rock-paper-scissors",
        title: "Rock Paper Scissors",
        emoji: "🪨",
        desc: "Test your luck and strategy in standard match rounds against the CPU.",
        color: "#fda4af"
    },
    {
        id: "sliding-puzzle",
        title: "Sliding Puzzle",
        emoji: "🧩",
        desc: "Rearrange numbered tiles into order by sliding them into the empty cell.",
        color: "#d8b4fe"
    },
    {
        id: "2048",
        title: "2048",
        emoji: "🔢",
        desc: "Merge matching adjacent numbers to construct the legendary 2048 tile.",
        color: "#fde047"
    },
    {
        id: "space-invaders",
        title: "Space Invaders",
        emoji: "🛸",
        desc: "Engage the descending alien armada and defend Earth from retro space invaders.",
        color: "#f43f5e"
    },
    {
        id: "memory-match",
        title: "Memory Match",
        emoji: "🎴",
        desc: "Uncover and find matching animal emojis in a classic card flipping test.",
        color: "#6ee7b7"
    }
];
const CAPTIONS = [
    "Pick a game, friend!",
    "Ooh, what should we play today?",
    "I bet you can beat my high score!",
    "Let's play together!",
    "Select any cabinet to start!"
];
let currentIndex = 0;
let fractionalIndexGlobal = 0;
let isScrollingThrottled = false;
let applyFractionalIndex = (fi) => {
    fractionalIndexGlobal = Math.max(0, Math.min((window._gamesLength || 12) - 1, fi));
    update3DDeckTransforms(fractionalIndexGlobal);
    const newActive = Math.round(fractionalIndexGlobal);
    if (newActive !== currentIndex) {
        currentIndex = newActive;
        updateEditorialPanel();
        updateProgressNav();
    }
};
const STICKER_SETTINGS = {
    size: [240, 320],
    x: null,
    y: null,
    rotation: null,
    curlAngle: null,
    startCurl: 0.15,
    duration: 1100,
    onLand: null
};
function layer(cls) {
    const node = document.createElement("div");
    node.className = `sticker__layer ${cls}`;
    return node;
}
function setVars(node, vars) {
    for (const k in vars) node.style.setProperty(k, String(vars[k]));
}
function cancelSafe(anim) {
    try { anim.cancel(); } catch (_) {}
}
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function clamp01(v) { return clamp(v, 0, 1); }
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function resolveSize(size) {
    return Array.isArray(size) ? Math.round(rand(size[0], size[1])) : size;
}
let stickerUid = 0;
class StickerSlap {
    constructor(stage, options = {}) {
        if (!stage) throw new Error("StickerSlap requires a stage element.");
        this.stage = stage;
        this.defaults = { ...STICKER_SETTINGS, ...options };
        this.stickers = [];
        const cs = getComputedStyle(stage);
        if (cs.position === "static") stage.style.position = "relative";
        if (cs.overflow === "visible") stage.style.overflow = "hidden";
    }
    async slap(source, opts = {}) {
        const o = { ...this.defaults, ...opts };
        o.size = resolveSize(o.size);
        const el = this._createSticker(source, o);
        this.stage.appendChild(el);
        this.stickers.push(el);
        await this._animateIn(el, o);
        if (typeof o.onLand === "function") o.onLand(el);
        return el;
    }
    clear() {
        this.stickers.forEach(s => s.remove());
        this.stickers = [];
    }
    _settle(el) {
        const flat = el.querySelector(".sticker__flat");
        const vars = ["--src", "--u0", "--u1", "--w0", "--w1", "--minp",
            "--span", "--big", "--s", "--ca", "--a", "--b", "--d", "--p"];
        for (const name of vars) el.style.removeProperty(name);
        el.replaceChildren(flat);
        el.style.transform = `rotate(${el._restRotation}deg)`;
    }
    _createSticker(src, o) {
        const rect = this.stage.getBoundingClientRect();
        let S = o.size;
        const minDim = Math.min(rect.width || window.innerWidth, rect.height || window.innerHeight);
        if (minDim < 500) {
            S = Math.round(Math.min(S, Math.max(180, minDim * 0.45)));
        } else if (minDim < 800) {
            S = Math.round(Math.min(S, Math.max(220, minDim * 0.40)));
        } else {
            S = Math.round(Math.min(S, Math.max(260, minDim * 0.32)));
        }
        const fx = o.x == null ? Math.random() : clamp01(o.x);
        const fy = o.y == null ? Math.random() : clamp01(o.y);
        const left = fx * rect.width - S / 2;
        const top = fy * rect.height - S / 2;
        const rest = o.rotation == null ? rand(-15, 15) : o.rotation;
        const angle = (o.curlAngle == null ? rand(0, 360) : o.curlAngle) * (Math.PI / 180);
        const u = [Math.cos(angle), Math.sin(angle)];
        const w = [-Math.sin(angle), Math.cos(angle)];
        const projs = [
            [0, 0],
            [S, 0],
            [S, S],
            [0, S]
        ].map(c => c[0] * u[0] + c[1] * u[1]);
        const minP = Math.min(...projs);
        const span = Math.max(...projs) - minP;
        const p0 = clamp01(o.startCurl);
        const el = document.createElement("div");
        el.className = "sticker";
        el.dataset.id = `sticker-${++stickerUid}`;
        Object.assign(el.style, {
            left: `${left}px`,
            top: `${top}px`,
            width: `${S}px`,
            height: `${S}px`
        });
        const safeSrc = encodeURI(src);
        setVars(el, {
            "--src": `url("${safeSrc}")`,
            "--u0": u[0],
            "--u1": u[1],
            "--w0": w[0],
            "--w1": w[1],
            "--minp": minP,
            "--span": span,
            "--big": S * 6,
            "--s": S,
            "--ca": 90 + angle * 180 / Math.PI,
            "--a": 1 - 2 * u[0] * u[0],
            "--b": -2 * u[0] * u[1],
            "--d": 1 - 2 * u[1] * u[1],
            "--p": 1
        });
        const flat = layer("sticker__flat");
        const img = document.createElement("img");
        img.className = "sticker__img";
        img.src = safeSrc;
        img.draggable = false;
        flat.appendChild(img);
        const flapShadow = layer("sticker__flap-shadow");
        const flapClip = layer("sticker__flap-clip");
        const flapInner = layer("sticker__flap-inner");
        const flapFill = layer("sticker__flap-fill");
        flapInner.appendChild(flapFill);
        flapClip.appendChild(flapInner);
        flapShadow.appendChild(flapClip);
        el.append(flat, flapShadow);
        el._restRotation = rest;
        el._startCurl = 1;
        return el;
    }
    _animateIn(el, o) {
        const rest = el._restRotation;
        const entrance = el.animate([
            {
                offset: 0,
                transform: `perspective(600px) translateZ(220px) scale(1.6) rotate(${rest - 8}deg)`,
                opacity: 0.9
            },
            {
                offset: 0.72,
                transform: `perspective(600px) translateZ(0px) scale(0.98) rotate(${rest}deg)`,
                opacity: 1
            },
            {
                offset: 0.88,
                transform: `perspective(600px) translateZ(-3px) scale(0.97) rotate(${rest}deg)`,
                opacity: 1
            },
            {
                offset: 1,
                transform: `perspective(600px) translateZ(0px) scale(1.0) rotate(${rest}deg)`,
                opacity: 1
            }
        ], { duration: 2200, easing: "cubic-bezier(0.25, 1, 0.35, 1)", fill: "both" });
        return entrance.finished.then(() => {
            el.style.setProperty("--p", "1");
            el.style.transform = `rotate(${rest}deg)`;
            cancelSafe(entrance);
            this._settle(el);
            return el;
        });
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const landingScreen = document.getElementById("landing-screen");
    const discoveryScreen = document.getElementById("discovery-screen");
    const stage = document.getElementById("stage");
    const brandTitle = document.getElementById("brand-title");
    const btnBack = document.getElementById("btn-back");
    let currentTheme = localStorage.getItem("golden-hour-theme") || "light";
    function applyTheme(theme) {
        currentTheme = theme;
        localStorage.setItem("golden-hour-theme", theme);
        document.documentElement.setAttribute("data-theme", theme);
        const themeBtns = document.querySelectorAll(".btn-theme-toggle");
        themeBtns.forEach(btn => {
            if (theme === "dark") {
                btn.innerHTML = "🌙 Theme: Dark";
            } else {
                btn.innerHTML = "☀️ Theme: Light";
            }
        });
    }
    applyTheme(currentTheme);
    document.querySelectorAll(".btn-theme-toggle").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (window.retroAudio) {
                window.retroAudio.playSFX('click');
            }
            const nextTheme = currentTheme === "dark" ? "light" : "dark";
            applyTheme(nextTheme);
        });
    });
    build3DCardDeck();
    if (stage && landingScreen) {
        const slapper = new StickerSlap(stage);
        const handlePointerSlap = (e) => {
            if (!landingScreen.classList.contains("active")) return;
            if (e.target.closest("button") || e.target.closest(".btn-enter") || e.target.closest("#btn-enter") || e.target.closest(".audio-btn")) {
                return;
            }
            const charImg = CHARACTER_STICKERS[Math.floor(Math.random() * CHARACTER_STICKERS.length)];
            const r = stage.getBoundingClientRect();
            slapper.slap(charImg, {
                x: (e.clientX - r.left) / r.width,
                y: (e.clientY - r.top) / r.height
            });
            if (window.retroAudio) {
                window.retroAudio.playSFX('pop');
            }
        };
        document.addEventListener("pointerdown", handlePointerSlap);
    }
    const clickHint = document.getElementById("click-hint");
    if (clickHint) {
        const dismissHint = () => {
            clickHint.classList.add("hidden");
            setTimeout(() => clickHint.remove(), 550);
            document.removeEventListener("pointerdown", dismissHint, true);
        };
        document.addEventListener("pointerdown", dismissHint, { capture: true, once: true });
    }
    const btnEnter = document.getElementById("btn-enter");
    if (btnEnter) {
        btnEnter.addEventListener("click", (e) => {
            e.stopPropagation();
            if (window.retroAudio) {
                window.retroAudio.startBGM();
                window.retroAudio.playSFX('click');
            }
            if (landingScreen && discoveryScreen) {
                landingScreen.classList.remove("active");
                setTimeout(() => {
                    discoveryScreen.classList.add("active");
                    discoveryScreen.scrollTop = 0;
                    updateActiveGameIndex(0, false);
                    startMomoCaptions();
                }, 150);
            }
        });
    }
    if (btnBack) {
        btnBack.addEventListener("click", () => {
            if (window.retroAudio) {
                window.retroAudio.playSFX('click');
            }
            if (landingScreen && discoveryScreen) {
                discoveryScreen.classList.remove("active");
                setTimeout(() => {
                    landingScreen.classList.add("active");
                }, 150);
            }
        });
    }
    const btnPlayHero = document.getElementById("btn-play-hero");
    if (btnPlayHero) {
        btnPlayHero.addEventListener("click", () => {
            launchGame(currentIndex);
        });
    }
    const btnExitGame = document.getElementById("btn-exit-game");
    if (btnExitGame) {
        btnExitGame.addEventListener("click", () => {
            closeGameModal();
        });
    }
    window._gamesLength = games.length;
    let wheelAccum = 0;
    applyFractionalIndex = (fi) => {
        fractionalIndexGlobal = Math.max(0, Math.min(games.length - 1, fi));
        update3DDeckTransforms(fractionalIndexGlobal);
        const newActive = Math.round(fractionalIndexGlobal);
        if (newActive !== currentIndex) {
            currentIndex = newActive;
            if (window.retroAudio) window.retroAudio.playSFX('slide');
            updateEditorialPanel();
            updateProgressNav();
        }
    };
    if (discoveryScreen) {
        discoveryScreen.addEventListener("wheel", (e) => {
            if (!discoveryScreen.classList.contains("active")) return;
            const gameModal = document.getElementById("game-modal");
            if (gameModal && gameModal.classList.contains("active")) return;
            e.preventDefault();
            e.stopPropagation();
            const step = Math.abs(e.deltaY) < 5 ? 0.003 : 0.012;
            const delta = e.deltaY * step;
            applyFractionalIndex(fractionalIndexGlobal + delta);
        }, { passive: false });
        let touchStartY = 0;
        let touchLastY = 0;
        discoveryScreen.addEventListener("touchstart", (e) => {
            touchStartY = e.touches[0].clientY;
            touchLastY = touchStartY;
        }, { passive: true });
        discoveryScreen.addEventListener("touchmove", (e) => {
            if (!discoveryScreen.classList.contains("active")) return;
            const gameModal = document.getElementById("game-modal");
            if (gameModal && gameModal.classList.contains("active")) return;
            const currentY = e.touches[0].clientY;
            const dy = touchLastY - currentY;
            touchLastY = currentY;
            applyFractionalIndex(fractionalIndexGlobal + dy * 0.008);
        }, { passive: true });
    }
    window.addEventListener("keydown", (e) => {
        if (discoveryScreen && discoveryScreen.classList.contains("active")) {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                navigateDeck(1);
            } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                navigateDeck(-1);
            } else if (e.key === "Enter") {
                launchGame(currentIndex);
            } else if (e.key === "Escape") {
                closeGameModal();
            }
        }
    });
});
const GAME_WORLD_DESIGNS = {
    "rock-paper-scissors": {
        category: "BATTLE MATCH",
        gradient: "linear-gradient(135deg, #3b0764 0%, #831843 50%, #be123c 100%)",
        bgPattern: "radial-gradient(circle at 50% 30%, rgba(244, 63, 94, 0.35) 0%, transparent 70%), repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 10px, transparent 10px, transparent 20px)",
        tagline: "Ultimate Hand Clash!",
        elements: ["✊", "✋", "✌️", "⚡"]
    },
    "snake": {
        category: "JUNGLE ARCADE",
        gradient: "linear-gradient(135deg, #022c22 0%, #065f46 50%, #047857 100%)",
        bgPattern: "radial-gradient(circle at 30% 20%, rgba(52, 211, 153, 0.3) 0%, transparent 65%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.25) 0%, transparent 60%)",
        tagline: "Chomp, Eat & Grow!",
        elements: ["🐍", "🍎", "🌿", "🍄"]
    },
    "snakes-ladders": {
        category: "TABLETOP BOARD",
        gradient: "linear-gradient(135deg, #2e1065 0%, #581c87 50%, #7e22ce 100%)",
        bgPattern: "radial-gradient(circle at 50% 50%, rgba(192, 132, 252, 0.3) 0%, transparent 70%), linear-gradient(0deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
        bgPatternSize: "40px 40px",
        tagline: "Climb up, Watch out!",
        elements: ["🎲", "🪜", "🐍", "🏆"]
    },
    "bubble-shooter": {
        category: "BUBBLY PUZZLE",
        gradient: "linear-gradient(135deg, #083344 0%, #0e7490 50%, #0284c7 100%)",
        bgPattern: "radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.4) 0%, transparent 50%), radial-gradient(circle at 75% 70%, rgba(165, 243, 252, 0.3) 0%, transparent 50%)",
        tagline: "Match & Pop Orbs!",
        elements: ["🫧", "🎯", "✨", "🔮"]
    },
    "n-queens": {
        category: "CHESS LAB",
        gradient: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)",
        bgPattern: "radial-gradient(circle at 50% 40%, rgba(251, 191, 36, 0.3) 0%, transparent 70%), repeating-conic-gradient(rgba(255,255,255,0.04) 0% 25%, transparent 0% 50%)",
        bgPatternSize: "48px 48px",
        tagline: "Tactical Crown Placement",
        elements: ["👑", "♟️", "⚔️", "✨"]
    },
    "minesweeper": {
        category: "TREASURE DIG",
        gradient: "linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #991b1b 100%)",
        bgPattern: "radial-gradient(circle at 50% 50%, rgba(248, 113, 113, 0.35) 0%, transparent 65%), linear-gradient(0deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        bgPatternSize: "32px 32px",
        tagline: "Uncover Safe Paths!",
        elements: ["💣", "🚩", "⚠️", "💎"]
    },
    "hangman": {
        category: "WORD QUEST",
        gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
        bgPattern: "radial-gradient(circle at 50% 30%, rgba(148, 163, 184, 0.3) 0%, transparent 70%), repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 16px)",
        tagline: "Guess the Hidden Word!",
        elements: ["🔤", "📝", "💡", "❓"]
    },
    "sudoku": {
        category: "NUMBERS DESK",
        gradient: "linear-gradient(135deg, #172554 0%, #1e40af 50%, #2563eb 100%)",
        bgPattern: "radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.35) 0%, transparent 70%), linear-gradient(0deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
        bgPatternSize: "36px 36px",
        tagline: "Satisfying Logic Grid",
        elements: ["🔢", "✏️", "🧠", "9️⃣"]
    },
    "sliding-puzzle": {
        category: "WOODEN MAZE",
        gradient: "linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #9333ea 100%)",
        bgPattern: "radial-gradient(circle at 50% 40%, rgba(216, 180, 254, 0.3) 0%, transparent 70%), repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 8px, transparent 8px, transparent 24px)",
        tagline: "Arrange the Pieces!",
        elements: ["🧩", "⚙️", "🔄", "⭐"]
    },
    "2048": {
        category: "NUMBER LAB",
        gradient: "linear-gradient(135deg, #713f12 0%, #a16207 50%, #ca8a04 100%)",
        bgPattern: "radial-gradient(circle at 50% 35%, rgba(253, 224, 71, 0.4) 0%, transparent 65%), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 20px, transparent 20px, transparent 40px)",
        tagline: "Merge to Reach 2048!",
        elements: ["⚡", "✨", "🔢", "💥"]
    },
    "space-invaders": {
        category: "RETRO GALAXY",
        gradient: "linear-gradient(135deg, #4c0519 0%, #881337 50%, #e11d48 100%)",
        bgPattern: "radial-gradient(circle at 50% 40%, rgba(251, 113, 133, 0.4) 0%, transparent 70%), radial-gradient(circle at 20% 80%, rgba(244, 63, 94, 0.3) 0%, transparent 40%)",
        tagline: "Defend the Galaxy!",
        elements: ["👾", "🚀", "⭐", "💥"]
    },
    "memory-match": {
        category: "ANIMAL MEMORY",
        gradient: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
        bgPattern: "radial-gradient(circle at 50% 40%, rgba(110, 231, 183, 0.35) 0%, transparent 70%), radial-gradient(circle at 80% 20%, rgba(52, 211, 153, 0.25) 0%, transparent 50%)",
        tagline: "Find All Matching Pairs!",
        elements: ["🐶", "🐱", "💖", "🃏"]
    }
};
function build3DCardDeck() {
    const stack = document.getElementById("deck-cards-stack");
    if (!stack) return;
    stack.innerHTML = "";
    games.forEach((game, idx) => {
        const card = document.createElement("div");
        card.className = "deck-card";
        card.dataset.index = idx;
        const world = GAME_WORLD_DESIGNS[game.id] || {
            category: "ARCADE",
            gradient: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            bgPattern: "none",
            tagline: "Tap to Select",
            elements: ["✨", "🎮", "⭐", "⚡"]
        };
        const patternSizeStyle = world.bgPatternSize ? `background-size: ${world.bgPatternSize};` : '';
        card.innerHTML = `
            <div class="deck-card-inner" style="background: ${world.gradient};">
                <div class="card-world-pattern" style="background-image: ${world.bgPattern}; ${patternSizeStyle}"></div>
                <div class="card-floating-decor">
                    <span class="decor-item decor-1">${world.elements[0]}</span>
                    <span class="decor-item decor-2">${world.elements[1]}</span>
                    <span class="decor-item decor-3">${world.elements[2]}</span>
                    <span class="decor-item decor-4">${world.elements[3]}</span>
                </div>
                <div class="card-badge">${world.category}</div>
                <div class="card-visual-center">
                    <div class="card-emoji-large">${game.emoji}</div>
                    <div class="card-title-on-cover">${game.title}</div>
                </div>
                <div class="card-footer">
                    <span class="card-tagline">${world.tagline}</span>
                    <div class="card-play-icon">▶</div>
                </div>
            </div>
        `;
        const playBtn = card.querySelector(".card-play-icon");
        if (playBtn) {
            playBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                launchGame(idx);
            });
        }
        card.addEventListener("click", () => {
            if (Math.abs(idx - currentIndex) < 0.5) {
                launchGame(idx);
            } else {
                updateActiveGameIndex(idx);
            }
        });
        stack.appendChild(card);
    });
    update3DDeckTransforms();
}
function navigateDeck(direction) {
    if (isScrollingThrottled) return;
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < games.length) {
        isScrollingThrottled = true;
        updateActiveGameIndex(nextIndex);
        setTimeout(() => {
            isScrollingThrottled = false;
        }, 280);
    }
}
function updateActiveGameIndex(newIndex) {
    if (newIndex < 0 || newIndex >= games.length) return;
    currentIndex = newIndex;
    if (window.retroAudio) {
        window.retroAudio.playSFX('slide');
    }
    if (typeof applyFractionalIndex === 'function') {
        applyFractionalIndex(newIndex);
    } else {
        update3DDeckTransforms(newIndex);
        updateEditorialPanel();
        updateProgressNav();
    }
}
function update3DDeckTransforms(fractionalIndex = currentIndex) {
    const cards = document.querySelectorAll(".deck-card");
    const viewportWidth = window.innerWidth;
    const translateYStep = viewportWidth <= 520 ? 115 : (viewportWidth <= 860 ? 140 : 190);
    cards.forEach((card) => {
        const idx = parseInt(card.dataset.index, 10);
        const rel = idx - fractionalIndex;
        const absRel = Math.abs(rel);
        let translateY = rel * translateYStep;
        let translateZ = absRel < 0.3 ? 80 : -130 - (absRel - 1) * 110;
        let scale = Math.max(0.45, 1 - absRel * 0.15);
        let rotateX = -rel * 12;
        let opacity = 1 - absRel * 0.28;
        let filterBlur = absRel > 1.5 ? Math.min(3, (absRel - 1.5) * 2) : 0;
        let zIndex = absRel < 0.3 ? 1000 : Math.round(100 - absRel * 20);
        const curveAmplitude = 55;
        const translateX = curveAmplitude * (rel * rel * 0.18 + absRel * 0.6);
        const rotateY = rel * -3.5;
        if (opacity < 0.05) {
            opacity = 0;
            card.style.pointerEvents = "none";
            card.setAttribute("data-state", "hidden");
        } else {
            card.style.pointerEvents = "auto";
            card.setAttribute("data-state", Math.abs(rel) < 0.3 ? "active" : "inactive");
        }
        card.style.transform = `translateX(${translateX.toFixed(1)}px) translateY(${translateY.toFixed(1)}px) translateZ(${translateZ.toFixed(1)}px) scale(${scale.toFixed(3)}) rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg)`;
        card.style.opacity = Math.max(0, opacity).toFixed(2);
        card.style.zIndex = zIndex;
        card.style.filter = `blur(${filterBlur.toFixed(1)}px)`;
    });
}
function updateEditorialPanel() {
    const game = games[currentIndex];
    if (!game) return;
    const category = GAME_CATEGORIES[game.id] || "GAME COLLECTION";
    const tagEl = document.getElementById("eyebrow-tag");
    const numEl = document.getElementById("eyebrow-num");
    const title1El = document.getElementById("title-line1");
    const title2El = document.getElementById("title-line2");
    const descEl = document.getElementById("editorial-description");
    if (tagEl) tagEl.textContent = `${category} COLLECTION`;
    if (numEl) numEl.textContent = `· ${String(currentIndex + 1).padStart(2, "0")}`;
    const titleWords = game.title.split(" ");
    if (titleWords.length > 1) {
        const mid = Math.ceil(titleWords.length / 2);
        if (title1El) title1El.textContent = titleWords.slice(0, mid).join(" ");
        if (title2El) title2El.textContent = titleWords.slice(mid).join(" ");
    } else {
        if (title1El) title1El.textContent = game.title;
        if (title2El) title2El.textContent = "";
    }
    if (descEl) descEl.textContent = game.desc;
}
function updateProgressNav() {
    const currentEl = document.getElementById("progress-current");
    const totalEl = document.getElementById("progress-total");
    const fillEl = document.getElementById("progress-bar-fill");
    if (currentEl) currentEl.textContent = String(currentIndex + 1).padStart(2, "0");
    if (totalEl) totalEl.textContent = String(games.length).padStart(2, "0");
    if (fillEl) {
        const percentage = ((currentIndex) / (games.length - 1)) * 100;
        fillEl.style.height = `${percentage}%`;
        fillEl.style.width = `${percentage}%`;
    }
}
function launchGame(index) {
    const game = games[index];
    if (!game) return;
    if (window.retroAudio) {
        window.retroAudio.playSFX('click');
    }
    const modal = document.getElementById("game-modal");
    const iframe = document.getElementById("game-iframe");
    const modalTitle = document.getElementById("game-modal-title");
    if (modal && iframe) {
        iframe.src = `games/${game.id}/index.html`;
        if (modalTitle) modalTitle.textContent = `${game.emoji} ${game.title}`;
        modal.classList.add("active");
    }
}
function closeGameModal() {
    const modal = document.getElementById("game-modal");
    const iframe = document.getElementById("game-iframe");
    if (modal) {
        modal.classList.remove("active");
    }
    if (iframe) {
        setTimeout(() => {
            iframe.src = "about:blank";
        }, 350);
    }
}
function startMomoCaptions() {
    const captionEl = document.getElementById("momo-caption");
    if (!captionEl || window.momoCaptionInterval) return;
    let capIdx = 0;
    window.momoCaptionInterval = setInterval(() => {
        capIdx = (capIdx + 1) % CAPTIONS.length;
        captionEl.style.opacity = 0;
        setTimeout(() => {
            captionEl.textContent = CAPTIONS[capIdx];
            captionEl.style.opacity = 1;
        }, 300);
    }, 6000);
}
(function initLaserBackground() {
    const NUM_LASERS = 250;
    const TAIL = 400;
    const canvas = document.getElementById("laser-bg");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let rafId = null;
    let lasers = [];
    function createLasers(n) {
        const arr = [];
        for (let i = 0; i < n; i++) {
            arr.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                s: Math.random() * 2 + 1,
            });
        }
        return arr;
    }
    function renderLaser(l) {
        const grad = ctx.createLinearGradient(l.x, l.y, l.x, l.y + TAIL);
        const a = 1 - ((canvas.height - l.y) / canvas.height) * 0.8;
        grad.addColorStop(0, `hsla(340,100%,100%,${a})`);
        grad.addColorStop(1, "hsla(340,100%,50%,0)");
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x, l.y + TAIL);
        ctx.stroke();
    }
    function updateLaser(l) {
        l.y -= l.s;
        if (l.y < -TAIL) l.y = canvas.height;
    }
    function render() {
        ctx.fillStyle = "hsl(261,43%,7%)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const l of lasers) {
            renderLaser(l);
            updateLaser(l);
        }
        rafId = requestAnimationFrame(render);
    }
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    function startLasers() {
        resizeCanvas();
        lasers = createLasers(NUM_LASERS);
        if (!rafId) render();
    }
    function stopLasers() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }
    window.addEventListener("resize", () => {
        const ds = document.getElementById("discovery-screen");
        if (ds && ds.classList.contains("active")) {
            resizeCanvas();
            lasers.forEach(l => {
                l.x = Math.random() * canvas.width;
                l.y = Math.random() * canvas.height;
            });
        }
    });
    const discoveryScreen = document.getElementById("discovery-screen");
    if (discoveryScreen) {
        const observer = new MutationObserver(() => {
            if (discoveryScreen.classList.contains("active")) {
                startLasers();
            } else {
                stopLasers();
            }
        });
        observer.observe(discoveryScreen, { attributes: true, attributeFilter: ["class"] });
        if (discoveryScreen.classList.contains("active")) startLasers();
    }
})();