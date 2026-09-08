class RetroAudioManager {
    constructor() {
        this.ctx = null;
        this.isBgmMuted = localStorage.getItem("retro-arcade-bgm-mute") === "true";
        this.isSfxMuted = localStorage.getItem("retro-arcade-sfx-mute") === "true";
        const isGameSubFolder = window.location.pathname.includes("/games/");
        const basePath = isGameSubFolder ? "../../" : "./";
        this.bgmAudio = new Audio(basePath + "audio/bgm.mp3");
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = 0.35;
        this.bgmStarted = false;
        this.sfxCache = {
            click: new Audio(basePath + "audio/click.wav"),
            pop: new Audio(basePath + "audio/pop.wav"),
            slide: new Audio(basePath + "audio/slide.wav"),
            win: new Audio(basePath + "audio/win.wav"),
            lose: new Audio(basePath + "audio/lose.wav")
        };
        this.tempo = 110;
        this.noteLength = 60 / this.tempo / 2;
        this.schedulerTimer = null;
        this.nextNoteTime = 0;
        this.currentStep = 0;
        this.melody = [
            67, 71, 74, 76,  0, 74, 72, 71,
            69, 72, 76, 79,  0, 76, 74, 72,
            62, 65, 69, 72,  0, 69, 67, 65,
            67, 71, 74, 77, 79, 74, 71, 67
        ];
        this.bass = [
            48, 48, 48, 48,  45, 45, 45, 45,
            50, 50, 50, 50,  47, 47, 47, 47
        ];
    }
    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
            this.nextNoteTime = this.ctx.currentTime;
        }
        this.updateVisualStates();
    }
    startBGM() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (this.isBgmMuted) return;
        this.bgmAudio.play().then(() => {
            this.bgmStarted = true;
        }).catch(() => {
            if (!this.bgmStarted) {
                this.bgmStarted = true;
                this.scheduler();
            }
        });
    }
    stopBGM() {
        this.bgmAudio.pause();
    }
    toggleBgm() {
        this.isBgmMuted = !this.isBgmMuted;
        localStorage.setItem("retro-arcade-bgm-mute", this.isBgmMuted);
        if (this.isBgmMuted) {
            this.stopBGM();
        } else {
            this.startBGM();
        }
        this.updateVisualStates();
    }
    toggleSfx() {
        this.isSfxMuted = !this.isSfxMuted;
        localStorage.setItem("retro-arcade-sfx-mute", this.isSfxMuted);
        if (!this.isSfxMuted) {
            this.playSFX('click');
        }
        this.updateVisualStates();
    }
    scheduler() {
        if (!this.bgmStarted || this.isBgmMuted) return;
        while (this.ctx && this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.playStep(this.currentStep, this.nextNoteTime);
            this.nextNoteTime += this.noteLength;
            this.currentStep = (this.currentStep + 1) % 32;
        }
        this.schedulerTimer = setTimeout(() => this.scheduler(), 25);
    }
    playStep(step, time) {
        const midiMelody = this.melody[step];
        if (midiMelody > 0) {
            const freq = this.midiToFreq(midiMelody);
            this.playSynthNote(freq, time, 0.05, 'triangle', 0.2);
        }
        if (step % 4 === 0) {
            const bassIndex = Math.floor(step / 2) % this.bass.length;
            const midiBass = this.bass[bassIndex];
            const freq = this.midiToFreq(midiBass);
            this.playSynthNote(freq, time, 0.08, 'sine', 0.4);
        }
    }
    playSynthNote(freq, time, volume, type = 'triangle', duration = 0.2) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
    }
    midiToFreq(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }
    playSFX(type) {
        if (this.isSfxMuted) return;
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        const avatar = document.getElementById("momo-header-avatar");
        if (avatar) {
            avatar.className = "momo-header-avatar";
            void avatar.offsetWidth;
            if (['win', 'pop', 'flip', 'click'].includes(type)) {
                avatar.classList.add("react-happy");
            } else if (type === 'lose') {
                avatar.classList.add("react-sad");
            }
            setTimeout(() => { avatar.className = "momo-header-avatar"; }, 1500);
        }
        const sfxAudio = this.sfxCache[type];
        if (sfxAudio) {
            try {
                const clone = sfxAudio.cloneNode();
                clone.volume = 0.6;
                clone.play().catch(() => this.playSynthSFX(type));
                return;
            } catch (e) {}
        }
        this.playSynthSFX(type);
    }
    playSynthSFX(type) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        switch (type) {
            case 'click': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.06);
                break;
            }
            case 'slide': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.16);
                break;
            }
            case 'pop': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            }
            case 'win': {
                const scale = [52, 56, 59, 64, 68, 71, 76];
                scale.forEach((note, idx) => {
                    this.playSynthNote(this.midiToFreq(note), now + idx * 0.08, 0.06, 'triangle', 0.18);
                });
                break;
            }
            case 'lose': {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.linearRampToValueAtTime(110, now + 0.4);
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            }
        }
    }
    updateVisualStates() {
        const bgmButtons = document.querySelectorAll(".btn-music-toggle");
        bgmButtons.forEach(btn => {
            if (this.isBgmMuted) {
                btn.innerHTML = "🔇 Music: Off";
                btn.classList.add("audio-muted");
            } else {
                btn.innerHTML = "♪ Music: On";
                btn.classList.remove("audio-muted");
            }
        });
        const sfxButtons = document.querySelectorAll(".btn-sfx-toggle");
        sfxButtons.forEach(btn => {
            if (this.isSfxMuted) {
                btn.innerHTML = "🔇 Sounds: Off";
                btn.classList.add("audio-muted");
            } else {
                btn.innerHTML = "🔊 Sounds: On";
                btn.classList.remove("audio-muted");
            }
        });
    }
    replaceAudioButtons() {
        const buttons = document.querySelectorAll(".btn-audio-toggle");
        buttons.forEach(btn => {
            const container = btn.parentNode;
            if (!container) return;
            const musicBtn = document.createElement("button");
            musicBtn.className = "btn btn-secondary btn-music-toggle";
            if (btn.getAttribute("style")) {
                musicBtn.setAttribute("style", btn.getAttribute("style"));
            }
            const sfxBtn = document.createElement("button");
            sfxBtn.className = "btn btn-secondary btn-sfx-toggle";
            if (btn.getAttribute("style")) {
                sfxBtn.setAttribute("style", btn.getAttribute("style"));
            }
            sfxBtn.style.marginLeft = "0.5rem";
            container.insertBefore(musicBtn, btn);
            container.insertBefore(sfxBtn, btn);
            btn.remove();
        });
        this.updateVisualStates();
    }
    setupGlobalToggle() {
        const startAudioOnUserGesture = () => {
            if (!this.isBgmMuted && (!this.ctx || this.ctx.state !== 'running' || !this.bgmStarted)) {
                this.startBGM();
            }
        };
        ['pointerdown', 'keydown', 'touchstart', 'click'].forEach(evt => {
            window.addEventListener(evt, startAudioOnUserGesture, { capture: true, passive: true });
        });
        document.addEventListener("click", (e) => {
            if (e.target.closest(".btn-music-toggle")) {
                this.toggleBgm();
            }
            if (e.target.closest(".btn-sfx-toggle")) {
                this.toggleSfx();
            }
        });
    }
}
window.retroAudio = new RetroAudioManager();
window.retroAudio.setupGlobalToggle();
document.addEventListener("DOMContentLoaded", () => {
    window.retroAudio.replaceAudioButtons();
    const isGamePage = window.location.pathname.includes("/games/");
    if (isGamePage) {
        const starfield = document.createElement("div");
        starfield.className = "starfield";
        starfield.style.opacity = "0.4";
        document.body.appendChild(starfield);
        const starCount = 20;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement("div");
            star.className = "star";
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 4}s`;
            star.style.animationDuration = `${2 + Math.random() * 3}s`;
            starfield.appendChild(star);
        }
        const header = document.querySelector(".game-header");
        if (header) {
            const backBtn = header.querySelector(".back-btn") || header.querySelector(".back-btn-link") || header.querySelector("a");
            if (backBtn) {
                backBtn.innerHTML = "⬅ Back to Golden Hour";
                backBtn.className = "back-btn";
                backBtn.href = "../../index.html";
                backBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    localStorage.setItem("show-dashboard", "true");
                    window.location.href = backBtn.href;
                });
            }
            const momoAvatar = document.createElement("div");
            momoAvatar.className = "momo-header-avatar";
            momoAvatar.id = "momo-header-avatar";
            momoAvatar.innerHTML = `
                <div class="momo-avatar-ear left"></div>
                <div class="momo-avatar-ear right"></div>
                <div class="momo-avatar-head">
                    <div class="momo-avatar-eyes">
                        <span class="eye"></span>
                        <span class="eye"></span>
                    </div>
                    <div class="momo-avatar-blush">
                        <span class="blush"></span>
                        <span class="blush"></span>
                    </div>
                </div>
            `;
            header.appendChild(momoAvatar);
        }
    } else {
        if (localStorage.getItem("show-dashboard") === "true") {
            localStorage.removeItem("show-dashboard");
            const landing = document.getElementById("landing-screen");
            const discovery = document.getElementById("discovery-screen");
            if (landing && discovery) {
                landing.classList.remove("active");
                discovery.classList.add("active");
                if (typeof renderActiveGame === "function") {
                    renderActiveGame("none");
                }
                if (typeof startMomoCaptions === "function") {
                    startMomoCaptions();
                }
            }
        }
    }
});