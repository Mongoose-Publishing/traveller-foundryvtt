import {hasTrait, getTraitValue} from "../dice-rolls.mjs";
import {Physics} from "./physics.mjs";
import {MgT2DamageDialog} from "../damage-dialog.mjs";

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

// Apply damage to an actor. Needs to calculate armour.
Tools.applyDamageTo = function(damage, ap, tl, options, traits, actor, token) {
    console.log("************************************")
    console.log("* Tools.applyDamageTo (DEPRECATED) *")
    console.log("************************************")
    let text = "";

    if (!options) {
        options = "";
    }
    if (!damage) {
        damage = 0;
    }
    if (!ap) {
        ap = 0;
    }
    if (!tl) {
        tl = 0;
    }
    if (!actor) {
        return;
    }

    console.log(`applyDamageTo: ${damage} AP ${ap} TL ${tl} (${options}) (${traits})`);

    let data = actor.system;
    let isRanged = true;
    let armour = 0;

    if (data.armour) {
        armour = parseInt(data.armour.protection);
        if (options !== "") {
            console.log(data.armour);
            if (data.armour.otherTypes && data.armour.otherTypes.indexOf(options) > -1) {
                armour += data.armour.otherProtection?parseInt(data.armour.otherProtection):0;
            }
        }
        armour = Math.max(0, armour);
    }
    if (hasTrait(traits, "lo-pen")) {
        let lopen = getTraitValue(traits, "lo-pen");
        if (lopen > 1) {
            armour *= lopen;
        }
    }
    if (data.armour && data.armour.archaic && isRanged && tl > data.armour.tl) {
        // Archaic armour gets halved.
        armour = parseInt(Math.round(armour / 2));
    }
    armour = Math.max(0, armour - ap);
    let actualDamage = Math.max(0, damage - armour);

    let stun = hasTrait(traits, "stun");

    if (actor.type === "traveller") {
        // Travellers don't have hits
        let remaining = actualDamage;
        // Damage always comes off END first.
        if (data.damage.END.value < data.characteristics.END.value) {
            remaining = Tools.applyDamageToCha(remaining, data, "END", stun);
        }
        // Now select either STR or DEX. Select the lowest as long as it doesn't take
        // the characteristic to zero.
        if (remaining > 0) {
            let str = data.characteristics.STR.current;
            if (str <= data.characteristics.DEX.current && str > remaining) {
                remaining = Tools.applyDamageToCha(remaining, data, "STR");
                Tools.applyDamageToCha(remaining, data, "DEX");
            } else {
                remaining = Tools.applyDamageToCha(remaining, data, "DEX");
                Tools.applyDamageToCha(remaining, data, "STR");
            }
        }
        actor.update({"data.damage": data.damage});
        return;
    } else {
        if (!data.hits.damage) {
            data.hits.damage = 0;
        }
        data.hits.damage += actualDamage;
        data.hits.value = parseInt(data.hits.max) - parseInt(data.hits.damage);
        if (stun) {
            data.hits.tmpDamage += actualDamage;
        }
        if (data.hits.tmpDamage > data.hits.damage) {
            data.hits.tmpDamage = data.hits.damage;
        }
        if (stun && data.characteristics) {
            if (data.hits.tmpDamage > data.characteristics.END.value) {
                let remaining = data.hits.tmpDamage - data.characteristics.END.value;
                actor.setFlag("mgt2e", "stunned", true);
                actor.setFlag("mgt2e", "stunnedRounds",
                    actor.getFlag("mgt2e", "stunnedRounds")?
                        parseInt(actor.getFlag("mgt2e", "stunnedRounds"))+remaining:remaining);
            }
        }
    }
    actor.update({"system.hits": data.hits});
}

// Called from a button press in damage output in the chat.
Tools.applyDamageToTokens = function(damage, damageOptions) {
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
}

// Called from a chat command.
Tools.damage = function(chatData, args) {
    if (args.length < 1) {
        ui.notifications.error("You must at least specify the amount of damage");
        return;
    }
    let damage = parseInt(args.shift());
    let damageOptions = { "traits": ""};
    while (args.length > 0) {
        if (args[0] === "noui") {
            damageOptions.noUI = true;
            args.shift();
            continue;
        }
        damageOptions.traits += args.shift();
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