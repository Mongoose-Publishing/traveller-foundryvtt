
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
        console.log(cha);
        console.log(rollType);
        console.log(dm);

        let dice = "2D6";
        if (rollType === "boon") {
            dice = "3D6k2";
        } else if (rollType === "bane") {
            dice = "3D6kl2";
        }
        let chaDM = this.getData().data.characteristics[cha].dm
        dice += " + " + chaDM;
        dice += " + " + this.value + " + " + dm;

        console.log(dice);

        let roll = new Roll(dice, this.actor.getRollData()).evaluate({async: false});
        if (roll) {
            let text = cha + "[" + chaDM + "] + " + this.skill.label;
            if (this.spec) {
                text += " (" + this.spec.label + ")"
            }
            text += " [" + this.value + "]";
            if (dm > 0) {
                text += " + " + dm;
            } else if (dm < 0) {
                text += " - " + dm;
            }
            if (rollType === "boon") {
                text += " <span class='boon'>[Boon]</span>";
            } else if (rollType === "bane") {
                text += " <span class='bane'>[Bane]</span>";
            }

            roll.toMessage({
                speaker: ChatMessage.getSpeaker({actor: this.actor}),
                flavor: "<b>" + text + "</b>",
                rollMode: game.settings.get("core", "rollMode")
            });
        }
        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2SkillDialog = MgT2SkillDialog;
