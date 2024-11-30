import { skillLabel } from "./dice-rolls.mjs";
import {MgT2AddSkillDialog} from "./add-skill-dialog.mjs";

export class MgT2XPDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/xp-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = "Make a roll";

        return options;
    }

    constructor(actor, skill, spec, cha) {
        super();
        this.actor = actor;
        const data = actor.system;

        this.skillId = skill;
        this.skill = null;
        this.specId = null;
        this.spec = null;
        this.value = 0;
        this.chaOnly = false;
        this.cha = cha;
        this.bonus = 0;
        this.notes = "";
        this.study = "";
        this.xp = 0;
        this.trained = false;

        if (cha && data.characteristics && data.characteristics[cha]) {
            this.characteristic = data.characteristics[cha];
            if (!skill) {
                this.chaOnly = true;
                this.value = 0;
            }
        }
        this.data = data;
        if (skill) {
            this.skill = data.skills[skill];
            this.cha = this.skill.default;
            this.xp = parseInt(this.skill.xp?this.skill.xp:0);
            this.bonus = parseInt(this.skill.bonus?this.skill.bonus:0);
            this.notes = this.skill.notes?this.skill.notes:"";
            this.study = this.skill.study?this.skill.study:"";
            this.boon = this.skill.boon;
            this.options.title = skillLabel(this.skill, skill);
            if (this.skill.trained) {
                this.value = this.skill.value;
                this.trained = true;

                if (spec) {
                    this.specId = spec;
                    this.spec = data.skills[skill].specialities[spec];
                    this.value = this.spec.value;
                    this.xp = parseInt(this.spec.xp?this.spec.xp:0);
                    this.bonus = parseInt(this.spec.bonus?this.spec.bonus:0);
                    this.notes = this.spec.notes?this.spec.notes:"";
                    this.boon = this.spec.boon;
                    this.options.title += " (" + skillLabel(this.spec, spec) + ")";
                }
            }
        } else if (cha) {
            this.options.title = this.characteristic.label;
            this.value = this.characteristic.dm;
        }
        this.value = parseInt(this.value);
        this.cost = 1;
        if (this.value > 0) {
            this.cost = Math.pow(2, this.value);
        }
    }

    getData() {
        return {
            "actor": this.actor,
            "data": this.data,
            "skill": this.skill,
            "spec": this.spec,
            "value": this.value,
            "chaOnly": this.chaOnly,
            "characteristic": this.cha,
            "cost": this.cost,
            "xp": this.xp,
            "bonus": this.bonus,
            "notes": this.notes,
            "study": this.study,
            "boon": this.boon,
            "showEdit": !(this.actor.parent)
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const save = html.find("button[class='save']");
        save.on("click", event => this.onSaveClick(event, html));

        html.find(".clearEffects").click(ev => {
           if (this.spec) {
               this.spec.augdm = 0;
               this.spec.augment = 0;
               this.spec.expert = 0;
           } else {
               this.skill.augdm = 0;
               this.skill.augment = 0;
               this.skill.expert = 0;
           }
           // TODO: Need to update the dialog.
        });
        html.find(".edit-skill").on("click", event => this.onSkillEdit(event, html));
    }

    async onSkillEdit(event, html) {
        event.preventDefault();
        new MgT2AddSkillDialog(this.actor, this.skillId, this.skill, this.specId, this.spec).render(true);
        this.close();
    }

    getIntValue(html, fieldName) {
        let field = html.find(`input.${fieldName}`);
        let value = 0;
        if (field) {
            field = field[0];
            if (field) {
                value = parseInt(field.value);
            }
        }
        return value;
    }

    async onSaveClick(event, html) {
        event.preventDefault();

        let xp = this.getIntValue(html, "skillXPxp");
        let bonus = this.getIntValue(html, "skillXPbonus");
        let notes = html.find("input.skillXPnotes")[0].value;
        let study = html.find("input.skillXPstudy")[0].value;
        let boon = html.find("select.skillXPboon")[0].value;
        if (boon) {
            console.log("Boon is set to " + boon);
        }

        // The required cost to go up a level.
        let cost = 1;
        let data = this.spec?this.spec:this.skill;
        if (this.value > 0) {
            cost = Math.pow(2, this.value);
        }
        while (xp >= cost) {
            if (!this.skill.trained) {
                this.skill.trained = true;
                xp -= cost;
            } else {
                data.value += 1;
                xp -= cost;
            }
            cost = Math.pow(2, data.value);
        }

        if (this.spec) {
            this.spec.xp = xp;
            this.spec.bonus = bonus;
            this.spec.notes = notes;
            if (study) {
                this.spec.study = study;
            }
            if (boon) {
                this.spec.boon = boon;
            } else {
                this.spec.boon = null;
            }

            //this.spec.augdm = parseInt(html.find("input[class='augdm']")[0].value);
            //this.spec.augment = parseInt(html.find("input[class='augment']")[0].value);
            //this.spec.expert = parseInt(html.find("input[class='expert']")[0].value);
        } else if (this.skill) {
            this.skill.xp = xp;
            this.skill.bonus = bonus;
            this.skill.notes = notes;
            if (study) {
                this.skill.study = study;
            }
            if (boon) {
                this.actor.system.skills[this.skillId].boon = boon;
            } else {
                this.actor.system.skills[this.skillId].boon = null;
            }

            // this.skill.augdm = parseInt(html.find("input[class='augdm']")[0].value);
            // this.skill.augment = parseInt(html.find("input[class='augment']")[0].value);
            // this.skill.expert = parseInt(html.find("input[class='expert']")[0].value);

            this.actor.system.skills[this.skillId].xp = xp;
            this.actor.system.skills[this.skillId].bonus = bonus;
            this.actor.system.skills[this.skillId].notes = notes;
        }
        this.actor.update({ "system.skills": this.actor.system.skills });

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2XPDialog = MgT2XPDialog;
