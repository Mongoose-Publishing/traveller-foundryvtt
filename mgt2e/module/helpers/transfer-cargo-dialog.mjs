import {MgT2Item} from "../documents/item.mjs";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

// First attempt at ApplicationV2 dialog.
// see: https://foundryvtt.wiki/en/development/api/applicationv2
export class MgT2TransferCargoDialog extends HandlebarsApplicationMixin(ApplicationV2) {

    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: MgT2TransferCargoDialog.formHandler,
            submitOnChange: false,
            closeOnSubmit: false
        },
        actions: {
            changeQuantity: MgT2TransferCargoDialog.changeQuantityAction
        },
        window: {
            title: "Transfer Cargo to Ship"
        }
    }

    static PARTS = {
        form: {
            template: "systems/mgt2e/templates/transfer-cargo-dialog.html"
        }
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

        if (this.srcItem) {
            // This should always be set.
            console.log(this.srcItem);
            context.item = this.srcItem;
            context.cargo = this.srcItem.system.cargo;
            if (context.cargo.speculative) {
                // Speculative Goods
                context.speculative = true;
            } else if (context.cargo.freight) {
                // Freight. Nice and easy.
                context.speculative = false;
                let worldId = context.cargo.destinationId;
                let world = await fromUuid(worldId);
                console.log(world);
                context.destination = world;
            } else {
                // Unexpected. Probably not dragged from a world.
                context.error = "Don't know what to do";
            }

        }

        return context;
    }


    static async formHandler(event, form, formData) {

    }

    static changeQuantityAction(event, target) {
        console.log("changeQuantityAction:");
    }

    constructor(srcActor, destActor, srcItem) {
        super();
        this.srcActor = srcActor;
        this.destActor = destActor;
        this.srcItem = srcItem;
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
        save.on("click", event => this.onSaveClick(event, html));

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
        let destItems = this.destActor.items.contents
        this.destItem = null;
        for (let i=0; i < destItems.length; i++) {
            console.log(this.srcItem.name + "  ==  " + destItems[i].name);
            if (this.srcItem.name === destItems[i].name) {
                console.log(this.srcItem.name + "  ===  " + destItems[i].name);
                if (this.srcItem.system.quantity === destItems[i].system.quantity) {
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
        console.log("Source item is [" + this.srcItem.name + "]");
        console.log("Destination item is [" + this.destItem.name + "]");

        if (number >= this.srcItem.system.quantity) {
            this.srcActor.deleteEmbeddedDocuments("Item", [this.srcItem.id]);
        } else if (number < 1) {
            //this.destActor.deleteEmbeddedDocuments("Item", [this.destItem.id]);
        } else {
            this.srcItem.system.quantity -= number;
            this.destItem.system.quantity = number;
            this.srcItem.update({ "system.quantity": this.srcItem.system.quantity });
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

window.MgT2TransferCargoDialog = MgT2TransferCargoDialog;
