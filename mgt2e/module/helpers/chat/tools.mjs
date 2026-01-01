import {hasTrait, getTraitValue, skillLabel} from "../dice-rolls.mjs";
import {Physics} from "./physics.mjs";
import {MgT2DamageDialog} from "../damage-dialog.mjs";
import {MgT2eMacros} from "./macros.mjs";
import {calculateCost} from "../utils/character-utils.mjs";
import {getShipData} from "../spacecraft/spacecraft-utils.mjs";
import {MGT2} from "../config.mjs";
import {setSpacecraftCriticalLevel} from "../spacecraft/criticals.mjs";

export const Tools = {};


Tools.upp = async function(chatData, args) {
    let text = `<div class="tools">`;

    let extra = 0;
    while (args.length > 0) {
        extra = Math.max(0, parseInt(args.shift()));
    }
    const title = `UPP ${(extra>0)?" (with "+extra+" extra rolls)":""}`;

    let rolls = [];
    for (let i=0; i < 6; i++) {
        const roll = await new Roll("2D6").evaluate();
        rolls[i] = roll.total;
    }
    while (extra-- > 0) {
        const roll = await new Roll("2d6").evaluate();
        let value = roll.total;
        let lowest = 0;
        for (let i=0; i < 6; i++) {
            if (rolls[i] < rolls[lowest]) {
                lowest = i;
            }
        }
        if (rolls[lowest] < value) {
            rolls[lowest] = value;
        }
    }
    let total = 0;
    for (let i=0; i < 6; i++) {
        total += rolls[i];
    }
    text += `<div class="upp-data" data-STR="${rolls[0]}" data-DEX="${rolls[1]}" data-END="${rolls[2]}" data-INT="${rolls[3]}" data-EDU="${rolls[4]}" data-SOC="${rolls[5]}">`;
    text += `<h3>${title}</h3>`;
    for (let i=0; i < 6; i++) {
        text += `<span class="skill-roll">${rolls[i]}</span> `;
    }
    text += `<br/>Total: ${total}`
    text += `</div></div>`;

    chatData.content = text;
    ChatMessage.create(chatData);
};

Tools.message = function(chatData, message) {
    chatData.content = message;
    ChatMessage.create(chatData);
}

// Not really hexadecimal, so can't use normal maths functions.
// Skips some letters (I and O) to avoid confusion.
Tools.toHex = function(value) {
    if (value === null || value === undefined || parseInt(value) === NaN) {
        return "?"
    }
    let vals = [
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        "A", "B", "C", "D", "E", "F", "G", "H", "J", "K",
        "L", "M", "N", "P", "Q", "R", "S", "T", "U", "V",
        "W", "X", "Y", "Z"
    ];
    let n = parseInt(value);
    if (n < 0 || n >= vals.length) {
        return "?";
    }
    return vals[n];
}

/**
 * Gets owned actors. Returns a list of selected actors that this user has
 * ownership permission on. If none are selected, gets the players main
 * character, if they are not the GM, and they have ownership permission.
 */
Tools.getSelectedOwned = function(a) {
    const user = game.users.current;
    const selected = canvas.tokens.controlled;
    const list = [];

    if (a) {
        return [ a ];
    }

    if (selected.length > 0) {
        for (let t of selected) {
            if (t.actor && t.actor.permission >= 3) {
                list.push(t.actor);
            }
        }
    }
    if (list.length === 0 && !game.user.isGM) {
        if (game.user.character) {
            let actor = game.user.character;
            if (actor.permission >= 3) {
                list.push(actor);
            }
        }
    }
    return list;
}


/**
 * Gets an array of selected tokens. If any tokens are marked as
 * targets, then all of them are returned. Otherwise, if there is
 * a selected token, then that is returned instead.
 */
Tools.getSelected = function() {
    const user = game.users.current;
    const selected = canvas.tokens.controlled;
    const targets = user.targets;

    if (targets.size === 0) {
        return selected;
    } else {
        return targets.values();
    }
}

Tools.setStatusFor = function(actor, args, status) {
    if (args.includes(status)) {
        actor.setFlag("mgt2e", status, true);
    }
    if (args.includes("-" + status)) {
        actor.unsetFlag("mgt2e", status);
    }
}

Tools.setStatus = function(chatData, args) {
    const selected = Tools.getSelected();

    if (selected.length === 0) {
        ui.notifications("No tokens selected");
        return;
    }
    for (let token of selected) {
        if (!token.owner) {
            continue;
        }
        let actor = token.actor;
        if (actor.type === "traveller" || actor.type === "npc" || actor.type === "creature") {
            Tools.setStatusFor(actor, args, "stunned");
            Tools.setStatusFor(actor, args, "fatigued");
            Tools.setStatusFor(actor, args, "highGravity");
            Tools.setStatusFor(actor, args, "lowGravity");
            Tools.setStatusFor(actor, args, "zeroGravity");
            Tools.setStatusFor(actor, args, "poisoned");
            Tools.setStatusFor(actor, args, "diseased");
            Tools.setStatusFor(actor, args, "unconscious");
            Tools.setStatusFor(actor, args, "disabled");
            Tools.setStatusFor(actor, args, "dead");
            Tools.setStatusFor(actor, args, "destroyed");
            Tools.setStatusFor(actor, args, "needsFirstAid");
            Tools.setStatusFor(actor, args, "needsSurgery");
            Tools.setStatusFor(actor, args, "inCover");
            Tools.setStatusFor(actor, args, "prone");
            actor.update({ "system.status": actor.system.status });
        }
    }
}

