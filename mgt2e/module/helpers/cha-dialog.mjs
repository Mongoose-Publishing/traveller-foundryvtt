import {MgT2Item} from "../documents/item.mjs";

// Allow damage characteristics to be modified.
export class MgT2ChaDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/cha-dialog.html";
        options.width = "400";
        options.height = "auto";
        options.title = "Move Items";

        return options;
    }

    constructor(actor) {
        super();
        this.actor = actor;

        this.options.title = "Modify " + actor.name;
    }

    getData() {

        this.LIST = {};

        for (let c in this.actor.system.characteristics) {
            if (c !== "STR" && c != "DEX" && c != "END") {
                if (this.actor.system.characteristics[c].show) {
                    this.LIST[c] = {
                        'hasDamage': this.actor.system.damage[c] ? true : false
                    };
                }
            }

            console.log(c);
        }

        return {
            "ACTOR": this.actor,
            "STATS": this.actor.system.settings.characteristics,
            "LIST": this.LIST
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const save = html.find("button[class='save']");
        save.on("click", event => this.onSaveClick(event, html));

        html.find(".chaItem").click(ev => this._toggle(html, ev.currentTarget.dataset.id));
    }

    _toggle(html, cha) {
        if (this.LIST[cha].hasDamage) {
            this.LIST[cha].hasDamage = false;
            this.actor.system.damage[cha] = null;
            delete this.actor.system.damage[cha];
            this.actor.update({[`system.damage.-=${cha}`]: null});
            html.find(".cha-" + cha)[0].innerHTML = cha;
        } else {
            this.LIST[cha].hasDamage = true;
            this.actor.system.damage[cha] = { "value": 0 };
            this.actor.update({"system.damage": this.actor.system.damage });
            html.find(".cha-" + cha)[0].innerHTML = cha + " <i class=\"fa-solid fa-check\"></i>";
        }
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
