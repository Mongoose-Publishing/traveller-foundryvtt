import {MgT2Item} from "../../documents/item.mjs";
import {outputTradeChat, tradeBuyFreightHandler, tradeBuyGoodsHandler} from "../utils/trade-utils.mjs";
import {Tools} from "../chat/tools.mjs";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

// see: https://foundryvtt.wiki/en/development/api/applicationv2
export class MgT2MissileAttackApp extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(salvoActor, targetActor) {
        super();
        this.salvoActor = salvoActor;
        this.targetActor = targetActor;
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: MgT2MissileAttackApp.formHandler,
            submitOnChange: false,
            closeOnSubmit: false
        },
        actions: {
            selectTarget: MgT2MissileAttackApp.selectTargetAction
        },
        window: {
            title: "MGT2.Dialog.MissileAttack"
        }
    }

    static PARTS = {
        form: {
            template: "systems/mgt2e/templates/dialogs/missile-attack.html"
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    }

    async _prepareContext(options) {
        const context = {
            buttons: [
                { type: "submit", icon: "fa-solid fa-save", label: "Impact" }
            ]
        }

        return context;
    }

    /*
     *
     * @param partId
     * @param context
     * @returns {Promise<*>}
     * @private
     */
    async _preparePartContext(partId, context) {
        console.log("_preparePartContext: " + partId);
        context.partId = `${this.id}-${partId}`;

        if (this.salvoActor?.system?.sourceId) {
            this.sourceActor = await fromUuid(this.salvoActor.system.sourceId);
        }
        context.sourceActor = this.sourceActor;

        context.TARGET_ICON = "systems/mgt2e/icons/misc/unknown-target.svg";
        if (this.targetActor) {
            console.log(this.targetActor);
            context.TARGET_ICON = this.targetActor.img;
        }
        context.salvoActor = this.salvoActor;
        context.DAMAGE = "";
        context.weaponItem = await fromUuid(this.salvoActor.system.salvo.weaponId);
        if (context.weaponItem) {
            context.DAMAGE = context.weaponItem.system.weapon.damage;
        }
        context.SIZE = this.salvoActor.system.size.value;
        context.DM = 0;
        context.TL = this.salvoActor.system.salvo.tl;

        return context;
    }


    static async formHandler(event, form, formData) {
        return;
        if (event.type === "submit") {
            console.log("Buying speculative item " + this.cargoItem.name);
            let quantity = parseInt(formData.object.quantitySelect);

            const data = {
                type: "tradeBuyGoods",
                shipActorId: this.shipActor.uuid,
                worldActorId: this.worldActor.uuid,
                cargoItemId: this.cargoItem.uuid,
                quantity: quantity
            }
            // const queryValue = await gm.query("mgt2e.tradeBuyGoods", data, { timeout: 30 * 1000 });
            this.close();
            if (this.worldActor.permission > 2) {
                await tradeBuyGoodsHandler(data);
            } else {
                game.socket.emit("system.mgt2e", data);
            }
        }

        return null;
    }

    static selectTargetAction(event, target) {
        console.log("selectTargetAction:");

        let selected = Tools.getSelected();
        console.log(selected);
        if (selected.length > 0) {
            let token = selected[0];
            console.log(token.document.uuid);
            this.targetActor = token.document.actor;
        }
        this.render();

    }
}

window.MgT2BuyCargoApp = MgT2BuyCargoApp;
