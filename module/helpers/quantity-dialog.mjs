
export class MgT2QuantityDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2/templates/quantity-dialog.html";
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
        this.maxQuantity = srcItem.system.quantity;
        this.number = this.maxQuantity;

        console.log("MaxQuantity: " + this.maxQuantity);

        console.log(srcActor);
        console.log(destActor);

        let destItems = destActor.items.contents
        this.destItem = destItems[destItems.length - 1];
        console.log(this.destItem);
    }

    getData() {
        return {
            "max": this.maxQuantity,
            "number": this.maxQuantity
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const save = html.find("button[class='save']");
        save.on("click", event => this.onSaveClick(event, html));
    }

    async onSaveClick(event, html) {
        event.preventDefault();

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2QuantityDialog = MgT2QuantityDialog;
