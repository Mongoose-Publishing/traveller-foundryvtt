import {hasTrait} from "../helpers/dice-rolls.mjs";
import { MGT2 } from "../helpers/config.mjs";

export class MgT2VehicleDamageDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/vehicle-damage-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = game.i18n.localize("MGT2.VehicleDamageDialog.Title");
        options.shareable = true;
        options.popOut = true;
        options.resizable = true;

        return options;
    }

//    constructor(actor, damage, ap, laser, traits) {
    constructor(actor, damage, damageOptions) {
        super();
        console.log("VehicleDamageDialog: " + damage);

        console.log(actor);
        console.log(damageOptions);

        this.actor = actor;
        this.damageOptions = damageOptions;
        this.data = actor.system;

        this.dice = damageOptions.damageDice.replaceAll(/D.*/g, "");
        console.log(this.dice);
        this.lightWeapon = (this.dice < 4);

        this.facing = "front";
        this.FACES = {};
        for (let s of ["front", "rear", "sides", "top", "bottom"]) {
            console.log(s);
            this.FACES[s] = `${game.i18n.localize("MGT2.Vehicle.Face." + s)} (${actor.system.vehicle.armour[s]})`;
        }
        console.log(this.FACES);

        this.damage = damageOptions.damage + Math.max(0, damageOptions.effect);
        this.ap = damageOptions.ap?parseInt(damageOptions.ap):0;
        if (damageOptions.scale === "spacecraft") {
            this.damage = parseInt (this.damage * 10);
            this.ap = parseInt( this.ap * 10);
        }
        this.multiplier = damageOptions.multiplier?parseInt(damageOptions.multiplier):1;
        this.laser = damageOptions.damageType;
        this.armour = this.data.vehicle.armour[this.facing];
        // TL adds to armour if damage is low, or it is a stun attack.
        this.tl = this.data.vehicle.tl;

        this.actualDamage = this.damage;
        if (this.ap < this.armour) {
            this.actualDamage = this.damage - (this.armour - this.ap);
        }
        if (this.actualDamage < 0) {
            this.actualDamage = 0;
        }
        this.actualDamage *= this.multiplier;


        // Gain a critical every time pass 10% of hull damage.
        this.originalDamage = damageOptions.originalDamage;
        this.hits = parseInt(this.actor.system.hits.value) - this.actualDamage;
        this.maxHits = parseInt(this.actor.system.hits.max);

        this.tenPercent = parseInt(this.actor.system.hits.max / 10);

        // Current critical state.
        this.shipCriticals = {};
        this.criticalLabels = { };

    }

    getCriticalRoll() {
        let roll = parseInt(Math.random() * 6) + parseInt(Math.random() * 6);
        for (let c in MGT2.SPACECRAFT_CRITICALS) {
            if (roll-- === 0) {
                return c;
            }
        }
        return null;
    }

    getData() {
        this.criticalEffectRoll = this.getCriticalRoll();
        return {
            "actor": this.actor,
            "data": this.data,
            "damage": this.damage,
            "ap": this.ap,
            "laser": this.laser,
            "stun": this.stun,
            "FACES": this.FACES,
            "facing": this.facing,
            "armour": this.armour,
            "damageTrack": this.damageTrack,
            "actualDamage": this.actualDamage,
            "remainingDamage": this.remainingDamage,
            "hits": this.hits,
            "maxHits": this.maxHits,
            "crits": this.crits,
            "shipCriticals": this.shipCriticals,
            "criticalEffectRoll": this.criticalEffectRoll,
            "criticalLabels": this.criticalLabels,
            "multiplier": this.multiplier
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".face-selector").click(ev => {
            const value = $(ev.currentTarget).val();
            this.facing = value;
            this.armour = this.data.vehicle.armour[this.facing];

            this.setIntValue(html, ".armour", this.armour);
        });

        const roll = html.find("button[class='damageDone']");
        roll.on("click", event => this.doneClick(event, html));

        const dmg = html.find(".baseDamage");
        dmg.on("change", event => this.updateDamage(event, html));

        const ap = html.find(".baseAP");
        ap.on("change", event => this.updateDamage(event, html));

        const critList = html.find(".criticalSelect");
        critList.on("change", event => this.updateCrits(event, html, critList.data("idx")));

        html.find(".apply-button").click(ev => {
           this.applyDamage(ev, html);
        });
    }

    getIntValue(html, field) {
        if (html.find(field) && html.find(field)[0] && html.find(field)[0].value) {
            let v = html.find(field)[0].value;
            if (v === "" || !v) {
                return 0;
            }
            return parseInt(v);
        }
        return 0;
    }

    setIntValue(html, field, value) {
        if (html.find(field) && html.find(field)[0] && html.find(field)[0].value) {
            html.find(field)[0].value = value;
        }
    }

    updateDamage(event, html) {
        console.log("Was updated");

        let dmg = this.getIntValue(html, ".baseDamage");
        let ap = this.getIntValue(html, ".baseAP");

        dmg = parseInt(dmg);
        ap = parseInt(ap);

        let actual = dmg - Math.max(0, this.armour - ap);
        this.setIntValue(html, ".actualDamage",actual);
    }

    updateCrits(event, html, idx) {
        console.log("Update " + idx);
        if (idx === "effect") {
            this.criticalEffectRoll = event.currentTarget.value;
        } else {
            this.crits.criticals[idx].location = event.currentTarget.value;
        }
    }

    async doneClick(event, html) {
        console.log("doneClick:");
        event.preventDefault();
        let damage = this.actualDamage;


        // Apply raw damage
        this.actor.applyActualDamageToSpacecraft(damage, this.damageOptions);
        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2DamageDialog = MgT2DamageDialog;
