import {MgT2ActorSheet} from "../actor-sheet.mjs";

// This is a very simplified Spacecraft sheet.
export class MgT2SwarmActorSheet extends MgT2ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "actor"],
            template: "systems/mgt2e/templates/actor/actor-swarm-sheet.html",
            width: 520,
            height: 300,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }

    get template() {
        return "systems/mgt2e/templates/actor/actor-swarm-sheet.html";
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

    async getData() {
        const context = await super.getData();
        console.log("MgT2SwarmActorSheet.getData:");

        context.shipActor = await fromUuid(this.actor.system.sourceId);
        console.log(context.shipActor);
        if (this.actor.system.swarmType === "salvo") {
            context.type = "salvo";
            context.weaponItem = await fromUuid(this.actor.system.salvo.weaponId);
            if (context.weaponItem) {
                context.damage = context.weaponItem.system.weapon.damage;
            }
        } else if (this.actor.system.swarmType === "squadron") {

        } else {
            context.type = "unknown";
        }

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
