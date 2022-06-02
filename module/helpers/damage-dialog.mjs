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
        const data = actor.data.data;

        this.damage = damage;
        this.ap = ap;
        this.laser = laser;
        this.stun = stun;
        this.data = data;
        this.armour = data.armour;

        this.actualDamage = damage;
        if (ap < this.armour) {
            this.actualDamage = damage - (this.armour - ap);
        }

        this.DMG_STR = 0;
        this.DMG_DEX = 0;
        this.DMG_END = 0;

        this.STR = data.characteristics.STR.current;
        this.DEX = data.characteristics.DEX.current;
        this.END = data.characteristics.END.current;

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
            "STR": this.STR,
            "DEX": this.DEX,
            "END": this.END
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const roll = html.find("button[class='damageDone']");
        roll.on("click", event => this.doneClick(event, html));

        const str = html.find(".DMG_STR");
        str.on("change", event => this.updateDamage(event, html));
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

        console.log(this.actor.data.data.damage);

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