Tools.debugSelected = function(chatData) {
    const selected = Tools.getSelected();

    for (let token of selected) {
        console.log(token);
    }
}

Tools.applyDamageToCha= function(damage, actorData, cha) {
    if (damage > 0) {
        let dmg = Math.min(damage, actorData.characteristics[cha].current);
        actorData.damage[cha].value += dmg;
        console.log("Applied " + dmg + " to " + cha);

        return damage - dmg;
    }
    return 0;
}

Tools.showBlastRadius = async function(x, y, damageOptions) {
    console.log("showBlastRadius: ");
    console.log(damageOptions);

    if (game.settings.get("mgt2e", "blastEffectDivergence") > 0) {
        if (damageOptions.effect < 0) {
            let scale = canvas.grid.size / canvas.grid.distance;
            const variance = parseInt(scale * parseFloat(game.settings.get("mgt2e", "blastEffectDivergence")) * Math.abs(damageOptions.effect));
            const dice = `1D${variance} - 1D${variance}`;
            const xv = (await new Roll(dice, null).evaluate()).total;
            const yv = (await new Roll(dice, null).evaluate()).total;

            console.log(`Diverge ${dice} ${xv} ${yv}`);
            x += xv;
            y += yv;
        }
    }

    const templateData = {
        t: "circle",
        user: game.user.id,
        distance: damageOptions.blastRadius,
        direction: 0, x:  x, y: y,
        fillColor: "#FF8080",
        borderColor: "#FF8080",
        width: 3, opacity: 0.25
    }
    const template = canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [templateData]);
};

// Called from a button press in damage output in the chat.
Tools.applyDamageToTokens = async function(damage, damageOptions) {
    console.log("Tools.applyDamageToTokens:");

    let tokens = Tools.getSelected();
    if (tokens.size === 0) {
        ui.notifications.error(game.i18n.localize("MGT2.Error.CombatNoSelection"));
        return;
    }

    for (let token of tokens) {
        if (!token.isOwner) {
            // Don't have permission to update token.
            ui.notifications.warn("Cannot apply damage to " + token.name);
            continue;
        }
        token.actor.applyDamage(damage, damageOptions, (tokens.size > 1));
    }
};

Tools.rollSplitDamage = async function(damageOptions) {
    let dice = damageOptions.damageDice;
    let actor = null;
    console.log(damageOptions);
    if (damageOptions.actorId) {
        actor = await fromUuid(damageOptions.actorId);
    }
    let weapon = null;
    if (damageOptions.weaponId) {
        weapon = await fromUuid(damageOptions.weaponId);
    }

    const roll = await new Roll(dice, actor?actor.getRollData():null).evaluate();
    let baseDamage = Number(roll.total);
    let effect = Number((damageOptions.effect>0)?damageOptions.effect:0);
    damageOptions.damage = baseDamage;
    let damageEffect = baseDamage + effect;
    let titleText = "Now the damage has been rolled";
    let splitTitle = `${dice}`;
    if (effect > 0) {
        splitTitle += ` + ${effect}`;
    }

    let json = JSON.stringify(damageOptions);
    let content = `<div class="attack-message">`;
    content += `<h2>Roll ${splitTitle} Damage</h2>`;

    content += `<div class="message-content"><div>`;
    if (actor) {
        content += `<img class="skillcheck-thumb" alt="${actor.name}" src="${actor.thumbnail}"/>`;
    }
    if (weapon) {
        content += `<img class="skillcheck-thumb" alt="${weapon.name}" src="${weapon.img}"/>`;
        content += `<span><b>${weapon.name}</b></span><br/>`;
        content += `<span><b>Damage:</b> ${weapon.system.weapon.damage}</span><br/>`;
        content += `<span><b>Effect:</b> ${effect}</span><br/>`;
        content += `<span>${weapon.printWeaponTraits()}</span><br/>`

        if (weapon.hasTrait("destructive")) {
            baseDamage *= 10;
            effect *= 10;
            damageEffect *= 10;
        }
    }
    let dmgText = `Damage ${baseDamage}`;
    if (damageOptions.effect > 0) {
        dmgText += ` + ${effect} (${damageEffect})`
    }

    if (damageOptions.ap > 0) {
        dmgText += ` / AP ${damageOptions.ap}`;
    }
    if (damageOptions.radiationDamage > 0) {
        dmgText += ` / ${damageOptions.radiationDamage} Rads`;
    }

    content += `</div>`; // Message Content

    content += `<div class="damage-message" data-damage="${damageEffect}" data-options='${json}'>`;
    content += `<button data-damage="${damageEffect}" data-options='${json}'
                                title="${titleText}"
                                class="damage-button">${dmgText}</button>`;
    content += `</div>`; // Damage Message
    content += `</div>`; // Attack Message
    roll.toMessage({
        speaker: ChatMessage.getSpeaker({actor: actor}),
        flavor: content,
        rollMode: game.settings.get("core", "rollMode")
    });
}

