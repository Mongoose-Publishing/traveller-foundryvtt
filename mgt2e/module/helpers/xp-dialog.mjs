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

    constructor(actor, skillId, specId, cha) {
        super();
        this.actor = actor;
        const actorData = actor.system;

        console.log("MgT2XPDialog: [" + skillId + "] [" + specId + "]");

        this.skillId = skillId;
        this.skillData = null;
        this.specId = specId;
        this.spec = null;
        this.value = 0;
        this.chaOnly = false;
        this.cha = cha;
        this.bonus = 0;
        this.notes = "";
        this.study = "";
        this.xp = 0;
        this.trained = false;

        // skillId / specId  - string ids for the skill.
        // skillData / specData - objects for the skill
        // formData - object for either a parent skill or a specialisation.

        if (cha && actorData.characteristics && actorData.characteristics[cha]) {
            this.characteristic = actorData.characteristics[cha];
            if (!skillId) {
                this.chaOnly = true;
                this.value = 0;
            }
            this.formData = this.characteristic;
            this.formData.xp = parseInt(this.formData.xp?this.formData.xp:0);
            this.skillTitle = cha;
        }
        if (this.skillId && actorData.skills[skillId]) {
            this.skillData = actorData.skills[skillId];
            this.formData = this.skillData;
            this.skillTitle = skillLabel(this.skillData, this.skillId);

            if (this.specId && this.skillData.trained) {
                if (!this.skillData.specialities[this.specId]) {
                    ui.notifications.error("Cannot find speciality " + this.specId);
                    return;
                }
                this.specData = this.skillData.specialities[this.specId];
                this.formData = this.specData;
                this.skillTitle += ` (${skillLabel(this.specData, this.specId)})`;
            } else if (this.specId) {
                ui.notifications.error("Cannot train a specialisation if parent is untrained");
                return;
            } else {
                // Just the basic top level skill.
            }
        } else if (!this.chaOnly) {
            ui.notifications.error("Unable to find skill " + skillId);
            return;
        }
        this.formData.xp = parseInt(this.formData.xp?this.formData.xp:0);
        this.formData.bonus = parseInt(this.formData.bonus?this.formData.bonus:0);
        this.formData.notes = this.formData.notes?this.formData.notes:"";
        this.formData.study = this.formData.study?this.formData.study:"";

        this.options.title = game.i18n.format("MGT2.XPSkill.Title", { name: this.skillTitle });
        if (this.chaOnly) {
            if (["EDU", "INT", "PSI"].includes(cha)) {
                this.cost = (parseInt(this.characteristic.value) + 1) * 2;
            } else if (["STR", "DEX", "END"].includes(cha)) {
                this.cost = parseInt(this.characteristic.value) + 1;
            } else {
                this.cost = 0;
            }
        } else if (this.formData.specialities) {
            this.cost = 0;
        } else {
            this.cost = 1;
            if (this.formData.value > 0) {
                this.cost = Math.pow(2, this.formData.value);
            }
        }
    }

    getData() {
        return {
            "actor": this.actor,
            "data": this.actorData,
            "formData": this.formData,
            "skillData": this.skillData,
            "specData": this.specData,
            "skillTitle": this.skillTitle,
            "value": this.formData.value,
            "cost": this.cost,
            "xp": this.xp,
            "showEdit": !(this.actor.parent)
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const save = html.find("button[class='save']");
        save.on("click", event => this.onSaveClick(event, html));

        html.find(".clearEffects").click(ev => {
           this.formData.augdm = 0;
           this.formData.augment = 0;
           this.formData.expert = 0;
           // TODO: Need to update the dialog.
            html.find(".augdm")[0].value = "";
            html.find(".augment")[0].value = "";
            html.find(".expert")[0].value = "";
        });

        html.find(".edit-skill").on("click", event => this.onSkillEdit(event, html));
    }

    async onSkillEdit(event, html) {
        event.preventDefault();
        new MgT2AddSkillDialog(this.actor, this.skillId, this.specId).render(true);
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

        this.formData.xp = this.getIntValue(html, "skillXPxp");
        this.formData.bonus = this.getIntValue(html, "skillXPbonus");
        this.formData.notes = html.find("input.skillXPnotes")[0]?.value;
        this.formData.study = html.find("input.skillXPstudy")[0]?.value;
        this.formData.boon = html.find("select.skillXPboon")[0]?.value;

        if (this.chaOnly && this.cost > 0) {
            while (this.formData.xp >= this.cost) {
                this.formData.value += 1;
                this.formData.xp -= this.cost;
            }
            this.actor.update({"system.characteristics": this.actor.system.characteristics});
        } else if (this.cost > 0) {
            while (this.formData.xp >= this.cost) {
                if (!this.formData.trained) {
                    this.formData.trained = true;
                    this.formData.xp -= this.cost;
                } else {
                    this.formData.value += 1;
                    this.formData.xp -= this.cost;
                }
            }
            this.actor.update({ "system.skills": this.actor.system.skills });
        }
        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2XPDialog = MgT2XPDialog;
