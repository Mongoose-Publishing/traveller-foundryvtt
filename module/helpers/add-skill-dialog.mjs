import {rollSkill} from "../helpers/dice-rolls.mjs";

// Adding a new skill to an actor.
export class MgT2AddSkillDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2/templates/add-skill-dialog.html";
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
            this.options.title = "Edit skill";
        } else {
            this.options.title = "Add a new skill";
        }
        this.label = "New Skill"
        this.shortName = "newskill";
        this.default = "INT";
        this.background = false;
        this.combat = false;
        this.individual = false;
        this.icon = "systems/mgt2/icons/skills/new.svg";
        this.parent = "";
        this.value = 0;
        this.trained = false;

        if (spec) {
            this.label = spec.label;
            this.shortName = specId;
            if (spec.default) this.default = spec.default;
            this.combat = spec.combat;
            this.parent = skillId;
            this.value = spec.value;
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
        }
    }

    getData() {
        console.log("getData: Characteristic is " + this.cha);
        console.log("getData: Type is " + this.actor.type);
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
            "parent": this.parent
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const roll = html.find("button[class='addNewSkill']");
        roll.on("click", event => this.onAddClick(event, html));
    }

    async onAddClick(event, html) {
        event.preventDefault();
        console.log("onAddClick:");

        let label = html.find(".skillLabelField")[0].value;
        let shortname = html.find(".skillShortNameField")[0].value;
        let parent = html.find(".skillParentSelect")[0].value;
        let defaultCha = html.find(".skillDefaultSelect")[0].value;
        let combat = html.find(".skillCombatToggle")[0].value;
        let background = html.find(".skillBackgroundToggle")[0].value;

        console.log(label);
        console.log(parent);
        console.log(defaultCha);
        console.log(combat);
        console.log(background);

        if (parent) {
            if (this.data.skills[parent]) {
                if (!this.data.skills[parent].specialities) {
                    this.data.skills[parent].specialities = {};
                }
                let skill = {
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
            let skill = {
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

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

//window.MgT2SkillDialog = MgT2SkillDialog;
