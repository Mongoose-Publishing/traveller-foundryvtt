import {MgT2Item} from "../documents/item.mjs";

// Allow damage characteristics to be modified.
export class MgT2BuyDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/buy-dialog.html";
        options.width = "400";
        options.height = "auto";
        options.title = "Buy Item";

        return options;
    }

    constructor(actor, item, quantity) {
        super();
        this.actor = actor;
        this.item = item;
        this.quantity = quantity;

        if (!this.item) {
            ui.notifications.error("No item set");
        }

        this.options.title = `Buy ${item.name} for Cr${item.system.cost}`;
    }

    getData() {
        this.LIST = {};
        let after = null;
        let cost = "Cr" + Number(this.item.system.cost).toLocaleString();

        if (this.quantity > 1) {
            cost += " x" + this.quantity;
        }

        let totalPrice = Number(this.item.system.cost) * this.quantity;
        if (this.actor && this.actor.system.finance && Number(this.actor.system.finance.cash) >= totalPrice && this.actor.permission >= 3) {
            let cash = Number(this.actor.system.finance.cash);
            this.LIST[this.actor.uuid] = `${this.actor.name} : Cr${cash.toLocaleString()}`;

            after = "Cr" + (cash - Number(this.item.system.cost) * this.quantity).toLocaleString();
        }

        for (let a of game.actors) {
            if (a.permission >= 3 && a.system.finance && Number(a.system.finance.cash) >= totalPrice) {
                let cash = Number(a.system.finance.cash);
                this.LIST[a.uuid] = `${a.name} : Cr${cash.toLocaleString()}`;

                if (after === null) {
                    after = "Cr" + (cash - Number(this.item.system.cost) * this.quantity).toLocaleString();
                }
            }
        }

        return {
            "ACTOR": this.actor,
            "ITEM": this.item,
            "LIST": this.LIST,
            "QUANTITY": this.quantity,
            "AFTER": after,
            "COST": cost
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const save = html.find("button[class='buyButton']");
        save.on("click", event => this.onBuyClick(event, html));

        html.find(".buyerSelect").click(event => this.onSelectActor(event, html));
    }

    async onSelectActor(event, html) {
        let val = $(event.currentTarget).val();
        console.log(val);

        this.actor = await fromUuid(val);
        let cash = this.actor.system.finance.cash;
        let after = "Cr" + (cash - Number(this.item.system.cost) * this.quantity).toLocaleString();

        html.find(".after")[0].innerHTML = after;
    }

    async onBuyClick(event, html) {
        event.preventDefault();
        this.close();

        let cash = Number(this.actor.system.finance.cash);
        let cost = Number(this.item.system.cost) * this.quantity;
        if (cost > cash) {
            ui.notifications.error(
                game.i18n.format("MGT2.Error.NotEnoughCash",
                    {"actor": this.actor.name, "cost": cost})
            )
        }
        await this.actor.update({"system.finance.cash": cash - cost});
        ui.notifications.info(
            game.i18n.format("MGT2.Info.BuyItem",
                {"actor": this.actor.name, "cost": cost, "item": this.item.name}
            )
        );
        let d = await Item.create(this.item, {parent: this.actor});
        d.update({"system.quantity": this.quantity});
    }

}

window.MgT2BuyDialog = MgT2BuyDialog;
