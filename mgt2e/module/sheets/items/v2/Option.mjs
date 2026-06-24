
import { MgT2eItemV2 } from "./MgT2eItemV2.mjs";

// Both Vehicle Options and Robot Options.
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
            addEffect: MgT2eOptionSheet.#addEffect,
            editEffect: MgT2eOptionSheet.#editEffect,
            deleteEffect: MgT2eOptionSheet.#deleteEffect
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
        "manipulators": {
            template: "systems/mgt2e/templates/item/v2/option/robot-manipulators.html",
            scrollable: [''],
        },
        effects: {
            template: "systems/mgt2e/templates/item/v2/effects.html",
            scrollable: ['']
        },
        footer: {
            template: "systems/mgt2e/templates/actor/v2/footer.html"
        }
    };


    _addTab(group, name, active) {
        return {
            active: active,
            cssClase: active?"active":null,
            group: group,
            id: name,
            label: "MGT2.ItemTab." + name
        }
    }

    _prepareTabs(group) {
        let tabs = {
            description: this._addTab("primary", "description", true),
            effects: this._addTab("primary", "effects", false)
        }
        switch (this.document.system.option.type) {
            case "manipulator":
                tabs.manipulators = this._addTab("primary", "manipulators", false);
                break;
        }
        return tabs;
    }

    static async #addEffect(event, target) {
        console.log("addEffect:");

        this.document.createEmbeddedDocuments("ActiveEffect",[
            {
                label: "Effect",
                name: "Vehicle Effect",
                icon: "systems/mgt2e/icons/items/option.svg",
                disabled: false,
                transfer: true,
                system: {
                    augmentType: "vehicle"
                }
            }
        ]);
    }

    static async #editEffect(event) {
        let effectId = event.target.dataset["effectId"];

        let effect = this.document.effects.get(effectId);
        if (effect) {
            effect.sheet.render(true);
        } else {
            console.log("No effect");
        }
    }

    static async #deleteEffect(event) {
        let effectId = event.target.dataset["effectId"];

        let effect = this.document.effects.get(effectId);
        effect.delete();
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
            EFFECTS: this.document.effects,
            tabs: this._prepareTabs("primary")
        };

        // Is this for vehicles or robots?
        context.SELECT_MODEL = {
            "vehicle": "Vehicle",
            "robot": "Robot"
        }

        context.SELECT_TYPE = {};
        if (this.document.system.option.model === "vehicle") {
            for (let t in CONFIG.MGT2.VEHICLES.OPTIONS) {
                context.SELECT_TYPE[t] = game.i18n.localize(`MGT2.Option.Type.${t}`);
            }
        } else {
            for (let t in CONFIG.MGT2.ROBOTS.OPTIONS) {
                context.SELECT_TYPE[t] = game.i18n.localize(`MGT2.Option.Type.${t}`);
            }
        }
        context.SELECT_TECHLEVEL = {};
        for (let tl=0; tl < 20; tl++) {
            context.SELECT_TECHLEVEL[tl] = tl;
        }

        // Dynamically add tabs
        switch (this.document.system.option.type) {
            case "manipulator":
                break;
        }


        return context;
    }

    async _preparePartContext(partId, context) {
        console.log(partId);
        context.tab = context.tabs[partId];

        if (partId === "description") {
            context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
                this.document.system.description,
                { secrets: ((this.document.permission > 2)?true:false) }
            );
        }

        return context;
    }


    _onRender(context, options) {
        super._onRender(context, options);

        const traitSelect = this.element.querySelector('select[data-action="addFeature"]');
        if (traitSelect) {
            console.log("found");
            //traitSelect.removeEventListener("change", this.#addTrait.bind(this));
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
