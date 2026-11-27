
const MAX_HAND = 19;
const MAX_PLAY = 19;
const BOT_DELAY = 250;

let roundNumber = 1;
let initialHandSize = 0;

let selectedCards = [];
let playerHand = [];
let opponentHand = [];

let tableCards = [];
let tablePower = 0;

let currentTurn = "player";
let lastPlayedBy = null;
let gameOver = true;
let botTimer = null;


// ==============================
// SHUFFLE & DEAL
// ==============================

function shuffleDeck(deck) {

    const shuffled = [...deck];

    for (let i = shuffled.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] =
        [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

function dealCards() {

    const deck = shuffleDeck(cards);

    const handSize = Math.min(
        MAX_HAND,
        Math.floor(deck.length / 2)
    );

    playerHand = deck.slice(0, handSize);

    opponentHand = deck.slice(
        handSize,
        handSize * 2
    );
}


// ==============================
// START GAME
// ==============================

function startGame() {

    clearTimeout(botTimer);

    document.getElementById("result-screen").hidden = true;

    document.querySelector(".main-menu").style.display = "none";

    document.getElementById("game-board").hidden = false;

    document.getElementById("table-combo")
        .classList.remove("combo-effect");

    selectedCards = [];
    tableCards = [];
    tablePower = 0;

    lastPlayedBy = null;
    gameOver = false;

    roundNumber = 1;

    dealCards();

    initialHandSize = playerHand.length;

    currentTurn = Math.random() < 0.5
        ? "player"
        : "bot";

    renderPlayerHand();
    renderOpponentHand();
    renderTable();

    beginTurn();
}


// ==============================
// EXIT GAME
// ==============================

function exitGame() {

    clearTimeout(botTimer);

    gameOver = true;

    document.getElementById("result-screen").hidden = true;

    document.getElementById("game-board").hidden = true;

    document.querySelector(".main-menu").style.display = "";
}


// ==============================
// STATUS
// ==============================

function setStatus(message) {

    document.getElementById("game-status").textContent =
        message;
}


// ==============================
// TURN SYSTEM
// ==============================

function beginTurn() {

    clearTimeout(botTimer);

    if (gameOver) return;

    updateButtons();
    updateBattleUI();

    if (currentTurn === "player") {

        setStatus("Your Turn | Table Power: " + tablePower);

    } else {

        setStatus("Bot is thinking...");

        botTimer = setTimeout(botPlay, BOT_DELAY);
    }
}

function switchTurn() {

    currentTurn = currentTurn === "player"
        ? "bot"
        : "player";

    beginTurn();
}

function updateButtons() {

    document.getElementById("play-button").disabled =
        gameOver || currentTurn !== "player";

    document.getElementById("pass-button").disabled =
        gameOver ||
        currentTurn !== "player" ||
        tableCards.length === 0;
}


// ==============================
// RENDER PLAYER HAND
// ==============================

function renderPlayerHand() {

    const hand = document.getElementById("player-hand");

    hand.innerHTML = "";

    playerHand.forEach(card => {

        const container = document.createElement("div");

        container.className = "hand-card-container";

        const img = document.createElement("img");

        img.src = card.image;
        img.alt = card.name;
        img.className = "hand-card";

        if (selectedCards.includes(card)) {

            img.classList.add("selected");
        }

        img.onclick = () => selectCard(card, img);

        const power = document.createElement("div");

        power.className = "card-power";

        power.textContent = "Power: " + card.power;

        container.appendChild(img);
        container.appendChild(power);

        hand.appendChild(container);
    });
}


// ==============================
// RENDER OPPONENT HAND
// ==============================

function renderOpponentHand() {

    const hand = document.getElementById("opponent-hand");

    hand.innerHTML = "";

    opponentHand.forEach(() => {

        const back = document.createElement("div");

        back.className = "opponent-card";

        back.textContent = "?";

        hand.appendChild(back);
    });
}


// ==============================
// RENDER TABLE
// ==============================

function renderTable() {

    const area = document.getElementById("played-cards");

    area.innerHTML = "";

    tableCards.forEach(card => {

        const img = document.createElement("img");

        img.src = card.image;
        img.alt = card.name;
        img.className = "hand-card";

        area.appendChild(img);
    });
}


// ==============================
// SELECT CARDS
// ==============================

function selectCard(card, img) {

    if (gameOver || currentTurn !== "player") {
        return;
    }

    if (selectedCards.includes(card)) {

        selectedCards = selectedCards.filter(
            c => c !== card
        );

        img.classList.remove("selected");

    } else {

        if (selectedCards.length >= MAX_PLAY) {
            return;
        }

        selectedCards.push(card);

        img.classList.add("selected");
    }

    updatePower();
}


// ==============================
// VALIDATE COMBINATION
// ==============================

function isValidCombo(chosen) {

    if (chosen.length === 0) {
        return false;
    }

    // Prevent duplicate cards

    const ids = chosen.map(card => card.id);

    if (new Set(ids).size !== ids.length) {
        return false;
    }

    // Block Normal Pair

    if (chosen.length === 2) {

        const relation = relationships.find(r =>
            r.cards.includes(chosen[0].id) &&
            r.cards.includes(chosen[1].id)
        );

        if (!relation) {
            return false;
        }
    }

    const result = calculateCombo(chosen);

    return result.valid !== false;
}


// ==============================
// VALIDATE MOVE
// ==============================

function getMoveType(chosen) {

    if (
        chosen.length === 0 ||
        chosen.length > MAX_PLAY
    ) {
        return null;
    }

    // Relationship Counter
    // Solo -> Pair -> Trio -> Squad

    if (
        tableCards.length > 0 &&
        canExtendCombo(tableCards, chosen)
    ) {

        const combined = [
            ...tableCards,
            ...chosen
        ];

        if (
            combined.length <= MAX_PLAY &&
            isValidCombo(combined)
        ) {

            return "extension";
        }
    }

    // Block invalid combinations

    if (!isValidCombo(chosen)) {
        return null;
    }

    // Opening move

    if (tableCards.length === 0) {
        return "normal";
    }

    const result = calculateCombo(chosen);

    // Normal Power Counter

    if (
        chosen.length === tableCards.length &&
        result.totalPower > tablePower
    ) {

        return "normal";
    }

    return null;
}


// ==============================
// UPDATE POWER PREVIEW
// ==============================

function updatePower() {

    if (selectedCards.length === 0) {

        setStatus(
            "Your Turn | Table Power: " + tablePower
        );

        return;
    }

    const moveType = getMoveType(selectedCards);

    const previewCards = moveType === "extension"
        ? [...tableCards, ...selectedCards]
        : selectedCards;

    const result = calculateCombo(previewCards);

    const invalidPair =
        previewCards.length === 2 &&
        !isValidCombo(previewCards);

    let message =
        "Selected: " + selectedCards.length +
        " | Combo: " +
        (invalidPair ? "Invalid Pair" : result.combo) +
        " | Bonus: +" + result.bonus +
        " | Power: " + result.totalPower;

    if (moveType === "extension") {

        message += " | RELATIONSHIP COUNTER!";
    }

    if (moveType === null) {

        message += " | Invalid Move";
    }

    setStatus(message);
}


// ==============================
// PLAYER PLAY
// ==============================

function playCards() {

    if (gameOver || currentTurn !== "player") {
        return;
    }

    if (selectedCards.length === 0) {

        alert("Please select cards!");

        return;
    }

    const moveType = getMoveType(selectedCards);

    if (!moveType) {

        if (
            selectedCards.length === 2 &&
            !isValidCombo(selectedCards)
        ) {

            alert(
                "Invalid Pair! These cards have no Relationship."
            );

        } else {

            alert(
                "Invalid move! Match the card count " +
                "and beat the Power, or extend a Relationship Combo."
            );
        }

        return;
    }

    executeMove(
        "player",
        [...selectedCards],
        moveType
    );
}


// ==============================
// EXECUTE MOVE
// ==============================

function executeMove(side, chosen, moveType) {

    if (gameOver || currentTurn !== side) {
        return;
    }

    const hand = side === "player"
        ? playerHand
        : opponentHand;

    if (!chosen.every(card => hand.includes(card))) {
        return;
    }

    const actualMoveType = getMoveType(chosen);

    if (!actualMoveType) {
        return;
    }

    moveType = actualMoveType;

    if (moveType === "extension") {

        tableCards = [
            ...tableCards,
            ...chosen
        ];

    } else {

        tableCards = [...chosen];
    }

    const result = calculateCombo(tableCards);

    tablePower = result.totalPower;

    lastPlayedBy = side;

    if (side === "player") {

        playerHand = playerHand.filter(
            card => !chosen.includes(card)
        );

    } else {

        opponentHand = opponentHand.filter(
            card => !chosen.includes(card)
        );
    }

    selectedCards = [];

    renderPlayerHand();
    renderOpponentHand();
    renderTable();

    updateBattleUI();

    playComboEffect(moveType);

    if (checkWinner()) {
        return;
    }

    switchTurn();
}


// ==============================
// PASS SYSTEM
// ==============================

function passTurn() {

    if (gameOver || currentTurn !== "player") {
        return;
    }

    if (tableCards.length === 0) {

        alert("You must open the round!");

        return;
    }

    executePass("player");
}

function executePass(side) {

    if (gameOver || currentTurn !== side) {
        return;
    }

    const nextLeader = lastPlayedBy ||
        (side === "player" ? "bot" : "player");

    tableCards = [];
    tablePower = 0;
    selectedCards = [];

    lastPlayedBy = null;

    roundNumber++;

    renderTable();
    renderPlayerHand();

    document.getElementById("table-combo")
        .classList.remove("combo-effect");

    currentTurn = nextLeader;

    beginTurn();
}


// ==============================
// BOT AI
// ==============================

function botPlay() {

    if (gameOver || currentTurn !== "bot") {
        return;
    }

    if (opponentHand.length === 0) {

        checkWinner();

        return;
    }

    const sorted = [...opponentHand].sort(
        (a, b) => a.power - b.power
    );

    // Open a new round

    if (tableCards.length === 0) {

        executeMove(
            "bot",
            [sorted[0]],
            "normal"
        );

        return;
    }

    // Priority 1: Relationship Counter

    for (const card of sorted) {

        if (getMoveType([card]) === "extension") {

            executeMove(
                "bot",
                [card],
                "extension"
            );

            return;
        }
    }

    // Priority 2: Power Counter

    const count = tableCards.length;

    if (sorted.length >= count) {

        const bestMove = findBestCounter(
            sorted,
            count
        );

        if (bestMove) {

            executeMove(
                "bot",
                bestMove,
                getMoveType(bestMove)
            );

            return;
        }
    }

    // Priority 3: Pass

    console.log("Bot has no valid move. Passing...");
executePass("bot");
}


// ==============================
// OPTIMIZED BOT COUNTER
// ==============================

function findBestCounter(hand, count) {

    if (
        count <= 0 ||
        hand.length < count
    ) {

        return null;
    }

    const sorted = [...hand].sort(
        (a, b) => a.power - b.power
    );

    // ==========================
    // SOLO COUNTER
    // ==========================

    if (count === 1) {

        const card = sorted.find(card =>
            getMoveType([card]) === "normal"
        );

        return card ? [card] : null;
    }

    // ==========================
    // RELATIONSHIP PAIR COUNTER
    // ==========================

    if (count === 2) {

        let bestMove = null;
        let bestPower = Infinity;

        const handMap = new Map(
            hand.map(card => [card.id, card])
        );

        for (const relation of relationships) {

            const first = handMap.get(
                relation.cards[0]
            );

            const second = handMap.get(
                relation.cards[1]
            );

            if (!first || !second) {
                continue;
            }

            const pair = [first, second];

            if (!getMoveType(pair)) {
                continue;
            }

            const result = calculateCombo(pair);

            if (
                result.totalPower > tablePower &&
                result.totalPower < bestPower
            ) {

                bestPower = result.totalPower;

                bestMove = pair;
            }
        }

        return bestMove;
    }

    // ==========================
    // TRIPLE, SQUAD & GROUP
    // ==========================

    for (
        let i = 0;
        i <= sorted.length - count;
        i++
    ) {

        const chosen = sorted.slice(
            i,
            i + count
        );

        if (getMoveType(chosen)) {

            return chosen;
        }
    }

    return null;
}


// ==============================
// CHECK WINNER
// ==============================

function checkWinner() {

    if (playerHand.length === 0) {

        endGame("player");

        return true;
    }

    if (opponentHand.length === 0) {

        endGame("bot");

        return true;
    }

    return false;
}


// ==============================
// VICTORY & DEFEAT
// ==============================

function endGame(winner) {

    gameOver = true;

    clearTimeout(botTimer);

    updateButtons();
    updateBattleUI();

    const won = winner === "player";

    const title =
        document.getElementById("result-title");

    title.textContent = won
        ? "🏆 VICTORY!"
        : "DEFEAT!";

    title.style.color = won
        ? "#b58a23"
        : "#a46767";

    document.getElementById(
        "result-description"
    ).textContent = won
        ? "You won the game!"
        : "The opponent won the game!";

    document.getElementById(
        "result-screen"
    ).hidden = false;
}


// ==============================
// CARD COLLECTION
// ==============================

function openCollection() {

    document.querySelector(
        ".main-menu"
    ).style.display = "none";

    document.getElementById(
        "collection"
    ).hidden = false;

    showCards();
}

function closeCollection() {

    document.getElementById(
        "collection"
    ).hidden = true;

    document.querySelector(
        ".main-menu"
    ).style.display = "";
}

function showCards() {

    const list = document.getElementById("card-list");

    list.innerHTML = "";

    cards.forEach(card => {

        const container =
            document.createElement("div");

        container.className = "game-card";

        const img = document.createElement("img");

        img.src = card.image;
        img.alt = card.name;

        const name = document.createElement("h3");

        name.textContent = card.name;

        const power = document.createElement("p");

        power.textContent = "Power: " + card.power;

        container.appendChild(img);
        container.appendChild(name);
        container.appendChild(power);

        list.appendChild(container);
    });
}


// ==============================
// BATTLE UI
// ==============================

function updateBattleUI() {

    // Player Card Counter

    document.getElementById(
        "player-count"
    ).textContent =
        "Cards remaining: " +
        playerHand.length +
        "/" +
        initialHandSize;

    // Opponent Card Counter

    document.getElementById(
        "opponent-count"
    ).textContent =
        "Cards remaining: " +
        opponentHand.length +
        "/" +
        initialHandSize;

    // Round Number

    document.getElementById(
        "round-number"
    ).textContent =
        "ROUND " +
        String(roundNumber).padStart(2, "0");

    // Table Information

    const result = tableCards.length > 0
        ? calculateCombo(tableCards)
        : {
            combo: "No Combo",
            totalPower: 0,
            bonus: 0
        };

    document.getElementById(
        "table-combo"
    ).textContent =
        result.combo.toUpperCase();

    document.getElementById(
        "table-power"
    ).textContent =
        result.totalPower + " POWER";

    document.getElementById(
        "table-bonus"
    ).textContent =
        "+" + result.bonus + " Combo Bonus";

    // Turn Indicator

    const indicator = document.getElementById(
        "turn-indicator"
    );

    if (gameOver) {

        indicator.textContent = "GAME OVER";

        indicator.className = "finished-turn";

    } else if (currentTurn === "player") {

        indicator.textContent = "YOUR TURN";

        indicator.className = "player-turn";

    } else {

        indicator.textContent = "OPPONENT'S TURN";

        indicator.className = "bot-turn";
    }
}


// ==============================
// RELATIONSHIP COMBO ANIMATION
// ==============================

function playComboEffect(moveType) {

    const combo = document.getElementById(
        "table-combo"
    );

    combo.classList.remove("combo-effect");

    if (moveType === "extension") {

        void combo.offsetWidth;

        combo.classList.add("combo-effect");
    }
}
