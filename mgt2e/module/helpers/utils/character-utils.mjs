import {calculateSpacecraftCost} from "../spacecraft/spacecraft-utils.mjs";

async function getPowerOrInfluence() {
    const roll = await new Roll("2D6", null).evaluate();
    switch (roll.total) {
        case 2: case 3: case 4: case 5:
            return 0;
        case 6: case 7:
            return 1;
        case 8:
            return 2;
        case 9:
            return 3;
        case 10:
            return 4;
        case 11:
            return 5;
        case 12:
            return 6;
    }
    return 0;
}

function getAffinity(affinity) {
    if (affinity <= 2) {
        return 0;
    } else if (affinity <= 4) {
        return 1;
    } else if (affinity <= 6) {
        return 2;
    } else if (affinity <= 8) {
        return 3;
    } else if (affinity <= 10) {
        return 4;
    } else if (affinity === 11) {
        return 5;
    } else {
        return 6;
    }
}

export async function randomiseAssociate(item) {
    if (!item || item.type !== "associate") {
        return;
    }

    let associate = item.system.associate;
    let affinityDice = "", enmityDice = "";

    if (associate.relationship === "contact") {
        affinityDice = "1d6+1";
        enmityDice = "1d6-1";
    } else if (associate.relationship === "ally") {
        affinityDice = "2d6";
        enmityDice = "0";
    } else if (associate.relationship === "rival") {
        affinityDice = "1d6-1";
        enmityDice = "1d6+1";
    } else if (associate.relationship === "enemy") {
        affinityDice = "0";
        enmityDice = "2d6";
    } else {
        return "";
    }
    console.log(associate.relationship);
    console.log(affinityDice);
    console.log(enmityDice);
    let roll = await new Roll(affinityDice, null).evaluate();
    associate.affinity = getAffinity(roll.total);
    roll = await new Roll(enmityDice, null).evaluate();
    associate.enmity = 0 - getAffinity(roll.total);
    console.log(associate.affinity);
    console.log(associate.enmity);

    associate.power = await getPowerOrInfluence();
    associate.influence = await getPowerOrInfluence();

    let description = "";
    if (associate.affinity > 0) {
        description += game.i18n.localize("MGT2.History.Degree.Affinity." + associate.affinity);
        description += ". ";
    }
    if (associate.enmity < 0) {
        description += game.i18n.localize("MGT2.History.Degree.Enmity." + (0 - associate.enmity));
        description += ". ";
    }
    if (associate.power > 0) {
        description += game.i18n.localize("MGT2.History.Degree.Power." + associate.power);
        description += ". ";
    }
    if (associate.influence > 0) {
        description += game.i18n.localize("MGT2.History.Degree.Influence." + associate.influence);
        description += ". ";
    }
    if (!item.system.description) {
        // Only set this the first time.
        item.system.description = description;
    }
}

export async function calculateCost(actor) {
    console.log("calculateCost:");
    if (actor.type === "spacecraft") {
        await calculateSpacecraftCost(actor);
    }
}
