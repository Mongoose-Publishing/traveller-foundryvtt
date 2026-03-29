
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
            addTrait: {
                handler: MgT2eVehicleSheet.#addTrait,
                buttons: [0, 1, 2],
                event: "change"
            },
            removeTrait: MgT2eVehicleSheet.#removeTrait
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

    static async #addTrait(event, target) {
        console.log("addTrait:");
        console.log(event);
        console.log(target);

        console.log(event.target.value);

        let trait = event.target.value;

        if (this.document.system.vehicle.traits === "") {
            this.document.system.vehicle.traits = trait;
        } else {
            this.document.system.vehicle.traits += "," + trait;
        }
        this.document.update({"system.vehicle.traits": this.document.system.vehicle.traits});
    }

    static async #removeTrait(event, target) {
        let traitId = event.target.dataset["traitId"];

        let traits = this.document.system.vehicle.traits;
        let re = new RegExp(` ?${traitId},?`, "g");
        let b = traits.replaceAll(re, "").replaceAll(/,$/g, "").trim();
        this.actor.update({"system.vehicle.traits": b});
    }

    static async #test(event, target) {
        console.log("TEST");
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

        context.structure = Math.ceil(this.document.system.hits.max / 10);

        context.TYPE_SELECT = {};
        for (let t in CONFIG.MGT2.VEHICLES.TYPE) {
            context.TYPE_SELECT[t] = game.i18n.localize(`MGT2.Vehicle.Type.${t}`);
        }

        context.SELECT_TRAITS = {};
        context.SELECT_TRAITS[""] = "";
        if (CONFIG.MGT2.VEHICLES.TYPE[this.document.system.vehicle.type]) {
            let allowedFeatures = CONFIG.MGT2.VEHICLES.TYPE[this.document.system.vehicle.type].allowedFeatures;
            if (allowedFeatures) {
                for (let t in allowedFeatures) {
                    if (this.document.system.vehicle.traits.indexOf(allowedFeatures[t]) === -1) {
                        context.SELECT_TRAITS[allowedFeatures[t]] = game.i18n.localize("MGT2.Vehicle.Trait." + allowedFeatures[t]);
                    }
                }
            }
        }
        console.log(context.SELECT_TRAITS);

        return context;
    }

    _onRender(context, options) {
        super._onRender(context, options);

        const traitSelect = this.element.querySelector('select[data-action="addTrait"]');
        if (traitSelect) {
            console.log("found");
            //traitSelect.removeEventListener("change", this.#addTrait.bind(this));
            traitSelect.addEventListener("change", (ev) => {
                // Manually trigger your private static method
                MgT2eVehicleSheet.#addTrait.call(this, ev, ev.currentTarget);
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
