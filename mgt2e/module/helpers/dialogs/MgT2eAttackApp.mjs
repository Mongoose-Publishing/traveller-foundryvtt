import {MgT2Item} from "../../documents/item.mjs";
import {outputTradeChat, tradeBuyFreightHandler, tradeBuyGoodsHandler} from "../utils/trade-utils.mjs";
import {Tools} from "../chat/tools.mjs";
import {rollSpaceAttack} from "../dice-rolls.mjs";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

// see: https://foundryvtt.wiki/en/development/api/applicationv2
export class MgT2eAttackApp extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(actor, weaponItem, attackOptions) {
        super();
        this.actor = actor;
        this.weaponItem = weaponItem;
        this.attackOptions = attackOptions;
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: MgT2eAttackApp.formHandler,
            submitOnChange: false,
            closeOnSubmit: false
        },
        actions: {
            selectTarget: MgT2eAttackApp.selectTargetAction
        },
        window: {
            title: "MGT2.AttackRoll"
        }
    }

    static PARTS = {
        form: {
            template: "systems/mgt2e/templates/dialogs/attack-dialog.html"
        },
        footer: {
            template: "templates/generic/form-footer.hbs"
        }
    }

    _getSkillText() {
        const cha = this.weaponItem.system.weapon.characteristic;
        const skillFqdn = this.weaponItem.system.weapon.skill;

        let text = cha + " + " + this.actor.getSkillLabel(skillFqdn, false);

        return text;
    }

    async _prepareContext(options) {
        const context = {
            actor: this.actor,
            weaponItem: this.weaponItem,
            rangeUnit: "m",
            skillText: this._getSkillText(),
            buttons: [
                { type: "submit", icon: "fa-solid fa-save", label: "Attack" }
            ]
        }
        const range = parseInt(this.weaponItem.system.weapon.range)||0;
        this.range = {
            short: range / 4,
            medium: range,
            long: range * 2,
            extreme: range * 4
        }

        context.RANGE_SELECT = {};
        context.RANGE_SELECT["+1"] = `${game.i18n.localize("MGT2.Attack.short")} (${this.range.short}${context.rangeUnit}, +1)`;
        context.RANGE_SELECT["+0"] = `${game.i18n.localize("MGT2.Attack.medium")} (${this.range.medium}${context.rangeUnit}, +0)`;
        context.RANGE_SELECT["-2"] = `${game.i18n.localize("MGT2.Attack.long")} (${this.range.long}${context.rangeUnit}, -2)`;
        context.RANGE_SELECT["-4"] = `${game.i18n.localize("MGT2.Attack.extreme")} (${this.range.extreme}${context.rangeUnit}, -4)`;

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

        this.close();
    }
}

