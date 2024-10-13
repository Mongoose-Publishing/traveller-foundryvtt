import {hasTrait} from "../helpers/dice-rolls.mjs";
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

        this.actor = actor;
        this.damageOptions = damageOptions;
        this.data = actor.system;

        this.damage = damageOptions.damage + Math.min(0, damageOptions.effect);
        this.ap = damageOptions.ap?parseInt(damageOptions.ap):0;
        this.multiplier = damageOptions.multiplier?parseInt(damageOptions.multiplier):1;
        this.laser = damageOptions.damageType;
        this.armour = this.data.spacecraft.armour ?? 0;

        this.actualDamage = damage;
        if (this.ap < this.armour) {
            this.actualDamage = damage - (this.armour - this.ap);
            this.actualDamage *= this.multiplier;
        }
        if (this.actualDamage < 0) {
            this.actualDamage = 0;
        }

        this.crits = {};
        this.crits.effectCrit = false;
        this.crits.effectSeverity = 0;
        this.crits.numCrits = 0;
        if (this.actualDamage > 0 && damageOptions.effect >= 6) {
            this.crits.effectCrit = true;
            this.crits.effectSeverity = damageOptions.effect - 5;
        }
        // Gain a critical every time pass 10% of hull damage.
        this.originalDamage = damageOptions.originalDamage;
        this.damageTrack = [];
        this.maxHits = parseInt(this.actor.system.hits.max);
        for (let d=0; d < 10; d++) {
            let limit = parseInt(((d + 1) * this.maxHits) / 10);
            if ( limit > this.originalDamage + this.actualDamage) {
                this.damageTrack[d] = "undamaged";
            } else if (limit > this.originalDamage) {
                this.damageTrack[d] = "critical";
            } else {
                this.damageTrack[d] = "damaged";
            }
        }
        this.tenPercent = parseInt(this.actor.system.hits.max / 10);
        this.crits.numCrits = parseInt(this.actualDamage / this.tenPercent);

        // Current critical state.
        this.shipCriticals = this.actor.system.spacecraft?.combat?.criticals;
        if (!this.shipCriticals) {
            this.shipCriticals = {};
        }

        if (this.crits.numCrits > 0) {
            this.crits.criticals = {};
            for (let c = 0; c < this.crits.numCrits; c++) {
                this.crits.criticals[c] = {};
                this.crits.criticals[c].location = this.getCriticalRoll();
                this.crits.criticals[c].severity = 1;
                if (this.shipCriticals[c]) {
                    this.crits.criticals[c].total = this.shipCriticals[c].severity;
                }
            }
        }
        console.log(this.crits.criticals);

        if (!this.crits.effectCrit && !this.crits.numCrits) {
            // No criticals, so don't pass any data.
            this.crits = null;
        }



        this.criticalLabels = { };
        let roll = 2;
        for (let c in MGT2.SPACECRAFT_CRITICALS) {
            this.criticalLabels[c] = game.i18n.format("MGT2.Spacecraft.Criticals." + c,
                { "roll": roll });
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
        let criticalEffectRoll = this.getCriticalRoll();
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
            "crits": this.crits,
            "criticalEffectRoll": criticalEffectRoll,
            "criticalLabels": this.criticalLabels,
            "multiplier": this.multiplier
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const roll = html.find("button[class='damageDone']");
        roll.on("click", event => this.doneClick(event, html));

        const str = html.find(".DMG_STR");
        str.on("change", event => this.updateDamage(event, html));

        html.find(".apply-button").click(ev => {
           this.applyDamage(ev, html);
        });
    }

    applyDamage(event, html) {
        console.log("apply");
        console.log(event);
        let cha = event.currentTarget.dataset.cha;

        let currentDmg = this.getIntValue(html, ".DMG_" + cha);
        let currentScore = this.getIntValue(html, ".VAL_" + cha);
        let maxScore = this.getIntValue(html, this.data.characteristics[cha].value);

        console.log("Cha " + cha + " max " + maxScore + " currently " + currentScore + " with dmg " + currentDmg);

        if (this.remainingDamage <= currentScore) {
            currentDmg += this.remainingDamage;
            currentScore -= this.remainingDamage;
            this.remainingDamage = 0;
        } else {
            let applyDmg = currentScore;
            currentDmg += applyDmg;
            currentScore -= applyDmg;
            this.remainingDamage -= applyDmg;
        }

        this.setIntValue(html, ".DMG_"+cha, currentDmg);
        this.setIntValue(html, ".VAL_"+cha, currentScore);
        this.setIntValue(html, ".remaining", this.remainingDamage);
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

        let str = this.getIntValue(html, ".DMG_STR");
        let dex = this.getIntValue(html, ".DMG_DEX");
        let end = this.getIntValue(html, ".DMG_END");

        console.log(`STR ${str}, DEX ${dex}, END ${end}`);

    }

    async doneClick(event, html) {
        event.preventDefault();
        console.log("doneClick:");

        let str = this.getIntValue(html, ".DMG_STR");
        let dex = this.getIntValue(html, ".DMG_DEX");
        let end = this.getIntValue(html, ".DMG_END");
        let remaining = this.getIntValue(html, ".remaining")

        console.log(`STR ${str}, DEX ${dex}, END ${end}`);

        let total = str + dex + end;
        let damage = this.data.damage;

        this.damageOptions.characteristics = {
            "STR": str,
            "DEX": dex,
            "END": end
        }
        this.actor.applyActualDamageToTraveller(damage, this.damageOptions);
        this.close();
        return;

        if (this.stun) {
            // 'tmp' tracks how much of the current damage is temporary.
            let added = end - damage.END.value;
            damage.END.value = parseInt(damage.END.value) + end;
            damage.END.tmp = Math.min(damage.END.value, parseInt(damage.END.tmp) + added);
            if (remaining > 0) {
                this.actor.setFlag("mgt2e", "stunned", true);
                this.actor.setFlag("mgt2e", "stunnedRounds",
                    this.actor.getFlag("mgt2e", "stunnedRounds")?
                        parseInt(this.actor.getFlag("mgt2e", "stunnedRounds"))+remaining:remaining);
            }
        } else {
            damage.STR.value = parseInt(damage.STR.value) + str;
            damage.DEX.value = parseInt(damage.DEX.value) + dex;
            damage.END.value = parseInt(damage.END.value) + end;
        }

        if (damage.STR.value > this.data.characteristics.STR.value) {
            damage.STR.value = this.data.characteristics.STR.value;
        }
        if (damage.DEX.value > this.data.characteristics.DEX.value) {
            damage.DEX.value = this.data.characteristics.DEX.value;
        }
        if (damage.END.value > this.data.characteristics.END.value) {
            damage.END.value = this.data.characteristics.END.value;
        }

        this.data.damage.STR.value = str;
        this.data.damage.DEX.value = dex;
        this.data.damage.END.value = end;

        console.log(this.data.damage);

        this.actor.update({ "system.damage": this.data.damage });

        let atZero = 0;
        if (str >= this.data.characteristics.STR.value) atZero++;
        if (dex >= this.data.characteristics.DEX.value) atZero++;
        if (end >= this.data.characteristics.END.value) atZero++;

        switch (atZero) {
            case 2:
                this.actor.setFlag("mgt2e", "unconscious", true);
                break;
            case 3:
                this.actor.setFlag("mgt2e", "disabled", true);
                break;
        }

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2DamageDialog = MgT2DamageDialog;
