import {rollSkill} from "../helpers/dice-rolls.mjs";

export class MgT2SkillDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2/templates/skill-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = "Make a roll";

        return options;
    }

    constructor(actor, skill, spec, cha) {
        super();
        console.log("constructor:");

        console.log("Constructor skill is " + skill);
        console.log("Constructor spec is " + spec);
        console.log(actor);

        this.actor = actor;

        const data = actor.data.data;

        this.skillId = skill;
        this.skill = null;
        this.spec = null;
        this.value = -3;
        this.cha = cha;
        if (cha) {
            this.characteristic = data.characteristics[cha];
        }
        this.data = data;
        if (skill) {
            this.skill = data.skills[skill];
            this.cha = this.skill.default;
            if (data.skills[skill].trained) {
                this.value = this.skill.value;
                if (spec) {
                    this.spec = data.skills[skill].specialities[spec];
                    this.value = this.spec.value;
                }
            } else {
                this.value = data.skills["jackofalltrades"].value - 3;
            }
            this.options.title = this.skill.label;
        } else if (cha) {
            this.options.title = this.characteristic.label;
            this.value = this.characteristic.dm;
        }
        if (this.spec) {
            this.options.title += " (" + this.spec.label + ")";
        }
    }

    getData() {
        console.log("getData: Characteristic is " + this.cha);
        console.log("getData: Type is " + this.actor.type);
        return {
            "actor": this.actor,
            "data": this.data,
            "skill": this.skill,
            "spec": this.spec,
            "value": this.value,
            "showCha": (this.skill && this.actor.type != "creature"),
            "dm": 0,
            "dicetype": "normal",
            "characteristic": this.cha
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
        let cha = this.cha;
        let remember = false;
        if (html.find(".skillDialogCha")[0]) {
            cha = html.find(".skillDialogCha")[0].value;
            remember = html.find(".skillDialogRemember")[0].value;
        }
        let rollType = html.find(".skillDialogRollType")[0].value;

        if (remember && this.skillId) {
            console.log("Remembering " + cha + " for " + this.skillId);
            this.actor.data.data.skills[this.skillId].default = cha;
            this.actor.update({ "data.skills": this.actor.data.data.skills });
        }
        rollSkill(this.actor, this.skill, this.spec, cha, dm, rollType);

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2SkillDialog = MgT2SkillDialog;
