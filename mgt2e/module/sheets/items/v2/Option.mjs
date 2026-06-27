
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
        "armour": {
            template: "systems/mgt2e/templates/item/v2/option/robot-armour.html",
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

    _addTab(group, name) {
        // Compare directly against our tracked class instance variable
        const activeTabId = this.tabGroups?this.tabGroups[group]:"description";
        const isActive = activeTabId === name;

        return {
            active: isActive,
            cssClass: isActive ? "active" : null,
            group: group,
            id: name,
            label: "MGT2.ItemTab." + name
        };
    }

    _prepareTabs(group) {
        let tabs = {
            description: this._addTab("primary", "description"),
            effects: this._addTab("primary", "effects")
        }
        switch (this.document.system.option.type) {
            case "manipulator":
                tabs.manipulators = this._addTab("primary", "manipulators");
                break;
        }
        console.log(tabs);
        return  tabs ;
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

    async _calculateManipulators(item, newSize) {
        console.log("CALCULATE MANIPULATORS");
        let robotSize = 5;
        let robotSlots = 8;
        if (item.parent && item.parent.type === "robot") {
            robotSize = parseInt(item.parent.system.robot.size) || 8;
            robotSlots = parseInt(item.parent.system.robot.slots) || 8;
        }
        let size = parseInt(newSize) || 0;
        let slotpc = parseInt(item.system.option.manipulators.slotpc);

        slotpc = parseInt(Math.max(1, 10 * Math.pow(2, size)));
        console.log("Size: " + size);
        console.log("Slot%: " + slotpc);


        const slots = Math.ceil((robotSlots * slotpc) / 100.0);
        console.log("Robot slots: " + robotSlots);
        console.log("Slots: " + slots);

        const actualSize = robotSize + size;
        let str = (actualSize - 1) * 2;
        let dex = parseInt(item.system.tl / 2) + 1;


        if (slots != item.system.option.slots) {
            item.system.option.slots = slots;
            item.system.option.manipulators.str = str;
            item.system.option.manipulators.dex = dex;
            item.system.option.manipulators.slotpc = slotpc;
            await item.update({"system.option": item.system.option });
        }


    }

    _prepareManipulators(context) {
        context.SELECT_SIZE = {};
        context.SELECT_SIZE["-3"] = "Small -3";
        context.SELECT_SIZE["-2"] = "Small -2";
        context.SELECT_SIZE["-1"] = "Small -1";
        context.SELECT_SIZE["+0"] = "Standard";
        context.SELECT_SIZE["+1"] = "Large +1";
        context.SELECT_SIZE["+2"] = "Large +2";

    }

    async _preparePartContext(partId, context) {
        context.tab = context.tabs[partId];

        if (partId === "description") {
            context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
                this.document.system.description,
                { secrets: ((this.document.permission > 2)?true:false) }
            );
        } else if (partId === "manipulators") {
            this._prepareManipulators(context);
        }

        return context;
    }

    _onRender(context, options) {
        super._onRender(context, options);

        const e = this.element.querySelector('select[data-action="changeManipulators"]');
        if (e) {
            console.log("found");
            e.addEventListener("change", (ev) => {
                this._calculateManipulators(this.document, ev.target.value);
            })
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
