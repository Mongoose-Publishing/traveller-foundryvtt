
import { MgT2eActorV2 } from "./MgT2eActorV2.mjs";

export class MgT2eVehicleSheet extends MgT2eActorV2 {
    static DEFAULT_OPTIONS = {
        classes: ["mgt2e", "sheet", "actor"],
        position: {width: 720, height: 600},
        window: {
            resizable: true,
            controls: [] // Header buttons go here
        },
        // Map your HTML [data-action] attributes to JS functions
        actions: {
            rollCheck: MgT2eActorV2.onRollCheck,
            test: MgT2eVehicleSheet.#test,
            addFeature: {
                handler: MgT2eVehicleSheet.#addFeature,
                buttons: [0, 1, 2],
                event: "change"
            },
            removeFeature: MgT2eVehicleSheet.#removeFeature
        },
        form: {
            handler: MgT2eVehicleSheet.#onFormSubmit,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        tabs: {
            template: "templates/generic/tab-navigation.hbs"
        },
        main: {
            template: "systems/mgt2e/templates/actor/v2/vehicle.html"
        },
        footer: {
            template: "systems/mgt2e/templates/actor/v2/footer.html"
        }
    };

    static async #addFeature(event, target) {
        console.log("addFeature:");

        let feature = event.target.value;

        if (this.document.system.vehicle.features === "") {
            this.document.system.vehicle.features = feature;
        } else {
            this.document.system.vehicle.features += "," + feature;
        }
        this.document.update({"system.vehicle.features": this.document.system.vehicle.features});
    }

    static async #removeFeature(event, target) {
        let featureId = event.target.dataset["featureId"];

        let features = this.document.system.vehicle.features;
        let re = new RegExp(` ?${featureId},?`, "g");
        let b = features.replaceAll(re, "").replaceAll(/,$/g, "").trim();
        b = b.replaceAll(/,,/g, ",");
        this.actor.update({"system.vehicle.features": b});
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
            actor: this.document,
            owner: this.document.permission > 2,
            system: this.document.system,
            items: this.document.items,
            config: CONFIG.MGT2,
            tabs: this._getTabs(options)
        };

        await this._calculateTypes();

        context.structure = Math.ceil(this.document.system.hits.max / 10);

        context.TYPE_SELECT = {};
        for (let t in CONFIG.MGT2.VEHICLES.TYPE) {
            context.TYPE_SELECT[t] = game.i18n.localize(`MGT2.Vehicle.Type.${t}`);
        }

        context.SELECT_FEATURES = {};
        context.SELECT_FEATURES[""] = "";
        if (CONFIG.MGT2.VEHICLES.TYPE[this.document.system.vehicle.type]) {
            let allowedFeatures = CONFIG.MGT2.VEHICLES.TYPE[this.document.system.vehicle.type].allowedFeatures;
            if (allowedFeatures) {
                for (let t in allowedFeatures) {
                    if (this.document.system.vehicle?.features?.indexOf(allowedFeatures[t]) === -1) {
                        context.SELECT_FEATURES[allowedFeatures[t]] = game.i18n.localize("MGT2.Vehicle.Feature." + allowedFeatures[t]);
                    }
                }
            }
        }
        context.SELECT_TECHLEVEL = {};
        for (let tl=0; tl < 20; tl++) {
            context.SELECT_TECHLEVEL[tl] = tl;
        }

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

    _getTabs(options) {
        return "";
    }
}
