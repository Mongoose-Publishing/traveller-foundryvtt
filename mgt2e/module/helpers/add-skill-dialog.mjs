import { skillLabel } from "./dice-rolls.mjs";

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

    constructor(actor, skillId, specId) {
        super();
        console.log("MgT2AddSkillDialog:");

        console.log(skillId);
        console.log(specId);

        this.isEdit = !!skillId;
        this.actor = actor;
        this.actorData = actor.system;
        this.skillId = skillId;
        this.specId = specId;

        if (this.isEdit) {
            this.options.title = game.i18n.localize("MGT2.EditSkill.Edit");
            this.options.title += " - " + skillId;
            if (specId) {
                this.options.title += "." + specId;
            }

            this.skillData = this.actorData.skills[this.skillId];
            this.formData = this.skillData;
            if (specId) {
                this.specData = this.skillData.specialities[this.specId];
                this.formData = this.specData;
                this.label = skillLabel(this.formData, specId);
                this.shortName = specId;
            } else {
                this.label = skillLabel(this.formData, skillId);
                this.shortName = skillId;
            }
            console.log(this.formData);
            this.default = this.formData.default;
            this.isCombat = this.formData.combat;
            this.isIndividual = this.formData.individual;
            this.isBackground = this.formData.background;
            this.isDeleted = !!this.formData.deleted;
            console.log(this.isCombat);

            // Always comes from the parent.
            this.icon = this.skillData.icon;
            // Only used by specialisations.
            if (specId) {
                this.parentId = skillId;
                this.parentLabel = skillLabel(this.skillData, skillId);
            } else {
                this.parentId = null;
            }
        } else {
            this.options.title = game.i18n.localize("MGT2.EditSkill.Add");
            this.label = "New Skill"
            this.shortName = "new_skill";
            this.default = "INT";
            this.isBackground = false;
            this.isCombat = false;
            this.isIndividual = false;
            this.isDeleted = false;
            this.icon = "systems/mgt2e/icons/skills/new.svg";
            this.parentId = "";
            this.parentLabel = "";

            this.SKILL_LIST = {};
            this.SKILL_LIST[""] = "-";
            for (let s in this.actorData.skills) {
                if (this.actorData.skills[s].requires !== "XXX") {
                    this.SKILL_LIST[s] = skillLabel(this.actorData.skills[s], s);
                }
            }
        }
        this.CHA_LIST = {};
        this.CHA_LIST[""] = "-";
        for (let c in this.actorData.characteristics) {
            this.CHA_LIST[c] = c;
        }
    }

    getData() {
        return {
            // Read only
            "actor": this.actor,
            "data": this.actorData,
            "shortName": this.shortName,
            "isEdit": this.isEdit,
            "SKILL_LIST": this.SKILL_LIST,
            "CHA_LIST": this.CHA_LIST,
            // Editable
            "label": this.label,
            "default": this.default,
            "isBackground": this.isBackground,
            "isCombat": this.isCombat,
            "isIndividual": this.isIndividual,
            "icon": this.icon,
            "isDeleted": this.isDeleted,
            "parentId": this.parentId,
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
        let combat = html.find(".skillCombatToggle")[0].checked;
        let background = html.find(".skillBackgroundToggle")[0].checked;
        let individual = html.find(".skillIndividualToggle")[0].checked;

        if (parent) {
            console.log("Has a parent [" + parent + "]");
            if (this.actorData.skills[parent]) {
                if (!this.actorData.skills[parent].specialities) {
                    this.actorData.skills[parent].specialities = {};
                }
                // Find a unique id for this speciality.
                if (!this.isEdit && this.actorData.skills[parent].specialities[shortname]) {
                    let idx = 1;
                    while (this.actorData.skills[parent].specialities[shortname+"_"+idx]) {
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
                this.actorData.skills[parent].specialities[shortname] = skill;

            } else {
                console.log("Parent skill [" + parent + "] does not exist");
            }
        } else {
            console.log("Top level skill");
            // Find a unique id for this skill.
            if (!this.isEdit && (this.actorData.skills[shortname])) {
                let idx = 1;
                while (this.actorData.skills[shortname+"_"+idx]) {
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
                'individual': individual,
                'requires': defaultCha,
                'icon': this.icon
            }
            this.actorData.skills[shortname] = skill;
        }

        this.actor.update({ "system.skills": this.actor.system.skills });

        this.close();
    }

    async onDeleteClick(event, html) {
        event.preventDefault();
        console.log("onDeleteClick:");

        console.log("Top skill is " + this.skillId);
        console.log("Specialisation is " + this.specId);

        if (this.actor.type === "package") {
            // Packages need to mark a skill as deleted, rather than deleting it.
            if (this.specId) {
                console.log("Parent is " + this.skillId);
                if (this.actor.system.skills[this.skillId].specialities[this.specId].deleted) {
                    this.actor.system.skills[this.skillId].specialities[this.specId].deleted = false;
                } else {
                    this.actor.system.skills[this.skillId].specialities[this.specId].deleted = true;
                }
            } else {
                console.log("Mark " + this.shortName + " as deleted");
                if (this.actor.system.skills[this.skillId].deleted) {
                    this.actor.system.skills[this.skillId].deleted = false;
                } else {
                    this.actor.system.skills[this.skillId].deleted = true;
                }
            }
            console.log(this.actor.system.skills);
            this.actor.update({ "system.skills": this.actor.system.skills });
        } else if (this.specId) {
            // Delete a specialisation.
            console.log("Parent is " + this.skillId);
            if (Object.getOwnPropertyNames(this.actor.system.skills[this.skillId].specialities).length === 1) {
                // If the final speciality is removed, then we need to remove the whole
                // structure, so that the parent skill is treated as a normal skill.
                this.actor.update({[`system.skills.${this.skillId}.-=specialities`]: null});
            } else {
                this.actor.update({[`system.skills.${this.skillId}.specialities.-=${this.specId}`]: null});
            }
        } else {
            // Delete a top level skill.
            this.actor.update({[`system.skills.-=${this.skillId}`]: null});
        }
        this.close();
        return;
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

//window.MgT2SkillDialog = MgT2SkillDialog;
