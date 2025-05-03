import {MgT2ActorSheet} from "../actor-sheet.mjs";
import {MgT2Item} from "../../documents/item.mjs";

export class MgT2VehicleActorSheet extends MgT2ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: [ "mgt2", "sheet", "actor"],
            template: "systems/mgt2e/templates/actor/actor-vehicle-sheet.html",
            width: 720,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }

    _prepareVehicleItems(context) {
        const actorData = context.actor.system;
        const cargo = [];
        const locker = [];
        const hardware = [];
        const software = [];
        const roles = [];

        let cargoUsed = 0;
        for (let i of context.items) {
            if (i.type === 'cargo') {
                cargo.push(i);
                let q = 1;//parseInt(i.system.quantity);
                if (q > 0) {
                    cargoUsed += q;
                }
            } else if (i.type === "software") {
                software.push(i);
            } else if (i.type === "role") {
                roles.push(i);
            } else {
                locker.push(i);
            }
        }
        context.cargo = cargo;
        context.locker = locker;
        context.roles = roles;
        context.software = software;
    }

    _prepareVehicleCrew(context) {
        const actorData = context.actor.system;
        const crew = [];
        const passengers = [];

        for (let actorId in actorData.crewed.crew) {
            let actor = game.actors.get(actorId);
            if (actor) {
                crew.push(actor);
            }
        }
        for (let actorId in actorData.crewed.passengers) {
            let actor = game.actors.get(actorId);
            if (actor) {
                passengers.push(actor);
            }
        }
        context.crew = crew;
        context.passengers = passengers;

    }

    async getData() {
        const context = await super.getData();

        this._prepareVehicleItems(context);
        this._prepareVehicleCrew(context);

        console.log("Vehicle getData");

        let system = context.actor.system;
        context.system = system;

        context.selectVehicleTL = {};
        for (let tl = 0; tl <= 17; tl++) {
            context.selectVehicleTL[`${tl}`] = `${tl} - ${game.i18n.localize("MGT2.Item.Tech." + tl)}`;
        }
        context.selectChassis = {};
        context.selectSubType = {};
        for (let c in CONFIG.MGT2.VEHICLES.CHASSIS) {
            if (!system.vehicle.chassis) {
                system.vehicle.chassis = c;
            }
            context.selectChassis[c] = game.i18n.localize("MGT2.Vehicle.ChassisLabel." + c);
            if (system.vehicle.chassis === c) {
                for (let s in CONFIG.MGT2.VEHICLES.CHASSIS[c].subtypes) {
                    context.selectSubType[s] = game.i18n.localize("MGT2.Vehicle.SubTypeLabel." + s);
                }
            }
        }
        context.selectSkill = {};
        for (let skill of [ "drive", "flyer"]) {
            let skillData = CONFIG.MGT2.SKILLS[skill];
            for (let spec in skillData.specialities) {
                context.selectSkill[`${skill}.${spec}`] =
                    `${game.i18n.localize("MGT2.Skills." + skill)} (${game.i18n.localize("MGT2.Skills."+spec)})`;
            }
        }

        context.selectSpeed = {};
        let lastSpeed = 0;
        for (let spd in CONFIG.MGT2.VEHICLES.SPEED) {
            if (!system.vehicle.speed) {
                system.vehicle.speed = spd;
            }
            let label = game.i18n.localize("MGT2.Vehicle.SpeedBand." + spd);
            let max = CONFIG.MGT2.VEHICLES.SPEED[spd].max;
            if (lastSpeed || max) {
                label = `${label} (${lastSpeed}${max ? (" - " + max) : "+ "}km/h)`;
            }
            context.selectSpeed[spd] = label;
            lastSpeed = max;
        }

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

    }

    async _onDrop(event) {
        console.log("Drop on Vehicle Sheet");
        console.log(event);

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            console.log("Could not parse data");
            return false;
        }
        switch (data.type) {
            case "Item":
                return this._onDropItem(event, data);
            case "Actor":
                return this._onDropActor(event, data);
        }
        return true;
    }

    async _onDropItem(event, data) {
        // Do thing.
        super._onDropItem(event, data);
        console.log("On drop item");


        let item = await fromUuid(data.uuid);
        if (!item || ["package", "term", "worlddata", "associate"].includes(item.type)) {
            console.log("Not allow type " + item.type);
            return false;
        }

       return;
    }

    async _onDropActor(event, data) {
        let droppedActor = await fromUuid(data.uuid);
        if (!droppedActor) {
            return;
        }
        console.log("_onDropActor:");
        if (["npc", "traveller"].includes(droppedActor.type)) {
            console.log(`Adding new crew member ${droppedActor._id}`);
            if (!this.actor.system.crewed) {
                this.actor.system.crewed = {"crew": {}, "passengers": {}, "roles": []};
            }
            this.actor.update({[`system.crewed.passengers.${droppedActor._id}`]: {roles: ["NONE"]}});
        } else {
            return;
        }

        // Do nothing.
        return true;
    }

}

