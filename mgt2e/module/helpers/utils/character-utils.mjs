import {calculateSpacecraftCost} from "../spacecraft/spacecraft-utils.mjs";
import {MGT2} from "../config.mjs";

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
    if (actor.type === "spacecraft") {
        await calculateSpacecraftCost(actor);
    }
}

export function copySkills(actorData) {
    const BASE_SKILLS = MGT2.getDefaultSkills();
    if ([ "traveller", "npc", "package", "creature" ].includes(actorData.type)) {
        // Need to add skills.
        if (!actorData.system.skills) {
            actorData.system.skills = {};
        }
        for (let s in BASE_SKILLS) {
            if (actorData.system.skills[s]) {
                continue;
            }
            actorData.system.skills[s] = JSON.parse(
                JSON.stringify(BASE_SKILLS[s])
            )
            actorData.system.skills[s].id = s;
            actorData.system.skills[s].value = 0;
            if (actorData.system.skills[s].specialities) {
                for (let sp in actorData.system.skills[s].specialities) {
                    actorData.system.skills[s].specialities[sp].id = sp;
                    actorData.system.skills[s].specialities[sp].value = 0;
                }
            }
            if (!actorData.system.skills[s].icon) {
                actorData.system.skills[s].icon = `systems/mgt2e/icons/skills/${s}.svg`;
            }
        }
    }
}

export async function rollUPP(actorData, options) {
    let upp = actorData.system.characteristics;

    if (!options) {
        options = {};
    }

    if (upp) {
        let html = `<div class="chat-package">`;
        html += `<p><b>${actorData.name}</b></p>`;
        html += `<div class="stats grid grid-3col">`;

        let prefix = options.shift ? "~" : "";
        for (let c in upp) {
            if (upp[c].show) {
                let dice = "2D6";
                if (options.ctrl) {
                    let roll = await new Roll("2D6", null).evaluate();
                    let modifier = 0;
                    switch (roll.total) {
                        case 2:
                            modifier = -2;
                            break;
                        case 3:
                        case 4:
                            modifier = -1;
                            break;
                        case 10:
                        case 11:
                            modifier = +1;
                            break;
                        case 12:
                            modifier = +2;
                            break;
                    }
                    upp[c].value += modifier;
                    html += `<div class="stat resource"><span class="stat-hdr">${c}</span><span class="stat-val">+/-<br/>${(modifier >= 0) ? ("+" + modifier) : modifier}</span></div>`;
                } else {
                    if (upp[c].roll) {
                        dice = upp[c].roll;
                    }
                    if (options.shift) {
                        let totals = [];
                        for (let i = 0; i < 5; i++) {
                            let roll = await new Roll(dice, null).evaluate();
                            totals.push(roll.total);
                        }
                        totals = totals.sort(function (a, b) {
                            return a - b;
                        });
                        upp[c].value = totals[2];
                    } else {
                        let roll = await new Roll(dice, null).evaluate();
                        upp[c].value = roll.total;
                    }
                    html += `<div class="stat resource"><span class="stat-hdr">${c}</span><span class="stat-val">${prefix}${dice}<br/>${upp[c].value}</span></div>`;
                }
            }
        }
        return html;
    }
    return null;
}
