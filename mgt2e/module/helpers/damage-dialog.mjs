import {hasTrait} from "../helpers/dice-rolls.mjs";

export class MgT2DamageDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/damage-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = game.i18n.localize("MGT2.DamageDialog.Title");
        options.shareable = true;
        options.popOut = true;
        options.resizable = true;

        return options;
    }

    constructor(actor, damage, damageOptions) {
        super();
        console.log("*** DamageDialog:");

        console.log(actor);
        console.log(damageOptions);
        console.log(damage);

        this.actor = actor;
        this.damageOptions = damageOptions;
        const data = actor.system;

        damageOptions.effect = parseInt(damageOptions.effect);
        this.damage = parseInt(damageOptions.damage) + ((damageOptions.effect > 0)?damageOptions.effect:0);
        this.ap = damageOptions.ap?damageOptions.ap:0;
        this.laser = damageOptions.damageType;
        this.stun = hasTrait(damageOptions.traits, "stun");
        this.data = data;
        this.armour = damageOptions.armour?damageOptions.armour:0;
        if (damageOptions.finalArmour !== undefined && damageOptions.finalArmour !== this.armour) {
            this.armour = `${this.armour} (${damageOptions.finalArmour})`;
        }
        this.wounds = "";
        this.armourText = damageOptions.armourText;

        this.actualDamage = damage;
        if (!data.damage) {
            // This is a creature or NPC. Shouldn't be called.
            data.hits.damage += this.actualDamage;
            this.actor.update({ "data.damage": this.data.damage });
            return;
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
            this.woundsEffect = "";
        } else if (this.stun) {
            this.wounds = game.i18n.localize("MGT2.Damage.Wound.Stun");
            this.woundsEffect = game.i18n.localize("MGT2.Damage.Wound.StunEffect");
        } else if (this.actualDamage < parseInt(totalEND / 2)) {
            this.wounds = game.i18n.localize("MGT2.Damage.Wound.Minor");
            this.woundsEffect = game.i18n.localize("MGT2.Damage.Wound.MinorEffect");
        } else if (this.actualDamage <= totalEND) {
            this.wounds = game.i18n.localize("MGT2.Damage.Wound.Major");
            this.woundsEffect = game.i18n.localize("MGT2.Damage.Wound.MajorEffect");
        } else if (this.actualDamage < totalEND * 2) {
            this.wounds = game.i18n.localize("MGT2.Damage.Wound.Severe");
            this.woundsEffect = game.i18n.localize("MGT2.Damage.Wound.SevereEffect");
        } else if (this.actualDamage < totalEND * 3) {
            this.wounds = game.i18n.localize("MGT2.Damage.Wound.Crippling");
            this.woundsEffect = game.i18n.localize("MGT2.Damage.Wound.CripplingEffect");
        } else if (this.actualDamage < totalEND * 4) {
            this.wounds = game.i18n.localize("MGT2.Damage.Wound.Critical");
            this.woundsEffect = game.i18n.localize("MGT2.Damage.Wound.CriticalEffect");
        } else if (this.actualDamage < totalEND * 5) {
            this.wounds = game.i18n.localize("MGT2.Damage.Wound.Mortal");
            this.woundsEffect = game.i18n.localize("MGT2.Damage.Wound.MortalEffect");
        } else {
            this.wounds = game.i18n.localize("MGT2.Damage.Wound.Devastating");
            this.woundsEffect = game.i18n.localize("MGT2.Damage.Wound.DevastatingEffect");
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
            "wounds": this.wounds,
            "armourText": this.armourText,
            "woundsEffect": this.woundsEffect
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
        let damage = this.actualDamage;

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
