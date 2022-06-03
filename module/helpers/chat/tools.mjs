
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
    chatData.
    ChatMessage.create(chatData);
}

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
    let dmg = parseInt(args.shift());
    let ap = 0;
    let isLaser = false;
    let isStun = false;

    if (!isNaN(args[0])) {
        ap = parseInt(args.shift());
    }

    if (targets.size == 0) {
        Tools.message(chatData, "No tokens are selected");
        return;
    }

    for (let target of targets.values()) {
        console.log(target.data.name);

        let linked = target.data.actorLink;
        let type = target.data.document._actor.data.type;

        console.log(type);

        if (type == "traveller") {
            // This is a Traveller, which has a complex damage system.
        } else {
            // This is the simple case for NPCs and Creatures.

        }

    }


};
