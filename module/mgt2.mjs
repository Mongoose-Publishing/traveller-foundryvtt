// Import document classes.
import { MgT2Actor } from "./documents/actor.mjs";
import { MgT2Item } from "./documents/item.mjs";
// Import sheet classes.
import { MgT2ActorSheet } from "./sheets/actor-sheet.mjs";
import { MgT2ItemSheet } from "./sheets/item-sheet.mjs";
import { MgT2EffectSheet } from "./sheets/effect-sheet.mjs";

// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { MGT2 } from "./helpers/config.mjs";
import { Tools } from "./helpers/chat/tools.mjs";
import { rollSkill } from "./helpers/dice-rolls.mjs";
import {MgT2DamageDialog} from "./helpers/damage-dialog.mjs";
import {MgT2Effect} from "./documents/effect.mjs";


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

    game.settings.register('mgt2', 'verboseSkillRolls', {
        name: game.i18n.localize("MGT2.Settings.Verbose.Name"),
        hint: game.i18n.localize("MGT2.Settings.Verbose.Hint"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        onChange: value => {
            console.log(`Setting verboseSkillRolls to ${value}`)
        }
    });
    game.settings.register('mgt2', 'useChatIcons', {
        name: game.i18n.localize("MGT2.Settings.ChatIcons.Name"),
        hint: game.i18n.localize("MGT2.Settings.ChatIcons.Hint"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        onChange: value => {
            console.log(`Setting iconsInChat to ${value}`)
        }
    });
    game.settings.register('mgt2', 'quickRolls', {
        name: game.i18n.localize("MGT2.Settings.QuickRolls.Name"),
        hint: game.i18n.localize("MGT2.Settings.QuickRolls.Hint"),
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        onChange: value => {
            console.log(`Setting quickRolls to ${value}`)
        }
    });

  // Add custom constants for configuration.
  CONFIG.MGT2 = MGT2;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "2d6 - 8 + @initiative",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = MgT2Actor;
  CONFIG.Item.documentClass = MgT2Item;
  CONFIG.ActiveEffect.documentClass = MgT2Effect;

  console.log(CONFIG);

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("mgt2", MgT2ActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("mgt2", MgT2ItemSheet, { makeDefault: true });
  DocumentSheetConfig.unregisterSheet(ActiveEffect, "core", ActiveEffectConfig);
  DocumentSheetConfig.registerSheet(ActiveEffect, "mgt2", MgT2EffectSheet, { makeDefault: true});
//  ActiveEffects.unregisterSheet("core", ActiveEffectSheet);
//  ActiveEffects.registerSheet("mgt2", MgT2EffectSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

Hooks.on('renderChatMessage', function(app, html) {
    const damageMessage = html.find(".damage-message")[0];
    if (damageMessage) {
        damageMessage.setAttribute("draggable", true);

        let dmg = damageMessage.getAttribute("data-damage");

        let dragData = {
            type: "Damage",
            laser: false,
            ap: parseInt(damageMessage.getAttribute("data-ap")),
            damage: parseInt(damageMessage.getAttribute("data-damage"))
        }

        damageMessage.addEventListener("dragstart", ev => {
            return ev.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        });
    }

    const uppMessage = html.find(".upp-data")[0];
    if (uppMessage) {
        uppMessage.setAttribute("draggable", true);
        let dragData = {
            type: "UPP",
            STR: parseInt(uppMessage.getAttribute("data-STR")),
            DEX: parseInt(uppMessage.getAttribute("data-DEX")),
            END: parseInt(uppMessage.getAttribute("data-END")),
            INT: parseInt(uppMessage.getAttribute("data-INT")),
            EDU: parseInt(uppMessage.getAttribute("data-EDU")),
            SOC: parseInt(uppMessage.getAttribute("data-SOC"))
        }
        uppMessage.addEventListener("dragstart", ev => {
            return ev.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        });
    }
});

Hooks.on('ready', () => {
   $(document).on('click', '.damage-button', function() {
       let dmg = $(this).data('damage');
       let ap = $(this).data("ap");
       let tl = $(this).data("tl");
       let options = $(this).data("options");
       let traits = $(this).data("traits");

       Tools.applyDamage(dmg, ap, tl, options, traits);
   });
});

Hooks.on("chatMessage", function(chatlog, message, chatData) {
    if (message.indexOf("/upp") === 0) {
        let args = message.split(" ");
        args.shift();
        Tools.upp(chatData, args);
        return false;
    } else if (message.indexOf("/damage") === 0) {
        let args = message.split(" ");
        args.shift();
        Tools.damage(chatData, args);
        return false;
    } else if (message.indexOf("/showskills") === 0) {
        Tools.showSkills(chatData);
        return false;
    }

    return true;
});

Hooks.on("preUpdateActor", (actor, data, options, userId) => {
   console.log("Actor about to change");
   console.log(actor);
   console.log(data);

   if (data.data.hits) {
       // This is an NPC or Creature
   } else if (data.data.damage) {
       // This is a PC.
   }
});

Hooks.on("preUpdateToken", (token, data, moved) => {
    console.log("Token about to change event");

    if (data && data.actorData && data.actorData.data && data.actorData.data.hits) {
        // NPC or Creature has had its HITS changed.

        let actorId = token.data.actorId;
        let actor = token._actor;
        console.log(token.data.name);

        let name = token.data.name;
        let max = token.data.actorData.data.hits.max[0];
        let half = parseInt(max / 2);
        let tenth = parseInt(max / 10);
        let message = null;
        let value = data.actorData.data.hits.value;
        let oldValue = token.data.actorData.data.hits.value;
        console.log(`NPC Token hits changing to ${value}/${max} from ${oldValue}`);

        let isOkay = false, isInjured = false, isUnconscious = false, isDead = false, isDestroyed = false;

        if (value < oldValue) {
            // Damage.
            let damage = oldValue - value;
            if (damage > max) {
                // More damage than they have hits.
                message = game.i18n.format("MGT2.Damage.MassiveDamage", { 'name': name});
            } else if (damage > half) {
                // More than half their hits in a single blow.
                message = game.i18n.format("MGT2.Damage.HeavyDamage", { 'name': name});
            } else if (damage > 2 * tenth) {
                message = game.i18n.format("MGT2.Damage.ModerateDamage", { 'name': name});
            } else {
                message = game.i18n.format("MGT2.Damage.LightDamage", { 'name': name});
            }
            message += " ";
            if (value <= 0) {
                isDead = true;
                if (oldValue > 0) {
                    message += game.i18n.format("MGT2.Damage.Killed");
                } else {
                    message += game.i18n.format("MGT2.Damage.EvenMoreDead");
                }
            } else if (value <= tenth) {
                isUnconscious = true;
                if (oldValue > tenth) {
                    message += game.i18n.format("MGT2.Damage.KnockedOut");
                } else {
                    message += game.i18n.format("MGT2.Damage.StillOut");
                }
            } else if (value <= half) {
                isInjured = true;
                if (oldValue > half) {
                    message += game.i18n.format("MGT2.Damage.Hurt");
                } else {
                    message += game.i18n.format("MGT2.Damage.StillHurt");
                }
            } else {
                isOkay = true;
            }
        } else {
            // Healing.
            message = "is feeling better";
        }
        let tokenObject = token.object;
        if (isDestroyed) {
            tokenObject.toggleEffect("systems/mgt2/icons/effects/destroyed.svg", { "overlay": true, "active": true });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/dead.svg", { "overlay": true, "active": false });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/unconscious.svg", { "overlay": true, "active": false });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/injured.svg", { "overlay": false, "active": false });
        } else if (isDead) {
            tokenObject.toggleEffect("systems/mgt2/icons/effects/dead.svg", { "overlay": true, "active": true });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/unconscious.svg", { "overlay": true, "active": false });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/injured.svg", { "overlay": false, "active": false });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/destroyed.svg", { "overlay": true, "active": false });
        } else if (isUnconscious) {
            tokenObject.toggleEffect("systems/mgt2/icons/effects/unconscious.svg", { "overlay": true, "active": true });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/dead.svg", { "overlay": true, "active": false });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/injured.svg", { "overlay": false, "active": false });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/destroyed.svg", { "overlay": true, "active": false });
        } else if (isInjured) {
            tokenObject.toggleEffect("systems/mgt2/icons/effects/injured.svg", { "overlay": false, "active": true });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/dead.svg", { "overlay": true, "active": false });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/unconscious.svg", { "overlay": true, "active": false });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/destroyed.svg", { "overlay": true, "active": false });
        } else {
            tokenObject.toggleEffect("systems/mgt2/icons/effects/dead.svg", { "overlay": true, "active": false });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/unconscious.svg", { "overlay": true, "active": false });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/injured.svg", { "overlay": false, "active": false });
            tokenObject.toggleEffect("systems/mgt2/icons/effects/destroyed.svg", { "overlay": true, "active": false });
        }

        let text = "<div class='damaged-token'>";
        if (game.settings.get("mgt2", "useChatIcons")) {
            text += `<img class='skillcheck-thumb' src='${actor.thumbnail}'/>`;
        }
        text += message;
        text += "</div>";

        let chatData = {
            user: game.user.id,
            speaker: {
              "actor": actorId,
              "token": token.data._id
            },
            content: text
        }
        ChatMessage.create(chatData, {});

    }
});

