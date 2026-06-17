
import { MgT2eActorV2 } from "./MgT2eActorV2.mjs";
import {MgT2VehicleDamageApp} from "../../helpers/dialogs/vehicle-damage-app.mjs";

export class MgT2eRobotSheet extends MgT2eActorV2 {

    static DEFAULT_OPTIONS = {
        classes: ["mgt2e", "sheet", "actor" ],
        position: {width: 720, height: 640},
        window: {
            resizable: true,
            controls: [] // Header buttons go here
        },
        // Map your HTML [data-action] attributes to JS functions
        actions: {
            rollCheck: MgT2eActorV2.onRollCheck,
            test: MgT2eRobotSheet.#test,
            addFeature: {
                handler: MgT2eRobotSheet.#addFeature,
                buttons: [0, 1, 2],
                event: "change"
            },
            removeFeature: MgT2eRobotSheet.#removeFeature,
            editItem: MgT2eRobotSheet.#editItem,
            deleteItem: MgT2eRobotSheet.#deleteItem,
        },
        form: {
            handler: MgT2eRobotSheet.#onFormSubmit,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        main: {
            template: "systems/mgt2e/templates/actor/v2/robot/robot.html",
            scrollable: ['']
        },
        tabs: {
            template: "templates/generic/tab-navigation.hbs",
            scrollable: [""]
        },
        description: {
            template: "systems/mgt2e/templates/actor/v2/robot/description.html",
            scrollable: ['']
        },
        /*
        design: {
            template: "systems/mgt2e/templates/actor/v2/robot/design.html",
            scrollable: [""],
            classes: ["vehicle-design-tab"],
        },
        combat: {
            template: "systems/mgt2e/templates/actor/v2/robot/combat.html",
            scrollable: ['']
        },
        equipment: {
            template: "systems/mgt2e/templates/actor/v2/robot/equipment.html",
            scrollable: ['']
        },
        */
        footer: {
            template: "systems/mgt2e/templates/actor/v2/footer.html"
        }
    };

    static TABS = {
        primary: {
            tabs: [
                { id: "description" },
                // { id: "design" },
                // { id: "combat" },
                // { id: "equipment" },
            ],
            labelPrefix: "MGT2.RobotTab",
            initial: "design"
        }
    }

    static async #addFeature(event, target) {
        console.log("addFeature:");

    }

    static async #removeFeature(event, target) {
    }

    static async #editItem(event, target) {
        let itemId = event.target.dataset["itemId"];

        const item = this.document.items.get(itemId);
        if (item) {
            item.sheet.render(true);
        }
    }

    static async #deleteItem(event, target) {
        let itemId = event.target.dataset["itemId"];

        const item = this.document.items.get(itemId);
        if (item) {
            item.delete();
        }
    }

    static async #test(event, target) {
        console.log("TEST");
    }

    async _calculateTypes() {

    }

    async _calculateHits() {

    }



    prepareData() {
        console.log("prepareDerivedData:");
    }

    async _prepareContext(options) {
        const context = {
            actor: this.document,
            owner: this.document.permission > 2,
            system: this.document.system,
            items: this.document.items,
            config: CONFIG.MGT2,
            tabs: this._prepareTabs("primary")
        };



        return context;
    }

    async _preparePartContext(partId, context) {
        context.tab = context.tabs[partId];

        if (partId === "description") {
            context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
                this.document.system.description,
                { secrets: ((this.document.permission > 2)) }
            );
        }


        return context;
    }


    _onRender(context, options) {
        super._onRender(context, options);

        const traitSelect = this.element.querySelector('select[data-action="addFeature"]');
        if (traitSelect) {
            //traitSelect.removeEventListener("change", this.#addTrait.bind(this));
            traitSelect.addEventListener("change", (ev) => {
                // Manually trigger your private static method
            });
        }
    }

    static async #onFormSubmit(event, form, formData) {
        console.log("onFormSubmit:");
        await this.document.update(formData.object);
    }

    async _onDrop(event) {
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }
        console.log(data);
        switch (data.type) {
            case "Item":
                await this._onDropItem(event, data);
                break;
            case "Damage":
                await this._onDropDamage(event, data);
                break;
        }
    }

    async _onDropItem(event, data) {
        const item = await Item.fromDropData(data);

        if (!item || this.document.uuid === item.parent?.uuid) {
            console.log("Not allowed");
            return;
        }
        const itemData = item.toObject();
        try {
            const r = await this.document.createEmbeddedDocuments("Item", [ itemData ]);
            return r;
        } catch (err) {
            console.error("Failed to create", err);
            return false;
        }
    }

    async _onDropDamage(event, data) {
        console.log("DAMAGE:");

        const damageOptions = JSON.parse(data.options);
        console.log(damageOptions);
        this.applyDamageToRobot(damageOptions);


    }

    // Apply damage to a vehicle. This uses the damage rules from the Vehicle Update book.
    async applyDamageToRobot(options) {


    }

}
