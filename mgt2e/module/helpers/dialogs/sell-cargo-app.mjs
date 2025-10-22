import {MgT2Item} from "../../documents/item.mjs";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

// First attempt at ApplicationV2 dialog.
// see: https://foundryvtt.wiki/en/development/api/applicationv2
// Dialog to buy speculative cargo.
export class MgT2SellCargoApp extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(shipActor, worldActor, cargoItem) {
        super();
        this.shipActor = shipActor;
        this.worldActor = worldActor;
        this.cargoItem = cargoItem;
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: MgT2BuyCargoApp.formHandler,
            submitOnChange: false,
            closeOnSubmit: false
        },
        actions: {
            changeQuantity: MgT2SellCargoApp.changeQuantityAction
        },
        window: {
            title: "Transfer Cargo to Ship"
        }
    }

    static PARTS = {
        form: {
            template: "systems/mgt2e/templates/dialogs/sell-speculative.html"
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    }

    async _prepareContext(options) {
        const context = {
            buttons: [
                { type: "submit", icon: "fa-solid fa-save", label: "Sell" }
            ]
        }

        return context;
    }

    /**
     * What we render depends on the type of the item. Firstly, it should always be
     * cargo of some kind. But there are two types:
     *   Freight: system.cargo.freight will be true
     *   Speculative Goods: system.cargo.speculative will be true
     *
     * Freight is 'free', it doesn't cost money to ship. You get paid when you
     * deliver it. You can only take all or nothing.
     *
     * Speculative Goods need to be purchased. You can select how much that you
     * want to buy. Speculative Goods are more complicated, since we need to worry
     * about quantity and cost.
     *
     * @param partId
     * @param context
     * @returns {Promise<*>}
     * @private
     */
    async _preparePartContext(partId, context) {
        console.log("_preparePartContext: " + partId);
        context.partId = `${this.id}-${partId}`;

        if (this.cargoItem) {
            // This should always be set.
            console.log(this.cargoItem);
            context.item = this.cargoItem;
            context.cargo = this.cargoItem.system.cargo;
            if (context.cargo.speculative) {
                // What price is the world buying at?
                context.salePrice = 0;
                for (let i of this.worldActor.items) {
                    if (i.type === "cargo" && i.name === this.cargoItem.name) {
                        context.salePrice = i.system.cargo.salePrice;
                        context.variance = i.system.cargo.salePrice - i.system.cargo.price;
                    }
                }
                context.QUANTITY_LIST = {};
                // What's the most that we can buy? Limited by cargo and price.
                let maxQuantity = this.cargoItem.system.quantity;
                for (let q=1; q <= maxQuantity; q++) {
                    context.QUANTITY_LIST[q] = `${q}dt (Cr${q * this.cargoItem.system.cost})`;
                }
                context.qty = maxQuantity;
            } else {
                // Unexpected. Probably not dragged from a world.
                context.error = "Don't know what to do";
            }
        }

        return context;
    }


    static async formHandler(event, form, formData) {
        if (event.type === "submit") {
            let quantity = parseInt(formData.object.quantitySelect);

            this.shipActor.system.finance.cash -= quantity * this.cargoItem.system.cost;

            this.cargoItem.system.quantity -= quantity;

            const itemData = {
                "name": this.cargoItem.name,
                "img": this.cargoItem.img,
                "type": "cargo",
                "system": foundry.utils.deepClone(this.cargoItem.system)
            }
            itemData.system.cargo.confirmed = true;
            itemData.system.cargo.meta = {
                purchasePrice: itemData.system.cost
            }
            itemData.system.quantity = quantity;
            Item.create(itemData, { parent: this.shipActor });
            this.shipActor.update({"system.finance": this.shipActor.system.finance})

            if (this.cargoItem.system.quantity > 0) {
                this.cargoItem.update({"system.quantity": this.cargoItem.system.quantity });
            } else {
                this.worldActor.deleteEmbeddedDocuments("Item", [ this.cargoItem.id]);
            }

            this.close();
        }

        return null;
    }

    static changeQuantityAction(event, target) {
        console.log("changeQuantityAction:");
    }

    getData() {
        console.log("Number is " + this.transferNumber);
        return {
            "max": this.maxQuantity,
            "half": (this.maxQuantity > 3)?parseInt(this.maxQuantity/2):0,
            "transferNumber": this.transferNumber
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const save = html.find("button[class='save']");
        //save.on("click", event => this.onSaveClick(event, html));

        html.find(".quantity-inc").click(ev => this._changeQuantity(+1, html));
        html.find(".quantity-dec").click(ev => this._changeQuantity(-1, html));
        html.find(".quantity").click(ev => this._selectQuantity(html));
    }

    _changeQuantity(change, html) {
    }

    _getCount(option) {
    }

    _selectQuantity(html) {
    }

    async onSaveClick(event, html) {
        event.preventDefault();
        return;

        let option = html.find(".quantity")[0].value;
        let number = parseInt(html.find(".number")[0].value);

        console.log("Option selected " + option);
        console.log("Custom number " + number);

        // Need to find the item that has been copied to the destination.
        let destItems = this.shipActor.items.contents
        this.destItem = null;
        for (let i=0; i < destItems.length; i++) {
            console.log(this.cargoItem.name + "  ==  " + destItems[i].name);
            if (this.cargoItem.name === destItems[i].name) {
                console.log(this.cargoItem.name + "  ===  " + destItems[i].name);
                if (this.cargoItem.system.quantity === destItems[i].system.quantity) {
                    this.destItem = destItems[i];
                    break;
                }
            }
        }
        console.log(this.destItem);

        if (option === "one") {
            number = 1;
        } else if (option === "all") {
            number = this.max;
        } else {
            // Number is the custom number.
        }
        console.log("Source item is [" + this.cargoItem.name + "]");
        console.log("Destination item is [" + this.destItem.name + "]");

        if (number >= this.cargoItem.system.quantity) {
            this.worldActor.deleteEmbeddedDocuments("Item", [this.cargoItem.id]);
        } else if (number < 1) {
            //this.destActor.deleteEmbeddedDocuments("Item", [this.destItem.id]);
        } else {
            this.cargoItem.system.quantity -= number;
            this.destItem.system.quantity = number;
            this.cargoItem.update({ "system.quantity": this.cargoItem.system.quantity });
            this.destItem.update({ "system.quantity": this.destItem.system.quantity });

            if (this.destItem.system.status) {
                this.destItem.system.status = MgT2Item.OWNED;
                this.destItem.update({ "system.status": this.destItem.system.status });
            }
        }

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2BuyCargoApp = MgT2BuyCargoApp;