Hooks.once("ready", async function() {
    Hooks.on("hotbarDrop", (bar, data, slot) => createTravellerMacro(data, slot));
});

Hooks.on("applyActiveEffect", (actor, effectData) => {
   console.log("hook.applyActiveEffect:");
   console.log(actor);
   console.log(effectData);

   const actorData = actor.data.data;
   let key = effectData.KEY;
   let value = effectData.value;
   let type = effectData.effect.data.flags.augmentType;

   console.log(type);

   if (type === "chaAug") {

   }

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

  if (game.settings.get("mgt2", "quickRolls")) {
      rollSkill(actor, skillName);
  } else {
      new MgT2SkillDialog(actor, skillName).render(true);
  }

}

function updateData(dmg, ap) {
    console.log("Doing it here");
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

Handlebars.registerHelper('isTrained', function(skill) {
    if (skill) {
        if (skill.trained) {
            return true;
        }
    }
    return false;
});

Handlebars.registerHelper('ifEquals', function(arg1, arg2) {
   return arg1 == arg2;
});

/**
 * Given an active effect, display the key in a readable form.
 */
Handlebars.registerHelper('effect', function(key) {
    if (key && key.startsWith("data.characteristics")) {
        key = key.replaceAll(/[a-z.]/g, "");
        return key;
    } else if (key && key.startsWith("data.skills")) {
        let skills = game.system.template.Actor.templates.skills.skills;
        key = key.replaceAll(/\.[a-z]*$/g, "");
        key = key.replaceAll(/data.skills./g, "");
        let skill = key.replaceAll(/\..*/g, "");
        if (key.indexOf(".specialities") > -1) {
            let spec = key.replaceAll(/.*\./g, "");
            return skills[skill].label + " (" + skills[skill].specialities[spec].label + ")";
        } else {
            return skills[skill].label;
        }
    }
    return key;
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
});
