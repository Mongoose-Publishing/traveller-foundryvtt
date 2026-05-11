import { skillLabel, getSkillValue, rollSkill } from "../helpers/dice-rolls.mjs";

// Allow damage characteristics to be modified.
export class MgT2PowerDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/power-dialog.html";
        options.width = "400";
        options.height = "auto";
        options.title = "Use Power";
        return options;
    }

    constructor(actor, power) {
        super();
        this.actor = actor;
        this.power = power;

        const data = actor.system;
        this.data = data;
        this.skill = this.power.system.power.skill.split(".")[0];
        this.speciality = this.power.system.power.skill.split(".")[1];
        this.score = parseInt(getSkillValue(this.actor, this.skill, this.speciality));
        this.range = parseInt(this.power.system.power.range);
        this.cost = parseInt(this.power.system.power.cost);
        this.check = parseInt(this.power.system.power.check);

        this.RANGES = {};
        //Adds the current range and up to two range bands further
        for (let t = 0; t <= 2 && (this.range + t) <= 10; t += 1) {
            this.RANGES[t + this.range] = `${game.i18n.localize("MGT2.Item.PsionicRange." + (this.range + t))} Psi: ${this.cost * (2 ** (t))}`;
        };
        this.ROLLTYPES = {
            "normal": game.i18n.localize("MGT2.TravellerSheet.Normal"),
            "boon": game.i18n.localize("MGT2.TravellerSheet.Boon"),
            "bane": game.i18n.localize("MGT2.TravellerSheet.Bane")
        };

        this.MODE_SELECT = {
            "publicroll": game.i18n.localize("MGT2.Dialog.Public"),
            "gmroll": game.i18n.localize("MGT2.Dialog.Private"),
            "blindroll": game.i18n.localize("MGT2.Dialog.Blind"),
            "selfroll": game.i18n.localize("MGT2.Dialog.Self")
        }

        this.mode = game.settings.get("core", "rollMode")

    }

    getData() {
        return {
            "power": this.power,
            "score": this.score,
            "cha": "PSI",
            "skill": skillLabel(this.data.skills[this.skill]),
            "speciality": (this.skill && this.speciality) ? skillLabel(this.data.skills[this.skill].specialities[this.speciality]) : "",
            "dm": 0,
            "dicetype": "normal",
            "RANGES": this.RANGES,
            "ROLLTYPES": this.ROLLTYPES,
            "MODE_SELECT": this.MODE_SELECT,
            "mode": this.mode
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const roll = html.find("button[class='roll']");
        roll.on("click", event => this.onRollClick(event, html));
    }

    async onRollClick(event, html) {
        event.preventDefault();

        let dm = parseInt(html.find("input[class='skillDialogDM']")[0].value);
        let rollType = html.find(".skillDialogRollType")[0].value;
        let rollMode = html.find(".skillDialogRollMode")[0].value;
        let range = parseInt(html.find(".skillDialogRange")[0].value);
        let psiPoints = this.cost * (2 ** (range - this.range));

        let powerOptions = {
            "skillDM": this.score,
            "dm": dm,
            "rollType": rollType,
            "difficulty": this.check,
            "rollMode": rollMode
        };

        const total = await rollSkill(this.actor, this.skill, powerOptions);
        if (total < this.check) {
            psiPoints = 1;
        };
        if (!this.actor.system.damage["PSI"]) {
            this.actor.system.damage["PSI"] = { "value": 0 };
        };

        let overflow = psiPoints - (this.actor.system.characteristics["PSI"].value - this.actor.system.damage["PSI"].value);
        this.actor.system.damage["PSI"].value += psiPoints;
        this.actor.update({ "system.damage": this.actor.system.damage });
        if (overflow > 0) {
            this.actor.applyActualDamageToTraveller(overflow, {});
        };

        this.close();
    }

}

window.MgT2PowerDialog = MgT2PowerDialog;