Tools.requestedSkillCheck = async function(skillFqn, skillOptions) {
    game.mgt2e.rollSkillMacro(skillFqn, {
        "cha": skillOptions.cha,
        "difficulty": skillOptions.difficulty,
        "description": skillOptions.description,
        "success": skillOptions.success,
        "failure": skillOptions.failure,
        "cost": skillOptions.cost,
        "quick": skillOptions.quick?skillOptions.quick:false,
        "rollType": skillOptions.rollType?skillOptions.rollType:"standard"
    });

};

// Called from a chat command.
Tools.damage = function(chatData, args) {
    if (args.length < 1) {
        ui.notifications.error("You must at least specify the amount of damage");
        return;
    }
    let damage = parseInt(args.shift());
    let damageOptions = { "traits": "", "damage": damage, "ap": 0, "effect": 0, "scale": "traveller" };
    while (args.length > 0) {
        if (args[0] === "--noui") {
            damageOptions.noUI = true;
            args.shift();
            continue;
        }
        damageOptions.traits += args.shift() + " ";
    }
    Tools.applyDamageToTokens(damage, damageOptions);
};

Tools.showSkills = function(chatData, args) {
    let actors = Tools.getSelectedOwned();

    if (actors.length === 0) {
        return;
    }

    let labelName = true;
    let all = false;
    while (args.length > 0) {
        let option = args[0];
        if (option.startsWith("i")) {
            labelName = false;
        }
        if (option.startsWith("a")) {
            all = true;
        }
        args.shift();
    }

    let actor = actors[0];
    let skills = actor.system.skills;

    let text = "";
    for (let skill in skills) {
        let skillData = skills[skill];
        if (!skillData.trained && !all) {
            continue;
        }
        let shown = false;
        if (skills[skill].specialities) {
            for (let spec in skills[skill].specialities) {
                let skillFqn = skill + "." + spec;
                let specData = skills[skill].specialities[spec];

                if ((skillData.individual && specData.trained) || specData.value > 0 || all) {
                    if (labelName) {
                        text += `${actor.getSkillLabel(skillFqn, true)}<br/>`;
                    } else {
                        text += `${skillFqn}<br/>`;
                    }
                    shown = true;
                }
            }
        }
        if (!shown) {
            if (labelName) {
                text += `${actor.getSkillLabel(skill, true)}<br/>`;
            } else {
                text += `${skill}<br/>`;
            }
        }
    }

    chatData.whisper = [ game.user.id ];
    this.message(chatData, text);
}

Tools.rollChatSkill = async function(chatData, args) {
    let actors = Tools.getSelectedOwned();

    let skillFqn = null;
    if (args.length > 0) {
        skillFqn = args[0];
    }
    if (!skillFqn) {
        return;
    }
    args.shift();
    let options = { quick: true };
    while (args.length > 0) {
        let val = ""+args[0];
        if (val.match(/[A-Za-z][A-Za-z][A-Za-z]/)) {
            options.cha = val.toUpperCase();
        } else if (val === "+") {
            options.rollType = "boon";
        } else if (val === "-") {
            options.rollType = "bane";
        } else if (parseInt(val) !== NaN && parseInt(val) != 0) {
            options.dm = parseInt(val);
        }
        args.shift();
    }

    let text = "";
    for (let actor of actors) {
        Tools.requestedSkillCheck(skillFqn, options);
    }
}

Tools.rollChatAttack = async function(chatData, args) {

}

Tools.currentTime = function(chatData, args) {
    const user = game.users.current;
    let year = game.settings.get("mgt2e", "currentYear");
    let day = game.settings.get("mgt2e", "currentDay");

    if (user.isGM && args.length > 0) {
        let value = args.shift();
        let inc = false;
        let y = false;
        if (value.startsWith("+")) {
            inc = true;
        }
        if (value.match("[0-9]+y.*")) {
            year = parseInt(year) + parseInt(value);
        } else {
            day = parseInt(day) + parseInt(value);
        }

        while (parseInt(day) > 365) {
            year++;
            day-=365;
        }
        while (parseInt(day) < 1) {
            year--;
            day+=365;
        }
        game.settings.set("mgt2e", "currentYear", year);
        game.settings.set("mgt2e", "currentDay", day);
    } else if (args.length > 0) {
        ui.notifications.error("Only the GM can set the date and time");
    }
    if (parseInt(day) < 10) {
        day = "00" + day;
    } else if (parseInt(day) < 100) {
        day = "0" + day;
    }
    let text = "It is currently " + year + "-" + day;
    this.message(chatData, text);
}

