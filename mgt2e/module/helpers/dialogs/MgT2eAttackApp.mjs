import {MgT2Item} from "../../documents/item.mjs";
import {outputTradeChat, tradeBuyFreightHandler, tradeBuyGoodsHandler} from "../utils/trade-utils.mjs";
import {Tools} from "../chat/tools.mjs";
import {rollAttack, rollSpaceAttack} from "../dice-rolls.mjs";
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
        await this.calculateTargets();
        if (this.ATTACKER_TOKEN) {
            context.ATTACKER_TOKEN = this.ATTACKER_TOKEN;
            context.TARGETS = this.TARGETS;
            context.TARGET_SELECT = {};
            context.TARGET_SELECT[""] = "-";
            for (let t of this.TARGETS) {
                let text = `${t.distance}m ${t.name}`;
                if (t.type) {
                    text += ` [${t.type}]`;
                }
                if (t.facing) {
                    text += ` - ${game.i18n.localize("MGT2.Vehicle.Face." + t.facing)}`;
                }
                context.TARGET_SELECT[t.token.document._id] = text;
            }
        }

        return context;
    }

    // Rotation 0 assumes vehicle is pointing upwards (positive Y)
    _getTargetFacingHit(shooterX, shooterY, targetX, targetY, targetRotation) {
        const dx = shooterX - targetX;
        const dy = shooterY - targetY;
        let angleToShooter = Math.atan2(dx, dy) * (180 / Math.PI);
        if (angleToShooter < 0) {
            angleToShooter += 360;
        }
        console.log("Angle: " + angleToShooter);
        console.log("Rotation: " + targetRotation);
        let relativeAngle = (angleToShooter + targetRotation) % 360;
        if (relativeAngle < 0) {
            relativeAngle += 360;
        }
        console.log(relativeAngle);
        if (relativeAngle >= 315 || relativeAngle < 45) {
            return "aft";
        } else if (relativeAngle >= 45 && relativeAngle < 135) {
            return "starboard";
        } else if (relativeAngle >= 135 && relativeAngle < 225) {
            return "fore";
        } else {
            return "port";
        }
    }

    // Calculate what targets are available.
    // 1 must be selected - this is the person firing
    // 1+ must be targeted - these are the potential targets.
    async calculateTargets() {
        const user = game.users.current;
        const selected = canvas.tokens.controlled;
        const targets = user.targets;

        if (selected.length !== 1) {
            // We must have exactly one token selected. This is the current user.
            return;
        }

        if (targets.length < 1) {
            // We must also have some targets selected.
            return;
        }
        this.ATTACKER_TOKEN = selected[0];
        this.TARGETS = [];

        this.attackerTokenName = selected[0].name;
        const X = parseInt(selected[0].center.x);
        const Y = parseInt(selected[0].center.y);
        // Assume everything is in metres.
        let unitMultiplier = 1;
        if (canvas.grid.units === "km") {
            unitMultiplier = 1000;
        }

        for (let token of targets) {
            let x = parseInt(token.center.x);
            let y = parseInt(token.center.y);
            const dx = Math.abs(X - x);
            const dy = Math.abs(Y - y);

            // True euclidean distance.
            let d = Math.sqrt(dx * dx + dy * dy);
            let metres = (d / canvas.grid.size) * canvas.grid.distance * unitMultiplier;
            let rangeDm= 0;
            if (metres <= this.range.short) {
                rangeDm = 1;
            } else if (metres <= this.range.medium) {
                rangeDm = 0;
            } else if (metres <= this.range.long) {
                rangeDm = -2;
            } else if (metres <= this.range.extreme) {
                rangeDm = -4;
            } else {
                // Target is out of range.
                continue;
            }
            metres = parseFloat(metres.toFixed(1));

            console.log(token);
            const target = {
                token: token,
                name: token.name,
                rangeDm: rangeDm,
                distance: metres
            };

            if (token.actor.type === "vehicle") {
                // Work out facing?
                target.type = game.i18n.localize("TYPES.Actor.vehicle");
                target.facing = this._getTargetFacingHit(X, Y, x, y, token.document.rotation);
            } else if (token.actor.type === "spacecraft") {
                target.type = game.i18n.localize("TYPES.Actor.spacecraft");
            }
            this.TARGETS.push(target);

            this.TARGETS.sort((a, b) => {
                if (a.distance !== b.distance) {
                    return a.distance - b.distance;
                } else {
                    return a.name.localeCompare(b.name);
                }
            });
        }
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
                rangeSelect.value = `${(target.rangeDm>=0)?"+":""}${target.rangeDm}`;
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

        rollAttack(this.actor, this.weaponItem, this.attackOptions);
        this.close();
    }
}

