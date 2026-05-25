
import { MgT2eItemV2 } from "./MgT2eItemV2.mjs";

export class MgT2eOptionSheet extends MgT2eItemV2 {
    static DEFAULT_OPTIONS = {
        classes: ["mgt2e", "sheet", "item"],
        position: {width: 720, height: 600},
        window: {
            resizable: true,
            controls: [] // Header buttons go here
        },
        // Map your HTML [data-action] attributes to JS functions
        actions: {
            rollCheck: MgT2eItemV2.onRollCheck,
            addFeature: {
                handler: MgT2eOptionSheet.#addFeature,
                buttons: [0, 1, 2],
                event: "change"
            },
            removeFeature: MgT2eOptionSheet.#removeFeature
        },
        form: {
            handler: MgT2eOptionSheet.#onFormSubmit,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        main: {
            template: "systems/mgt2e/templates/item/v2/item-option.html",
            scrollable: ['']
        },
        tabs: {
            template: "templates/generic/tab-navigation.hbs"
        },
        description: {
            template: "systems/mgt2e/templates/item/v2/description.html",
            scrollable: ['']
        },
        effects: {
            template: "systems/mgt2e/templates/item/v2/effects.html",
            scrollable: ['']
        },
        footer: {
            template: "systems/mgt2e/templates/actor/v2/footer.html"
        }
    };

    static TABS = {
        primary: {
            tabs: [
                { id: "description" },
                { id: "effects" },
            ],
            labelPrefix: "MGT2.ItemTab",
            initial: "description"
        }
    }

    static async #addFeature(event, target) {
        console.log("addFeature:");

        let feature = event.target.value;
    }

    static async #removeFeature(event, target) {
        let featureId = event.target.dataset["featureId"];

    }

    static async #test(event, target) {
        console.log("TEST");
    }

    async _calculateTypes() {
        const vehicleType = this.document.system.vehicle.type;
        const typeConfig = CONFIG.MGT2.VEHICLES.TYPE[vehicleType];

        if (!typeConfig) {
            console.log(`Unknown vehicle type [${vehicleType}]`);
            return;
        }
        let traits = this.document.system.vehicle.traits;
        for (let t of typeConfig.traits) {
            if (traits.indexOf(t) === -1) {
                traits = traits + "," + t;
            }
        }
        if (traits !== this.document.system.vehicle.traits) {
            await this.document.update({"system.vehicle.traits": traits});
        }
    }

    prepareData() {
        console.log("prepareDerivedData:");
    }

    async _prepareContext(options) {
        const context = {
            item: this.document,
            owner: this.document.permission > 2,
            system: this.document.system,
            parent: this.document.parent,
            config: CONFIG.MGT2,
            tabs: this._prepareTabs("primary")
        };


        context.SELECT_TECHLEVEL = {};
        for (let tl=0; tl < 20; tl++) {
            context.SELECT_TECHLEVEL[tl] = tl;
        }

        return context;
    }

    _preparePartContext(partId, context) {
        console.log(partId);
        context.tab = context.tabs[partId];



        return context;
    }


    _onRender(context, options) {
        super._onRender(context, options);

        const traitSelect = this.element.querySelector('select[data-action="addFeature"]');
        if (traitSelect) {
            console.log("found");
            //traitSelect.removeEventListener("change", this.#addTrait.bind(this));
            traitSelect.addEventListener("change", (ev) => {
                // Manually trigger your private static method
                MgT2eVehicleSheet.#addFeature.call(this, ev, ev.currentTarget);
            });
        }
    }

    static async #onFormSubmit(event, form, formData) {
        console.log("onFormSubmit:");
        await this.document.update(formData.object);
    }

    _getTabs2(options) {
        return "";
    }
}