Tools.macroExecutionEnricher = function(match, options) {
    try {
        const type = match[1];
        const macroName = match[3]?match[3]:match[2];
        const argsString = match[4];
        const flavor = match[6];

        const title = `${macroName}(${argsString})`;

        if (type === "/mgt2e") {
            return Tools.internalExecutionButton(macroName, argsString, title, flavor);
        } else if (type === "/mgMacro") {
            return Tools.macroExecutionButton(macroName, argsString, title, flavor);
        } else if (type === "/actor") {
            return Tools.actorInlineDisplay(macroName);
        } else if (type === "/item") {
            return Tools.itemInlineDisplay(macroName, argsString, title, flavor);
        } else {
            console.log(type);
        }
    } catch (e) {
        console.log(e);
    }
}

Tools.blockInline = async function(argsString) {
    const a = document.createElement("div");
    const argsRgx = /(\w+)=\s*(?:"([^"]*)"|(\S+))/g;

    const args = {};
    let match;
    while ((match = argsRgx.exec(argsString)) !== null) {
        match
        const key = match[1];
        const value = match[2] ?? match[3];
        args[key] = value;
    }
}

Tools.itemInlineDisplay = async function(itemId) {
    let item = await fromUuid(itemId);
    if (!item) {
        item = game.items.get(itemId);
    }
    if (!item) {
        item = game.item.getName(itemId);
    }
    const a = document.createElement("div");
    if (!item) {
        a.innerHTML = `Unable to find item ${itemId}`;
        return a;
    }
    let html = "";

    html = `<div class="inline-item"><span class="item-name">${item.name}</span>: ${item.system.description}</div>`;

    a.innerHTML = html;
    return a;
}

Tools.actorInlineDisplay = async function(actorId) {
    let actor = fromUuidSync(actorId);
    if (!actor) {
        actor = game.actors.get(actorId);
    }
    if (!actor) {
        actor = game.actors.getName(actorId);
    }

    const a = document.createElement("div");
    if (!actor) {
        a.innerHTML = `Unable to find actor ${actorId}`;
        return a;
    }

    if (actor.type === "creature") {
        await Tools.creatureInlineDisplay(a, actor);
    } else if (actor.type === "npc" || actor.type==="traveller") {
        await Tools.npcInlineDisplay(a, actor);
    } else if (actor.type === "spacecraft") {
        await Tools.spacecraftInlineDisplay(a, actor);
    } else if (actor.type === "vehicle") {
        await Tools.vehicleInlineDisplay(a, actor);
    } else {
        a.innerHTML = `Currently only supports Travellers, NPCs and Spacecraft`;
    }
    return a;
}

Tools.creatureInlineDisplay = async function(a, actor) {
    let html = `<div class="inline-creature actor-link" data-actor-id="${actor.uuid}">`;
    html += `<h2>${actor.name}</h2>`;
    html += `<img src="${actor.img}"/>`;

    if (actor.system.description) {
        let d = await TextEditor.enrichHTML(
            actor.system.description,
            { secrets: ((actor.permission > 2)?true:false) }
        );
        html += d;
    }

    html += `<table class="creature-stats">`;
    html += `<tr><th>Animal</th><th>Hits</th><th>Speed</th></tr>`;
    html += `<tr class="noborder"><td>`;
    html += `<a class="embedded-actor-link actor-draggable" data-actor-id="${actor.uuid}">${actor.name}</a></td>`;
    html += `<td>${actor.system.hits.max}</td><td>${actor.system.speed.value}</td></tr>`;

    html += `<tr><th>Skills</th><td colspan="2">${actor.printSkills()}</td></tr>`;
    html += `<tr><th>Attacks</th><td colspan="2">${actor.printAttacks()}</td></tr>`;
    html += `<tr><th>Traits</th><td colspan="2">${actor.printCreatureTraits(true)}</td></tr>`;
    html += `<tr><th>Behaviour</th><td colspan="2">${actor.printCreatureBehaviours()}</td></tr>`;

    html += `</table></div>`;
    a.innerHTML = html;
    return a;
}

