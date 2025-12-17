import {MgT2Item} from "../../documents/item.mjs";
import {outputTradeChat, tradeBuyFreightHandler, tradeBuyGoodsHandler} from "../utils/trade-utils.mjs";
import {Tools} from "../chat/tools.mjs";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

// see: https://foundryvtt.wiki/en/development/api/applicationv2
export class MgT2MissileAttackApp extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(salvoActor, targetActor) {
        super();
        this.salvoActor = salvoActor;
        this.targetActor = targetActor;
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

        if (this.salvoActor?.system?.sourceId) {
            this.sourceActor = await fromUuid(this.salvoActor.system.sourceId);
        }
        context.sourceActor = this.sourceActor;

        context.TARGET_ICON = "systems/mgt2e/icons/misc/unknown-target.svg";
        if (this.targetActor) {
            console.log(this.targetActor);
            context.TARGET_ICON = this.targetActor.img;
        }
        context.salvoActor = this.salvoActor;
        context.DAMAGE = "";
        this.weaponItem = await fromUuid(this.salvoActor.system.salvo.weaponId);
        context.weaponItem = this.weaponItem;
        if (context.weaponItem) {
            context.DAMAGE = context.weaponItem.system.weapon.damage;
        }
        context.SIZE = this.salvoActor.system.size.value;
        context.DM = 0;
        context.TL = this.salvoActor.system.salvo.tl;

        return context;
    }


    static async formHandler(event, form, formData) {
        console.log(event);
        console.log(form);
        console.log(formData);
        if (event.type === "submit") {
            MgT2MissileAttackApp.rollImpact();
        }

        return null;
    }

    static selectTargetAction(event, target) {
        console.log("selectTargetAction:");
        console.log(event);
        console.log(target);
    }

    static rollImpact() {
        let attackDice = "2D6";
        let smartDm = 1;
        let targetTL = parseInt(this.targetActor.system.spacecraft.tl);
        let missileTL = parseInt(this.salvoActor.system.salvo.tl);
        if (targetTL < missileTL) {
            smartDm = Math.min(6, missileTL - targetTL);
        }
        let attackDm = smartDm + parseInt(this.salvoActor.system.salvo.size.value);

        let attackOptions = {
            "score": attackDm,
            "salvoSize": parseInt(this.salvoActor.system.salvo.size.value)
        };
        rollSpaceAttack(this.salvoActor, null, this.weaponItem, attackOptions);
    }
}

