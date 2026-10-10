import {MgT2Item} from "../../documents/item.mjs";
import {Tools} from "../chat/tools.mjs";
import {rollAttack, rollSpaceAttack} from "../dice-rolls.mjs";
import {getAttackerTokens, getTargetData} from "../utils/combat-utils.mjs";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

// see: https://foundryvtt.wiki/en/development/api/applicationv2
export class MgT2eAttackApp extends HandlebarsApplicationMixin(ApplicationV2) {

    // this.actor : The character actually doing the firing.
    // attackOptions:
    //    vehicle: if attached to a vehicle, the vehicle actor.
    constructor(actor, weaponItem, attackOptions) {
        super();
        this.actor = actor;
        this.weaponItem = weaponItem;
        this.attackOptions = attackOptions;

        if (this.attackOptions?.vehicle) {
            this.ATTACKER_TOKENS = getAttackerTokens(this.attackOptions.vehicle);
        } else {
            this.ATTACKER_TOKENS = getAttackerTokens(this.actor);
        }
        if (this.ATTACKER_TOKENS?.length === 1) {
            // Exactly one possible attacker token.
            this.ATTACKER_TOKEN = this.ATTACKER_TOKENS[0];
            this.TARGETS = getTargetData(this.ATTACKER_TOKEN);
            this.ATTACKER_TOKEN.control({ releaseOthers: true });
        } else {
            ui.notifications.warn("No unique attacker token selected");
        }
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: MgT2eAttackApp.formHandler,
            submitOnChange: false,
            closeOnSubmit: false
        },
        actions: {
            selectTarget: MgT2eAttackApp.selectTargetAction,
            addTargets: MgT2eAttackApp.#addTargets
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

    _getRangeDM(target) {
        if (target.distance <= this.range.short) {
            return +1;
        } else if (target.distance <= this.range.medium) {
            return +0;
        } else if (target.distance <= this.range.long) {
            return -2;
        } else if (target.distance <= this.range.extreme) {
            return -4;
        }
        return -99;
    }

    async _prepareContext(options) {
        console.log("_prepareContext:");
        const characteristic = this.weaponItem.system.weapon.characteristic;
        const skill = this.weaponItem.system.weapon.skill;
        const characteristicDM = this.actor.system.characteristics?.[characteristic]?.dm || 0;
        this.skillDM = this.actor.getSkillValue(skill, { cha: characteristic }) + characteristicDM;

        const context = {
            actor: this.actor,
            weaponItem: this.weaponItem,
            rangeUnit: this.weaponItem.system.weapon.scale === "vehicle" ? "km" : "m",
            skillText: this._getSkillText(),
            skillDM: this.skillDM,
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

        context.customDM = parseInt(this.attackOptions.dm) || 0;

        context.RANGE_SELECT = {};
        context.RANGE_SELECT["+1"] = `${game.i18n.localize("MGT2.Attack.short")} (${this.range.short}${context.rangeUnit}, +1)`;
        context.RANGE_SELECT["+0"] = `${game.i18n.localize("MGT2.Attack.medium")} (${this.range.medium}${context.rangeUnit}, +0)`;
        context.RANGE_SELECT["-2"] = `${game.i18n.localize("MGT2.Attack.long")} (${this.range.long}${context.rangeUnit}, -2)`;
        context.RANGE_SELECT["-4"] = `${game.i18n.localize("MGT2.Attack.extreme")} (${this.range.extreme}${context.rangeUnit}, -4)`;

        // Get possible targets
        this.TARGETS = getTargetData(this.ATTACKER_TOKEN)
        if (this.ATTACKER_TOKEN) {
            context.ATTACKER_TOKEN = this.ATTACKER_TOKEN;
            context.TARGETS = this.TARGETS;
            context.TARGET_SELECT = {};
            for (let t of this.TARGETS) {
                let text = `${t.distance}m ${t.name}`;
                if (t.type) {
                    text += ` [${game.i18n.localize("TYPES.Actor." + t.type)}]`;
                }
                if (t.sizeDM) {
                    text += ` [Size ${t.sizeDM>0?"+":""}${t.sizeDM}]`
                }
                if (t.facing) {
                    text += ` - ${game.i18n.localize("MGT2.Vehicle.Face." + t.facing)}`;
                }
                t.rangeDM = this._getRangeDM(t);
                if (t.rangeDM) {
                    text += ` [${t.rangeDM}]`;
                }
                context.TARGET_SELECT[t.token.document._id] = text;
            }
            if (!this.currentTarget) {
                this.currentTarget = this.TARGETS[0];
            }
        } else {
            context.ATTACKER_TOKENS = this.ATTACKER_TOKENS;
            context.ATTACKER_SELECT = {};
            for (let t of this.ATTACKER_TOKENS) {
                console.log(t);
                context.ATTACKER_SELECT[t.document.uuid] = t.name;
            }
        }
        if (this.attackerTokenName && options?.window) {
            options.window.title = game.i18n.format("MGT2.AttackDialog.Title", { name: this.attackerTokenName });
        }
        context.currentTarget = this.currentTarget;
        console.log(this.currentTarget);

        return context;
    }

    static async #addTargets() {
        console.log("Recalculate targets");
        this.TARGETS = getTargetData(this.ATTACKER_TOKEN)
        this.render();
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

    _onRender(context, options) {
        super._onRender(context, options);

        // When target is changed, update the range for the attack.
        const targetSelect = this.element.querySelector('select[data-action="changeTarget"]');
        if (targetSelect) {
            targetSelect.addEventListener("change", (ev) => {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                const id = ev.target.value;
                const target = this.TARGETS.filter(t => t.token.document._id === id)[0];
                const rangeSelect = this.element.querySelector('select[data-action="changeRange"]');
                rangeSelect.value = `${(target.rangeDM>=0)?"+":""}${target.rangeDM}`;
                this.currentTarget = target;
                this.render();
            });
        }
    }


    // Despite being static, formHandler has access to `this`
    static async formHandler(event, form, formData) {

        let customDM = parseInt(formData.object.DM);
        if (isNaN(customDM)) {
            customDM = 0;
        }
        const rangeDM = parseInt(formData.object.range);

        if (event.type === "submit") {
            this.rollImpact(customDM, rangeDM);
        }

        return null;
    }

    // Despite being static, action methods have access to `this`
    static selectTargetAction(event, target) {
        console.log("selectTargetAction:");
        // Do nothing. We should already have a target by this point.
    }

    rollImpact(customDM, rangeDM) {
        this.attackOptions.skillDM = this.skillDM;
        this.attackOptions.dm = customDM;
        this.attackOptions.rangeDM = rangeDM;
        this.attackOptions.showBreakdown = true;
        if (this.currentTarget.dodgeDM) {
            this.attackOptions.dodgeDM = this.currentTarget.dodgeDM;
        }
        this.currentTarget.token.actor.setDodgeEffect(0);

        if (this.currentTarget?.type === "vehicle") {
            this.attackOptions.facing = this.currentTarget.facing;
        }
        rollAttack(this.actor, this.weaponItem, this.attackOptions);
        this.close();
    }

}

