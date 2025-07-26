import {MgT2ActorSheet} from "../actor-sheet.mjs";
import {MgT2Item} from "../../documents/item.mjs";
import {calculateFreightLots, createFreight, createSpeculativeGoods } from "../../helpers/utils/trade-utils.mjs";
import {createWorld, setTradeCodes } from "../../helpers/utils/world-utils.mjs";
import {MGT2} from "../../helpers/config.mjs";

export class MgT2WorldActorSheet extends MgT2ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: [ "mgt2", "sheet", "actor"],
            template: "systems/mgt2e/templates/actor/actor-world-sheet.html",
            width: 720,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }

    _prepareItems(context) {
        context.cargo = [];
        context.factions = [];

        for (let i of context.items) {
            i.img = i.img || CONFIG.MGT2.DEFAULT_ITEM_ICON;
            i.cssStyle = "";

            // Append to gear.
            if (i.type === 'cargo') {
                context.cargo.push(i);
            } else if (i.type === "worlddata") {
                if (i.system?.world?.datatype === "faction") {
                    context.factions.push(i);
                }
            }
        }
    }

    async getData() {
        const context = await super.getData();

        this._prepareItems(context);

        context.system = context.actor.system;
        context.world = context.system.world;

        let tradeCodes = context.world.uwp.codes;
        setTradeCodes(context.actor);
        if (tradeCodes !== context.world.uwp.codes) {
            await context.actor.update({"system.world.uwp.codes": context.world.uwp.codes});
        }

        context.PORT_SELECT = {};
        for (let p in CONFIG.MGT2.WORLD.starport) {
            context.PORT_SELECT[p] = `${p} - ${game.i18n.localize("MGT2.WorldSheet.Starport.Quality." + p)}`;
        }

        context.SIZE_SELECT = {};
        for (let d in CONFIG.MGT2.WORLD.size) {
            context.SIZE_SELECT[d] = `${CONFIG.MGT2.WORLD.size[d].diameter}`;
        }

        context.ATMOSPHERE_SELECT = {};
        for (let d in CONFIG.MGT2.WORLD.size) {
            context.ATMOSPHERE_SELECT[d] = game.i18n.localize("MGT2.WorldSheet.Atmosphere.Composition." + d);
        }

        context.HYDROGRAPHICS_SELECT = {};
        for (let d in CONFIG.MGT2.WORLD.hydrographics) {
            context.HYDROGRAPHICS_SELECT[d] = `${ parseInt(d) * 10 }% - ${game.i18n.localize("MGT2.WorldSheet.Hydrographics.Description."+d)}`;
        }

        context.POPULATION_SELECT = {};
        for (let d in CONFIG.MGT2.WORLD.population) {
            context.POPULATION_SELECT[d] = CONFIG.MGT2.WORLD.population[d].range.toLocaleString();
        }

        context.GOVERNMENT_SELECT = {};
        for (let d in CONFIG.MGT2.WORLD.government) {
            context.GOVERNMENT_SELECT[d] = `${d} - ${game.i18n.localize("MGT2.WorldSheet.Government.Type." + d)}`;
        }

        context.LAW_SELECT = {};
        for (let d in CONFIG.MGT2.WORLD.lawLevel) {
            context.LAW_SELECT[d] = `${d} - ${game.i18n.localize("MGT2.WorldSheet.Law.Weapons." + d)}`;
        }

        context.TECH_SELECT = {};
        for (let d in CONFIG.MGT2.WORLD.techLevel) {
            context.TECH_SELECT[d] = `${d} - ${game.i18n.localize("MGT2.Item.Tech." + d)}`;
        }

        context.BROKER_SELECT = {}
        for (let i=0; i < 5; i++) {
            context.BROKER_SELECT[i] = i;
        }

        context.brokerActorImg = "systems/mgt2e/icons/misc/drop-target.svg";
        context.brokerActorName = "";
        context.streetwiseActorImg = "systems/mgt2e/icons/misc/drop-target.svg";
        context.streetwiseActorName = "";

        if (context.world.meta.brokerActorId) {
            let brokerActor = fromUuidSync(context.world.meta.brokerActorId);
            if (brokerActor && ["traveller", "npc"].includes(brokerActor.type)) {
                context.brokerActorImg = brokerActor.img;
                context.brokerActorName = brokerActor.name;
            }
        }
        if (context.world.meta.streetwiseActorId) {
            let streetwiseActor = fromUuidSync(context.world.meta.streetwiseActorId);
            if (streetwiseActor && ["traveller", "npc"].includes(streetwiseActor.type)) {
                context.streetwiseActorImg = streetwiseActor.img;
                context.streetwiseActorName = streetwiseActor.name;
            }
        }

        context.SHIPYARD_SELECT = {
            "": "None",
            "smallcraft": "Smallcraft",
            "spacecraft": "Spacecraft",
            "capital": "Capital Ships"
        }
        context.REPAIR_SELECT = {
            "": "None",
            "limited": "Limited",
            "repair": "Full"
        }
        context.FUEL_SELECT = {
            "": "None",
            "unrefinedd": "Unrefined",
            "refined": "Refined"
        }

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.createFreight').click(ev => {
            createFreight(this.actor, 1, 1000);
        });
        html.find('.generateWorld').click(ev => {
            createWorld(this.actor);
        });
        html.find('.generateSpeculative').click(ev => {
            createSpeculativeGoods(this.actor);
        });
    }

    async _onDrop(event) {
        console.log("Drop on World Sheet");
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
        return;
    }

    async _onDropActor(event, data) {
        let droppedActor = await fromUuid(data.uuid);
        if (!droppedActor) {
            return;
        }
        console.log("_onDropActor:");
        if (["npc", "traveller"].includes(droppedActor.type)) {
            console.log("Trader");
            if (event.target.closest(".brokerDropZone")) {
                this.actor.system.world.meta.brokerActorId = droppedActor.uuid;
                this.actor.system.world.meta.brokerScore = droppedActor.system.skills["broker"].value;
            } else if (event.target.closest(".streetwiseDropZone")) {
                this.actor.system.world.meta.streetwiseActorId = droppedActor.uuid;
                this.actor.system.world.meta.streetwiseScore = droppedActor.system.skills["streetwise"].value;
            }
            this.actor.update({"system.world.meta": this.actor.system.world.meta});
            return;
        }

        if (droppedActor.type === "world") {
            // Need to calculate trade.
            console.log("Freight");
            calculateFreightLots(this.actor, droppedActor, 0);
            return;
        }


        // Do nothing.
        return true;
    }

    // Make this world a star system. A star system is only defined on the main world.
    async _createStarSystem() {
        if (this.actor.system.starSystem) {
            // Already exists, nothing to do.
            return;
        }

        let starSystem = {
            "name": this.actor.name
        }
    }
}

