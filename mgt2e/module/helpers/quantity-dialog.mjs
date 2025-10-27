import {MgT2Item} from "../documents/item.mjs";

export class MgT2QuantityDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/quantity-dialog.html";
        options.width = "400";
        options.height = "auto";
        options.title = "Move Items";

        return options;
    }

    constructor(srcActor, destActor, srcItem) {
        super();
        this.srcActor = srcActor;
        this.destActor = destActor;
        this.srcItem = srcItem;
        this.maxQuantity = parseInt(srcItem.system.quantity);
        this.transferNumber = 1;

        this.options.title = "Move " + srcItem.name + " to " + destActor.name;
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
        console.log(change);
        this.transferNumber += change;
        if (this.transferNumber < 1) {
            this.transferNumber = 1;
        } else if (this.transferNumber > this.maxQuantity) {
            this.transferNumber = this.maxQuantity;
        }
        html.find(".number")[0].value = this.transferNumber;
        html.find(".quantity")[0].value = "custom";
    }

    _getCount(option) {
        console.log("getCount: " + option);
        if (option === "one") {
            return 1;
        } else if (option === "three") {
            return 3;
        } else if (option === "ten") {
            return 10;
        } else if (option === "half") {
            return parseInt(this.maxQuantity / 2);
        } else if (option === "all") {
            return this.maxQuantity;
        } else {
            // Number is the custom number.
            return this.transferNumber;
        }
    }

    _selectQuantity(html) {
        let option = html.find(".quantity")[0].value;
        this.transferNumber = this._getCount(option);
        console.log("Setting number to be " + this.transferNumber);
        html.find(".number")[0].value = this.transferNumber;
    }

    async onSaveClick(event, html) {
        event.preventDefault();

        let option = html.find(".quantity")[0].value;
        let number = parseInt(html.find(".number")[0].value);

        // We need to create a new item at the destination.
        this.destItem = foundry.utils.duplicate(this.srcItem);

        if (option === "one") {
            number = 1;
        } else if (option === "all") {
            number = this.max;
        } else {
            // Number is the custom number.
        }

        if (number >= this.srcItem.system.quantity) {
            this.srcActor.deleteEmbeddedDocuments("Item", [this.srcItem.id]);
        } else {
            this.srcItem.system.quantity -= number;
            this.srcItem.update({ "system.quantity": this.srcItem.system.quantity });

            this.destItem.system.quantity = number;
            this.destItem.system.status = MgT2Item.OWNED;

            Item.create(this.destItem, { parent: this.destActor });
        }

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2QuantityDialog = MgT2QuantityDialog;
