import {MGT2} from "../helpers/config.mjs";
import { skillLabel } from "../helpers/dice-rolls.mjs";

import {MgT2Effect} from "../documents/effect.mjs";

export class MgT2EffectSheet extends ActiveEffectConfig {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "active-effect-sheet"],
            template: "templates/sheets/active-effect-config.html",
            width: 560,
            height: "auto",
            submitOnClose: true
        });
    }
    /** @override *
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["sheet", "mgt2", "active-effect-sheet", "item", "item-sheet"],
            width: 520,
            height: 480,
            tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes"}],
            submitOnClose: true,
            submitOnChange: true
        });
    }
     */

    /** @override */
    get template() {
        const path = "systems/mgt2e/templates";
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/active-effect-config.html`;
    }

    async getData(options) {
        // Retrieve base data structure.
        const context = await super.getData(options);
        context.effectTypes = MGT2.EFFECTS;
        context.effectType = MGT2.EFFECTS[context.data.flags.augmentType];

        let prop = context.effectType.property;
        if (context.effectType.targets === "char") {
            context.targets = {};
            for (const k of ['STR', 'DEX', 'END', 'INT', 'PSI']) {
                let key = "system.characteristics." + k + "." + prop;
                context.targets[key] = k;
            }
        } else if (context.effectType.targets === "skills") {
            context.targets = {};
            let skills = MGT2.getDefaultSkills();
            for (let id in skills) {
                let baseKey = "system.skills."+id
                context.targets[baseKey + "." + prop] = skillLabel(skills[id], id);
                if (skills[id].specialities) {
                    for (let sid in skills[id].specialities) {
                        context.targets[baseKey + ".specialities." + sid + "." + prop] = skillLabel(skills[id], id) + " (" + skillLabel(skills[id].specialities[sid], sid) + ")";
                    }
                }
            }
        } else {
            context.targets = {};
            context.targets["system.modifiers.encumbrance.multiplierBonus" ] = "Carry Multiplier";
            context.targets["system.modifiers.encumbrance." + prop] = "Encumbrance DM";
            context.targets["system.modifiers.physical." + prop] = "Physical DM";
            context.targets["system.modifiers.melee." + prop] = "Melee DM";
            context.targets["system.modifiers.guncombat." + prop] = "Gun Combat DM";
            context.targets["system.modifiers.armour." + prop] = "Armour";
            context.targets["system.modifiers.initiative." + prop] = "Initiative";
        }

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");

        let ae = foundry.utils.duplicate(this.object);
        ae.name = formData.data.name;

        ae.disabled = formData.disabled;
        ae.transfer = formData.transfer;
        ae.changes = formData.changes;

        return this.object.update(ae);
    }
}
