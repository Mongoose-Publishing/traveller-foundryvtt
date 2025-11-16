import {getTraitValue, hasTrait} from "../helpers/dice-rolls.mjs";
import { MGT2 } from "../helpers/config.mjs";

export class MgT2SpacecraftDamageDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/spacecraft-damage-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = game.i18n.localize("MGT2.SpacecraftDamageDialog.Title");
        options.shareable = true;
        options.popOut = true;
        options.resizable = true;

        return options;
    }

//    constructor(actor, damage, ap, laser, traits) {
    constructor(actor, damage, damageOptions) {
        super();
        console.log("SpacecraftDamageDialog: " + damage);

        console.log(actor);
        console.log(damageOptions);

        this.actor = actor;
        this.damageOptions = damageOptions;
        this.data = actor.system;

        this.damage = damageOptions.damage + Math.max(0, damageOptions.effect);
        this.ap = damageOptions.ap?parseInt(damageOptions.ap):0;
        if (damageOptions.scale !== "spacecraft") {
            this.damage = parseInt (this.damage / 10);
            this.ap = parseInt( this.ap / 10);
        }
        this.multiplier = damageOptions.multiplier?parseInt(damageOptions.multiplier):1;
        this.laser = damageOptions.damageType;
        this.armour = this.data.spacecraft.armour ?? 0;

        this.armourAsPercentage = false;
        if (hasTrait(damageOptions.traits, "spinal")) {
            let spinal = parseInt(getTraitValue(damageOptions.traits, "spinal"));
            if (spinal > 0) {
                this.armour = this.armour * spinal;
            }
            this.armourAsPercentage = true;
            this.ap = 0;
            this.actualDamage = this.damage * this.multiplier;
            this.actualDamage = Math.floor(this.actualDamage * (1 - this.armour / 100));
        } else {
            this.actualDamage = this.damage;
            if (this.ap < this.armour) {
                this.actualDamage = this.damage - (this.armour - this.ap);
            }
            if (this.actualDamage < 0) {
                this.actualDamage = 0;
            }
            this.actualDamage *= this.multiplier;
        }

        this.crits = {};
        this.crits.effectCrit = false;
        this.crits.effectSeverity = 0;
        this.crits.numCrits = 0;
        if (this.actualDamage > 0 && damageOptions.effect >= 6) {
            this.crits.effectCrit = true;
            this.crits.effectSeverity = damageOptions.effect - 5;
            console.log("Effect Critical: " + damageOptions.effect - 5);
        }
        // Gain a critical every time pass 10% of hull damage.
        this.originalDamage = damageOptions.originalDamage;
        this.damageTrack = [];
        this.hits = parseInt(this.actor.system.hits.value) - this.actualDamage;
        this.maxHits = parseInt(this.actor.system.hits.max);
        this.crits.numCrits = 0;
        let firstSustainedLevel = 0;
        for (let d=0; d < 10; d++) {
            let limit = parseInt(((d + 1) * this.maxHits) / 10);
            console.log(`${d} ${limit} ${this.originalDamage} ${this.actualDamage}`);
            if ( limit >= this.originalDamage + this.actualDamage) {
                this.damageTrack[d] = "undamaged";
            } else if (limit >= this.originalDamage) {
                this.damageTrack[d] = "critical";
                this.crits.numCrits ++;
                if (!firstSustainedLevel) {
                    firstSustainedLevel = (d+1) * 10;
                }
            } else {
                this.damageTrack[d] = "damaged";
            }
        }
        this.tenPercent = parseInt(this.actor.system.hits.max / 10);

        // Current critical state.
        this.shipCriticals = {};
        for (let c in MGT2.SPACECRAFT_CRITICALS) {
            let severity = this.actor.flags.mgt2e["crit_"+c];
            if (severity) {
                this.shipCriticals[c] = parseInt(severity);
            } else {
                this.shipCriticals[c] = 0;
            }
        }

        if (this.crits.numCrits > 0) {
            this.crits.criticals = [];
            for (let c = 0; c < this.crits.numCrits; c++) {
                this.crits.criticals[c] = {};
                let location = this.getCriticalRoll();
                this.crits.criticals[c].location = location;
                this.crits.criticals[c].severity = 1;
                this.crits.criticals[c].sustained = c * 10 + firstSustainedLevel;
            }
        }

        if (!this.crits.effectCrit && !this.crits.numCrits) {
            // No criticals, so don't pass any data.
            this.crits = null;
        }

        this.criticalLabels = { };
        let roll = 2;
        for (let c in MGT2.SPACECRAFT_CRITICALS) {
            this.criticalLabels[c] = game.i18n.format("MGT2.Spacecraft.Criticals." + c) + ` (${roll})`;
            roll++;
        }
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
            "multiplier": this.multiplier,
            "armourAsPercentage": this.armourAsPercentage
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
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
        console.log(this.crits);

        let critEffect = html.find(".criticalEffectSelect");
        if (critEffect && critEffect[0]) {
            this.criticalEffectRoll = critEffect[0].value;
        }

        let critList = html.find(".criticalSelect");
        for (let c = 0; c < critList.length; c++) {
            if (this.crits.criticals[c]) {
                this.crits.criticals[c].location = critList[c].value;
            }
        }

        // Apply Criticals
        if (this.crits?.criticals) {
            for (let c = 0; c < this.crits.criticals.length; c++) {
                let location = this.crits.criticals[c].location;
                let severity = this.crits.criticals[c].severity;
                console.log(`Apply crit ${c} to ${location} severity ${severity}`);
                await this.actor.setCriticalLevel(location, severity);
            }
        }

        // Apply critical effect
        if (this.crits?.effectCrit) {
            await this.actor.setCriticalLevel(this.criticalEffectRoll, this.crits.effectSeverity);
        }

        // Apply raw damage
        this.actor.applyActualDamageToSpacecraft(damage, this.damageOptions);
        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2DamageDialog = MgT2DamageDialog;
