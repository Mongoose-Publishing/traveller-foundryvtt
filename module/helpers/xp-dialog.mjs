
export class MgT2XPDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2/templates/xp-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = "Make a roll";

        return options;
    }

    constructor(actor, skill, spec, cha) {
        super();
        this.actor = actor;
        const data = actor.system;

        console.log("xp-dialog:");
        console.log(actor);

        this.skillId = skill;
        this.skill = null;
        this.specId = null;
        this.spec = null;
        this.value = 0;
        this.chaOnly = false;
        this.cha = cha;
        this.bonus = 0;
        this.notes = "";
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
                }
            }
            this.options.title = this.skill.label;
        } else if (cha) {
            this.options.title = this.characteristic.label;
            this.value = this.characteristic.dm;
        }
        if (this.spec) {
            this.options.title += " (" + this.spec.label + ")";
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
            "notes": this.notes
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const save = html.find("button[class='save']");
        save.on("click", event => this.onSaveClick(event, html));
    }

    async onSaveClick(event, html) {
        event.preventDefault();

        let xp = parseInt(html.find("input[class='skillXPxp']")[0].value);
        let bonus = parseInt(html.find("input[class='skillXPbonus']")[0].value);
        let notes = html.find("input[class='skillXPnotes']")[0].value;

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
        } else if (this.skill) {
            this.skill.xp = xp;
            this.skill.bonus = bonus;
            this.skill.notes = notes;

            console.log("XP is " + xp);

            this.actor.system.skills[this.skillId].xp = xp;
            this.actor.system.skills[this.skillId].bonus = bonus;
            this.actor.system.skills[this.skillId].notes = notes;

            this.actor.update({ "system.skills": this.actor.system.skills });
        }

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2XPDialog = MgT2XPDialog;
