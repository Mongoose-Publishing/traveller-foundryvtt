import {MgT2ItemSheet} from "../item-sheet.mjs";
import {randomiseAssociate} from "../../helpers/utils/character-utils.mjs";

export class MgT2AssociateItemSheet extends MgT2ItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "item", "associate" ],
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
        });
    }

    async getData() {
        let context = await super.getData();

        context.enrichedDescription = await TextEditor.enrichHTML(this.object.system.description );

        console.log("MgT2AssociateItemSheet.getData:");

        context.RELATIONSHIP_SELECT = {
            "contact": game.i18n.localize("MGT2.History.Relation.contact"),
            "ally": game.i18n.localize("MGT2.History.Relation.ally"),
            "rival": game.i18n.localize("MGT2.History.Relation.rival"),
            "enemy": game.i18n.localize("MGT2.History.Relation.enemy")
        };

        context.AFFINITY_SELECT = {};
        context.ENMITY_SELECT = {};
        context.POWER_SELECT = {};
        context.INFLUENCE_SELECT = {};
        for (let i=0; i <= 6; i++) {
            context.AFFINITY_SELECT[i] = `(${i}) ` + game.i18n.localize("MGT2.History.Degree.Affinity." + i);
            context.ENMITY_SELECT[0 - i] = `(-${i}) ` + game.i18n.localize("MGT2.History.Degree.Enmity." + i);
            context.POWER_SELECT[i] = `(${i}) ` + game.i18n.localize("MGT2.History.Degree.Power." + i);
            context.INFLUENCE_SELECT[i] = `(${i}) ` + game.i18n.localize("MGT2.History.Degree.Influence." + i);
        }

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".randomiseRelationship").click(ev => this._randomiseRelationship(this.item));

        html.find(".relationship-type").click(ev => {
            this.item.system.associate.relationship = $(ev.currentTarget).val();
            void this._randomiseRelationship(this.item);
        });
    }

    async _randomiseRelationship(item) {
        await randomiseAssociate(item);
        await item.update({"system": item.system });
    }
}
