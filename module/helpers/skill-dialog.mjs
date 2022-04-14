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

    constructor(actor, skill, spec) {
        super();
        console.log("constructor:");

        console.log("Constructor skill is " + skill);
        console.log("Constructor spec is " + spec);
        console.log(actor);

        this.actor = actor;

        const data = actor.data.data;

        let skillValue = 0;
        let specValue = 0;
        let skillLabel = "";
        let specLabel = "";
        let skillDefault = "";

        this.skill = null;
        this.spec = null;
        this.value = -3;
        this.data = data;
        if (skill) {
            this.skill = data.skills[skill];
            if (data.skills[skill].trained) {
                this.value = this.skill.value;
                if (spec) {
                    this.spec = data.skills[skill].specialities[spec];
                    this.value = this.spec.value;
                }
            } else {
                this.value = data.skills["jackofalltrades"].value - 3;
            }
        }
        this.options.title = this.skill.label;
        if (this.spec) {
            this.options.title += " (" + this.spec.label + ")";
        }
    }

    getData() {
        return {
            "actor": this.actor,
            "data": this.data,
            "skill": this.skill,
            "spec": this.spec,
            "value": this.value,
            "dm": 0,
            "dicetype": "normal",
            "characteristic": this.skill.default
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
        let cha = html.find(".skillDialogCha")[0].value;
        let rollType = html.find(".skillDialogRollType")[0].value;
        let remember = html.find(".skillDialogRemember")[0].value;

        if (remember) {
            this.skill.default = cha;
        }
        rollSkill(this.actor, this.skill, this.spec, cha, dm, rollType);

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2SkillDialog = MgT2SkillDialog;
