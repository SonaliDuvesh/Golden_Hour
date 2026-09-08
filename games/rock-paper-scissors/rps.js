const CHOICES = ["rock", "paper", "scissor"];
const EMOJI = {
    "rock": "🪨",
    "paper": "🗒️",
    "scissor": "✂️"
};
const OUTCOMES = {
    "rock,rock": "tie",
    "rock,paper": "lose",
    "rock,scissor": "win",
    "paper,rock": "win",
    "paper,paper": "tie",
    "paper,scissor": "lose",
    "scissor,rock": "lose",
    "scissor,paper": "win",
    "scissor,scissor": "tie"
};
const PRINT_RESULTS = {
    "win": "✨ You win! The crowd cheers for your clever choice.",
    "lose": "💥 You lose this round. The computer had the upper hand.",
    "tie": "🤝 It's a tie. Fate could not decide today."
};
let scores = {
    wins: 0,
    losses: 0,
    ties: 0
};
const winsVal = document.getElementById("wins-val");
const lossesVal = document.getElementById("losses-val");
const tiesVal = document.getElementById("ties-val");
const resultLabel = document.getElementById("result-label");
const computerLabel = document.getElementById("computer-label");
function formatChoice(choice) {
    return `${EMOJI[choice]} ${choice.charAt(0).toUpperCase() + choice.slice(1)}`;
}
function playRound(userChoice) {
    const computerChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    const key = `${userChoice},${computerChoice}`;
    const outcome = OUTCOMES[key];
    const resultText = PRINT_RESULTS[outcome];
    if (window.retroAudio) {
        if (outcome === "win") {
            window.retroAudio.playSFX('win');
        } else if (outcome === "lose") {
            window.retroAudio.playSFX('lose');
        } else {
            window.retroAudio.playSFX('pop');
        }
    }
    if (outcome === "win") scores.wins++;
    else if (outcome === "lose") scores.losses++;
    else scores.ties++;
    winsVal.textContent = scores.wins;
    lossesVal.textContent = scores.losses;
    tiesVal.textContent = scores.ties;
    computerLabel.textContent = `Computer chose: ${formatChoice(computerChoice)}`;
    resultLabel.textContent = `You chose: ${formatChoice(userChoice)}\n${resultText}`;
}
document.getElementById("btn-rock").addEventListener("click", () => playRound("rock"));
document.getElementById("btn-paper").addEventListener("click", () => playRound("paper"));
document.getElementById("btn-scissor").addEventListener("click", () => playRound("scissor"));
document.getElementById("btn-reset").addEventListener("click", () => {
    if (window.retroAudio) {
        window.retroAudio.playSFX('click');
    }
    scores = { wins: 0, losses: 0, ties: 0 };
    winsVal.textContent = 0;
    lossesVal.textContent = 0;
    tiesVal.textContent = 0;
    resultLabel.textContent = "Ready when you are!";
    computerLabel.textContent = "Computer is waiting...";
});