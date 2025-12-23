import {MgT2Item} from "../../documents/item.mjs";
import {outputTradeChat, tradeBuyFreightHandler, tradeBuyGoodsHandler} from "../utils/trade-utils.mjs";
import {Tools} from "../chat/tools.mjs";
import {rollSpaceAttack} from "../dice-rolls.mjs";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

// see: https://foundryvtt.wiki/en/development/api/applicationv2
export class MgT2MissileAttackApp extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(salvoActor, targetActor, weaponItem, attackOptions) {
        super();
        this.salvoActor = salvoActor;
        this.targetActor = targetActor;
        this.weaponItem = weaponItem;
        this.attackOptions = attackOptions;
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: MgT2MissileAttackApp.formHandler,
            submitOnChange: false,
            closeOnSubmit: false
        },
        actions: {
            selectTarget: MgT2MissileAttackApp.selectTargetAction
        },
        window: {
            title: "MGT2.Dialog.MissileAttack"
        }
    }

    static PARTS = {
        form: {
            template: "systems/mgt2e/templates/dialogs/missile-attack.html"
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    }

    async _prepareContext(options) {
        const context = {
            buttons: [
                { type: "submit", icon: "fa-solid fa-save", label: "Impact" }
            ]
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

        console.log("WEAPON IN CONTEXT");
        console.log(this.weaponItem);

        if (this.salvoActor?.system?.sourceId) {
            this.sourceActor = await fromUuid(this.salvoActor.system.sourceId);
        }
        context.salvoActor = this.salvoActor;
        context.targetActor = this.targetActor;
        context.attackDM = this.attackOptions.attackDM;

        context.salvoActor = this.salvoActor;
        context.DAMAGE = "";
        context.weaponItem = this.weaponItem;
        if (context.weaponItem) {
            context.DAMAGE = context.weaponItem.system.weapon.damage;
        }
        context.SIZE = this.salvoActor.system.size.value;
        context.DM = 2;
        context.TL = this.salvoActor.system.salvo.tl;

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

