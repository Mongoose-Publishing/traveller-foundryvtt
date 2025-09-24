import {MGT2} from "../helpers/config.mjs";
import { skillLabel } from "../helpers/dice-rolls.mjs";

import {MgT2Effect} from "../documents/effect.mjs";

/**
 * Need to support both V12 and V13.
 */
export class MgT2EffectSheet extends ActiveEffectConfig {
    // V12
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["sheet", "active-effect-sheet"],
            template: "templates/sheets/active-effect-config.html",
            width: 560,
            height: "auto",
            submitOnClose: true
        });
    }

    /** @override */
    get template() {
        const path = "systems/mgt2e/templates";
        return `${path}/active-effect-config.html`;
    }

    // V12
    async getData(options) {
        // Retrieve base data structure.
        const context = await super.getData(options);
        context.effectTypes = MGT2.EFFECTS;

        let augmentType = context.document?.system?.augmentType;
        if (!augmentType) {
            // This was the old V12 way of doing it.
            augmentType = context.data.flags.augmentType;
            if (!augmentType) {
                // Try and guess the augment type. May be needed if previous version was run on V13.
                if (this.object.changes.length === 0) {
                    augmentType = "skillDM";
                } else {
                    let key = this.object.changes[0].key;
                    if (key.startsWith("system.char")) {
                        augmentType = "chaDM";
                    } else if (key.startsWith("system.skills")) {
                        augmentType = "skillDM";
                    } else {
                        augmentType = "miscDM";
                    }
                    context.document.system.augmentType = augmentType;
                    context.document.update({"system.augmentType": augmentType});
                }
            }
        }

        context.effectType = MGT2.EFFECTS[augmentType];

        let prop = context.effectType?.property;
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

    // V12
    activateListeners(html) {
        super.activateListeners(html);
    }

    // V12
    async _updateObject(event, formData) {
        console.log("_updateObject:");

        let ae = foundry.utils.duplicate(this.object);
        ae.name = formData.document.name;

        ae.disabled = formData.disabled;
        ae.transfer = formData.transfer;
        ae.changes = formData.changes;

        return this.object.update(ae);
    }

    // V13
    _onRender(context, options) {
        console.log("onRender:");
    }

    // V13
    static DEFAULT_OPTIONS = {
      id: "effects-form",
      position: { width: 560, height: "auto" },
      form: {
          submitOnChange: true,
          submitOnClose: true,
          closeOnSubmit: false
      }
    };


    // V13
    static PARTS = {
        header: {template: "templates/sheets/active-effect/header.hbs"},
        tabs: {template: "templates/generic/tab-navigation.hbs"},
        details: {template: "templates/sheets/active-effect/details.hbs"},
        duration: {template: "templates/sheets/active-effect/duration.hbs"},
        changes: {template: "systems/mgt2e/templates/effect/changes.html"}
    }
    // V13
    static TABS = {
        sheet: {
            tabs: [
                {id: "changes", icon: "fa-solid fa-gears"},
                {id: "details", icon: "fa-solid fa-book"},
                {id: "duration", icon: "fa-solid fa-clock"}
            ],
            initial: "changes",
            labelPrefix: "EFFECT.TABS"
        }
    };

    // V13
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        let augmentType = context.document.system?.augmentType;
        if (augmentType === null) {
            // This is a pre-v13 augment, so need to try and fix it.
            console.log("Migrating effect to v13");
            if (context.document.flags.augmentType && typeof context.document.flags.augmentType === "string") {
                console.log("Augment flag is a string, so copy that");
                augmentType = context.document.flags.augmentType;
            } else {
                console.log("Unknown augment type - assuming skillDM");
                augmentType = "skillDM";
            }
            context.document.system.augmentType = augmentType;
        }
        context.effectType = MGT2.EFFECTS[augmentType];

        let prop = context.effectType?.property;
        if (context.effectType?.targets === "char") {
            context.targets = {};
            for (const k of ['STR', 'DEX', 'END', 'INT', 'PSI']) {
                let key = "system.characteristics." + k + "." + prop;
                context.targets[key] = k;
            }
        } else if (context.effectType?.targets === "skills") {
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

        // V13
        context.buttons = [
            {
                type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save"
            }
        ];

        return context;
    }

    async _onChangeForm(formConfig, event) {
        console.log("_onChangeForm:");
        console.log("TARGET: " + event.target.name);
        console.log("VALUE: " + event.target.value);

        await super._onChangeForm(formConfig, event);

        // We don't seem to save changes automatically.
        let ae = foundry.utils.duplicate(this.document);
        if (event.target.name === "document.name") {
            ae.name = event.target.value;
        } else if (event.target.name.startsWith("changes.")) {
            let idx = parseInt(event.target.name.split(".")[1]);
            let param = event.target.name.split(".")[2];

            ae.changes[idx][param] = event.target.value;
        }
        await this.document.update(ae);
    }

}
