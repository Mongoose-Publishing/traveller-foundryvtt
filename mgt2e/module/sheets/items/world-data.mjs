import {MgT2ItemSheet} from "../item-sheet.mjs";
import {roll2D6} from "../../helpers/dice-rolls.mjs";

export class MgT2WorldDataItemSheet extends MgT2ItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "item", "world-data" ],
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
        });
    }

    async getData() {
        let context = await super.getData();

        context.enrichedDescription = await TextEditor.enrichHTML(
            this.object.system.description,
            { secrets: ((context.item.permission > 2)?true:false) }
        );

        context.TYPE_SELECT = {
            "faction": "Faction",
            "passenger": "Passenger",
            "star": "Star",
            "planet": "Planet"
        };

        let worldData = this.item.system.world;
        switch (worldData.datatype) {
            case "faction":
                if (!worldData.government) {
                    worldData.government = 0;
                }
                if (!worldData.strength) {
                    worldData.strength = "obscure";
                }
                context.governmentLabel = game.i18n.localize("MGT2.WorldSheet.Government.Type." + worldData.government);
                context.factionStrength = game.i18n.localize("MGT2.WorldSheet.Faction.Strength." + worldData.strength);
                break;
            case "passenger":
                context.passage = game.i18n.localize("MGT2.WorldSheet.Passage." + worldData.passage);
                break;
            case "planet":
                break;
            case "star":
                break;
        }
        context.worldData = worldData;

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".world-data-type").click(ev => {
            let type = $(ev.currentTarget).val();

            switch (type) {
                case "faction":
                    this._initFaction();
                    break;
                case "passenger":
                    this._initPassenger();
                    break;
                case "star":
                    this._initStar();
                    break;
                case "planet":
                    this._initPlanet();
                    break;
                case "sector":
                    this._initSector();
                    break;
            }
        });

    }

    async _initFaction() {
        let data = {
            "datatype": "faction",
            "government": await roll2D6(),
            "strength": "minor"
        }
        await this.item.update({"system.world": data});
    }

    async _initPassenger() {
        let data = {
            "datatype": "passenger",
            "passage": "basic",
            "actorId": null,
            "sourceId": null,
            "destinationId": null
        }
        await this.item.update({"system.world": data});
    }

    async _initStar() {
        let data = {
            "datatype": "star",
            "spectralType": "G2",
            "spectralClass": "V"
        }
        await this.item.update({"system.world": data});
    }

    async _initPlanet() {
        let data = {
            "datatype": "planet",
            "uwp": "X300000-0",
            "worldId": null
        }
        await this.item.update({"system.world": data});
    }

    async _initSector() {
        let data = {
            "datatype": "sector",
            "x": 0,
            "y": 0
        }
        await this.item.update({"system.world": data});
    }

}
