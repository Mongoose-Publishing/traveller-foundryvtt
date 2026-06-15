import {MgT2Item} from "../../documents/item.mjs";
import {outputTradeChat, tradeBuyFreightHandler, tradeBuyGoodsHandler} from "../utils/trade-utils.mjs";
import {Tools} from "../chat/tools.mjs";
import {hasTrait, rollSpaceAttack} from "../dice-rolls.mjs";
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
        this.armourFace = "front";
        this.armourFaceValue = this.targetActor.system.vehicle.armour[this.armourFace];
    }

    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: MgT2VehicleDamageApp.formHandler,
            submitOnChange: false,
            closeOnSubmit: false,
        },
        actions: {
            selectTarget: MgT2VehicleDamageApp.selectTargetAction,
            changeFace: MgT2VehicleDamageApp.changeFaceAction
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

    isCriticalHit() {
        if (this.damageOptions.effect > 5) {
            return true;
        }
        // TODO: Need to check size of vehicle.
        return false;
    }

    isLightDamage() {
        console.log(this.damageOptions);
        const traits = this.damageOptions.traits;

        if (hasTrait(traits, "blast") && !hasTrait(traits, "stun")) {
            return false;
        }
        if (hasTrait(traits, "destructive")) {
            return false;
        }
        if (this.isCriticalHit()) {
            return false;
        }

        return true;
    }

    async _prepareContext(options) {
        console.log("prepareContext:");

        let totalArmourValue = this.armourFaceValue;
        if (this.isLightDamage()) {
            totalArmourValue += parseInt(this.targetActor.system.vehicle.tl);
        }
        let actualDamage = parseInt(this.damageOptions.damage);
        if (actualDamage > totalArmourValue) {
            actualDamage -= totalArmourValue;
        } else {
            actualDamage = 0;
        }
        this.structureDamage = parseInt(actualDamage / parseInt(this.targetActor.system.hits.structure));
        let damageEffect = "None";
        if (actualDamage > 0 && actualDamage < this.targetActor.system.hits.structure) {
            damageEffect = "Minor";
        } else if (actualDamage >= this.targetActor.system.hits.structure) {
            damageEffect = "Significant";
            if (this.structureDamage > 1) {
                damageEffect += " x" + this.structureDamage;
            }
        }

        const context = {
            buttons: [
                { type: "submit", icon: "fa-solid fa-save", label: "Apply Damage" }
            ],
            TARGET: this.targetActor,
            OPTIONS: this.damageOptions,
            ARMOUR_SELECT: this.ARMOUR_SELECT,
            armourFace: this.armourFace,
            armourFaceValue: this.armourFaceValue,
            totalArmourValue: totalArmourValue,
            actualDamage: actualDamage,
            damageEffect: damageEffect
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

    static async #changeArmourFace(face) {
        console.log("changeArmourFace: " + face);
        this.armourFace = face;
        this.armourFaceValue = this.targetActor.system.vehicle.armour[face];

        this.render();

    }

    _onRender(context, options) {
        super._onRender(context, options);

        const armourSelect = this.element.querySelector('select[data-action="changeFace"]');
        if (armourSelect) {
            //traitSelect.removeEventListener("change", this.#addTrait.bind(this));
            armourSelect.addEventListener("change", (ev) => {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                // Manually trigger your private static method
                //MgT2eVehicleSheet.#addFeature.call(this, ev, ev.currentTarget);
                console.log("CHANGE");
                this.armourFace = ev.target.value;
                MgT2VehicleDamageApp.#changeArmourFace.call(this, ev.target.value);
            });
        }
    }

    // Despite being static, formHandler has access to `this`
    static async formHandler(event, form, formData) {
        console.log("formHandler:");

        if (event.type === "submit") {
            this.applyDamage();
        }

        return null;
    }


    // Despite being static, action methods have access to `this`
    static selectTargetAction(event, target) {
        console.log("selectTargetAction:");
        // Do nothing. We should already have a target by this point.
    }

    applyDamage() {
        if (this.structureDamage > 0) {
            this.targetActor.system.hits.damage += this.structureDamage;
            this.targetActor.update({"system.hits.damage": this.targetActor.system.hits.damage });
        }

        this.close();
    }
}

