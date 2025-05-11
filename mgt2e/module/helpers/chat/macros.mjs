/**
 * Built in macros
 */
import {rollAttack, skillLabel} from "../dice-rolls.mjs";
import {randomiseAssociate} from "../utils/character-utils.mjs";
import {Tools} from "./tools.mjs";


export const MgT2eMacros = {};

// Add a skill to a character sheet.
// If the level is specified, skill is set to this level if higher.
// If a level is not specified, then the skill is incremened by 1.
MgT2eMacros.skillGain = function(args) {
    let skillId = args.skill;
    let specId = null;
    let level = args.level;
    let context = args.text;

    if (!skillId || args.cha) {
        MgT2eMacros.chaGain(args);
        return;
    }

    if (skillId.indexOf(".") > -1) {
        skillId = args.skill.split(".")[0];
        specId = args.skill.split(".")[1];
    }
    if (level !== undefined) {
        level = Number(level);
    }

    for (let actor of Tools.getSelectedOwned()) {
        let skill = actor.system.skills[skillId];
        let text = "";
        let skillName = actor.getSkillLabel(args.skill, false);

        if (!skill.trained) {
            skill.trained = true;
            text += `<b>${skillName}</b> is now trained.<br/>`;
        }
        if (level !== undefined && level === 0) {
            // Level set to zero, nothing else to do.
        } else {
            if (skill.specialities) {
                if (specId) {
                    if (skill.specialities[specId]) {
                        let current = Number(skill.specialities[specId].value);
                        if (level === undefined && current < 4) {
                            skill.specialities[specId].value = current + 1;
                            text += `Incrementing <b>${skillName}</b> to ${current + 1}.`;
                        } else if (level > current) {
                            skill.specialities[specId].value = level;
                            text += `Setting <b>${skillName}</b> to ${level}.`;
                        } else {
                            text += `<b>${skillName}</b> is unchanged.`;
                        }
                    }
                } else {
                    // Player has to select which speciality to raise.
                    // Put the choice into the chat.
                    text += `Select a speciality to train:<br/>`;
                    for (let s in skill.specialities) {
                        let spec = skillId + "." + s;
                        let specName = actor.getSkillLabel(spec, false);
                        let current = Number(skill.specialities[s].value);

                        if ((level === undefined || level > current) && current < 4) {
                            text += `<span class="skillGain-spec" data-actorId="${actor._id}" data-skill="${spec}" data-level="${level}">${specName} ${current}</span><br/>`;
                        }
                    }
                }
            } else if (level === undefined && skill.value < 4) {
                skill.value += 1;
                text += `Incrementing <b>${skillName}</b> to ${skill.value}.`;
            } else if (level > skill.value) {
                skill.value = level;
                text += `Setting <b>${skillName}</b> to ${level}.`;
            } else {
                text += `<b>${skillName}</b> is unchanged.`;
            }
        }
        actor.update({"system.skills": actor.system.skills});

        let html = `<div class="chat-package"><h3>${actor.name}</h3>`;
        if (context) {
            html += `<p>${context}</p>`;
        }
        html += `<p>${text}</p>`;
        html += `</div>`;

        let chatData = {
            speaker: ChatMessage.getSpeaker({actor: actor}),
            content: html
        };
        ChatMessage.create(chatData, {});
    }
};

MgT2eMacros.cash = function(args) {
    let cash = args.cash;
    let pension = args.pension;
    let medical = args.medical;
    let context = args.text;

    for (let actor of Tools.getSelectedOwned()) {
        let text = "";

        if (actor.system.finance) {
            let finance = actor.system.finance;

            if (cash) {
                finance.cash = Number(finance.cash) + Number(cash);
                finance.cash = Math.max(0, finance.cash);
                text += `Gain Cr${cash} to a total of Cr${finance.cash}.`;
            }
            if (pension) {
                finance.pension = Number(finance.pension) + Number(pension);
                finance.pension = Math.max(0, finance.pension);
                text += `Pension increases by Cr${pension} to a total of Cr${finance.pension}/year.`;
            }
            if (medical) {
                finance.medicalDebt = Number(finance.medicalDebt) + Number(medical);
                finance.medicalDebt = Math.max(0, finance.medicalDebt);
                text += `Medical debt increases by Cr${medical} to a total of Cr${finance.medicalDebt}.`;
            }

            actor.update({"system.finance": finance});

            let html = `<div class="chat-package"><h3>${actor.name}</h3>`;
            if (context) {
                html += `<p>${context}</p>`;
            }
            html += `<p>${text}</p>`;
            html += `</div>`;

            let chatData = {
                speaker: ChatMessage.getSpeaker({actor: actor}),
                content: html
            };
            ChatMessage.create(chatData, {});
        }
    }
}

