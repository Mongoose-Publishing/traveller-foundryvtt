import {MgT2ActorSheet} from "../actor-sheet.mjs";
import {MgT2Item} from "../../documents/item.mjs";
import {
    calculateFreightLots, clearFreight,
    createFreight,
    createSpeculativeGoods,
    distanceBetweenWorlds, tradeDisembarkPassengerHandler
} from "../../helpers/utils/trade-utils.mjs";
import {createWorld, setTradeCodes, worldDropBrokerHandler} from "../../helpers/utils/world-utils.mjs";
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

    async getDestination(worldActor, destinationWorlds, destId) {
        if (!destinationWorlds[destId]) {
            let world = await fromUuid(destId);
            destinationWorlds[destId] = {
                name: world.name,
                parsecs: distanceBetweenWorlds(worldActor, world),
                freight: [],
                passengers: [],
                mail: []
            }
        }
        return destinationWorlds[destId];
    }

    async _prepareItems(context) {
        context.cargo = [];
        context.factions = [];
        context.localGoods = [];

        let destinationWorlds = {};
        for (let i of context.items) {
            i.img = i.img || CONFIG.MGT2.DEFAULT_ITEM_ICON;
            i.cssStyle = "";

            // Append to gear.
            if (i.type === 'cargo') {
                // Add some meta data.
                let basePrice = i.system.cargo.price;
                if (i.system.cargo.speculative) {
                    i.system.cargo.costDiff = i.system.cost - basePrice;
                    i.system.cargo.costSign = Math.sign(i.system.cargo.costDiff);
                    i.system.cargo.saleDiff = i.system.cargo.salePrice - basePrice;
                    i.system.cargo.saleSign = Math.sign(i.system.cargo.saleDiff);
                    context.cargo.push(i);
                } else if (i.system.cargo.freight) {
                    i.system.cargo.totalPrice = parseInt(i.system.cargo.price) * parseInt(i.system.quantity);
                    let dest = await this.getDestination(context.actor, destinationWorlds, i.system.cargo.destinationId);
                    dest.freight.push(i);
                } else {
                    context.localGoods.push(i);
                }
            } else if (i.type === "worlddata") {
                if (i.system?.world?.datatype === "faction") {
                    context.factions.push(i);
                } else if (i.system?.world?.datatype === "passenger") {
                    let dest = await this.getDestination(context.actor, destinationWorlds, i.system.world.destinationId);
                    dest.passengers.push(i);
                }
            }
        }
        context.destinationWorlds = destinationWorlds;
    }

    _canDragStart() {
        // If you can see it, you can drag from it. This allows the
        // trade mechanism, but means we need to be careful about
        // everything else.
        return true
    }

    _canDragDrop() {
        // Allow freight, trade goods and passengers to be dropped on
        // a world.
        return true;
    }

    async getData() {
        const context = await super.getData();

        if (context.actor.permission > 2) {
            context.isEditable = true;
        }

        context.enrichedDescription = await TextEditor.enrichHTML(
            this.object.system.description,
            { secrets: ((context.actor.permission > 2)?true:false) }
        );

        await this._prepareItems(context);

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
        for (let d in CONFIG.MGT2.WORLD.atmosphere) {
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
        context.BASES_SELECT = {
            "": ""
        }
        for (let b of [ "N", "S", "M", "C"]) {
            if (context.world.uwp.bases.indexOf(b) === -1) {
                context.BASES_SELECT[b] = game.i18n.localize("MGT2.WorldSheet.Bases." + b);
            }
        }
        if (Object.keys(context.BASES_SELECT).length === 1) {
            context.BASES_SELECT = null;
        }

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Define trade drag listener here, because all players should be able to do it.
        let handler = ev => this._onDragStart(ev);
        html.find('.trade-item').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });
        html.find('.freight').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });

        html.find('.freight-clear').click(ev => {
            const e = $(ev.currentTarget).parents(".destination-title");
            clearFreight(this.actor, e.data("destinationId"));
        });
        html.find('.createFreight').click(ev => {
            createFreight(this.actor, 1, 1000);
        });
        html.find('.generateWorld').click(ev => {
            createWorld(this.actor);
        });
        html.find('.generateSpeculative').click(ev => {
            createSpeculativeGoods(this.actor);
        });
        html.find('.base-remove').click(ev => {
            // Remove base
            const e = $(ev.currentTarget).parents(".world-pill");
            const id = e.data("baseId");
            let re = new RegExp(` ?${id},?`, "g");
            let b = this.actor.system.world.uwp.bases.replaceAll(re, "").replaceAll(/,$/g, "").trim();
            this.actor.update({"system.world.uwp.bases": b});
        });
        html.find('.base-add').click(ev => {
            // Add base
            const value = $(ev.currentTarget).val();
            if (this.actor.system.world.uwp.bases) {
                this.actor.system.world.uwp.bases += ", " + value;
            } else {
                this.actor.system.world.uwp.bases = value;
            }
            this.actor.update({"system.world.uwp.bases": this.actor.system.world.uwp.bases});
        });
        html.find('.faction-add').click(ev => {
           // Add faction
            console.log("Click faction");
            this._createFaction();
        });
    }

    async _createFaction() {
        console.log("_createFaction:");
        let itemData = {
            name: "Faction",
            type: "worlddata",
            system: {
                world: {
                    datatype: "faction",
                    government: 7,
                    strength: "minor"
                }
            }
        };
        Item.create(itemData, { parent: this.actor });
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
        let droppedItem = await fromUuid(data.uuid);
        if (!droppedItem) {
            return;
        }

        if (["cargo"].includes(droppedItem.type)) {
            console.log("Dropping cargo on world");

            return true;
        }

        return;
    }

    async _disembark(passenger) {
        let shipActor = await fromUuid(passenger.system.meta.spacecraftId);
        if (!shipActor) {
            ui.notifications.error("Unable to find spacecraft this actor is on");
            return;
        }
        let list = [];
        let idList = [];
        for (let p in shipActor.system.crewed.passengers) {
            let data = shipActor.system.crewed.passengers[p];
            if (data.destinationId === this.actor.uuid) {
                list.push(await fromUuid("Actor."+p));
                idList.push(p);
            }
        }
        console.log(list);
        if (list.length > 0) {
            let contentData = {
                destinationName: this.actor.name,
                passengerName: passenger.name,
                passengerList: list
            }
            const content = await renderTemplate("systems/mgt2e/templates/dialogs/disembark-passengers.html", contentData);

            const disembark = await foundry.applications.api.DialogV2.confirm({
                window: {
                    title: "Disembark Passengers?"
                },
                content,
                modal: true
            });
            // This needs to be done as GM.
            if (disembark) {
                const data = {
                    type: "tradeDisembarkPassenger",
                    shipActorId: shipActor.uuid,
                    worldActorId: this.actor.uuid,
                    passengerList: idList
                }
                if (this.actor.permission > 2) {
                    await tradeDisembarkPassengerHandler(data);
                } else {
                    game.socket.emit("system.mgt2e", data);
                }
            }
        }
    }

    async _onDropActor(event, data) {
        let droppedActor = await fromUuid(data.uuid);
        if (!droppedActor) {
            return;
        }
        console.log("_onDropActor:");
        if (droppedActor.type === "npc" && droppedActor.system.meta) {
            if (droppedActor.system.meta.destinationId === this.actor.uuid) {
                this._disembark(droppedActor);
            } else {
                ui.notifications.warn(`${droppedActor.name} doesn't want to disembark here`);
            }
            return;
        }

        if (["npc", "traveller"].includes(droppedActor.type)) {
            let data = {
                type: "worldDropBroker",
                brokerActorId: droppedActor.uuid,
                worldActorId: this.actor.uuid,
            }
            if (event.target.closest(".brokerDropZone")) {
                data.skill = "broker";
                data.skillScore = parseInt(droppedActor.system.skills["broker"].value);
            } else if (event.target.closest(".streetwiseDropZone")) {
                data.skill = "streetwise";
                data.skillScore = parseInt(droppedActor.system.skills["streetwise"].value);
            }
            if (this.actor.permission > 2) {
                await worldDropBrokerHandler(data);
            } else {
                game.socket.emit("system.mgt2e", data);
            }
            return;
        }

        if (droppedActor.type === "world") {
            // Need to calculate trade.
            if (this.actor.permission < 3) {
                ui.notifications.error(`You do not have permission to calculate trade for ${this.actor.name}`);
                return;
            }
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

