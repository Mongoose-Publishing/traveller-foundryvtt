
class MgT2eVehicleSheet extends MgT2eActorV2 {
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
            rollCheck: MgT2ActorV2.onRollCheck
        },
        form: {
            handler: MgT2ActorV2.onFormSubmit,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        header: {
            template: "systems/mgt2e/templates/actor/v2/header.html"
        },
        tabs: {
            template: "templates/generic/tab-navigation.html"
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
        return context;
    }
}
