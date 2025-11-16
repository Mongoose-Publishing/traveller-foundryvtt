import {MgT2ActorSheet} from "../actor-sheet.mjs";

// This is a very simplified Spacecraft sheet.
export class MgT2SalvoActorSheet extends MgT2ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "actor"],
            template: "systems/mgt2e/templates/actor/actor-salvo-sheet.html",
            width: 520,
            height: 300,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }

    get template() {
        return "systems/mgt2e/templates/actor/actor-salvo-sheet.html";
    }

    prepareBaseData() {
        // Nothing to prepare.
    }

    prepareDerivedData() {
        // Nothing to prepare.
    }

    _preUpdate(changes, options, user) {
        // Do thing.
    }

    getData() {
        const context = super.getData();
        console.log("SALVO getData");

        context.targetName = "THE ENEMY";

        return context;
    }

    _onDrop(event) {
        // Nothing
    }

    _prepareItems(context) {
        return;
    }

    activateLiseners(html) {
        return;
    }

    preUpdateActor() {
        // nothing
    }
}
