
import { MgT2eActorV2 } from "./MgT2eActorV2.mjs";

export class MgT2eVehicleSheet extends MgT2eActorV2 {
    static DEFAULT_OPTIONS = {
        //tag: "form", // The outer element type
        classes: ["mgt2e", "sheet", "actor"],
        position: {width: 720, height: 600},
        window: {
            resizable: true,
            controls: [] // Header buttons go here
        },
        // Map your HTML [data-action] attributes to JS functions
        actions: {
            rollCheck: MgT2eActorV2.onRollCheck
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

    async _prepareContext(options) {
        const context = {
            actor: this.document,
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

        return context;
    }

    static async #onFormSubmit(event, form, formData) {
        await this.document.update(formData.object);
    }

    _getTabs(options) {
        return "";
    }
}
