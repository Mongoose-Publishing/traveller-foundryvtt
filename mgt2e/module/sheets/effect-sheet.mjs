import {MGT2} from "../helpers/config.mjs";
import { skillLabel } from "../helpers/dice-rolls.mjs";

import {MgT2Effect} from "../documents/effect.mjs";

/**
 * Need to support both V12 and V13.
 */
export class MgT2EffectSheet extends foundry.applications.sheets.ActiveEffectConfig {
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
            for (const k of ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC', 'PSI']) {
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

        // Resolve augmentType: stored in flags.mgt2e.augmentType (v14+),
        // with fallback to old flag path and heuristic detection for legacy effects.
        let augmentType = context.document.flags?.mgt2e?.augmentType
            ?? context.document.flags?.augmentType
            ?? context.document.system?.augmentType
            ?? null;

        if (!augmentType) {
            // Legacy effect: try to detect from change keys.
            const changes = context.document.changes ?? [];
            if (changes.length === 0) {
                augmentType = "skillDM";
            } else {
                const key = changes[0].key ?? "";
                if (key.startsWith("system.char")) {
                    augmentType = "chaDM";
                } else if (key.startsWith("system.skills")) {
                    augmentType = "skillDM";
                } else {
                    augmentType = "miscDM";
                }
            }
            // Persist the resolved type for next time
            context.document.update({ "flags.mgt2e.augmentType": augmentType });
        }

        context.effectType = MGT2.EFFECTS[augmentType] ?? null;
        context.augmentType = augmentType;
        context.effectTypeLabel = game.i18n.localize("MGT2.Effects.Type." + augmentType);
        context.showValue = context.effectType?.value !== false;

        // Build targets dropdown based on effectType
        const prop = context.effectType?.property;
        if (context.effectType?.targets === "char") {
            context.targets = { "": "-" };
            for (const k of ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC', 'PSI']) {
                const label = game.i18n.localize("MGT2." + k);
                const fullName = game.i18n.localize("MGT2.Characteristics." + k);
                context.targets["system.characteristics." + k + "." + prop] = label + " – " + fullName;
            }
        } else if (context.effectType?.targets === "skills") {
            context.targets = { "": "-" };
            const skills = MGT2.getDefaultSkills();
            for (const id in skills) {
                const baseKey = "system.skills." + id;
                context.targets[baseKey + "." + prop] = skillLabel(skills[id], id);
                if (skills[id].specialities) {
                    for (const sid in skills[id].specialities) {
                        context.targets[baseKey + ".specialities." + sid + "." + prop] =
                            skillLabel(skills[id], id) + " (" + skillLabel(skills[id].specialities[sid], sid) + ")";
                    }
                }
            }
        } else {
            context.targets = { "": "-" };
            context.targets["system.modifiers.encumbrance.multiplierBonus"] = game.i18n.localize("MGT2.Modifiers.CarryMultiplier") || "Carry Multiplier";
            if (prop) {
                context.targets["system.modifiers.encumbrance." + prop] = game.i18n.localize("MGT2.Modifiers.Encumbrance") || "Encumbrance DM";
                context.targets["system.modifiers.physical." + prop] = game.i18n.localize("MGT2.Modifiers.Physical") || "Physical DM";
                context.targets["system.modifiers.melee." + prop] = game.i18n.localize("MGT2.Modifiers.Melee") || "Melee DM";
                context.targets["system.modifiers.guncombat." + prop] = game.i18n.localize("MGT2.Modifiers.GunCombat") || "Gun Combat DM";
                context.targets["system.modifiers.armour." + prop] = game.i18n.localize("MGT2.Modifiers.Armour") || "Armour";
                context.targets["system.modifiers.initiative." + prop] = game.i18n.localize("MGT2.Modifiers.Initiative") || "Initiative";
            }
        }

        // v14: modes are no longer provided by super._prepareContext; build them manually
        context.modes = {
            "add": game.i18n.localize("EFFECT.MODE.Add") || "Add",
            "multiply": game.i18n.localize("EFFECT.MODE.Multiply") || "Multiply",
            "override": game.i18n.localize("EFFECT.MODE.Override") || "Override",
            "upgrade": game.i18n.localize("EFFECT.MODE.Upgrade") || "Upgrade",
            "downgrade": game.i18n.localize("EFFECT.MODE.Downgrade") || "Downgrade",
            "custom": game.i18n.localize("EFFECT.MODE.Custom") || "Custom"
        };

        context.buttons = [
            { type: "submit", icon: "fa-solid fa-save", label: "SETTINGS.Save" }
        ];

        return context;
    }

    // v14: ensure custom keys (modes, targets, effectType) survive per-part context prep
    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        if (partId === "changes") {
            partContext.modes = context.modes;
            partContext.targets = context.targets;
            partContext.effectType = context.effectType;
            partContext.augmentType = context.augmentType;
            partContext.effectTypeLabel = context.effectTypeLabel;
            partContext.showValue = context.showValue;
        }
        return partContext;
    }

    async _onChangeForm(formConfig, event) {
        await super._onChangeForm(formConfig, event);

        const ae = this.document.toObject();
        if (!ae.changes) ae.changes = [];

        if (event.target.name === "document.name") {
            ae.name = event.target.value;
        } else if (event.target.name.startsWith("changes.")) {
            const parts = event.target.name.split(".");
            const idx = parseInt(parts[1]);
            const param = parts[2];

            if (!ae.changes[idx]) {
                ae.changes[idx] = { key: "", mode: 2, value: "", priority: null };
            }
            ae.changes[idx][param] = event.target.value;
        }

        await this.document.update(ae);
    }

}