Tools.npcInlineDisplay = async function(a, actor) {
    let html = `<div class="inline-actor"><img class="portrait" src="${actor.img}"/>`;
    html += `<span class="actor-link rollable name" data-actor-id="${actor.uuid}">${actor.name}</span>`;
    html += `<span class="profession">${actor.system.sophont.profession}</span>`;

    html += `<div style="clear: left"/>`;

    html += `<div class="grid grid-3col actor-link" data-actor-id="${actor.uuid}">`;
    html += `<div class="species-title">Species</div><div class="species-title">Gender</div><div class="species-title">Age</div>`;
    html += `<div class="species-data">${actor.system.sophont.species}</div>`;
    html += `<div class="species-data">${actor.system.sophont.gender}</div>`;
    html += `<div class="species-data">${actor.system.sophont.age}</div>`;
    html += `</div>`;

    html += `<div class="actor-body-container actor-link" data-actor-id="${actor.uuid}">`;

    // Characteristics
    html += `<div class="grid grid-4col actor-cha-list">`;
    html += `<div class="species-title grid-span-3">Traits</div><div>-</div>`;
    html += `<div class="species-title">STR</div><div>${actor.system.characteristics.STR.value}</div>`;
    html += `<div class="species-title">INT</div><div>${actor.system.characteristics.INT.value}</div>`;
    html += `<div class="species-title">DEX</div><div>${actor.system.characteristics.DEX.value}</div>`;
    html += `<div class="species-title">EDU</div><div>${actor.system.characteristics.EDU.value}</div>`;
    html += `<div class="species-title">END</div><div>${actor.system.characteristics.END.value}</div>`;
    html += `<div class="species-title">SOC</div><div>${actor.system.characteristics.SOC.value}</div>`;
    html += `</div>`;

    // Skills
    html += `<div class="actor-skill-list">`;
    html += `<div class="species-title" style="width: 100%">Skills</div>`;
    const skills = actor.system.skills;

    let skillHtml = "";
    for (let key in skills) {
        let skill = skills[key];

        if (skill.trained) {
            let showParent = true;
            if (skill.specialities) {
                for (let specKey in skill.specialities) {
                    let spec = skill.specialities[specKey];
                    if (spec.value > 0) {
                        showParent = false;
                        skillHtml += `<li>${skillLabel(skill, key).replace(/ /, "&nbsp;")}&nbsp;(${skillLabel(spec, specKey).replace(/ /, "&nbsp;")})/${spec.value}</li>`;
                    }
                }
            }
            if (showParent) {
                skillHtml += `<li>${skillLabel(skill, key).replace(/ /, "&nbsp;")}/${skill.value}</li>`;
            }
        }
    }
    html += `<ul class="skill-list">${skillHtml}</ul>`;
    html += `</div>`; // Skills
    html += `</div>`; // Container

    html += `<div class="grid grid-3col actor-equipment-list actor-link" data-actor-id="${actor.uuid}">`;
    html += `<div class="species-title">Equipment</div>`;
    html += `<div class="grid-span-2">`;
    let weapons = "";
    let armour = "";
    let equipment = "";
    for (let i of actor.items) {
        if (i.type === "weapon") {
            weapons += `<li>${i.name} (${i.system.weapon.damage})</li>`;
        } else if (i.type === "armour") {
            armour += `<li>${i.name} (+${i.system.armour.protection})</li>`;
        } else {
            equipment += `<li>${i.name}</li>`;
        }
    }
    if (weapons !== "") {
        html += `<b>Weapons:</b> <ul class="skill-list">${weapons}</ul><br/>`;
    }
    if (armour !== "") {
        html += `<b>Armour:</b> <ul class="skill-list"> ${armour}</ul><br/>`;
    }
    if (equipment !== "") {
        html += `<b>Equipment:</b> <ul class="skill-list">${equipment}</ul><br/>`;
    }
    html += `</div>`;
    html += `</div>`;
    html += `</div>`;
    html += `</div>`;

    if (actor.system.description) {
        let d = await TextEditor.enrichHTML(
            actor.system.description,
            { secrets: ((actor.permission > 2)?true:false) }
        );
        html += d;
    }

    html += `</div>`;

    a.innerHTML = html;

    return a;
}

Tools.prettyNumber = function(value, digits, sign) {
    let f = parseFloat(value);
    if (isNaN(f)) {
        f = 0;
    }
    let prefix = "";
    if (sign && f >= 0) {
        prefix = "+";
    }
    return prefix + (new Intl.NumberFormat(undefined, { maximumFractionDigits: digits}).format(f));
}

Tools.inlineSpacecraftData = function(heading, items) {
    let html = `<tr><th>${heading}</th>`;

    if (!items || items.length === 0) {
        return "";
    }

    items = items.sort(function(a, b) {
        return (a.name < b.name)?-1:(a.name > b.name)?1:0;
    })

    html += "<td>";
    for (let i in items) {
        if (i>0) html += "<br/>";
        html += items[i].name;
        if (items[i].quantity && items[i].quantity > 1) {
            html += " x" + items[i].quantity;
        }
    }
    html += "</td>";
    html += "<td>";
    for (let i in items) {
        if (i>0) html += "<br/>";
        if (items[i].tons > 0) {
            html += Tools.prettyNumber(items[i].tons, 2);
        } else {
            html += "&mdash;";
        }
    }
    html += "</td>";
    html += "<td>";
    for (let i in items) {
        if (i>0) html += "<br/>";
        if (items[i].cost !== 0) {
            html += Tools.prettyNumber(items[i].cost, 3);
        } else {
            html += "&mdash;";
        }
    }
    html += "</td>";

    html += `</tr>`;

    return html;
}

