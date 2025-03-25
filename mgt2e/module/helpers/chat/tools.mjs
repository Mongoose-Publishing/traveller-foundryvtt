import {hasTrait, getTraitValue, skillLabel} from "../dice-rolls.mjs";
import {Physics} from "./physics.mjs";
import {MgT2DamageDialog} from "../damage-dialog.mjs";
import {MgT2eMacros} from "./macros.mjs";

export const Tools = {};

Tools.uwp = function(chatData, args) {
    if (args < 2) {
        return;
    }
    let sector = args.shift();
    let xy = args.shift();

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", `https://travellermap.com/data/${sector}/${xy}`, false);
    xmlHttp.send();

    let obj = JSON.parse(xmlHttp.responseText);

    if (obj.Worlds.length == 0) {
        chatData.content = `No world found at ${xy}`;
    } else {
        let text = `<div class="tools">`;
        let data = obj.Worlds[0];
        text += `<h2>${data.Name} (${data.Hex}) / ${data.Sector}</h2>`;
        text += `${data.UWP}<br/>`;
        text += `${data.Remarks}<br/>`;
        let uwp = data.UWP;
        text += Tools.uwpToText(uwp);
        text += "</div>";
        chatData.content = text;

    }
    ChatMessage.create(chatData);
}

Tools.uwpToText = function(uwp) {
    let text = "<div>";

    let starport = uwp.substring(0, 1);
    let size = uwp.substring(1, 2);
    let atmosphere = uwp.substring(2, 3);
    let hydrosphere = uwp.substring(3, 4);

    text += `<b>Starport:</b> ${starport}<br/>`;
    text += `<b>Size:</b> ${size}<br/>`;


    text += "</div>";
    return text;
}



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

Tools.renumber = function() {
    const selected = Tools.getSelected();

    console.log("Tools.rename:");

    if (selected.length === 0) {
        ui.notifications.error("No tokens selected");
        return;
    }
    const allTokens = selected[0].scene.tokens;

    let number = 1;
    for (let token of selected) {
        if (!token.owner) {
            // Don't have permission to update token.
            continue;
        }
        console.log("Renaming " + token.name);
        let baseName = token.name;
        if (baseName.indexOf("#") > -1) {
            let count = 0;
            for (let t of allTokens) {
                if (baseName === t.name && !count) {
                    count++;
                } else if (baseName === t.name) {
                    // We have a duplicate.
                    baseName = token.name.replaceAll(/ *#.*/g, "");
                    console.log("Change [" + token.name + "] [" + baseName + "]");
                    count++;
                    break;
                }
            }
            if (count < 2) {
                continue;
            }
        }
        let done = false;
        while (!done) {
            name = baseName + " #" + number++;
            done = true;
            for (let t of allTokens) {
                if (name === t.name) {
                    console.log("Found a collision with " + t.name);
                    done = false;
                    break;
                }
            }
        }
        console.log("Renamed to " + token.name);
        token.document.update({ "name": name });

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

Tools.requestedSkillCheck = async function(skillFqn, skillOptions) {
    game.mgt2e.rollSkillMacro(skillFqn, {
        "cha": skillOptions.cha,
        "difficulty": skillOptions.difficulty,
        "description": skillOptions.description,
        "success": skillOptions.success,
        "failure": skillOptions.failure
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

Tools.showSkills = function(chatData) {
    const user = game.users.current;
    const selected = canvas.tokens.controlled;

    console.log(selected);

    if (selected.length === 0) {
        ui.notifications.error("You need to select a token");
        return;
    } else if (selected.length > 1) {
        ui.notifications.error("You must have only one token selected");
        return;
    }

    let token = selected[0];
    let name = token.data.name;
    console.log(name);

    let text = `<h1>${name}</h1>`;

    let actorId = token.data.actorId;
    let actor = game.actors.get(actorId);
    if (!actor) {
        ui.notifications.error("Unable to find actor " + actorId);
        return;
    }
    let skills = actor.system.skills;

    console.log(skills);

    for (let skill in skills) {
        text += `${skills[skill].label}<br/>`;
//        text += `${skill.label}<br/>`;
    }

    this.message(chatData, text);
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
        } else {
            console.log(type);
        }
    } catch (e) {
        console.log(e);
    }
}

Tools.actorInlineDisplay = function(actorId) {
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
    console.log(actor);

    if (actor.type === "creature") {
        Tools.creatureInlineDisplay(a, actor);
    } else if (actor.type === "npc") {
        Tools.npcInlineDisplay(a, actor);
    } else {
        a.innerHTML = `Currently only supports NPCs`;
    }
    return a;
}

Tools.creatureInlineDisplay = function(a, actor) {
    let html = `<div class="inline-creature actor-link" data-actor-id="${actor.uuid}">`;
    html += `<h2>${actor.name}</h2>`;
    html += `<img src="${actor.img}"/>`;
    html += `${actor.system.description}`;

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

Tools.npcInlineDisplay = function(a, actor) {
    let html = `<div class="inline-actor"><img class="portrait" src="${actor.img}"/>`;
    html += `<span class="actor-link rollable name" data-actor-id="${actor._uuid}">${actor.name}</span>`;
    html += `<span class="profession">${actor.system.sophont.profession}</span>`;

    html += `<div style="clear: left"/>`;

    html += `<div class="grid grid-3col actor-link" data-actor-id="${actor._uuid}">`;
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
    html += `</div></div>`;

    a.innerHTML = html;

    return a;
}

Tools.internalExecutionButton = function(macroName, argsString, title, flavor) {
    const a = document.createElement("a");
    a.classList.add("inline-mgt2e-execution");
    a.dataset.macroName = macroName;
    a.dataset.args = argsString;
    a.innerHTML = `<i class="fas fa-dice"></i> ${flavor ?? title}`;
    a.innerHTML = `<span class="internal-macro"><i class="fas fa-dice"></i> ${flavor ?? title}</span>`;
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
        } else if (macroName === "damage") {
            MgT2eMacros.damage(args);
        } else if (macroName === "item") {
            MgT2eMacros.createItem(args);
        } else if (macroName === "associate") {
            MgT2eMacros.createAssociate(args);
        }
    } catch (e) {
        ui.notifications.error(e.error);
        throw e;
    }
};