MgT2eMacros.chaGain = function(args) {
    let cha = args.cha;
    let level = args.level;
    let context = args.text;

    if (!level) {
        level = 1;
    } else {
        level = Number(level);
    }

    for (let actor of Tools.getSelectedOwned()) {
        let text = "";

        if (actor && actor.system.characteristics[cha]) {
            let current = Number(actor.system.characteristics[cha].value);
            if (level > 0) {
                if (current < 15) {
                    actor.system.characteristics[cha].value = Math.min(15, current + level);
                    text += `Raising <b>${cha}</b> to ${actor.system.characteristics[cha].value}.`;
                } else {
                    text += `<b>${cha}</b> is unchanged.`;
                }
            } else if (level < 0) {
                if (current > 0) {
                    actor.system.characteristics[cha].value = Math.max(0, current + level);
                    text += `Reducing <b>${cha}</b> to ${actor.system.characteristics[cha].value}.`;
                } else {
                    text += `<b>${cha}</b> is unchanged.`;
                }
            }
        }
        actor.update({"system.characteristics": actor.system.characteristics});

        let html = `<div class="chat-package"><h3>${actor.name}</h3>`;
        if (context) {
            html += `<p>${context}</p>`;
        }
        html += `<p>${text}</p>`;
        html += `</div>`;

        let chatData = {
            speaker: ChatMessage.getSpeaker({actor: actor}),
            content: html
        };
        ChatMessage.create(chatData, {});
    }
}

MgT2eMacros.specialityGain = function(actorId, skill, level) {
    let actor = game.actors.get(actorId);
    let text = "";
    if (actor.permission < 3) {
        ui.notifications.error("You do not have permission to update this actor");
        return;
    }

    if (actor) {
        let skills = actor.system.skills;
        let skillId = skill.split(".")[0];
        let specId = skill.split(".")[1];

        if (skills[skillId] && skills[skillId].specialities[specId]) {
            let spec = skills[skillId].specialities[specId];
            if (level === "undefined") {
                if (spec.value < 4) {
                    spec.value = Number(spec.value) + 1;
                }
            } else {
                if (spec.value < level) {
                    spec.value = Number(level);
                }
            }
            text += `<b>${actor.getSkillLabel(skill)}</b> is set to ${spec.value}`;
            actor.update({"system.skills": actor.system.skills });

            let html = `<div class="chat-package"><h3>${actor.name}</h3>`;
            html += `<p>${text}</p>`;
            html += `</div>`;

            let chatData = {
                speaker: ChatMessage.getSpeaker({actor: actor}),
                content: html
            };
            ChatMessage.create(chatData, {});
        }
    }
};

MgT2eMacros.skillCheck = function(args, ask) {
    let skillFqn = args.skill;
    let target = args.target?args.target:8;
    let dm = args.dm?Number(args.dm):0;

    if (!ask && game.users.current.isGM && !canvas.tokens.controlled.length) {
        // If current user is the GM, when trying to roll a skill, if no tokens
        // are selected then turn it into a skill request.
        ask = true;
    }

    if (ask) {
        let title = "";
        let cha = args.cha?args.cha:null;
        let skillFqn = args.skill;

        let skillId = skillFqn;
        let specId = null;
        if (skillId && skillId.indexOf(".")) {
            skillId = skillFqn.split(".")[0];
            specId = skillFqn.split(".")[1];
        }
        let skill = CONFIG.MGT2.SKILLS[skillId];

        if (skillFqn && !skill) {
            ui.notifications.error(`Skill [${skillId}] is unrecognised.`);
        }

        if (!cha) {
            cha = skill.default;
        }
        if (CONFIG.MGT2.CHARACTERISTICS[cha]) {
            title = `${cha} + `;
        }
        title += skillLabel(skill, skillId);

        let html = `<div class='skill-message'><h2>${title}</h2><div class="message-content">`;
        if (args.text) {
            html += `<div class="skill-description">${args.text}</div>`;
        }
        if (args.target) {
            html += `<div><b>Target:</b> ${args.target}+</div>`;
        }
        let jsonData = {
            "dm": dm,
            "rollType": "standard",
            "difficulty": args.target,
            "description": args.text,
            "success": args.success,
            "failure": args.failure,
            "cost": args.cost?args.cost:0
        }
        if (skillFqn) {
            jsonData["skill"] = skillFqn;
        }
        if (specId) {
            jsonData["specId"] = specId;
        }
        if (cha) {
            jsonData["cha"] = cha;
        }
        let json = JSON.stringify(jsonData);

        html += `<div class="skillcheck-message" data-skillcheck="${skillFqn}" data-options='${json}'>`;
        html += `<button data-skillcheck="${skillFqn}" data-options='${json}'
                    title="${title}"
                    class="skillcheck-button">Roll ${title}</button>`;
        html += `</div>`;

        let chatData = {
            content: html,
            rollMode: game.settings.get("core", "rollMode")
        };
        ChatMessage.create(chatData, {});

    } else {
        game.mgt2e.rollSkillMacro(skillFqn, {
            "difficulty": target,
            "cha": args.cha,
            "dm": dm,
            "description": args.text,
            "success": args.success,
            "failure": args.failure,
            "cost": args.cost?args.cost:0
        });
    }
};