Tools.spacecraftInlineDisplay = async function(a, actor) {
    let html = `<div class="inline-spacecraft">`;

    // Let's make sure everything is calculated correctly.
    await calculateCost(actor);

    html += `<div class="spacecraft-header actor-link rollable name" data-actor-id="${actor.uuid}">`;
    html += `<h3>${actor.name}</h3>`;
    let tc = actor.system.spacecraft.type;
    if (tc) {
        // This is messy. We have a single variable (type) which is two things - a type and a class.
        // A type is all uppercase and digits (e.g. Y, A2 etc)
        // A class is mixed case and only letters.
        // Some ships have both. We split them with a slash (/) if there are two.
        let a = tc.split("/");
        if (a.length > 1) {
            let shipType = a[0].trim();
            let shipClass = a[1].trim();
            html += `<span class="type">TYPE: ${shipType} (${shipClass.toUpperCase()} CLASS)</span>`;
        } else {
            if (tc.match(/^[A-Z0-9]*$/)) {
                html += `<span class="type">TYPE: ${tc}</span>`;
            } else {
                html += `<span class="type">CLASS: ${tc.toUpperCase()}</span>`;
            }
        }
    } else if (actor.system.spacecraft.dtons < 100) {
        html += `<span class="type">SMALL CRAFT</span>`;
    } else {
        html += `<span class="type">CLASS/TYPE: N/A</span>`;
    }
    html += `<br style="clear:both"/>`;
    html += `</div>`;

    if (actor.system.description) {
        let d = await TextEditor.enrichHTML(
            actor.system.description,
            { secrets: ((actor.permission > 2)?true:false) }
        );
        html += `<div class="spacecraft-description">${d}</div>`;
    }

    // Data stats to the right.
    html += `<div class="spacecraft-right">`;
    html += `<div><div class="title">Crew</div>`;

    let crewText = "";
    for (let role of actor.items) {
        if (role.type === "role" && role.system.role.show) {
            if (crewText) crewText +=", ";
            crewText += role.name;
            if (role.system.role.positions > 1) {
                crewText += " x" + role.system.role.positions;
            }
        }
    }
    html += `<p>${crewText}</p>`
    html += `</div>`;

    let spacecraft = actor.system.spacecraft;
    let data = getShipData(actor);

    let totalCost = 0; // Base cost is already included in data list
    for (let t in data) {
        for (let i of data[t]) {
            totalCost += i.cost;
        }
    }
    let purchaseCost = totalCost;
    if (spacecraft.isStandardDesign) {
        purchaseCost *= 0.9;
    }
    let maintenanceCost = (purchaseCost * 1000) / 12;

    html += `<div><div class="title">Hull: ${actor.system.hits.max}</div><p></p></div>`;
    html += `<div><div class="title">Running Costs</div>`;
    html += `<div class="sub-title">Maintenance Cost</div>`
    html += `<p>Cr${new Intl.NumberFormat(undefined, {maximumFractionDigits: 0}).format(maintenanceCost)}/month</p>`;

    html += `<div class="sub-title">Purchase Cost</div>`
    html += `<p>MCr${new Intl.NumberFormat(undefined, {maximumFractionDigits: 6}).format(purchaseCost)}</p>`;
    html += `</div>`;
    html += `<div><div class="title">Power Requirements</div></div>`;

    let basicShipPower = data["hull"][0].power;
    let mDrivePower = data["mDrive"].reduce((n, {power}) => n + power, 0);
    let jDrivePower = data["jDrive"].reduce((n, {power}) => n + power, 0);
    let sensorPower = data["sensor"].reduce((n, {power}) => n + power, 0);
    let weaponPower = data["weapon"].reduce((n, {power}) => n + power, 0);

    html += `<p>Basic Ship Systems</p>`;
    html += `<p>${basicShipPower}</p>`;
    if (mDrivePower > 0) {
        html += `<hr/><p>Manoeuvre Drive</p>`;
        html += `<p>${mDrivePower}</p>`;
    }
    if (jDrivePower > 0) {
        html += `<hr/><p>Jump Drive</p>`;
        html += `<p>${jDrivePower}</p>`;
    }
    if (sensorPower > 0) {
        html += `<hr/><p>Sensors</p>`;
        html += `<p>${sensorPower}</p>`;
    }
    if (weaponPower > 0) {
        html += `<hr/><p>Weapons</p>`;
        html += `<p>${weaponPower}</p>`;
    }
    // Power from other items
    for (let s of ["bridge", "systems", "stateroom", "common"]) {
        for (let i of data[s]) {
            if (i.power && parseFloat(i.power) > 0) {
                html += `<hr/><p>${i.name}</p>`;
                html += `<p>${parseFloat(i.power)}</p>`;
            }
        }
    }

    html += `<p></p>`;
    html += `</div>`;

    // Table to the left.
    html += `<table class="ship-data"><tr class="header"><th>TL${actor.system.spacecraft.tl}</th><th></th><th>TONS</th><th>COST (MCr)</th></tr>`;

    html += Tools.inlineSpacecraftData("Hull", data["hull"] );
    if (data["armour"]) {
        html += Tools.inlineSpacecraftData("Armour", data["armour"]);
    }
    if (data["mDrive"]) {
        html += Tools.inlineSpacecraftData("M-Drive", data["mDrive"]);
    }
    if (data["jDrive"]) {
        html += Tools.inlineSpacecraftData("J-Drive", data["jDrive"]);
    }
    if (data["power"]) {
        html += Tools.inlineSpacecraftData("Power Plant", data["power"]);
    }
    if (data["fuel"]) {
        html += Tools.inlineSpacecraftData("Fuel Tanks", data["fuel"]);
    }
    if (data["bridge"]) {
        html += Tools.inlineSpacecraftData("Bridge", data["bridge"]);
    }
    if (data["computer"]) {
        html += Tools.inlineSpacecraftData("Computer", data["computer"]);
    }
    if (data["sensor"]) {
        html += Tools.inlineSpacecraftData("Sensors", data["sensor"]);
    }
    if (data["weapon"]) {
        html += Tools.inlineSpacecraftData("Weapons", data["weapon"]);
    }
    if (data["bulkheads"]) {
        html += Tools.inlineSpacecraftData("Bulkheads", data["bulkheads"]);
    }
    if (data["systems"]) {
        html += Tools.inlineSpacecraftData("Systems", data["systems"]);
    }
    if (data["software"]) {
        html += Tools.inlineSpacecraftData("Software", data["software"]);
    }
    if (data["stateroom"]) {
        html += Tools.inlineSpacecraftData("Staterooms", data["stateroom"]);
    }
    if (data["common"]) {
        html += Tools.inlineSpacecraftData("Common Areas", data["common"]);
    }
    if (data["cargo"]) {
        html += Tools.inlineSpacecraftData("Cargo", data["cargo"]);
    }

    html += `<tr><td colspan="4" style="text-align: center"><b>Total:</b> MCr${new Intl.NumberFormat(undefined, {maximumFractionDigits: 3}).format(totalCost)}</td></tr>`;


    html += `</table>`;
    html += `<p></p>`;
    html += `<div class="starship-image">`;
    html += `<img style="border: none" src="${actor.img}"/>`
    html += `</div>`;

    if (actor.system.spacecraft.deckplans) {
        html += `<div class="starship-deckplans">`;
        for (let d in actor.system.spacecraft.deckplans) {
            html += `<img style="border: none" src="${actor.system.spacecraft.deckplans[d]}"/>`;
        }
        html += `</div>`;
    }

    html += `</div>`;
    a.innerHTML = html;

    return a;
}


