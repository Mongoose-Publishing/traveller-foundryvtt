import {rollAttack} from "../helpers/dice-rolls.mjs";
import {getSkillValue} from "../helpers/dice-rolls.mjs";

export class MgT2AttackDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2/templates/attack-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = "Attack";

        return options;
    }

    constructor(actor, weapon) {
        super();
        console.log("MgT2AttackDialog:");
        console.log(actor);
        console.log(weapon);

        this.actor = actor;
        this.weapon = weapon;

        const data = actor.data.data;
        this.data = data;
        this.cha = this.weapon.data.weapon.characteristic;
        this.skill = this.weapon.data.weapon.skill.split(".")[0];
        this.speciality = this.weapon.data.weapon.skill.split(".")[1];

        // Work out what the skill bonus is.
        this.score = parseInt(getSkillValue(this.actor, this.skill, this.speciality));
        console.log(this.cha);
        console.log(data.characteristics[this.cha].dm);
        this.score += parseInt(data.characteristics[this.cha].dm);

        // Work out the damage.
        this.damage = weapon.data.weapon.damage;
        this.damage = this.damage.toUpperCase().replace(/D6/, "D");
        this.damage = this.damage.replace(/ *\* *10/, "D");

        console.log("Weapon skill total " + this.score);

        this.range = parseInt(this.weapon.data.weapon.range);
        console.log("Range: " + this.range);
        this.melee = true;
        if (this.range > 0) {
            this.melee = false;
            this.shortRange = parseInt(this.range / 4);
            this.longRange = parseInt(this.range * 2);
            this.extremeRange = parseInt(this.range * 4);
        }

        this.options.title = this.weapon.name;
        if (this.skill) {
        }
    }

    getData() {
        return {
            "actor": this.actor,
            "data": this.data,
            "weapon": this.weapon,
            "melee": this.melee,
            "damage": this.damage,
            "range": this.range,
            "shortRange": this.shortRange,
            "longRange": this.longRange,
            "extremeRange": this.extremeRange,
            "dm": 0,
            "score": this.score,
            "cha": this.cha,
            "skill": this.data.skills[this.skill].label,
            "speciality": this.data.skills[this.skill].specialities[this.speciality].label,
            "dicetype": "normal",
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const roll = html.find("button[class='skillRoll']");
        roll.on("click", event => this.onRollClick(event, html));
    }

    async onRollClick(event, html) {
        event.preventDefault();
        console.log("onRollClick:");

        let dm = parseInt(html.find("input[class='skillDialogDM']")[0].value);
        let rangeDM = parseInt(html.find(".attackDialogRange")[0].value);
        let rollType = html.find(".skillDialogRollType")[0].value;

        rollAttack(this.actor, this.weapon, this.score, dm, rollType, rangeDM);

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2AttackDialog = MgT2AttackDialog;
