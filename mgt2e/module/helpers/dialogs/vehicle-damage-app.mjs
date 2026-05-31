import {MgT2Item} from "../../documents/item.mjs";
import {outputTradeChat, tradeBuyFreightHandler, tradeBuyGoodsHandler} from "../utils/trade-utils.mjs";
import {Tools} from "../chat/tools.mjs";
import {rollSpaceAttack} from "../dice-rolls.mjs";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

// see: https://foundryvtt.wiki/en/development/api/applicationv2
export class MgT2VehicleDamageApp extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(targetActor, damageOptions) {
        super();
        this.targetActor = targetActor;
        this.damageOptions = damageOptions;

        this.ARMOUR_SELECT = {
            "front": game.i18n.localize("MGT2.Vehicle.Face.front"),
            "rear": game.i18n.localize("MGT2.Vehicle.Face.rear"),
            "port": game.i18n.localize("MGT2.Vehicle.Face.port"),
            "starboard": game.i18n.localize("MGT2.Vehicle.Face.starboard"),
            "top": game.i18n.localize("MGT2.Vehicle.Face.top"),
            "bottom": game.i18n.localize("MGT2.Vehicle.Face.bottom")
        }
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: MgT2VehicleDamageApp.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
        },
        actions: {
            selectTarget: MgT2VehicleDamageApp.selectTargetAction
        },
        position: {
            width: 400,
            height: "auto"
        },
        window: {
            title: "MGT2.Dialog.VehicleDamage"
        }
    }

    static PARTS = {
        form: {
            template: "systems/mgt2e/templates/dialogs/vehicle-damage.html"
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    }

    async _prepareContext(options) {
        const context = {
            buttons: [
                { type: "submit", icon: "fa-solid fa-save", label: "Impact" }
            ],
            TARGET: this.targetActor,
            OPTIONS: this.damageOptions,
            ARMOUR_SELECT: this.ARMOUR_SELECT
        }

        return context;
    }

    /*
     *
     * @param partId
     * @param context
     * @returns {Promise<*>}
     * @private
     */
    async _preparePartContext(partId, context) {
        console.log("_preparePartContext: " + partId);
        context.partId = `${this.id}-${partId}`;



        return context;
    }

    // Despite being static, formHandler has access to `this`
    static async formHandler(event, form, formData) {

        console.log(formData.object.DM);
        let customDM = parseInt(formData.object.DM);
        if (isNaN(customDM)) {
            customDM = 0;
        }

        if (event.type === "submit") {
            this.rollImpact(customDM);
        }

        return null;
    }

    // Despite being static, action methods have access to `this`
    static selectTargetAction(event, target) {
        console.log("selectTargetAction:");
        // Do nothing. We should already have a target by this point.
    }

    rollImpact(customDM) {
        let attackDice = "2D6";
        let smartDm = 1;
        let targetTL = parseInt(this.targetActor.system.spacecraft.tl);
        let missileTL = parseInt(this.salvoActor.system.salvo.tl);
        if (targetTL < missileTL) {
            smartDm = Math.min(6, missileTL - targetTL);
        }
        console.log(this.salvoActor);
        let attackDm = smartDm + parseInt(this.salvoActor.system.size.value);

        let attackOptions = {
            "attackDM": attackDm,
            "salvoSize": parseInt(this.salvoActor.system.size.value),
            "dm": customDM
        };
        rollSpaceAttack(this.salvoActor, null, this.weaponItem, attackOptions);
        this.close();
    }
}

