// Import document classes.
// noinspection JSUnresolvedVariable,JSUnresolvedFunction

import { MgT2Actor } from "./documents/actor.mjs";
import { MgT2Item } from "./documents/item.mjs";
// Import sheet classes.
import { MgT2ActorSheet } from "./sheets/actor-sheet.mjs";
import { MgT2NPCActorSheet } from "./sheets/actor-sheet.mjs";
import { MgT2CreatureActorSheet } from "./sheets/actor-sheet.mjs";
import { MgT2ItemSheet } from "./sheets/item-sheet.mjs";
import { MgT2EffectSheet } from "./sheets/effect-sheet.mjs";

// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { MGT2 } from "./helpers/config.mjs";
import { Tools } from "./helpers/chat/tools.mjs";
import { rollSkill } from "./helpers/dice-rolls.mjs";
import { skillLabel } from "./helpers/dice-rolls.mjs";
import {MgT2Effect} from "./documents/effect.mjs";
import { migrateWorld } from "./migration.mjs";
import { NpcIdCard } from "./helpers/id-card.mjs";



/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
    game.mgt2e = {
        MgT2Actor,
        MgT2Item,
        rollSkillMacro,
        rollAttackMacro
    };

    game.settings.register("mgt2e", "systemSchemaVersion", {
        config: false,
        scope: "world",
        type: Number,
        default: 0
    });

    game.settings.register('mgt2e', 'verboseSkillRolls', {
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
    game.settings.register('mgt2e', 'useChatIcons', {
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
    game.settings.register('mgt2e', 'useEncumbrance', {
        name: game.i18n.localize("MGT2.Settings.UseEncumbrance.Name"),
        hint: game.i18n.localize("MGT2.Settings.UseEncumbrance.Hint"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    game.settings.register('mgt2e', 'quickRolls', {
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
    game.settings.register('mgt2e', 'skillColumns', {
        name: game.i18n.localize("MGT2.Settings.SkillColumns.Name"),
        hint: game.i18n.localize("MGT2.Settings.SkillColumns.Hint"),
        scope: 'client',
        config: true,
        type: String,
        choices: {
            "2": game.i18n.localize("MGT2.Settings.SkillColumns.Values.Two"),
            "3": game.i18n.localize("MGT2.Settings.SkillColumns.Values.Three")
        },
        default: "3"
    });
    game.settings.register('mgt2e', 'skillFormat', {
        name: game.i18n.localize("MGT2.Settings.SkillFormat.Name"),
        hint: game.i18n.localize("MGT2.Settings.SkillFormat.Hint"),
        scope: 'client',
        config: true,
        type: String,
        choices: {
            "rows": game.i18n.localize("MGT2.Settings.SkillFormat.Values.Rows"),
            "columns": game.i18n.localize("MGT2.Settings.SkillFormat.Values.Columns")
        },
        default: "columns"
    });

    game.settings.register('mgt2e', 'currentYear', {
       name: game.i18n.localize("MGT2.Settings.CurrentYear.Name"),
       hint: game.i18n.localize("MGT2.Settings.CurrentYear.Hint"),
       scope: 'world',
       config: true,
       type: Number,
       default: 1105
    });
    game.settings.register('mgt2e', 'currentDay', {
        name: game.i18n.localize("MGT2.Settings.CurrentDay.Name"),
        hint: game.i18n.localize("MGT2.Settings.CurrentDay.Hint"),
        scope: 'world',
        config: true,
        type: Number,
        default: 1
    });
    game.settings.register('mgt2e', 'autoResizeSpacecraft', {
        name: game.i18n.localize("MGT2.Settings.AutoResizeSpacecraft.Name"),
        hint: game.i18n.localize("MGT2.Settings.AutoResizeSpacecraft.Hint"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    game.settings.register('mgt2e', 'playerSheetNotification', {
        name: game.i18n.localize("MGT2.Settings.PlayerSheetNotification.Name"),
        hint: game.i18n.localize("MGT2.Settings.PlayerSheetNotification.Hint"),
        scope: 'world',
        config: true,
        choices: {
            "private": game.i18n.localize("MGT2.Settings.SheetNotification.Values.Private"),
            "public": game.i18n.localize("MGT2.Settings.SheetNotification.Values.Public"),
            "gm": game.i18n.localize("MGT2.Settings.SheetNotification.Values.GM")
        },
        default: "gm"
    });
    game.settings.register('mgt2e', 'gmSheetNotification', {
        name: game.i18n.localize("MGT2.Settings.GMSheetNotification.Name"),
        hint: game.i18n.localize("MGT2.Settings.GMSheetNotification.Hint"),
        scope: 'world',
        config: true,
        choices: {
            "private": game.i18n.localize("MGT2.Settings.SheetNotification.Values.Private"),
            "public": game.i18n.localize("MGT2.Settings.SheetNotification.Values.Public")
        },
        default: "private"
    });

  // Add custom constants for configuration.
  CONFIG.MGT2 = MGT2;
  console.log(CONFIG);

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "2d6 - 8 + @initiative.value",
    decimals: 0
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = MgT2Actor;
  CONFIG.Item.documentClass = MgT2Item;
  CONFIG.ActiveEffect.documentClass = MgT2Effect;

  //CONFIG.debug.hooks = true;
  //console.log(CONFIG);

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("mgt2e", MgT2ActorSheet, { label: "Traveller Sheet", makeDefault: true });
  Actors.registerSheet("mgt2e", MgT2NPCActorSheet, { label: "NPC Sheet", types: [ "npc"], makeDefault: false });
  Actors.registerSheet("mgt2e", MgT2CreatureActorSheet, { label: "Creature Sheet", types: [ "creature"], makeDefault: false });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("mgt2e", MgT2ItemSheet, { label: "Item Sheet", makeDefault: true });
  DocumentSheetConfig.unregisterSheet(ActiveEffect, "core", ActiveEffectConfig);
  DocumentSheetConfig.registerSheet(ActiveEffect, "mgt2e", MgT2EffectSheet, { makeDefault: true});
//  ActiveEffects.unregisterSheet("core", ActiveEffectSheet);
//  ActiveEffects.registerSheet("mgt2e", MgT2EffectSheet, { makeDefault: true });


    // Sockets
    game.socket.on("system.mgt2e", (data) => {
       if (data.type === "showIdCard") {
           let actor = data.actor;
           new NpcIdCard(actor).render(true);
       }
    });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});


Hooks.on('renderChatMessage', function(app, html) {
    const damageMessage = html.find(".damage-message")[0];
    if (damageMessage) {
        damageMessage.setAttribute("draggable", true);

        let dragData = {
            type: "Damage",
            laser: false,
            ap: parseInt(damageMessage.getAttribute("data-ap")),
            damage: parseInt(damageMessage.getAttribute("data-damage")),
            traits: damageMessage.getAttribute("data-traits"),
            vers: damageMessage.getAttribute("data-vers"),
            options: damageMessage.getAttribute("data-options"),
            tl: parseInt(damageMessage.getAttribute("data-tl"))
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
    if (game.user.isGM) {
        // Do we need to run a migration?
        const LATEST_SCHEMA_VERSION = 7;
        const currentVersion = parseInt(game.settings.get("mgt2e", "systemSchemaVersion"));
        console.log(`Schema version is ${currentVersion}`);
        if (!currentVersion || currentVersion < LATEST_SCHEMA_VERSION) {
            migrateWorld(currentVersion);
            game.settings.set("mgt2e", "systemSchemaVersion", LATEST_SCHEMA_VERSION);
        }
    }
    // Need to add click event to all existing chat damage buttons.
   $(document).on('click', '.damage-button', function() {
       let dmg = $(this).data('damage');
       let damageOptions = $(this).data("options");

       Tools.applyDamageToTokens(dmg, damageOptions);
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
    } else if (message.indexOf("/renumber") === 0) {
        Tools.renumber();
        return false;
    } else if (message.indexOf("/time") === 0) {
        let args = message.split(" ");
        args.shift();
        Tools.currentTime(chatData, args);html
        return false;
    } else if (message.indexOf("/status") === 0) {
        let args = message.split(" ");
        args.shift();
        Tools.setStatus(chatData, args);
        return false;
    }

    return true;
});

Hooks.on("createItem", (item) => {
    if (item.img === "icons/svg/item-bag.svg") {
        if (item.type === "weapon") {
            item.img = "systems/mgt2e/icons/items/gun-slug.svg";
        } else if (item.type === "armour") {
            item.img = "systems/mgt2e/icons/items/armour-light.svg";
        } else if (item.type === "augment") {
            item.img = "systems/mgt2e/icons/items/cybernetic.svg";
        } else if (item.type === "cargo") {
            item.img = "systems/mgt2e/icons/cargo/cargo.svg";
        } else if (item.type === "term") {
            item.img = "systems/mgt2e/icons/misc/career.svg";
        } else {
            item.img = "systems/mgt2e/icons/items/item.svg";
        }
        item.update({ "img": item.img });
    }
});



/**
 * Fired after actor has been created from data in template.json.
 * We need to fill in from CONFIG structures. We need to do it this
 * way since V12, since we can't access the template.json in V12.
 */
Hooks.on("createActor", (actor) => {
    console.log("createActor:");

    // Copy in characteristics where needed.
    if (actor.type === "traveller" || actor.type === "npc" || actor.type === "package") {
        // Need to add characteristics. We want them in a specific order, otherwise
        // they get sorted alphabetically.
        for (let c of [
            "STR", "DEX", "END", "INT", "EDU", "SOC",
            "CHA", "TER", "PSI", "WLT", "LCK", "MRL",
            "STY", "RES", "FOL", "REP" ]) {

            if (actor.system.characteristics[c]) {
                continue;
            }
            actor.system.characteristics[c] = JSON.parse(
                JSON.stringify(MGT2.CHARACTERISTICS[c])
            );
            if (actor.type === "package") {
                actor.system.characteristics[c].value = 0;
                actor.system.characteristics[c].current = 0;
            }
        }
        actor.update({ "system.characteristics": actor.system.characteristics });
    }

    // Copy in skills where needed.
    if (actor.type === "traveller" || actor.type === "npc" || actor.type === "package" || actor.type === "creature") {
        // Need to add skills.
        for (let s in MGT2.SKILLS) {
            if (actor.system.skills[s]) {
                continue;
            }
            actor.system.skills[s] = JSON.parse(
                JSON.stringify(MGT2.SKILLS[s])
            )
            actor.system.skills[s].id = s;
            actor.system.skills[s].value = 0;
            if (actor.system.skills[s].specialities) {
                for (let sp in actor.system.skills[s].specialities) {
                    actor.system.skills[s].specialities[sp].id = sp;
                    actor.system.skills[s].specialities[sp].value = 0;
                }
            }
            if (!actor.system.skills[s].icon) {
                actor.system.skills[s].icon = `systems/mgt2e/icons/skills/${s}.svg`;
            }
        }
        actor.update({ "system.skills": actor.system.skills });
    }

    if (actor.img === "icons/svg/mystery-man.svg") {
        let colours = [ "white", "blue", "gold", "green", "red" ];
        if (actor.type === "creature") {
            actor.img = `systems/mgt2e/icons/actors/creature-${colours[colours.length * Math.random() | 0]}.svg`;
        } else if (actor.type === "traveller" || actor.type === "npc") {
            actor.img = `systems/mgt2e/icons/actors/traveller-${colours[colours.length * Math.random() | 0]}.svg`;
        } else if (actor.type === "package") {
            actor.img = `systems/mgt2e/icons/actors/traveller-grey.svg`;
        } else if (actor.type === "spacecraft") {
            actor.img = `systems/mgt2e/images/tokens/spacecraft/white/far_trader.webp`;
        } else if (actor.type === "vehicle") {
            actor.img = `systems/mgt2e/images/tokens/vehicles/white/jeep.webp`;
        } else {
            actor.img = "systems/mgt2e/icons/actors/traveller-red.svg";
        }
        actor.update({ "img": actor.img });
    }
    if (actor.type === "npc") {
        actor.update({"system.settings.columns": 6 });
    }
});

Hooks.on("preUpdateActor", (actor, data, options, userId) => {
    console.log("**** Hooks.preUpdateActor:");
    if (data?.system?.damage) {
        // This is a Traveller with full damage by stat
        const damage = data.system.damage;
        let endDmg = parseInt(damage.END?damage.END.value:actor.system.damage.END.value);
        let strDmg = parseInt(damage.STR?damage.STR.value:actor.system.damage.STR.value);
        let dexDmg = parseInt(damage.DEX?damage.DEX.value:actor.system.damage.DEX.value);
        let endMax = actor.system.characteristics.END.value;
        let strMax = actor.system.characteristics.STR.value;
        let dexMax = actor.system.characteristics.DEX.value;

        console.log(`Damage is STR ${strDmg} DEX ${dexDmg} END ${endDmg}`);

        let atZero = 0;
        if (endDmg >= endMax) atZero++;
        if (dexDmg >= dexMax) atZero++;
        if (strDmg >= strMax) atZero++;
        console.log("atZero:" + atZero);
        switch (atZero) {
            case 2:
                actor.setFlag("mgt2e", "unconscious", true);
                actor.unsetFlag("mgt2e", "disabled");
                actor.unsetFlag("mgt2e", "dead");
                break;
            case 3:
                actor.setFlag("mgt2e", "disabled", true);
                break;
            default:
                actor.unsetFlag("mgt2e", "unconscious");
                actor.unsetFlag("mgt2e", "disabled");
                actor.unsetFlag("mgt2e", "dead");
        }
    } else if (data?.system?.hits) {
        // This is an NPC or Creature
        let dmg = data.system.hits.damage?data.system.hits.damage:actor.system.hits.damage;
        let max = data.system.hits.max?data.system.hits.max:actor.system.hits.max;

        if (dmg >= max) {
            actor.setFlag("mgt2e", "dead", "true");
            actor.unsetFlag("mgt2e", "unconscious");
            actor.unsetFlag("mgt2e", "disabled");
        } else if (dmg >= max * 0.667) {
            actor.setFlag("mgt2e", "unconscious", "true");
            actor.unsetFlag("mgt2e", "dead");
            actor.unsetFlag("mgt2e", "disabled");
        } else {
            actor.unsetFlag("mgt2e", "unconscious");
            actor.unsetFlag("mgt2e", "disabled");
            actor.unsetFlag("mgt2e", "dead");
        }
    }
});

Hooks.on("preUpdateToken", (token, data, moved) => {
    console.log("preUpdateToken:");
    console.log(token);

    if (data?.actor?.system?.hits) {
        console.log(`preUpdateToken: "${token.name}" has hits`);
        let hits = parseInt(data.actor.system.hits.value);
        let max = parseInt(token.actor.system.hits.max);

        let actorType = token.actor.type;
        if (actorType === "traveller") {
            // Travellers use their characteristics as hitpoints.
            // HITS is just a sum of STR, DEX and END for purposes of
            // showing the resource bar.
            console.log(data);
            if (data.actor.system.status) {
                if (actor.system.status.woundLevel > 1) {
                    tokenObject.toggleEffect("systems/mgt2e/icons/effects/unconscious.svg", {
                        "overlay": true,
                        "active": false
                    });
                }
            }
        } else if (actorType === "creature" || actorType === "npc") {
            // NPCs and Creatures use a generic HITS value.
            let half = parseInt(max / 2);
            let tenth = parseInt(max / 10);

            let text = "";

            let tokenObject = token.object;
            if (hits <= 0) {
                // Token is dead.
                text += `They are dead.`;
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/dead.svg", { "overlay": true, "active": true });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/unconscious.svg", { "overlay": true, "active": false });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/injured.svg", { "overlay": false, "active": false });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/destroyed.svg", { "overlay": true, "active": false });
            } else if (hits <= tenth) {
                // Token is unconscious.
                text += `They are unconscious.`;
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/dead.svg", { "overlay": true, "active": false });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/unconscious.svg", { "overlay": true, "active": true });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/injured.svg", { "overlay": false, "active": false });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/destroyed.svg", { "overlay": true, "active": false });
            } else if (hits <= half) {
                // Token is bloodied.
                text += `They are shaken.`;
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/dead.svg", { "overlay": true, "active": false });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/unconscious.svg", { "overlay": true, "active": false });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/injured.svg", { "overlay": false, "active": true });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/destroyed.svg", { "overlay": true, "active": false });
            } else {
                // Token is okay.
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/dead.svg", { "overlay": true, "active": false });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/unconscious.svg", { "overlay": true, "active": false });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/injured.svg", { "overlay": false, "active": false });
                tokenObject.toggleEffect("systems/mgt2e/icons/effects/destroyed.svg", { "overlay": true, "active": false });
            }
            if (text.length > 0) {
                let chatData = {
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker(),
                    content: text
                }
                ChatMessage.create(chatData, {});
            }
        } else {
            // Healed. Nothing to say.
            return;
        }
    }
    return true;
});



Hooks.once("ready", async function() {
    Hooks.on("hotbarDrop", (bar, data, slot) => {
        if (data.type === "Item" || data.data?.dragType === "skill") {
            createTravellerMacro(data, slot);
            return false;
        }
    });
});

Hooks.on("applyActiveEffect", (actor, effectData) => {
   const actorData = actor.system;
   let key = effectData.KEY;
   let value = effectData.value;
   let type = effectData.effect.data.flags.augmentType;

   console.log(type);

   if (type === "chaAug") {

   }
});

Hooks.on("combatTurn", (combat, data, options) => {
    // This is the actor which just finished their turn.
    let combatant = combat.combatant.actor;
    // Reset any reaction penalties back to zero.
    combatant.unsetFlag("mgt2e", "reaction");

    // If stunned, reduce rounds left to be stunned
    let stunned = combatant.getFlag("mgt2e", "stunned");
    if (stunned) {
        let rounds = combatant.getFlag("mgt2e", "stunnedRounds");
        rounds = rounds?parseInt(rounds):0;

        if (--rounds < 1) {
            combatant.unsetFlag("mgt2e", "stunned");
            combatant.unsetFlag("mgt2e", "stunnedRounds");
        } else {
            combatant.setFlag("mgt2e", "stunnedRounds", rounds);
        }
    }
});

Hooks.on("combatRound", (combat, data, options) => {
    // This is the actor which just finished their turn.
    let combatant = combat.combatant.actor;
    // Reset any reaction penalties back to zero.
    combatant.unsetFlag("mgt2e", "reaction");

    // If stunned, reduce rounds left to be stunned
    let stunned = combatant.getFlag("mgt2e", "stunned");
    if (stunned) {
        let rounds = combatant.getFlag("mgt2e", "stunnedRounds");
        rounds = rounds?parseInt(rounds):0;

        if (--rounds < 1) {
            combatant.unsetFlag("mgt2e", "stunned");
            combatant.unsetFlag("mgt2e", "stunnedRounds");
        } else {
            combatant.setFlag("mgt2e", "stunnedRounds", rounds);
        }
    }
});

Hooks.on("dropCanvasData", (canvas, data) =>{
   console.log("Dropped something on canvas");
   console.log(data);
});


// Dropping a skill on the macro bar. An entire skill tree is dragged,
// not just a speciality.
async function createTravellerMacro(data, slot) {
    console.log("createTravellerMacro:");
    let actorId = data.actorId;
    let dragData = data.data;

    if (data.type === "Item") {
        let item = await Item.fromDropData(data);
        let label = item.name;

        let command = null;
        if (item.type === "weapon") {
            command = `game.mgt2e.rollAttackMacro('${item.name}')`;
        } else {
            command = `Hotbar.toggleDocumentSheet("${item.uuid}")`;
        }

        if (command) {
            let macro = await Macro.create({
                name: label,
                type: "script",
                command: command,
                img: item.img
            });
            game.user.assignHotbarMacro(macro, slot);
        } else {
            ui.notifications.warn(`Don't know what to do with "${label}"`);
        }
        return false;
    } else if (dragData.dragType === "skill") {
        let actor = game.actors.find(a => (a._id === actorId));
        if (!actor) {
            ui.notifications.warn(game.i18n.localize("MGT2.Warn.HotBar.NewActor"));
            return false;
        }
        let skill = actor.system.skills[dragData.skillName];
        let label = actor.getSkillLabel(dragData.skillName);

        const command = `game.mgt2e.rollSkillMacro('${dragData.skillName}')`;
        let macro = null; //game.macros.entries.find(m => (m.name === dragData.skillName));
        if (!macro) {
            macro = await Macro.create({
                name: label,
                type: "script",
                command: command,
                img: actor.getSkillIcon(dragData.skillName)
            });
        }
        ui.notifications.info(game.i18n.format("MGT2.Info.HotBar.AssignedSkill", { skill: label}));
        game.user.assignHotbarMacro(macro, slot);
        return false;
    }

}

function rollSkillMacro(skillName) {
  console.log("rollSkillMacro: " + skillName);

  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) {
      actor = game.actors.tokens[speaker.token];
  }
  if (!actor) {
      actor = game.actors.get(speaker.actor);
  }
  if (!actor) {
      ui.notifications.warn(game.i18n.localize("MGT2.Warn.HotBar.SelectActorSkill"));
      return;
  }

  if (game.settings.get("mgt2e", "quickRolls")) {
      rollSkill(actor, skillName);
  } else {
      new MgT2SkillDialog(actor, skillName).render(true);
  }
}

function rollAttackMacro(itemName) {
    console.log("rollAttackMacro: ");
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) {
        actor = game.actors.tokens[speaker.token];
    }
    if (!actor) {
        actor = game.actors.get(speaker.actor);
    }
    if (!actor) {
        return ui.notifications.warn(game.i18n.format("MGT2.Warn.HotBar.SelectActorItem", {item: itemName }));
    }

    let item = actor.items.find(i => (i.name === itemName));
    if (!item) {
        return ui.notifications.warn(game.i18n.format("MGT2.Warn.HotBar.ActorNotHaveItem", {actor: actor.name, item: itemName }));
    }

    new MgT2AttackDialog(actor, item).render(true);
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

Handlebars.registerHelper('toPlainText', function(html) {
    console.log(html);
    if (html && typeof html === 'string') {
        let text = html.replace(/<[^>]*>/g, "");

        text = text.replace(/@UUID.*\{(.*)\}/, "$1");
        text = text.replace(/&.*;/, "");
        if (text.length > 120) {
            text = text.substring(0, 117) + "...";
        }
        return text;
    } else {
        return "Undefined";
    }
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
            type = ` [${game.i18n.localize("MGT2.TravellerSheet.Boon")}]`;
        } else if (data.settings.rollType === "bane") {
            type = ` [${game.i18n.localize("MGT2.TravellerSheet.Bane")}]`;
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
                return `${cha} + ${skillLabel(skill)} (${skillLabel(spec)}) ${type}`;
            } else {
                return `${cha} + ${skillLabel(skill)} ${type}`;
            }
        } else {
            return `${cha} + ${skillLabel(skill)}  (${game.i18n.localize("MGT2.TravellerSheet.Untrained")}) ${type}`;
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

Handlebars.registerHelper('isItemEquipped', function(item) {
    if (item.system.status === MgT2Item.EQUIPPED) {
        return true;
    }
    return false;
});

Handlebars.registerHelper('isItemCarried', function(item) {
    if (item.system.status === MgT2Item.CARRIED) {
        return true;
    }
    return false;
});

Handlebars.registerHelper('isItemOwned', function(item) {
    if (item.system.status === MgT2Item.EQUIPPED || item.system.status === MgT2Item.CARRIED) {
        return false;
    }
    if (item.type === "term" || item.type === "associate") {
        return false;
    }
    return true;
});


Handlebars.registerHelper('equipItem', function(item) {
    if (item.system.status === MgT2Item.EQUIPPED || item.system.weight === undefined) {
        return "";
    }

    let title="Activate item";
    let icon="fa-hand-fist";
    if (item.type === "armour") {
        title = "Wear armour";
        icon = "fa-shirt";
    }
    return `<a class="item-control item-activate" title="${title}"><i class="fas ${icon}"></i></a>`;
});

Handlebars.registerHelper('deactivateItem', function(item) {
    if (!item.system.status || item.system.status === MgT2Item.CARRIED || item.system.status === MgT2Item.OWNED || item.system.weight === undefined) {
        return "";
    }

    let title="Deactivate item";
    let icon="fa-suitcase";
    if (item.type === "armour") {
        title = "Remove armour";
    } else if (item.type === "weapon") {
        title = "Put away weapon";
    }
    return `<a class="item-control item-deactivate" title="${title}"><i class="fas ${icon}"></i></a>`;
});

Handlebars.registerHelper('storeItem', function(item) {
    if (!item.system.status || item.system.status === MgT2Item.OWNED || item.system.weight === undefined) {
        return "";
    }
    let title="Store item";
    let icon="fa-arrow-down-to-square";
    return `<a class="item-control item-store" title="${title}"><i class="fas ${icon}"></i></a>`;
});

Handlebars.registerHelper('carryItem', function(item) {
    if (item.system.status === MgT2Item.CARRIED || item.system.weight === undefined) {
        return "";
    }
    let title="Carry item";
    let icon="fa-suitcase";
    return `<a class="item-control item-carry" title="${title}"><i class="fas ${icon}"></i></a>`;
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

Handlebars.registerHelper('ifStartsWith', function(arg1, arg2) {
    if (arg1 && arg2) {
        return arg1.startsWith(arg2);
    }
    return false;
});

Handlebars.registerHelper('mountedWeaponsCount', function(mount, wpn) {
    if (mount.hardware.weapons) {
        if (mount.hardware.weapons[wpn._id]) {
            let q = parseInt(mount.hardware.weapons[wpn._id].quantity);
            if (q > 1) {
                return "x" + q;
            }
        }
    }
    return "";
});

Handlebars.registerHelper('concat', function(arg1, arg2, arg3, arg4, arg5) {
    let text = "";

    if (typeof arg1 === 'string' || arg1 instanceof String) text += arg1;
    if (typeof arg2 === 'string' || arg2 instanceof String) text += arg2;
    if (typeof arg3 === 'string' || arg3 instanceof String) text += arg3;
    if (typeof arg4 === 'string' || arg4 instanceof String) text += arg4;
    if (typeof arg5 === 'string' || arg5 instanceof String) text += arg5;

    return text;
});

Handlebars.registerHelper('nameQuantity', function(item) {
   let name = item.name;
   let quantity = item.system.quantity;

   if (quantity && parseInt(quantity) > 1) {
       quantity = parseInt(quantity);
       name = `${name} x${quantity}`;
   }
   return name;
});

Handlebars.registerHelper('number', function(value) {
    return value.toLocaleString("en-GB");
});

Handlebars.registerHelper('quantity', function(item, value) {
   return Intl.NumberFormat("en-GB", { maximumFractionDigits: 2}).format(value * item.system.quantity);
});

Handlebars.registerHelper('formula', function(actor, value) {
    if (value === undefined || value === null || value == "") {
        return "";
    } else if (!isNaN(value)) {
        return value;
    } else if (actor === undefined || actor === null) {
        return "";
    } else {
        let roll = new Roll(value, actor.getRollData()).evaluate({async: false});
        return roll.total;
    }
});

Handlebars.registerHelper('augmentedSkill', function(skill, spec) {
    if (!skill) {
        return "";
    }
    let trained = skill.trained;
    let value = skill.value;
    if (skill.individual && spec) {
        trained = spec.trained;
    }
    let html = "";
    let data = spec?spec:skill;

    if (data.augment && trained && parseInt(data.augment) > 0) {
        html += `<p class="augmented">Skill Augment +${data.augment}</p>`;
    }
    if (data.expert) {
        html += `<p class="augmented">Expert Software/${data.expert} `;
        if (trained) {
            html += "(+1) ";
        } else {
            html += `[${data.expert - 1}] `;
        }
        html += `EDU/INT max ${data.expert * 2 + 8}</p>`;
    }

    return html;
});

/**
 * Outputs the list of CSS classes to be used by the skill block.
 * Reads the system settings to determine the number of columns to use and
 * whether we are row first or column first.
 */
Handlebars.registerHelper('skillListClasses', function() {
    let classes="skillList";
    let columns = parseInt(game.settings.get("mgt2e", "skillColumns"));
    let format = game.settings.get("mgt2e", "skillFormat");

    if (format === "columns") {
        classes += " skillList-Columns";
        if (columns === 3) {
            classes += " skillList-Columns-Three";
        } else {
            classes += " skillList-Columns-Two";
        }
    } else {
        classes += " skillList-Rows grid";
        if (columns === 3) {
            classes += " skillList-Rows-Three grid-3col";
        } else {
            classes += " skillList-Rows-Two grid-2col";
        }
    }

    return classes;
});

// Decide whether to show a skill or not.
Handlebars.registerHelper('skillBlock', function(data, skillId, skill) {
    let showSkill = false;
    let showSpecs = false;
    let trainedOnly = data.settings.hideUntrained;
    let backgroundOnly = data.settings.onlyBackground;
    let untrainedLevel = data.skills["jackofalltrades"].value - 3;
    let isCreature = data.characteristics?false:true;

    // Don't show a skill if it requires a characteristic that
    // isn't being used by this actor.
    if (skill.requires && !isCreature) {
        if (!data.characteristics[skill.requires] || !data.characteristics[skill.requires].show) {
            return "";
        }
    }

    // If backgroundOnly is set, then shortcut to not showing anything.
    if (isCreature && !skill.creature) {
        if (skill.trait && data.traits && data.traits.indexOf(skill.trait) > -1) {
            showSkill = true;
        } else {
            return "";
        }
    } else if (backgroundOnly && !skill.background) {
        return "";
    } else if (backgroundOnly && skill.background) {
        showSkill = true;
    } else if (!trainedOnly || skill.trained) {
        showSkill = true;
    } else {
        if (skill.expert && parseInt(skill.expert) > 0) {
            showSkill = true;
        } else if (skill.dm && parseInt(skill.dm) > 0) {
            showSkill = true;
        } else if (skill.augment && parseInt(skill.augment) > 0) {
            showSkill = true;
        } else if (skill.specialities) {
            for (let sid in skill.specialities) {
                let spec = skill.specialities[sid];
                if ((spec.expert && parseInt(spec.expert) > 0) || (spec.dm && parseInt(spec.dm) > 0)) {
                    showSkill = true;
                    break;
                }
            }
        }
    }
    if (showSkill && skill.specialities) {
        for (let sid in skill.specialities) {
            let spec = skill.specialities[sid];
            if ((spec.expert && parseInt(spec.expert) > 0) || (spec.dm && parseInt(spec.dm) > 0)) {
                showSpecs = true;
                break;
            }
        }
    }
    if (skill.trained) {
        showSpecs = true;
    }
    skill.value = parseInt(skill.value);
    if (isNaN(skill.value) || skill.value < 0) {
        skill.value = 0;
    }
    const dataRoll='data-rolltype="skill" data-roll="2d6"';
    const dataSkill=`data-skill="${skillId}"`;

    const nameSkill=`system.skills.${skillId}`;

    if (showSkill) {
        let html = `<div class="skillBlock skill-draggable item"  ${dataRoll} ${dataSkill}>`;
        html += `<input type="checkbox" class="trained" name="${nameSkill}.trained" `;
        if (skill.trained) {
            html += " checked ";
        }
        html += `data-dtype="Boolean"/> `;
        let augmented = false;

        let title = skill.default;
        if (skill.trained) {
            title += " + " + skill.value;
        } else {
            title += " - " + Math.abs(untrainedLevel);
        }
        if (skill.bonus && skill.bonus > 0) {
            augmented = true;
        }
        if (skill.expert && skill.expert > 0) {
            augmented = true;
            title += " /" + (skill.expert -1);
        }
        if (skill.augment && skill.augment > 0) {
            augmented = true;
            title += " + " + skill.augment;
        }
        if (skill.dm && skill.dm > 0) {
            augmented = true;
            title += " + " + skill.dm;
        }
        let hasXp = (skill.xp && skill.xp > 0);
        let label = skillLabel(skill);
        html += `<label for="system.skills.${skillId}.value" `;
        html += `class="rollable ${skill.trained?"":"untrained"} ${augmented?"augmented":""}" `;
        html += `${dataRoll} ${dataSkill} data-label="${title}" title="${title}"`;
        html += `>${label}${hasXp?"<sup>+</sup>":""}</label>`;

        // Specialities?
        if (!backgroundOnly && skill.specialities && showSpecs) {
            html += `<input type="text" value="${skill.trained?0:untrainedLevel}" data-dtype="Number" class="skill-fixed" readonly/>`;
            for (let sid in skill.specialities) {
                let spec = skill.specialities[sid];
                spec.value = parseInt(spec.value);
                if (isNaN(spec.value) || spec.value < 0) {
                    spec.value = 0;
                }
                let showSpec = false;
                if (!trainedOnly && skill.trained) {
                    showSpec = true;
                } else if (parseInt(spec.value) > 0) {
                    showSpec = true;
                } else if (spec.expert && parseInt(spec.expert) > 0) {
                    showSpec = true;
                }
                if (showSpec) {
                    let augmented = false;
                    let title = spec.default?spec.default:skill.default;
                    if (skill.trained) {
                        title += " + " + skill.value;
                    } else {
                        title += " - " + Math.abs(untrainedLevel);
                    }
                    if (spec.expert) {
                        if (isNaN(spec.expert)) {
                            spec.expert = null;
                        } else {
                            spec.expert = parseInt(spec.expert);
                            augmented = true;
                            title += " /" + (spec.expert - 1);
                        }
                    }

                    html += "<div class='specialisationBlock'>";
                    if (skill.individual) {
                        html += `<input type="checkbox" class="spectrained" `;
                        html += `name="${nameSkill}.specialities.${sid}.trained" ${spec.trained?"checked":""} `;
                        html += `data-dtype="Boolean" />`;
                    }
                    let hasXp = (spec.xp && spec.xp > 0);
                    let label = skillLabel(spec);
                    html += `<label class="${augmented?"augmented":""} ${skill.individual?"individual":""} specialisation rollable" ${dataRoll} ${dataSkill} `;
                    html += `data-spec="${sid}" title="${title}">${label}${hasXp?"<sup>+</sup>":""}</label>`;
                    if (skill.trained && (!skill.individual || spec.trained)) {
                        html += `<input class="skill-level" type="text" name="${nameSkill}.specialities.${sid}.value" value="${spec.value}"/>`;
                    } else {
                        html += `<input type="text" value="${untrainedLevel}" data-dtype="Number" class="skill-fixed" readonly/>`;
                    }
                    html += "</div>";
                }
            }
        } else {
            if (skill.trained) {
                html += `<input class="skill-level" type="text" name="${nameSkill}.value" value="${skill.value}" ${dataRoll} ${dataSkill}"/>`;
            } else {
                html += `<input type="text" value="${untrainedLevel}" data-dtype="Number" class="skill-fixed" readonly/>`;
            }
        }

        html += "</div>"; // skillBlock

        return html;
    }

    return "";
});

Handlebars.registerHelper('isOwner', function(key) {
    return key.owner;
});

Handlebars.registerHelper('isObserver', function(key) {
    return key.document.permission >= 2;
});

Handlebars.registerHelper('isLimited', function(key) {
    return key.document.permission >= 2;
});

Handlebars.registerHelper('termYear', function(data, term) {
    if (term < 1) {
        term = 1;
    }

    return 1105;
});


/**
 * Given an active effect, display the key in a readable form.
 */
Handlebars.registerHelper('effect', function(key) {
    if (key && key.startsWith("system.characteristics")) {
        key = key.replaceAll(/[a-z.]/g, "");
        return key;
    } else if (key && key.startsWith("system.skills")) {
        let skills = MGT2.SKILLS;
        key = key.replaceAll(/\.[a-z]*$/g, "");
        key = key.replaceAll(/system.skills./g, "");
        let skill = key.replaceAll(/\..*/g, "");
        if (key.indexOf(".specialities") > -1) {
            let spec = key.replaceAll(/.*\./g, "");
            return `${skillLabel(skills[skill], skill)} (${skillLabel(skills[skill].specialities[spec], spec)})`;
        } else {
            return skillLabel(skills[skill], skill);
        }
    } else if (key && key.startsWith("system.modifiers")) {
        if (key === "system.modifiers.encumbrance.multiplierBonus") {
            return "Encumbrance Multiplier"
        }
        key = key.replaceAll(/system\.modifiers\./g, "");
        key = key.replaceAll(/\.effect/g, "");
        return key
    }
    return key;
});

/**
 * Do we need to display the list of status effects for this actor?
 * Does not check to see if a traveller, npc or creature.
 */
Handlebars.registerHelper('hasStatus', function(actor) {
    const status = actor.flags.mgt2e;
    if (!status) return false;

    if (status.fatigued || status.stunned || status.encumbered || status.vaccSuit ||
        status.lowGravity || status.highGravity || status.zeroGravity ||
        status.diseased || status.poisoned || status.dead || status.unconscious ||
        status.disabled || status.reaction) {
        return true;
    }
    return false;
});

Handlebars.registerHelper('toHex', function(value) {
    console.log(value);
    return parseInt(value).toString(16).toUpperCase();
});


Handlebars.registerHelper('showStatus', function(actor, status) {
    console.log("showStatus:" + status);
    console.log(actor);
   let type = "statusWarn";
   let label = game.i18n.localize("MGT2.TravellerSheet.StatusLabel."+status);

   if (status === "fatigued") {
       label += ` <i class="fas fa-xmark statusFatigued"> </i>`;
   } else if (status === "stunned") {
       if (parseInt(actor.getFlag("mgt2e", "stunnedRounds")) > 0) {
           label += ` (${actor.getFlag("mgt2e", "stunnedRounds")})`;
       }
       label += ` <i class="fas fa-xmark statusStunned"> </i>`;
       type = "statusBad";
   } else if (status === "dead") {
       label += ` <i class="fas fa-xmark statusDead"> </i>`;
       type = "statusBad";
   } else if (status === "unconscious") {
       type = "statusBad";
       label += ` <i class="fas fa-xmark statusUnconscious"> </i>`;
   } else if (status === "disabled") {
       label += ` <i class="fas fa-xmark statusDisabled"> </i>`;
       type = "statusBad";
   } else if (status === "reaction") {
       if (!(parseInt(actor.getFlag("mgt2e", "reaction")) < 0)) {
           return "";
       }
       label += ` (${actor.getFlag("mgt2e", "reaction")})`;
       label += ` <i class="fas fa-xmark statusReaction"> </i>`;
   } else if (status === "highGravity") {
       label += ` <i class="fas fa-xmark statusHighGravity"> </i>`;
   } else if (status === "lowGravity") {
       label += ` <i class="fas fa-xmark statusLowGravity"> </i>`;
   } else if (status === "zeroGravity") {
       label += ` <i class="fas fa-xmark statuszeroGravity"> </i>`;
   } else if (status === "diseased") {
       label += ` <i class="fas fa-xmark statusDiseased"> </i>`;
   } else if (status === "poisoned") {
       label += ` <i class="fas fa-xmark statusPoisoned"> </i>`;
   } else if (status === "disabled") {
       type = "statusBad";
       label += ` <i class="fas fa-xmark statusPoisoned"> </i>`;
   } else if (status === "dead") {
       type = "statusBad";
       label += ` <i class="fas fa-xmark statusPoisoned"> </i>`;
   }

   return `<div class="resource flex-group-center ${type}"><label>${label}</label></div>`;
});

Handlebars.registerHelper('showSimpleSkills', function(actor) {
   if (actor && actor.system && actor.system.skills) {
       let skills = actor.system.skills;
       let html = "";

       for (let key in skills) {
           let skill = skills[key];

           if (skill.trained) {
               let showParent = true;
               if (skill.specialities) {
                    for (let specKey in skill.specialities) {
                        let spec = skill.specialities[specKey];
                        if (spec.value > 0) {
                            showParent = false;
                            html += `<li>${skillLabel(skill, key).replace(/ /, "&nbsp;")}&nbsp;(${skillLabel(spec, specKey).replace(/ /, "&nbsp;")})/${spec.value}</li>`;
                        }
                    }
               }
               if (showParent) {
                   html += `<li>${skillLabel(skill, key).replace(/ /, "&nbsp;")}/${skill.value}</li>`;
               }
           }
       }
       return "<ul class='skill-list'>" + html + "</ul>";
   } else {
       return "";
   }

});

Handlebars.registerHelper('chaStatus', function(cha) {
    if (cha) {
        if (cha.current > cha.value) {
            return "dmHigh";
        } else if (cha.current < cha.value) {
            return "dmLow";
        } else {
            return "dm";
        }
    } else {
        return "";
    }
});

Handlebars.registerHelper('showCrewInfo', function(actorShip, actorCrew) {
    let html = "";
    let roles = actorShip.system.crewed.crew[actorCrew.id];

    for (let id in roles) {
        let roleItem = actorShip.items.get(id);
        if (roleItem) {
            html += `<div class="role-action-item"><span class="role-title">${roleItem.name}</span>`;
            html += `<div class="role-action-buttons">`;
            for (let id in roleItem.system.role.actions) {
                let action = roleItem.system.role.actions[id];
                let icon = "fa-comment";
                if (action.action === "weapon") {
                    icon = "fa-crosshairs";
                } else if (action.action === "skill") {
                    icon = "fa-dice";
                } else if (action.action === "special") {
                    icon = "fa-wand-magic-sparkles";
                }
                html += `<span class="role-action-button" data-action-id="${id}" data-role-id="${roleItem.id}" data-crew-id="${actorCrew.id}">`;
                html += `<i class="fa-regular ${icon}"></i> ${action.title}`;
                html += `</span>`;
            }
            html += "</div></div>";
        }
    }
    if (!html) {
        html =  game.i18n.localize("MGT2.Role.NoRoleAssigned");
    }
    return html;
});

Handlebars.registerHelper('skillToLabel', function(skillName) {
    let skillId = skillName.replaceAll(/\..*/g, "");
    let specId = (skillName.indexOf(".") < 0)?null:skillName.replaceAll(/.*\./g, "");

    let skills = MGT2.SKILLS;
    let label = "";
    if (skills[skillId]) {
        label = skills[skillId].label;
        if (!label) {
            label = game.i18n.localize("MGT2.Skills." + skillId);
        }
        if (specId && skills[skillId].specialities) {
            if (skills[skillId].specialities[specId]) {
                if (skills[skillId].specialities[specId].label) {
                    label += ` (skills[skillId].specialities[specId].label)`;
                } else {
                    label += ` (${game.i18n.localize("MGT2.Skills." + specId)})`;
                }
            }
        }
    } else {
        return "Unknown skill";
    }

    return label;
});

Handlebars.registerHelper('showBehaviours', function(key, behaviours) {
   // 'behaviours' is a string of space separated behaviour values.
   // Want to return <span> elements with localised names.
   let html = "";
   let list = behaviours.split(" ");
   for (let b in list) {
       if (list[b].length > 0) {
           let style = "";
           if (CONFIG.MGT2.CREATURES.behaviours[list[b]]?.group) {
               style = CONFIG.MGT2.CREATURES.behaviours[list[b]].group;
           }
           html += `<span class='behaviour-item ${style?"behaviour-style-"+style:""}' title='${game.i18n.localize("MGT2.Creature.BehaviourText." + list[b])}' data-behaviour-id='${list[b]}'>`;
           html += `${game.i18n.localize("MGT2.Creature.Behaviour." + list[b])} `;
           if (key.owner) {
               html += `<i class="fas fa-xmark behaviour-remove"> </i>`;
           }
           html += `</span>`;
       }
   }

   return html;
});

Handlebars.registerHelper('showTraits', function(key, traits) {
    // 'behaviours' is a string of space separated behaviour values. Some will have values
    // Want to return <span> elements with localised names.
    let html = "";
    let list = traits.split(",");
    for (let i in list) {
        if (list[i].length > 0) {
            let trait = list[i].trim();
            let value = null;
            if (trait.indexOf(" ") > -1) {
                value = trait.split(" ")[1].trim();
                trait = trait.split(" ")[0].trim();
            }
            let data = CONFIG.MGT2.CREATURES.traits[trait];
            if (data) {
                html += `<span class='trait-item' data-trait-id='${trait}'>`;
                if (key.owner) {
                    if (data.set) {
                        value = parseInt(value);
                        if (value > data.min) {
                            html += `<i class="fas fa-minus trait-minus"> </i>`;
                        }
                        if (value < data.max) {
                            html += `<i class="fas fa-plus trait-plus"> </i>`;
                        }
                    } else if (data.choices) {
                        value = parseInt(value);
                        if (value > 0) {
                            html += `<i class="fas fa-minus trait-minus"> </i>`;
                        }
                        if (value < data.choices.length - 1) {
                            html += `<i class="fas fa-plus trait-plus"> </i>`;
                        }
                    } else if (data.value) {
                        value = parseInt(value);
                        if (value > 1) {
                            html += `<i class="fas fa-minus trait-minus"> </i>`;
                        }
                        if (value < 21) {
                            html += `<i class="fas fa-plus trait-plus"> </i>`;
                        }
                    }
                }
                html += `&nbsp;${game.i18n.localize("MGT2.Creature.Trait." + trait)} `;
                if (data.choices) {
                    html += `(${game.i18n.localize("MGT2.Creature.TraitChoice."+trait+"."+data.choices[value])}) `;
                } else if (value) {
                    html += `(${(value > 0 && !data.value) ? "+" + value : value}) `;
                }
                if (key.owner) {
                    html += `&nbsp;<i class="fas fa-xmark trait-remove"> </i>`;
                } else {
                    html += "&nbsp;";
                }
                html += "</span>";
            } else {
                console.log(`WARN: Trait [${trait}] is invalid in [${traits}]`);
            }
        }
    }

    return html;
});


Handlebars.registerHelper('showWeaponTraits', function(key, traits) {
    // 'traits' are comma separated list of weapon traits. Some may have associated values.
    console.log("showWeaponTraits: [" + traits + "]");
    let html = "";
    let list = traits.split(",");
    for (let i in list) {
        if (list[i].length > 0) {
            let trait = list[i].trim();
            let value = null;
            if (trait.indexOf(" ") > -1) {
                value = trait.split(" ")[1].trim();
                trait = trait.split(" ")[0].trim();
            }
            let data = CONFIG.MGT2.WEAPONS.traits[trait];
            if (!data) {
                trait = trait.toLowerCase();
                data = CONFIG.MGT2.WEAPONS.traits[trait];
            }
            if (data) {
                html += `<span class='pill weapon-pill' data-trait-id='${trait}' title='${game.i18n.localize("MGT2.Item.WeaponTrait.Text."+trait)}'>`;
                if (key.owner) {
                    if (data.value !== null && data.value !== undefined) {
                        value = parseInt(value);
                        if (value > parseInt(data.min)) {
                            html += `<i class="fas fa-minus trait-minus"> </i>`;
                        }
                        if (value < parseInt(data.max)) {
                            html += `<i class="fas fa-plus trait-plus"> </i>`;
                        }
                    }
                }
                html += `&nbsp;${game.i18n.localize("MGT2.Item.WeaponTrait.Label." + trait)} `;
                if (value) {
                    html += `${value} `;
                }
                if (key.owner) {
                    html += `&nbsp;<i class="fas fa-xmark trait-remove"> </i>`;
                } else {
                    html += "&nbsp;";
                }
                html += "</span>";
            } else {
                html += `<span class='pill weapon-pill error-pill' data-trait-id='${trait}' title="Unknown trait">${trait}`;
                if (value) {
                    html += ` ${value}`;
                }
                if (key.owner) {
                    html += `&nbsp;<i class="fas fa-xmark trait-remove"> </i>`;
                } else {
                    html += "&nbsp;";
                }
                html += "</span>";
                console.log(`WARN: Trait [${trait}] is invalid in [${traits}]`);
            }
        }
    }

    return html;
});

Handlebars.registerHelper('showCargoTraits', function(key, traits) {
    // 'traits' are comma separated list of cargo traits. Each has a bonus attached to it.
    console.log("showCargoTraits: [" + traits + "]");
    let html = "";
    let list = traits.split(",");
    for (let i in list) {
        if (list[i].length > 0) {
            let trait = list[i].trim();
            let value = null;
            if (trait.indexOf(" ") > -1) {
                value = trait.split(" ")[1].trim();
                trait = trait.split(" ")[0].trim();
            }
            html += `<span class='pill cargo-pill' data-trait-id='${trait}' title='${game.i18n.localize("MGT2.Trade."+trait)}'>`;
            if (key.owner) {
                value = parseInt(value);
                if (value > -12) {
                    html += `<i class="fas fa-minus trait-minus"> </i>`;
                }
                if (value < 12) {
                    html += `<i class="fas fa-plus trait-plus"> </i>`;
                }
            }
            html += `&nbsp;${game.i18n.localize("MGT2.Trade." + trait)} `;
            if (value) {
                html += `${(value>=0)?"+":""}${value} `;
            }
            if (key.owner) {
                html += `&nbsp;<i class="fas fa-xmark trait-remove"> </i>`;
            } else {
                html += "&nbsp;";
            }
            html += "</span>";
        }
    }

    return html;
});

Handlebars.registerHelper('selectedWeaponId', function(actions, id) {
    if (actions && id && actions[id]) {
        return actions[id].weapon;
    } else {
        return "";
    }
});


/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
});

