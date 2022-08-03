import {MGT2} from "../helpers/config.mjs";

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



        if (context.effectType.targets == "char") {
            context.targets = {
                "STR": {"label": "STR"},
                "DEX": {"label": "DEX"},
                "END": {"label": "END"},
                "INT": {"label": "INT"},
                "PSI": {"label": "PSI"},
                "INIT": {"label": "INIT"},
                "SPEED": {"label": "SPEED"},
                "melee": {"label": "Melee"},
            };
        } else {
            context.targets = {};
            let skills = game.system.template.Actor.templates.skills.skills;
            for (let id in skills) {
                context.targets[id] = { "label": skills[id].label };
                if (skills[id].specialities) {
                    for (let sid in skills[id].specialities) {
                        context.targets[id + "." + sid] = { "label": skills[id].label + " (" + skills[id].specialities[sid].label + ")"};
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
        //ae.flags.augmentType = formData.data.flags.augmentType;

        console.log(formData);

        const effectData = this.getData();
        let changes = effectData?.data?.changes ? effectData.data.changes.map(c => c.toObject(false)) : [];

        ae.changes = formData.changes;


        return this.object.update(ae);
    }
}