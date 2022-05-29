// Import document classes.
import { MgT2Actor } from "./documents/actor.mjs";
import { MgT2Item } from "./documents/item.mjs";
// Import sheet classes.
import { MgT2ActorSheet } from "./sheets/actor-sheet.mjs";
import { MgT2ItemSheet } from "./sheets/item-sheet.mjs";

// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { MGT2 } from "./helpers/config.mjs";
import { Physics } from "./helpers/chat/physics.mjs";
import { rollSkill } from "./helpers/dice-rolls.mjs";


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.mgt2 = {
    MgT2Actor,
    MgT2Item,
    rollSkillMacro
  };

  // Add custom constants for configuration.
  CONFIG.MGT2 = MGT2;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "2d6 - 8",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = MgT2Actor;
  CONFIG.Item.documentClass = MgT2Item;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("mgt2", MgT2ActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("mgt2", MgT2ItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

Hooks.on("chatMessage", function(chatlog, message, chatData) {
    console.log(`My message was "${message}".`);
    console.log(chatData);

    if (message.indexOf("/phy") == 0) {
        let args = message.split(" ");
        args.shift()

        if (args.length === 0) {
            Physics.help(chatData);
            return false;
        } else if ("planet".startsWith(args[0])) {
            args.shift();
            Physics.planetCommand(chatData, args);
            return false;
        } else if ("thrust".startsWith(args[0])) {
            args.shift();
            Physics.thrustCommand(chatData, args);
            return false;
        } else if ("ethrust".startsWith(args[0])) {
            args.shift();
            Physics.eThrustCommand(chatData, args);
            return false;
        } else if ("rocket".startsWith(args[0])) {
            args.shift();
            Physics.rocketCommand(chatData, args);
            return false;
        } else if ("apitest".startsWith(args[0])) {
            args.shift();
            Physics.getSector(chatData, args);
            return false;
        }

        chatData.content = `<div class="physics">Unre`;
        chatData.type = 1;
        ChatMessage.create(chatData);
        return false;
    }
    return;
});

Hooks.once("ready", async function() {
    Hooks.on("hotbarDrop", (bar, data, slot) => createTravellerMacro(data, slot));
});

// Dropping a skill on the macro bar. An entire skill tree is dragged,
// not just a speciality.
async function createTravellerMacro(data, slot) {
    console.log("createTravellerMacro:");
    console.log(data);
    console.log(slot);
    let actorId = data.actorId;
    let dragData = data.data;

    if (dragData.dragType === "skill") {
        console.log("Have dragged a skill " + dragData.skillName);

        let actor = game.data.actors.find(a => (a._id === actorId));
        let skill = actor.data.skills[dragData.skillName];
        let label = skill.label;

        const command = `game.mgt2.rollSkillMacro('${dragData.skillName}')`;
        let macro = null; //game.macros.entries.find(m => (m.name === dragData.skillName));
        if (!macro) {
            macro = await Macro.create({
                name: label,
                type: "script",
                command: command,
                img: skill.icon
            });
        }
        game.user.assignHotbarMacro(macro, slot);
        return false;
    }

}

function rollSkillMacro(skillName) {
  console.log("rollSkillMacro: " + skillName);

  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) {
      console.log("We have a token");
      actor = game.actors.tokens[speaker.token];
  }
  if (!actor) {
      console.log("No actor yet");
      actor = game.actors.get(speaker.actor);
  }
  if (!actor) {
      console.log("No actor ever");
      return;
  }
  console.log(actor.name);

  let cha;
  if (actor.type == "traveller" || actor.type == "npc") {
      cha = actor.data.data.skills[skillName].default;
  }

  rollSkill(actor, skillName);

}

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('isChaShown', function(data, ch) {
    if (data.characteristics[ch]) {
        return data.characteristics[ch].show;
    } else {
        return false;
    }
});

Handlebars.registerHelper('defaultSkill', function(data) {
    if (data && data.skills && data.skills.jackofalltrades && data.skills.jackofalltrades.trained) {
        let dm = data.skills.jackofalltrades.value - 3;
        return (dm > 0)?0:dm;
    } else {
        return -3;
    }
});

Handlebars.registerHelper('showSpec', function(data, spec) {
    if (spec && spec.value && parseInt(spec.value) > 0) {
        return "inline-block";
    }
    return "hidden";
});


Handlebars.registerHelper('skillLabel', function(data, skill, spec) {
    if (data && data.skills && skill) {
        let cha = skill.default;
        let type = "";

        if (data.settings.rollType === "boon") {
            type = " [Boon]";
        } else if (data.settings.rollType === "bane") {
            type = " [Bane]";
        }

        const chars = data.characteristics;
        for (let ch in chars) {
            if (chars[ch].default) {
                cha = ch;
                break;
            }
        }

        if (skill.trained) {
            if (spec) {
                return cha + " + " + skill.label + " (" + spec.label + ")" + type;
            } else {
                return cha + " + " + skill.label + type;
            }
        } else {
            return cha + " + " + skill.label + " (untrained)" + type;
        }
    } else {
        return "Roll";
    }
});

Handlebars.registerHelper('skillRollable', function(data, skill, spec) {
    if (data && data.skills && skill) {
        let cha = skill.default;
        let dice = "2d6";

        if (data.settings.rollType === "boon") {
            dice="3d6k2";
        } else if (data.settings.rollType === "bane") {
            dice="3d6kl2";
        }

        const chars = data.characteristics;
        for (let ch in chars) {
            if (chars[ch].default) {
                cha = ch;
                break;
            }
        }
        let chaDM = data[cha];

        if (skill.trained) {
            let value = skill.value;
            let label = skill.label;
            if (spec) {
                value = spec.value;
                label = spec.label;
            }

            return dice + " + @" + cha + "["+cha+"] + " + value + "[" + label + "]";
        } else {
            let untrained = -3;
            if (data.skills && data.skills.jackofalltrades &&
                data.skills.jackofalltrades.trained) {
                untrained += data.skills.jackofalltrades.value;
            }

            return dice + " + @" + cha + "["+cha+"] + " + untrained + "[untrained]";
        }
    } else {
        return "2d6[Undefined]";
    }
});

Handlebars.registerHelper('boonDice', function(data) {
    if (data && data.settings) {
        let dice = "2d6";

        if (data.settings.rollType === "boon") {
            dice="3d6k2";
        } else if (data.settings.rollType === "bane") {
            dice="3d6kl2";
        }
        return dice;
    } else {
        return "2d6";
    }
});

Handlebars.registerHelper('boonLabel', function(data) {
    if (data && data.settings) {
        let label = "";

        if (data.settings.rollType === "boon") {
            label=" [Boon]";
        } else if (data.settings.rollType === "bane") {
            label = " [Bane]";
        }
        return label;
    } else {
        return "";
    }
});

Handlebars.registerHelper('rollType', function(data, type) {
    if (type === data.settings.rollType) {
        return "rollTypeActive";
    }
    return "rollType";
});

Handlebars.registerHelper('rollTypeActive', function(data, type) {
    if (type === data.settings.rollType) {
        return "checked";
    }
    return "";
});



/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
});
