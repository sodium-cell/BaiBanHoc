
const relationships = [
    // BEST FRIENDS
    { cards: [1, 3], type: "bestfriends" },
    { cards: [1, 4], type: "bestfriends" },
    { cards: [2, 18], type: "bestfriends" },
    { cards: [3, 4], type: "bestfriends" },
    { cards: [5, 6], type: "bestfriends" },
    { cards: [7, 17], type: "bestfriends" },
    { cards: [7, 14], type: "bestfriends" },
    { cards: [11, 16], type: "bestfriends" },
    { cards: [12, 10], type: "bestfriends" },
    { cards: [14, 17], type: "bestfriends" },

    // RIVALS
    { cards: [1, 10], type: "rivals" },
    { cards: [9, 10], type: "rivals" }
];

const relationshipBonus = {
    bestfriends: 2,
    situationship: 3,
    rivals: 4,
    love: 5
};

const relationshipNames = {
    bestfriends: "Best Friends",
    situationship: "Situationship",
    rivals: "Rivals / Enemies",
    love: "Love"
};


function calculateCombo(selected) {

    const count = selected.length;

    let bonus = 0;
    let combo = "No Combo";
    let valid = true;

    if (count === 1) {

        combo = "Solo";

    } else if (count === 2) {

        const relation = relationships.find(r =>
            r.cards.includes(selected[0].id) &&
            r.cards.includes(selected[1].id)
        );

        if (relation) {

            bonus = relationshipBonus[relation.type];
            combo = relationshipNames[relation.type];

        } else {

            combo = "Invalid Pair";
            valid = false;
        }

    } else if (count >= 3) {

        bonus = count + 3;

        if (count === 3) {
            combo = "Triple";
        } else if (count === 4) {
            combo = "Squad";
        } else {
            combo = "Group (" + count + ")";
        }
    }

    const basePower = selected.reduce(
        (total, card) => total + card.power,
        0
    );

    return {
        valid,
        combo,
        bonus,
        basePower: Number(basePower.toFixed(1)),
        totalPower: Number((basePower + bonus).toFixed(1))
    };
}


function canExtendCombo(tableCards, newCards) {
    if (tableCards.length === 0 || newCards.length === 0) {
        return false;
    }

    const combined = [...tableCards, ...newCards];
    const ids = combined.map(card => card.id);

    if (combined.length > 19) {
        return false;
    }

    if (new Set(ids).size !== ids.length) {
        return false;
    }

    // Solo -> Pair
    if (combined.length === 2) {
        return relationships.some(relation =>
            relation.cards.includes(ids[0]) &&
            relation.cards.includes(ids[1])
        );
    }

    // Pair -> Trio -> Squad -> Group
    return specialGroups.some(group =>
        ids.every(id => group.cards.includes(id))
    );
}