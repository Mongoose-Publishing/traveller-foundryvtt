// Import document classes.
import { TravellerActor } from "./documents/actor.mjs";
import { TravellerItem } from "./documents/item.mjs";
// Import sheet classes.
import { TravellerActorSheet } from "./sheets/actor-sheet.mjs";
import { TravellerItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { TRAVELLER } from "./helpers/config.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.traveller = {
    TravellerActor,
    TravellerItem
  };

  // Add custom constants for configuration.
  CONFIG.TRAVELLER = TRAVELLER;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "2d6",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = TravellerActor;
  CONFIG.Item.documentClass = TravellerItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("traveller", TravellerActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("traveller", TravellerItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

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
