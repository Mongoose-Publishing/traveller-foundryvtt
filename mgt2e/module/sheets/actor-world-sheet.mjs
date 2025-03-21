import {MgT2ActorSheet} from "./actor-sheet.mjs";
import {MgT2Item} from "../documents/item.mjs";
import {createFreight} from "../helpers/utils/trade-utils.mjs";
import {createWorld} from "../helpers/utils/world-utils.mjs";

export class MgT2WorldActorSheet extends MgT2ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: [ "mgt2e", "sheet", "actor"],
            template: "systems/mgt2e/templates/actor/actor-world-sheet.html",
            width: 720,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }

    _prepareItems(context) {
        context.cargo = [];

        console.log("Prepare World items");

        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            i.cssStyle = "";

            // Append to gear.
            if (i.type === 'cargo') {
                context.cargo.push(i);
            }
        }
    }

    async getData() {
        const context = await super.getData();

        this._prepareItems(context);

        context.system = context.actor.system;
        context.world = context.system.world;

        console.log(context.system);

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
    }

    async _onDrop(event) {
        console.log("Drop on World Sheet");

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
                // nothing
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
        // Do nothing.
        return true;
    }


}