Tools.vehicleInlineDisplay = async function(a, actor) {
    let html = `<div class="inline-vehicle">`;

    html += `<div class="vehicle-header actor-link rollable name" data-actor-id="${actor.uuid}">`;
    html += `<h4>${actor.name}</h4>`;
    html += `</div>`;

    let vehicle = actor.system.vehicle;

    if (actor.system.description) {
        let d = await TextEditor.enrichHTML(
            actor.system.description,
            { secrets: ((actor.permission > 2)?true:false) }
        );
        html += `<div>${d}</div>`;
    }

    let skill = actor.getSkillLabel(vehicle.skill, false);
    let speed = vehicle.speed;
    let cruiseSpeed = vehicle.speed;
    if (MGT2.VEHICLES.SPEED[speed] && MGT2.VEHICLES.SPEED[speed].band) {
        let cruiseBand = MGT2.VEHICLES.SPEED[speed].band - 1;
        for (let s in MGT2.VEHICLES.SPEED) {
            console.log(s);
            if (MGT2.VEHICLES.SPEED[s].band === cruiseBand) {
                cruiseSpeed = s;
                break;
            }
        }
    }
    let cruiseRange = parseInt(vehicle.range * 1.5);
    speed = game.i18n.localize("MGT2.Vehicle.SpeedBand." + speed);
    cruiseSpeed = game.i18n.localize("MGT2.Vehicle.SpeedBand." + cruiseSpeed);

    html += `<table>`;
    html += `<tr><th>TL</th><td>${vehicle.tl}</td>`;
    html += `<tr><th>SKILL</th><td>${skill}</td>`;
    html += `<tr><th>AGILITY</th><td>${vehicle.agility}</td>`;
    html += `<tr><th>SPEED (CRUISE)</th><td>${speed} (${cruiseSpeed})</td>`;
    html += `<tr><th>RANGE (CRUISE)</th><td>${vehicle.range} (${cruiseRange})</td>`;
    html += `<tr><th>CREW</th><td>${vehicle.crew}</td>`;
    html += `<tr><th>PASSENGERS</th><td>${vehicle.passengers}</td>`;
    html += `<tr><th>CARGO</th><td>${vehicle.tl}</td>`;
    html += `<tr><th>HULL</th><td>${actor.system.hits.max}</td>`;
    html += `<tr><th>SHIPPING</th><td>${vehicle.shipping}</td>`;
    html += `<tr><th>COST</th><td>Cr${vehicle.cost}</td>`;
    html += `</table>`;

    // Armour
    html += `<span class="armour-header">Armour</span>`;
    html += `<dl>`;
    html += `<dt>Front</dt><dd>${vehicle.armour.front}</dd>`;
    html += `<dt>Rear</dt><dd>${vehicle.armour.rear}</dd>`;
    html += `<dt>Sides</dt><dd>${vehicle.armour.sides}</dd>`;
    html += `</dl>`;

    html += `<img src="${actor.img}"/>`;

    html += `</div>`;
    a.innerHTML = html;

    return a;
}

