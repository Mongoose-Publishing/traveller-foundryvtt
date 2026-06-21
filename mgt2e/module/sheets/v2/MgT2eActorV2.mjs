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

    onFormSubmit() {

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

