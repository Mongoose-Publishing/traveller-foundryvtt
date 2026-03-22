const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

class MgT2eActorV2 extends HandlebarsApplicationMixin(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: "form", // The outer element type
        classes: ["my-system", "sheet", "actor"],
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
            template: ""
        },
        tabs: {
            template: ""
        },
        body: {
            template: ""
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

