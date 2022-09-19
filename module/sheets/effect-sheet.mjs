import {MGT2} from "../helpers/config.mjs";
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
        const path = "systems/mgt2/templates";
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/active-effect-config.html`;
    }

    getData(options) {
        // Retrieve base data structure.
        const context = super.getData(options);

        console.log("effect-sheet.getData:");
        console.log(context.data.flags);
        context.effectTypes = MGT2.EFFECTS;
        context.effectType = MGT2.EFFECTS[context.data.flags.augmentType];

        let prop =context.effectType.property;
        if (context.effectType.targets == "char") {
            context.targets = {};
            for (const k of [ 'STR', 'DEX', 'END', 'INT', 'PSI' ]) {
                let key = "data.characteristics."+k+"."+prop;
                context.targets[key] = {"label": k};
            }
        } else {
            context.targets = {};
            let skills = game.system.template.Actor.templates.skills.skills;
            for (let id in skills) {
                let baseKey = "data.skills."+id
                context.targets[baseKey + "." + prop] = { "label": skills[id].label };
                if (skills[id].specialities) {
                    for (let sid in skills[id].specialities) {
                        context.targets[baseKey + ".specialities." + sid + "." + prop] = { "label": skills[id].label + " (" + skills[id].specialities[sid].label + ")"};
                    }
                }
            }
        }

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");

        let ae = foundry.utils.duplicate(this.object);
        ae.label = formData.label;

        console.log("formData:");
        console.log(formData);
        console.log(CONST.ACTIVE_EFFECT_MODES);

        ae.disabled = formData.disabled;
        ae.transfer = formData.transfer;
        ae.changes = formData.changes;

        console.log("updated object:");
        console.log(ae);

        return this.object.update(ae);
    }
}