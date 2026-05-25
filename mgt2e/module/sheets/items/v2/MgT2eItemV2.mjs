const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class MgT2eItemV2 extends HandlebarsApplicationMixin(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: "form", // The outer element type
        classes: ["mgt2e", "sheet", "item"],
        position: {width: 720, height: 600},
        window: {
            resizable: true,
            controls: [] // Header buttons go here
        },
        // Map your HTML [data-action] attributes to JS functions
        actions: {
            rollCheck: MgT2eItemV2.onRollCheck
        },
        form: {
            handler: MgT2eItemV2.onFormSubmit,
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

    onRollCheck() {

    }

    onFormSubmit() {

    }

    async _prepareContext(options) {
        const context = {
            item: this.document,
            system: this.document.system,
            parent: this.document.parent,
            config: CONFIG.MGT2,
            tabs: this._getTabs(options)
        };
        return context;
    }
}

