import {MgT2AttackDialog} from "../../helpers/attack-dialog.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class MgT2eActorV2 extends HandlebarsApplicationMixin(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: "form", // The outer element type
        classes: ["mgt2e", "sheet", "actor"],
        position: {width: 720, height: 600},
        window: {
            resizable: true,
            controls: [] // Header buttons go here
        },
        // Map your HTML [data-action] attributes to JS functions
        actions: {
            attack: MgT2eActorV2.#onAttack,
            reload: MgT2eActorV2.#onReload,
            rollCheck: MgT2eActorV2.onRollCheck
        },
        form: {
            handler: MgT2eActorV2.onFormSubmit,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        header: {
            template: ""
        },
        tabs: {
            template: ""
        },
        body: {
            template: ""
        }
    };

    _prepareCharacteristics() {
        if (this.document.system.characteristics) {
            for (let c in this.document.system.characteristics) {
                let char = this.document.system.characteristics[c];
                if (char.value < 1) {
                    char.dm = -3;
                } else if (char.value < 3) {
                    char.dm = -2;
                } else {
                    char.dm = parseInt(char.value / 3) - 2;
                }
            }
        }
    }

    onRollCheck() {

    }

    static async #onAttack(event, target) {
        const itemId = event.target.dataset["itemId"];
        const item = this.document.items.get(itemId);

        if (item) {
            new MgT2AttackDialog(this.actor, item).render(true);
        } else {
            console.log("No item found");
        }
    }

    static async #onReload(event, target) {

    }

    onFormSubmit() {

    }

    async _prepareItems(context) {
        context.ITEMS = this.document.items;
        context.ITEMS_WEAPONS = [];
        context.ITEMS_ARMOUR = [];
        context.ITEMS_OPTIONS = [];
        context.ITEMS_GEAR = [];

        for (let item of this.document.items) {
            if ([ "weapon" ].includes(item.type)) {
                context.ITEMS_WEAPONS.push(item);
            } else if ([ "armour" ].includes(item.type)) {
                context.ITEMS_ARMOUR.push(item);
            } else if ([ "roles" ].includes(item.type)) {
                context.ITEMS_ROLES.push(item);
            } else if ([ "option" ].includes(item.type)) {
                context.ITEMS_OPTIONS.push(item);
                console.log(item);
                switch (item.system.option.type) {
                    case "armour":
                        context.ITEMS_ARMOUR.push(item);
                        break;
                }
            } else {
                context.ITEMS_GEAR.push(item);
            }
        }
    }

    async _prepareContext(options) {
        const context = {
            actor: this.document,
            system: this.document.system,
            items: this.document.items,
            config: CONFIG.MGT2,
            tabs: this._getTabs(options)
        };
        return context;
    }
}

