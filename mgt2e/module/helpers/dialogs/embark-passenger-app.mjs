import {MgT2Item} from "../../documents/item.mjs";
import {
    outputTradeChat,
    tradeBuyFreightHandler,
    tradeBuyGoodsHandler,
    tradeEmbarkPassengerHandler
} from "../utils/trade-utils.mjs";
import {Tools} from "../chat/tools.mjs";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

// First attempt at ApplicationV2 dialog.
// see: https://foundryvtt.wiki/en/development/api/applicationv2
// Dialog to buy speculative cargo.
export class MgT2EmbarkPassengerApp extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(worldActor, shipActor, passengerItem) {
        super();
        this.worldActor = worldActor;
        this.shipActor = shipActor;
        this.passengerItem = passengerItem;
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: MgT2EmbarkPassengerApp.formHandler,
            submitOnChange: false,
            closeOnSubmit: false
        },
        actions: {
            changeQuantity: MgT2EmbarkPassengerApp.changeQuantityAction
        },
        window: {
            title: "Embark Passengers"
        }
    }

    static PARTS = {
        form: {
            template: "systems/mgt2e/templates/dialogs/embark-passengers.html"
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    }

    async _prepareContext(options) {
        const context = {
            buttons: [
                { type: "submit", icon: "fa-solid fa-save", label: "Embark" }
            ]
        }

        return context;
    }

    /**
     * How many passengers to bring on board?
     *
     * @param partId
     * @param context
     * @returns {Promise<*>}
     * @private
     */
    async _preparePartContext(partId, context) {
        console.log("_preparePartContext: " + partId);
        context.partId = `${this.id}-${partId}`;

        let freeSpace = parseFloat(this.shipActor.system.spacecraft.cargo);
        for (let i of this.shipActor.items) {
            if (i.type === "cargo") {
                freeSpace -= parseFloat(i.system.quantity);
            }
        }
        // Might be needed for high passage passengers
        context.freeSpace = freeSpace;
        context.passenger = this.passengerItem;
        context.world = this.worldActor;

        console.log(this.passengerItem);

        let quantity = this.passengerItem.system.quantity;
        context.price = this.passengerItem.system.world.price;
        context.passage = this.passengerItem.system.world.passage;

        context.destinationWorld = await fromUuid(this.passengerItem.system.world.destinationId);

        context.QUANTITY_LIST = {};
        let maxQuantity = quantity;
        for (let q=1; q <= maxQuantity; q++) {
            context.QUANTITY_LIST[q] = `${q}dt (Cr${q * this.passengerItem.system.world.price})`;
        }
        context.qty = maxQuantity;
        console.log(context.qty);

        return context;
    }


    static async formHandler(event, form, formData) {
        if (event.type === "submit") {
            console.log("Embarking passenger " + this.passengerItem.name);
            let quantity = parseInt(formData.object.quantitySelect);

            const data = {
                type: "embarkPassenger",
                shipActorId: this.shipActor.uuid,
                worldActorId: this.worldActor.uuid,
                passengerItemId: this.passengerItem.uuid,
                quantity: quantity
            }
            // const queryValue = await gm.query("mgt2e.tradeBuyGoods", data, { timeout: 30 * 1000 });
            this.close();
            if (game.user.isGM) {
                await tradeEmbarkPassengerHandler(data);
            } else {
                game.socket.emit("system.mgt2e", data);
            }
        }

        return null;
    }

    static changeQuantityAction(event, target) {
        console.log("changeQuantityAction:");
    }

}
