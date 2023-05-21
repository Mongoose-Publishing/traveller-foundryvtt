import {rollSkill} from "../helpers/dice-rolls.mjs";

export class MgT2DamageDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2/templates/damage-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = "Apply Damage";

        return options;
    }

    constructor(actor, damage, ap, laser, stun) {
        super();
        console.log("DamageDialog constructor:");

        console.log(actor);

        this.actor = actor;
        const data = actor.system;

        this.damage = damage;
        this.ap = ap;
        this.laser = laser;
        this.stun = stun;
        this.data = data;
        this.armour = data.armour.protection;
        this.wounds = "";

        this.actualDamage = damage;
        if (ap < this.armour) {
            this.actualDamage = damage - (this.armour - ap);
        }
        if (this.actualDamage < 0) {
            this.actualDamage = 0;
        }

        this.DMG_STR = data.damage.STR.value;
        this.DMG_DEX = data.damage.DEX.value;
        this.DMG_END = data.damage.END.value;

        this.STR = data.characteristics.STR.current;
        this.DEX = data.characteristics.DEX.current;
        this.END = data.characteristics.END.current;

        let totalEND = parseInt(data.characteristics.END.value);
        if (this.actualDamage === 0) {
            this.wounds = "-";
        } else if (this.actualDamage < parseInt(totalEND / 2)) {
            this.wounds = "Minor Wound"
        } else if (this.actualDamage <= totalEND) {
            this.wounds = "Major Wound";
        } else if (this.actualDamage < totalEND * 2) {
            this.wounds = "Severe Wound";
        } else if (this.actualDamage < totalEND * 3) {
            this.wounds = "Crippling Wound";
        } else if (this.actualDamage < totalEND * 4) {
            this.wounds = "Critical Wound";
        } else if (this.actualDamage < totalEND * 5) {
            this.wounds = "Mortal Wound";
        } else {
            this.wounds = "Devastating";
        }

        this.remainingDamage = this.actualDamage;

    }

    getData() {
        return {
            "actor": this.actor,
            "data": this.data,
            "damage": this.damage,
            "ap": this.ap,
            "laser": this.laser,
            "stun": this.stun,
            "armour": this.armour,
            "actualDamage": this.actualDamage,
            "remainingDamage": this.remainingDamage,
            "STR": this.STR,
            "DEX": this.DEX,
            "END": this.END,
            "DMG_STR": this.DMG_STR,
            "DMG_DEX": this.DMG_DEX,
            "DMG_END": this.DMG_END,
            "wounds": this.wounds
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

        console.log(`STR ${str}, DEX ${dex}, END ${end}`);

        let total = str + dex + end;
        let damage = this.data.damage;

        damage.STR.value = parseInt(damage.STR.value) + str;
        damage.DEX.value = parseInt(damage.DEX.value) + dex;
        damage.END.value = parseInt(damage.END.value) + end;

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

        this.actor.update({ "data.damage": this.data.damage });

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2DamageDialog = MgT2DamageDialog;
