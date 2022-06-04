
export const Tools = {};

Tools.upp = function(chatData, args) {
    let text = `<div class="tools">`;

    let extra = 0;

    if (args.length > 0) {
        extra = Math.max(0, parseInt(args.shift()));
    }
    text += `<h3>UPP ${(extra>0)?" (with "+extra+" extra rolls)":""}</h3>`;

    let rolls = [];

    for (let i=0; i < 6; i++) {
        const roll = new Roll("2d6").evaluate({async: false});
        rolls[i] = roll.total;
    }
    while (extra-- > 0) {
        const roll = new Roll("2d6").evaluate({async: false});
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

    for (let i=0; i < 6; i++) {
        text += `<span class="skill-roll">${rolls[i]}</span> `;
    }
    text += `</div>`;

    chatData.content = text;
    ChatMessage.create(chatData);
};

Tools.message = function(chatData, message) {
    chatData.content = message;
    ChatMessage.create(chatData);
}

// Apply damage to an actor. Needs to calculate armour.
Tools.applyDamageTo = function(damage, ap, tl, options, actor) {
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

    console.log(`applyDamageTo: ${damage} AP ${ap} TL ${tl} (${options})`);

    let isLaser = options.indexOf("laser") > -1;
    let isPlasma = options.indexOf("plasma") > -1;
    let isEnergy = options.indexOf("energy") > -1;
    let isPsi = options.indexOf("psi") > -1;
    let isRanged = true;

    let data = actor.data.data;

    let armour = data.armour.protection;
    if (isLaser && data.armour.laser > armour) {
        armour = data.armour.laser;
    } else if (isPlasma && data.armour.plasma > armour) {
        armour = data.armour.plasma;
    } else if (isEnergy && data.armour.energy > armour) {
        armour = data.armour.energy;
    } else if (isPsi && data.armour.psi > armour) {
        armour = data.armour.psi;
    }
    if (data.armour.archaic && isRanged && tl > data.armour.tl) {
        // Archaic armour gets halved.
        armour = parseInt(Math.round(armour / 2));
    }
    armour = Math.max(0, armour - ap);
    damage = Math.max(0, damage - armour);

    console.log("HITS: " + data.hits.value);
    console.log("DAMAGE: " + damage);
    data.hits.value = Math.max(0, data.hits.value - damage);
    actor.update({ "data.hits": data.hits });
}

// Called from a button press in damage output in the chat.
Tools.applyDamage = function(damage, ap, tl, options) {
    console.log("Tools.applyDamage:");
    const user = game.users.current;


    const targets = user.targets;
    for (let target of targets.values()) {
        Tools.applyDamageTo(damage, ap, tl, options, target.actor);
    }
        console.log(targets);
}

// Called from a chat command.
Tools.damage = function(chatData, args) {
    let text=`<div class="tools">`;

    console.log("damage:");

    console.log("chatData:");
    console.log(chatData);
    console.log("game:");
    console.log(game);

    const user = game.users.current;
    console.log("User name: " + user.name);

    const targets = user.targets;
    console.log(targets);


    if (args.length < 1) {
        Tools.message(chatData, "You must at least specify the amount of damage");
        return;
    }
    let damage = parseInt(args.shift());
    let ap = 0;
    let tl = 0;
    let options = "";

    if (!isNaN(args[0])) {
        ap = parseInt(args.shift());
    }

    if (targets.size == 0) {
        Tools.message(chatData, "No tokens are selected");
        return;
    }

    for (let target of targets.values()) {
        let name = target.data.name;

        let linked = target.data.actorLink;
        let type = target.data.document._actor.data.type;

        console.log(type);

        console.log(name)
        console.log(target.actor.data);

        Tools.applyDamageTo(damage, ap, tl, options, target.actor);

        //if (type == "traveller") {

    }


};