MgT2eMacros.damage = function(args) {
    let dice = args.dice;
    let text = args.text;
    let damageType = args.type?args.type:"standard";
    let scale = args.scale?args.scale:null;
    let traits = args.traits;

    rollAttack(null, null, {
        "damage": dice,
        "title": args.title?args.title:null,
        "description": text,
        "scale": scale,
        "traits": args.traits,
        "damageType": damageType
    });
};

MgT2eMacros.createItem = async function(args, buy) {
    let item = null;
    let uuid = args.uuid;

    if (uuid) {
        let src = await fromUuid(uuid);
        if (!src) {
            ui.notifications.error(
                game.i18n.localize("MGT2.Error.CreateItem.NoItem")
            );
            return;
        }
        item = await src.clone();
    } else {
        item = {
            "name": "New Item",
            "type": "item",
            "system": {
                "quantity": 1,
                "description": "New Item"
            }
        }
        if (args.name) {
            item.name = args.name;
        }
        if (args.description) {
            item.system.description = args.description;
        }
        if (args.type) {
            item.type = type;
        }
        if (args.cost) {
            item.system.cost = args.cost;
        }
    }
    let quantity = 1;
    if (args.quantity) {
        let roll = await new Roll(args.quantity, null).evaluate();
        // Setting quantity on a cloned object doesn't seem to take.
        quantity = roll.total;
    }

    let cost = 0;
    if (buy && item.system.cost) {
        cost = Number(item.system.cost);
    }

    let added = false;
    for (let actor of Tools.getSelectedOwned()) {
        if (actor) {
            if (cost > 0 && actor.system.finance) {
                let cash = Number(actor.system.finance.cash);
                if (cost > cash) {
                    ui.notifications.error(
                        game.i18n.format("MGT2.Error.NotEnoughCash",
                            {"actor": actor.name, "cost": cost})
                    )
                    added = true; // Not really, but we don't want a "no tokens" error
                    continue;
                }
                await actor.update({"system.finance.cash": cash - cost});
                ui.notifications.info(
                    game.i18n.format("MGT2.Info.BuyItem",
                        {"actor": actor.name, "cost": cost, "item": item.name}
                    )
                );
            }
            let d = await Item.create(item, {parent: actor});
            d.update({"system.quantity": quantity});
            ui.notifications.info(
                game.i18n.format("MGT2.Info.CreateItem", {"item": item.name, "actor": actor.name})
            );
            added = true;
        }
    }
    if (!added) {
        ui.notifications.error(
            game.i18n.localize("MGT2.Error.CreateItem.NoToken")
        );
    }
}

MgT2eMacros.createAssociate = async function(args) {
    let type = args.type;
    if (!["contact", "enemy", "ally", "rival"].includes(type)) {
        ui.notifications.error("Unknown associate type");
        return;
    }
    let name = args.name?args.name:type;
    let description = args.description?args.description:"";

    let item = {
        "name": name,
        "type": "associate",
        "system": {
            "associate": {
                "relationship": type
            },
            "description": description
        }
    }
    let added = false;
    for (let actor of Tools.getSelectedOwned()) {
        if (actor) {
            let number = 1;
            if (args.number) {
                const roll = await new Roll(args.number).evaluate();
                number = roll.total;
            }

            for (let i = 0; i < number; i++) {
                if (number > 1) {
                    item.name = `${name} ${i + 1}`;
                }
                await randomiseAssociate(item);
                await Item.create(item, {parent: actor});
                ui.notifications.info(
                    game.i18n.format("MGT2.Info.CreateItem", {"item": item.name, "actor": actor.name})
                );
            }
            added = true;
        }
    }
};