Tools.internalExecutionButton = function(macroName, argsString, title, flavor) {
    const a = document.createElement("a");
    a.classList.add("inline-mgt2e-execution");
    a.dataset.macroName = macroName;
    a.dataset.args = argsString;
    //a.innerHTML = `<i class="fas fa-dice"></i> ${flavor ?? title}`;

    let symbol = `<i class="fas fa-dice"></i>`;
    if (["item"].includes(macroName)) {
        symbol = `<i class=\"fas fa-arrow-up-from-bracket\"></i>`;
    } else if (["req"].includes(macroName)) {
        symbol = `<i class="fas fa-dice">?</i>`;
    } else if (["train"].includes(macroName)) {
        symbol = `<i class="fas fa-book-open"></i>`;
    } else if (["buy"].includes(macroName)) {
        symbol = ``;
    } else if (["roll"].includes(macroName)) {
        symbol = `<i class="fas fa-solid fa-table-list"></i>`;
    }

    a.innerHTML = `<span class="internal-macro">${symbol} ${flavor ?? title}</span>`;
    return a;
}

Tools.macroExecutionButton = function(macroName, argsString, title, flavor) {
    const a = document.createElement("a");
    a.classList.add("inline-macro-execution");
    a.dataset.macroName = macroName;
    a.dataset.args = argsString;
    a.innerHTML = `<i class="fas fa-dice"></i> ${flavor ?? title}`;
    return a;
}

Tools.macroClick = function(event) {
    try {
        event.preventDefault();
        const a = event.currentTarget;

        const macroName = a.dataset.macroName;
        const argsString = a.dataset.args;
        const argsRgx = /(\w+)=\s*(?:"([^"]*)"|(\S+))/g;

        const args = {};
        let match;
        while ((match = argsRgx.exec(argsString)) !== null) {
            match
            const key = match[1];
            const value = match[2] ?? match[3];
            args[key] = value;
        }
        if (game.macros.getName(macroName)) {
            game.macros.getName(macroName).execute(args);
        } else {
            ui.notifications.error(`Macro '${macroName}' does not exist. Ensure it is installed in the Macro Folder.`);
        }
    } catch (e) {
        ui.notifications.error(e.error);
        throw e;
    }
};

// These are designed for internal commands rather than macros.
Tools.mgt2eClick = function(event) {
    try {
        event.preventDefault();
        const a = event.currentTarget;

        const macroName = a.dataset.macroName;
        const argsString = a.dataset.args;
        const argsRgx = /(\w+)=\s*(?:"([^"]*)"|(\S+))/g;

        const args = {};
        let match;
        while ((match = argsRgx.exec(argsString)) !== null) {
            match
            const key = match[1];
            const value = match[2] ?? match[3];
            args[key] = value;
        }

        if (macroName === "skillGain" || macroName === "train") {
            MgT2eMacros.skillGain(args);
        } else if (macroName === "skillCheck" || macroName === "skill") {
            MgT2eMacros.skillCheck(args, false);
        } else if (macroName === "skillReq" || macroName === "req") {
            MgT2eMacros.skillCheck(args, true);
        } else if (macroName === "damage" || macroName === "dmg") {
            MgT2eMacros.damage(args);
        } else if (macroName === "item") {
            MgT2eMacros.createItem(args, false);
        } else if (macroName === "buy") {
            MgT2eMacros.createItem(args, true);
        } else if (macroName === "associate") {
            MgT2eMacros.createAssociate(args);
        } else if (macroName === "cash") {
            MgT2eMacros.cash(args);
        } else if (macroName === "roll") {
            MgT2eMacros.roll(args);
        }
    } catch (e) {
        console.log("There was a macro error");
        ui.notifications.error(e.error);
        throw e;
    }
};

// Get a list of quantities, from 1 to max. If max is large, then we simplify the list.
Tools.getQuantities = function(max) {
    let list = [];

    for (let i=1; i < Math.min(10, max); i++) {
        list.push(i);
    }
    for (let i=10; i < Math.min(25, max); i+=5) {
        list.push(i);
    }
    for (let i=25; i < Math.min(200, max); i+= 25) {
        list.push(i);
    }

    return list;
}

Tools.test = async function(chatData, args) {
    let a = game.actors.getName("Beowulf");

    let effects = MGT2.SPACECRAFT_CRITICALS["crew"][0];

    await setSpacecraftCriticalLevel(a, "crew", 1);
}
