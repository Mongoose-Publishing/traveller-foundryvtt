import {rollSkill} from "../helpers/dice-rolls.mjs";

// Adding a new skill to an actor.
export class MgT2AddSkillDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/add-skill-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = "Add Skill";

        return options;
    }

    constructor(actor, skillId, skill, specId, spec) {
        super();
        console.log("MgT2AddSkillDialog:");

        if (skill) {
            console.log(skill);
        }

        console.log(actor);

        this.actor = actor;

        this.data = actor.system;
        this.isEdit = false;
        if (skill || spec) {
            this.isEdit = true;
        }

        if (this.isEdit) {
            this.options.title = game.i18n.localize("MGT2.EditSkill.Edit");
            this.options.title += " - " + skillId;
            if (spec) {
                this.options.title += " (" + specId + ")";
            }
        } else {
            this.options.title = game.i18n.localize("MGT2.EditSkill.Add");
        }
        this.label = "New Skill"
        this.shortName = "newskill";
        this.default = "INT";
        this.background = false;
        this.combat = false;
        this.individual = false;
        this.icon = "systems/mgt2e/icons/skills/new.svg";
        this.parent = "";
        this.parentLabel = "";
        this.value = 0;
        this.trained = false;
        this.isDeleted = false;

        if (spec) {
            this.label = spec.label;
            this.shortName = specId;
            if (spec.default) this.default = spec.default;
            this.combat = spec.combat;
            this.parent = skillId;
            this.parentLabel = skill.label;
            console.log(this.parent);
            this.value = spec.value;
            this.isDeleted = spec.deleted?true:false;
            if (spec.trained) {
                this.trained = spec.trained;
            }
        } else if (skill) {
            this.label = skill.label;
            this.shortName = skillId;
            this.default = skill.default;
            this.background = skill.background;
            this.combat = skill.combat;
            this.individual = skill.individual;
            this.icon = skill.icon;
            this.value = skill.value;
            this.trained = skill.trained;
            this.isDeleted = skill.deleted?true:false;
        }
    }

    getData() {
        return {
            "actor": this.actor,
            "data": this.data,
            "label": this.label,
            "shortName": this.shortName,
            "default": this.default,
            "background": this.background,
            "combat": this.combat,
            "individual": this.individual,
            "icon": this.icon,
            "isEdit": this.isEdit,
            "isDeleted": this.isDeleted,
            "parent": this.parent,
            "parentLabel": this.parentLabel
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const add = html.find("button[class='addNewSkill']");
        add.on("click", event => this.onAddClick(event, html));

        const del = html.find("button[class='deleteSkill']")
        if (del) {
            del.on("click", event => this.onDeleteClick(event, html));
        }

        if (!this.isEdit) {
            html.find(".skillLabelField").on("keyup", event => this.onLabelChange(event, html));
        }
    }

    onLabelChange(event, html) {
        let label = html.find(".skillLabelField")[0].value;
        let shortname = label.toLowerCase().trim();
        shortname = shortname.replaceAll(/ /g, "_");
        shortname = shortname.replaceAll(/[^a-z_]/g, "");

        html.find(".skillShortNameField")[0].value = shortname;

    }

    async onAddClick(event, html) {
        event.preventDefault();

        let label = html.find(".skillLabelField")[0].value;
        let shortname = html.find(".skillShortNameField")[0].value;
        let parent = html.find(".skillParentSelect")[0].value;
        let defaultCha = html.find(".skillDefaultSelect")[0].value;
        let combat = html.find(".skillCombatToggle")[0].value;
        let background = html.find(".skillBackgroundToggle")[0].value;

        if (parent) {
            if (this.data.skills[parent]) {
                if (!this.data.skills[parent].specialities) {
                    this.data.skills[parent].specialities = {};
                }
                // Find a unique id for this speciality.
                if (!this.isEdit && this.data.skills[parent].specialities[shortname]) {
                    let idx = 1;
                    while (this.data.skills[parent].specialities[shortname+"_"+idx]) {
                        idx++;
                    }
                    shortname = shortname + "_" + idx;
                }

                let skill = {
                    'id': shortname,
                    'label': label,
                    'combat': true,
                    'default': defaultCha,
                    'trained': false,
                    'value': 0
                }
                this.data.skills[parent].specialities[shortname] = skill;

            } else {
                console.log("Parent skill [" + parent + "] does not exist");
            }
        } else {
            // Find a unique id for this skill.
            if (!this.isEdit && (this.data.skills[shortname])) {
                let idx = 1;
                while (this.data.skills[shortname+"_"+idx]) {
                    idx++;
                }
                shortname = shortname + "_" + idx;
            }
            let skill = {
                'id': shortname,
                'label': label,
                'combat': combat,
                'default': defaultCha,
                'trained': false,
                'value': 0,
                'background': background,
                'requires': defaultCha,
                'icon': this.icon
            }
            this.data.skills[shortname] = skill;
        }

        this.actor.update({ "system.skills": this.actor.system.skills });

        this.close();
    }

    async onDeleteClick(event, html) {
        event.preventDefault();
        console.log("onDeleteClick:");

        if (this.isEdit) {
            if (this.actor.type === "package") {
                // Packages need to mark a skill as deleted, rather than deleting it.
                if (this.parent) {
                    if (this.actor.system.skills[this.parent].specialities[this.shortName].deleted) {
                        this.actor.system.skills[this.parent].specialities[this.shortName].deleted = false;
                    } else {
                        this.actor.system.skills[this.parent].specialities[this.shortName].deleted = true;
                    }
                } else {
                    if (this.actor.system.skills[this.shortName].deleted) {
                        this.actor.system.skills[this.shortName].deleted = false;
                    } else {
                        this.actor.system.skills[this.shortName].deleted = true;
                    }
                }
                console.log(this.actor.system.skills);
                this.actor.update({ "system.skills": this.actor.system.skills });
            } else if (this.parent) {
                if (Object.getOwnPropertyNames(this.actor.system.skills[this.parent].specialities).length === 1) {
                    // If the final speciality is removed, then we need to remove the whole
                    // structure, so that the parent skill is treated as a normal skill.
                    this.actor.update({[`system.skills.${this.parent}.-=specialities`]: null});
                } else {
                    this.actor.update({[`system.skills.${this.parent}.specialities.-=${this.shortName}`]: null});
                }
            } else {
                this.actor.update({[`system.skills.-=${this.shortName}`]: null});
            }
            this.close();
            return;
        }

    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

//window.MgT2SkillDialog = MgT2SkillDialog;
