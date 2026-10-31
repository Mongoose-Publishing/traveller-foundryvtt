import {MgT2Item} from "../../documents/item.mjs";
import {Tools} from "../chat/tools.mjs";
import {getTraitValue, hasTrait, rollAttack, rollSpaceAttack} from "../dice-rolls.mjs";
import {getAttackerTokens, getTargetData} from "../utils/combat-utils.mjs";
import {formatRangeDMOption, getTargetRangeBand, getWeaponRangeBands, rebindTargetById, resolveRangeDM} from "../utils/range-utils.mjs";
import {MGT2} from "../config.mjs";
import {AIMING_AUTO_WARNING, hasAimingAutoConflict, isCharacterAimingActor, parseAimingActions, resetAimingForTargetChange} from "../utils/attack-modifiers.mjs";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api
const MANUAL_RANGE_DMS = new Set([1, 0, -2, -4]);

function parseManualRangeDM(value) {
    if (!["number", "string"].includes(typeof value)) return null;
    if (typeof value === "string" && value.trim() === "") return null;
    const rangeDM = Number(value);
    return MANUAL_RANGE_DMS.has(rangeDM) ? rangeDM : null;
}

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
        this.shotType = "single";
        this.aimingActions = 0;

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
            this.ATTACKER_TOKENS = null;
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

        if (!this.actor) {
            return Tools.getSkillLabel(MGT2.getDefaultSkills(), skillFqdn);
        }

        let text = cha + " + " + this.actor.getSkillLabel(skillFqdn, false);

        return text;
    }

    _getRangeDM(target) {
        const result = getTargetRangeBand(target.distanceMetres ?? target.distance, this.rangeBands, {
            aimed: this.aimingActions > 0 && !["burst", "full"].includes(this.shotType),
            hasScope: hasTrait(this.weaponItem.system.weapon.traits, "scope")
        });
        if (result.band === "outOfRange") {
            target.rangeText = game.i18n.localize("MGT2.AttackDialog.OutOfRange");
        } else if (result.limitedByScope) {
            target.rangeText = game.i18n.localize("MGT2.AttackDialog.NoScope");
        } else {
            target.rangeText = game.i18n.localize(`MGT2.Attack.${result.band}`);
        }
        return result.dm;
    }

    _buildEligibleTargets(rawTargets) {
        const targets = [];
        const select = {};
        for (let target of rawTargets) {
            let text = `${target.distance}m ${target.name}`;
            if (target.type) text += ` [${game.i18n.localize("TYPES.Actor." + target.type)}]`;
            if (target.sizeDM) text += ` [Size ${target.sizeDM > 0 ? "+" : ""}${target.sizeDM}]`;
            if (target.facing) text += ` - ${game.i18n.localize("MGT2.Vehicle.Face." + target.facing)}`;

            if (this.isMelee) {
                if (target.distance >= 6) continue;
            } else {
                target.rangeDM = this._getRangeDM(target);
                if (target.rangeDM) text += ` [${target.rangeDM}]`;
                if (Number(target.rangeDM) <= -99) continue;
            }
            targets.push(target);
            select[target.token.document._id] = text;
        }
        return {targets, select};
    }

    async _prepareContext(options) {
        console.log("_prepareContext:");
        const characteristic = this.weaponItem.system.weapon.characteristic;
        const skill = this.weaponItem.system.weapon.skill;
        const characteristicDM = this.actor?.system.characteristics?.[characteristic]?.dm || 0;
        this.skillDM = (this.actor?.getSkillValue(skill, { cha: characteristic }) + characteristicDM) || 0;
        this.isMelee = (this.weaponItem.system.weapon.range > 0)?false:true;
        this.isAutoFire = hasTrait(this.weaponItem.system.weapon.traits, "auto");
        this.isOutOfAmmo = false;
        this.currentAmmo = this.weaponItem.useAmmo()?this.weaponItem.system.weapon.ammo:0;
        this.autoFire = getTraitValue(this.weaponItem.system.weapon.traits, "auto");

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
        context.isMelee = this.isMelee;
        context.canAim = !this.isMelee
            && this.weaponItem.system.weapon.scale !== "spacecraft"
            && isCharacterAimingActor(this.actor);
        this.rangeBands = getWeaponRangeBands(this.weaponItem.system.weapon.range, this.weaponItem.system.weapon.scale);
        this.range = this.rangeBands.display;

        context.customDM = parseInt(this.attackOptions.dm) || 0;

        context.ROLLTYPE_SELECT = {}
        context.ROLLTYPE_SELECT["standard"] = game.i18n.localize("MGT2.TravellerSheet.Normal");
        context.ROLLTYPE_SELECT["boon"] = game.i18n.localize("MGT2.TravellerSheet.Boon");
        context.ROLLTYPE_SELECT["bane"] = game.i18n.localize("MGT2.TravellerSheet.Bane");

        context.RANGE_SELECT = {};
        if (this.isMelee) {
            context.RANGE_SELECT["+0"] = "Melee";
        } else {
            context.RANGE_SELECT["+1"] = `${game.i18n.localize("MGT2.Attack.short")} (${this.range.short}${context.rangeUnit}, +1)`;
            context.RANGE_SELECT["+0"] = `${game.i18n.localize("MGT2.Attack.medium")} (${this.range.medium}${context.rangeUnit}, +0)`;
            context.RANGE_SELECT["-2"] = `${game.i18n.localize("MGT2.Attack.long")} (${this.range.long}${context.rangeUnit}, -2)`;
            context.RANGE_SELECT["-4"] = `${game.i18n.localize("MGT2.Attack.extreme")} (${this.range.extreme}${context.rangeUnit}, -4)`;
        }

        context.shotType = this.shotType;
        context.aimingActions = this.aimingActions;
        context.AIMING_ACTIONS = {};
        for (let i = 0; i <= 6; i++) context.AIMING_ACTIONS[i] = `${i}`;
        context.SHOT_SELECT = {};
        if (this.isMelee) {
            context.SHOT_SELECT["melee"] = game.i18n.format("MGT2.AttackDialog.ShotType.melee");
        } else {
            context.SHOT_SELECT["single"] = game.i18n.format("MGT2.AttackDialog.ShotType.single");
            if (this.isAutoFire) {
                // Automatic Fire
                this.fullAuto = Math.min(this.autoFire, parseInt(this.currentAmmo / 3) || 0);
                this.burstFire = Math.min(this.autoFire, this.currentAmmo);

                context.SHOT_SELECT["burst"] = game.i18n.format("MGT2.AttackDialog.ShotType.burst", {
                    shots: this.burstFire,
                    ammo: this.burstFire
                });
                context.SHOT_SELECT["full"] = game.i18n.format("MGT2.AttackDialog.ShotType.full", {
                    shots: this.fullAuto,
                    ammo: this.fullAuto * 3
                });
            }
        }
        // Recalculate target records and rebind the selection by stable token id.
        const currentTargetId = this.currentTarget?.token?.document?._id ?? this.currentTargetId;
        const rawTargets = getTargetData(this.ATTACKER_TOKEN) ?? [];
        if (this.ATTACKER_TOKEN) {
            context.ATTACKER_TOKEN = this.ATTACKER_TOKEN;
            let built = this._buildEligibleTargets(rawTargets);
            let selected = rebindTargetById(built.targets, currentTargetId);
            const reboundTargetId = selected?.token?.document?._id;
            const resetActions = resetAimingForTargetChange(this.aimingActions, currentTargetId, reboundTargetId);
            if (resetActions !== this.aimingActions) {
                this.aimingActions = resetActions;
                built = this._buildEligibleTargets(rawTargets);
                selected = rebindTargetById(built.targets, currentTargetId);
            }
            this.TARGETS = built.targets;
            context.TARGETS = built.targets;
            context.TARGET_SELECT = built.select;
            this.currentTarget = selected;
            if (this.currentTarget) this.currentTargetId = this.currentTarget.token.document._id;
        } else {
            this.TARGETS = [];
            context.TARGETS = [];
            this.currentTarget = undefined;
        }
        if (this.ATTACKER_TOKENS && this.ATTACKER_TOKENS.length > 1) {
            context.ATTACKER_TOKENS = this.ATTACKER_TOKENS;
            context.ATTACKER_SELECT = {};
            context.ATTACKER_SELECT["-"] = "-";
            for (let t of this.ATTACKER_TOKENS) {
                context.ATTACKER_SELECT[t.document.uuid] = t.name;
            }
        }
        if (this.attackerTokenName && options?.window) {
            options.window.title = game.i18n.format("MGT2.AttackDialog.Title", { name: this.attackerTokenName });
        }
        context.currentTarget = this.currentTarget;
        context.aimingActions = this.aimingActions;
        context.manualRangeRequired = !this.isMelee && !this.currentTarget;
        if (context.manualRangeRequired) {
            context.RANGE_SELECT = {"": "Select range...", ...context.RANGE_SELECT};
            const manualRangeDM = parseManualRangeDM(this.rangeOverrideDM);
            context.selectedRangeDM = manualRangeDM === null ? "" : formatRangeDMOption(manualRangeDM);
        } else {
            context.selectedRangeDM = formatRangeDMOption(resolveRangeDM(this.rangeOverrideDM, this.currentTarget?.rangeDM));
        }
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
                this.rangeOverrideDM = undefined;
                this.aimingActions = 0;
                rangeSelect.value = formatRangeDMOption(target.rangeDM);
                this.currentTarget = target;
                this.currentTargetId = target.token.document._id;
                this.render();
            });
        }

        const rangeSelect = this.element.querySelector('select[data-action="changeRange"]');
        if (rangeSelect) {
            rangeSelect.addEventListener("change", ev => {
                this.rangeOverrideDM = parseManualRangeDM(ev.target.value) ?? undefined;
            });
        }

        const attackerSelect = this.element.querySelector('select[data-action="changeAttacker"]');
        if (attackerSelect) {
            attackerSelect.addEventListener("change", (ev) => {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                const id = ev.target.value;
                const attacker = this.ATTACKER_TOKENS.filter(t => t.document.uuid === id)[0];
                this.ATTACKER_TOKEN = attacker;
                this.ATTACKER_TOKEN.control({ releaseOthers: true });
                this.TARGETS = getTargetData(this.ATTACKER_TOKEN);
                this.currentTarget = null;
                this.currentTargetId = undefined;
                this.rangeOverrideDM = undefined;
                this.aimingActions = 0;
                this.render();
            });
        }

        const shotSelect = this.element.querySelector('select[data-action="changeShotType"]');
        if (shotSelect) {
            shotSelect.addEventListener("change", (ev) => {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                this.shotType = ev.target.value;
                console.log(this.shotType);
                this.render();
            });
        }

        const aimingSelect = this.element.querySelector('select[data-action="changeAimingActions"]');
        if (aimingSelect) {
            aimingSelect.addEventListener("change", (ev) => {
                const actions = parseAimingActions(ev.target.value);
                if (actions === null) {
                    ui.notifications.warn("Aiming actions must be a whole number from 0 to 6.");
                    ev.target.value = `${this.aimingActions}`;
                    return;
                }
                this.aimingActions = actions;
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
        const submittedRange = formData.object.range;
        const manualRangeDM = parseManualRangeDM(submittedRange);
        const hasSubmittedRange = ["number", "string"].includes(typeof submittedRange)
            && !(typeof submittedRange === "string" && submittedRange.trim() === "");
        if (hasSubmittedRange && manualRangeDM === null) {
            ui.notifications.warn("Select a valid range before attacking.");
            return null;
        }
        if (!this.currentTarget && !this.isMelee && manualRangeDM === null) {
            ui.notifications.warn("Select a range for the manual targetless attack.");
            return null;
        }
        const rangeDM = manualRangeDM ?? resolveRangeDM(undefined, this.currentTarget?.rangeDM);
        const canAim = !this.isMelee
            && this.weaponItem?.system?.weapon?.scale !== "spacecraft"
            && isCharacterAimingActor(this.actor);
        const aimingActions = canAim ? parseAimingActions(formData.object.aimingActions) : 0;
        if (aimingActions === null) {
            ui.notifications.warn("Aiming actions must be a whole number from 0 to 6.");
            return null;
        }
        if (hasAimingAutoConflict(aimingActions, formData.object.shotType)) {
            ui.notifications.warn(AIMING_AUTO_WARNING);
            return null;
        }

        this.attackOptions.autoOption = formData.object.shotType;
        this.attackOptions.rollType = formData.object.rollType;
        this.attackOptions.aimingActions = aimingActions;

        if (event.type === "submit") {
            this.rollAttack(customDM, rangeDM);
        }

        return null;
    }

    // Despite being static, action methods have access to `this`
    static selectTargetAction(event, target) {
        console.log("selectTargetAction:");
        // Do nothing. We should already have a target by this point.
    }

    rollAttack(customDM, rangeDM) {
        this.attackOptions.skillDM = this.skillDM;
        this.attackOptions.dm = customDM;
        this.attackOptions.rangeDM = rangeDM;
        this.attackOptions.showBreakdown = true;

        // There won't always be a currentTarget. There might not even be a scene.
        if (this.currentTarget) {
            if (this.currentTarget?.dodgeDM) {
                this.attackOptions.dodgeDM = this.currentTarget.dodgeDM;
                // Remove dodge from the target being attacked.
                this.currentTarget.token.actor.setDodgeEffect(0);
            }

            if (this.currentTarget?.type === "vehicle") {
                this.attackOptions.facing = this.currentTarget.facing;
            }
        }
        rollAttack(this.actor, this.weaponItem, this.attackOptions);
        this.close();
    }

}
