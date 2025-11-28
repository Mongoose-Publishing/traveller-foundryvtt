const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class MgT2CharacteristicDamageApp extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(actor) {
        super();
        this.actor = actor;
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: MgT2CharacteristicDamageApp.formHandler,
            submitOnChange: false,
            closeOnSubmit: true
        },
        actions: {
            disable: MgT2CharacteristicDamageApp.disableAction
        },
        window: {
            title: "MGT2.Dialog.CharacteristicDamage.Title"
        }
    }

    static PARTS = {
        form: {
            template: "systems/mgt2e/templates/dialogs/characteristic-damage.html"
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    }

    async _prepareContext(options) {
        const context = {
            buttons: [
                { type: "submit", icon: "fa-solid fa-save", label: "Save" }
            ]
        }

        return context;
    }

    async _preparePartContext(partId, context) {
        console.log("_preparePartContext: " + partId);
        context.partId = `${this.id}-${partId}`;

        this.LIST = {};
        for (let c in this.actor.system.characteristics) {
            if (c !== "STR" && c != "DEX" && c != "END") {
                if (this.actor.system.characteristics[c].show) {
                    this.LIST[c] = this.actor.system.damage[c] ? true : false;
                }
            }
        }

        context.ACTOR = this.actor;
        context.STATS = this.actor.system.settings.characteristics;
        context.LIST = this.LIST;

        return context;
    }


    static async formHandler(event, form, formData) {
        if (event.type === "submit") {
            for (let c in formData.object) {
                if (this.actor.system.characteristics[c]) {
                    let value = formData.object[c];
                    if (value) {
                        this.actor.system.damage[c] = { "value": 0 };
                    } else {
                        this.actor.system.damage[c] = null;
                        delete this.actor.system.damage[c];
                        this.actor.update({[`system.damage.-=${c}`]: null });
                    }
                }
            }
            this.actor.update({"system.damage": this.actor.system.damage});
        }

        return null;
    }

    static disableAction(event, target) {
        console.log("disableAction:");
        delete this.actor.system.damage;
        this.actor.update({"system.-=damage": null });
        this.close();
    }
}
