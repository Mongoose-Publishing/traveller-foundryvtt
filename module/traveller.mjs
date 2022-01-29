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

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
});
