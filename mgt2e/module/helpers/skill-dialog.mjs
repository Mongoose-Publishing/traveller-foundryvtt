import {rollSkill} from "../helpers/dice-rolls.mjs";
import {MgT2AddSkillDialog} from "./add-skill-dialog.mjs";

export class MgT2SkillDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/skill-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = "Make a roll";

        return options;
    }

    // skillFqn is "<skillId>" or "<skillId>.<specId>"
    constructor(actor, skillFqn, skillOptions) {
        super();

        if (!skillOptions) {
            skillOptions = {};
        }

        this.skillFqn = skillFqn;
        this.skillId = null;
        this.specId = null;
        if (skillFqn) {
            this.skillId = skillFqn;
            if (skillFqn.indexOf(".")) {
                this.skillId = skillFqn.split(".")[0];
                this.specId = skillFqn.split(".")[1];

                this.skillData = actor.system.skills[this.skillId];
                if (this.specId === "") {
                    this.specId = null;
                } else if (this.specId && this.skillData.specialities) {
                    this.specData = this.skillData.specialities[this.specId];
                }
            } else {
                this.skillData = actor.system.skills[this.skillId];
                this.specData = null;
            }
        }

        this.skillOptions = skillOptions;
        this.actor = actor;
        const data = actor.system;

        this.value = data.skills["jackofalltrades"].value - 3;
        this.chaOnly = false;
        this.cha = skillOptions.cha;
        this.expert = 0;
        this.augment = 0;
        this.augdm = 0;
        this.penalty = 0;

        this.defaultDm = skillOptions.dm?skillOptions.dm:0;
        this.boonBane = skillOptions.rollType?skillOptions.rollType:"normal";
        this.target = skillOptions.difficulty?skillOptions.difficulty:8;
        this.skillText = "";
        this.description = skillOptions.description;

        if (this.cha && data.characteristics && data.characteristics[this.cha]) {
            if (!this.skillData) {
                this.chaOnly = true;
                this.value = 0;
            }
        }
        this.data = data;

        if (this.skillData) {
            if (!this.cha) {
                this.cha = this.skillData.default;
            }
            if (this.skillData.expert) {
                this.expert = parseInt(this.skillData.expert);
            }
            if (this.skillData.augdm && parseInt(this.skillData.augdm) > 0) {
                this.augdm = parseInt(this.skillData.augdm);
            }
            if (this.skillData.boon === "boon") {
                this.boonBane = "boon";
            } else if (this.skillData.bane === "bane") {
                this.boonBane = "bane";
            }
            if (this.skillData.trained) {
                this.value = this.skillData.value;

                if (this.skillData.augment && parseInt(this.skillData.augment) > 0) {
                    this.skillData.augment = parseInt(this.skillData.augment);
                }
                if (this.specData) {
                    this.value = this.specData.value;
                    if (this.specData.default && !this.cha) {
                        this.cha = this.specData.default;
                    }
                    if (this.specData.expert) {
                        this.expert = parseInt(this.specData.expert);
                    }
                }
            } else {
                this.value = data.skills["jackofalltrades"].value - 3;
                if (this.specData && this.specData.expert) {
                    this.expert = parseInt(this.specData.expert);
                }
            }
            this.options.title = this.skillData.label;
        } else if (this.cha) {
            this.characteristic = data.characteristics[this.cha];
            this.options.title = this.characteristic.label;
            this.value = this.characteristic.dm;
        }
        this.skillText = actor.getSkillLabel(skillFqn, false);
        this.options.title = this.skillText;
        this.penalty = data.physicalDM;
    }

    getData() {
        let CHA_SELECT = {};
        CHA_SELECT["-"] = "-";
        for (let c in this.data.characteristics) {
            if (this.data.characteristics[c].show) {
                CHA_SELECT[c] = c;
            }
        }

        let BOON_SELECT = {};
        BOON_SELECT["normal"] = game.i18n.localize("MGT2.TravellerSheet.Normal");
        BOON_SELECT["boon"] = game.i18n.localize("MGT2.TravellerSheet.Boon");
        BOON_SELECT["bane"] = game.i18n.localize("MGT2.TravellerSheet.Bane");

        let TARGET_SELECT = {};
        for (let t=2; t <= 16; t += 2) {
            TARGET_SELECT[t] = game.i18n.localize("MGT2.TaskDifficulty." + t) + ` (${t}+)`;
        }


        return {
            "actor": this.actor,
            "data": this.data,
            "skill": this.skillData,
            "description": this.description,
            "spec": this.specData,
            "skillText": this.skillText,
            "value": this.value,
            "showCha": (this.skillData && this.actor.type !== "creature"),
            "chaOnly": this.chaOnly,
            "dm": this.defaultDm,
            "dicetype": "normal",
            "physicalDM": this.penalty,
            "characteristic": this.cha,
            "target": this.target,
            "boonBane": this.boonBane,
            "showEdit": !(this.actor.parent),
            "CHA_SELECT": CHA_SELECT,
            "BOON_SELECT": BOON_SELECT,
            "TARGET_SELECT": TARGET_SELECT
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const roll = html.find("button[class='skillRoll']");
        roll.on("click", event => this.onRollClick(event, html));

        html.find(".edit-skill").on("click", event => this.onSkillEdit(event, html));
    }

    async onRollClick(event, html) {
        event.preventDefault();

        let dm = parseInt(html.find("input[class='skillDialogDM']")[0].value);
        let cha = this.cha;
        let remember = false;
        if (html.find(".skillDialogCha")[0]) {
            cha = html.find(".skillDialogCha")[0].value;
            remember = html.find(".rememberChaCheck")[0].checked;
        }
        let rollType = html.find(".skillDialogRollType")[0].value;
        let difficulty = parseInt(html.find(".skillDialogDifficulty")[0].value);

        if (remember && this.skillId) {
            if (this.spec) {
                this.actor.system.skills[this.skillId].specialities[this.specId].default = cha;
            } else {
                this.actor.system.skills[this.skillId].default = cha;
            }
            this.actor.update({ "system.skills": this.actor.system.skills });
        } else if (this.skillId) {
            this.cha = this.actor.system.skills[this.skillId].default;
        }
        rollSkill(this.actor, this.skillFqn, {
            "cha": cha,
            "dm": parseInt(dm),
            "rollType": rollType,
            "difficulty": difficulty,
            "description": this.skillOptions.description,
            "success": this.skillOptions.success,
            "failure": this.skillOptions.failure
        });
        //}, cha, dm, rollType, difficulty, this.text);

        this.close();
    }

    async onSkillEdit(event, html) {
        event.preventDefault();
        new MgT2AddSkillDialog(this.actor, this.skillId, this.specId).render(true);
        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2SkillDialog = MgT2SkillDialog;
