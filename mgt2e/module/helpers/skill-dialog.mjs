import {rollSkill, skillLabel} from "./dice-rolls.mjs";
import {MgT2AddSkillDialog} from "./add-skill-dialog.mjs";
import {MGT2} from "./config.mjs";

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
        if (skillFqn === "undefined") {
            this.skillFqn = null;
        }
        this.skillId = null;
        this.specId = null;
        this.chaOnly = false;

        if (this.skillFqn) {
            this.skillId = this.skillFqn;
            if (this.skillFqn.indexOf(".")) {
                this.skillId = this.skillFqn.split(".")[0];
                this.specId = this.skillFqn.split(".")[1];

                if (actor) {
                    this.skillData = actor.system.skills[this.skillId];
                    if (this.specId === "") {
                        this.specId = null;
                    } else if (this.specId && this.skillData.specialities) {
                        this.specData = this.skillData.specialities[this.specId];
                    }
                } else {
                    this.skillData = MGT2.getDefaultSkills()[this.skillId];
                    if (this.specId) {
                        this.specData = this.skillData.specialities[this.specId];
                    }
                }
            } else {
                this.skillData = actor.system.skills[this.skillId];
                this.specData = null;
            }
        } else {
            this.chaOnly = true;
        }

        this.skillOptions = skillOptions;
        this.actor = actor;
        const data = actor?actor.system:null;

        let untrainedValue = -3;
        if (data?.skills["jackofalltrades"]?.trained) {
            untrainedValue = parseInt(data.skills["jackofalltrades"].value) - 3;
            if (isNaN(untrainedValue)) {
                untrainedValue = -3;
            }
        }
        this.value = untrainedValue;
        this.cha = skillOptions.cha;
        this.expert = skillOptions.expert?skillOptions.expert:0;
        this.augment = 0;
        this.augdm = 0;
        this.penalty = 0;

        this.defaultDm = skillOptions.dm?skillOptions.dm:0;
        this.boonBane = skillOptions.rollType?skillOptions.rollType:"normal";
        this.target = skillOptions.difficulty?skillOptions.difficulty:8;
        this.skillText = "";
        this.description = skillOptions.description;
        this.mode = skillOptions.rollMode?skillOptions.rollMode:game.settings.get("core", "rollMode");

        if (skillOptions.agent) {
            // This is a direct skill roll without a character.
            this.actor = null;
            this.data = null;
            this.cha = null;
            this.value = skillOptions.level;

            this.options.title = skillOptions.agent;
            this.skillText = skillLabel(this.skillData, this.skillId);
            if (this.specId) {
                this.skillText += " (" + skillLabel(this.specData, this.specId) + ")";
            }

            return;
        }

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
            } else if (this.skillData.boon === "bane") {
                this.boonBane = "bane";
            }
            if (this.skillData.trained) {
                if (this.skillData.individual && this.specData) {
                    // Treat as untrained so far.
                } else {
                    this.value = this.skillData.value;
                }

                if (this.skillData.augment && parseInt(this.skillData.augment) > 0) {
                    this.skillData.augment = parseInt(this.skillData.augment);
                }
                if (this.specData) {
                    if (!this.skillData.individual || this.specData.trained) {
                        this.value = this.specData.value;
                    }
                    if (this.specData.default && !this.cha) {
                        this.cha = this.specData.default;
                    }
                    if (this.specData.expert) {
                        this.expert = parseInt(this.specData.expert);
                    }
                }
            } else {
                this.value = untrainedValue;
                if (this.specData && this.specData.expert) {
                    this.expert = parseInt(this.specData.expert);
                }
            }
            this.options.title = `${actor.name} (${this.skillData.label})`;
        } else if (this.cha) {
            this.characteristic = data.characteristics[this.cha];
            this.options.title = `${actor.name} (${this.characteristic.label})`;
            this.value = this.characteristic.dm;
        }
        // Apply characteristic boon/bane from augmentation effects
        if (this.cha && data.characteristics?.[this.cha]?.boon) {
            this.boonBane = data.characteristics[this.cha].boon;
        }
        this.skillText = actor.getSkillLabel(skillFqn, false);
        this.options.title = `${actor.name} (${this.skillText})`;
        this.penalty = data.physicalDM;
    }

    getData() {
        let CHA_SELECT = {};
        CHA_SELECT["-"] = "-";
        if (this.data) {
            for (let c in this.data.characteristics) {
                if (this.data.characteristics[c].show) {
                    CHA_SELECT[c] = c;
                }
            }
        }

        let BOON_SELECT = {};
        BOON_SELECT["normal"] = game.i18n.localize("MGT2.TravellerSheet.Normal");
        BOON_SELECT["boon"] = game.i18n.localize("MGT2.TravellerSheet.Boon");
        BOON_SELECT["bane"] = game.i18n.localize("MGT2.TravellerSheet.Bane");

        let MODE_SELECT = {};
        MODE_SELECT["publicroll"] = game.i18n.localize("MGT2.Dialog.Public");
        MODE_SELECT["gmroll"] = game.i18n.localize("MGT2.Dialog.Private");
        MODE_SELECT["blindroll"] = game.i18n.localize("MGT2.Dialog.Blind");
        MODE_SELECT["selfroll"] = game.i18n.localize("MGT2.Dialog.Self");

        let TARGET_SELECT = {};
        for (let t=2; t <= 16; t += 2) {
            TARGET_SELECT[t] = game.i18n.localize("MGT2.TaskDifficulty." + t) + ` (${t}+)`;
        }
        if (!TARGET_SELECT[this.target]) {
            TARGET_SELECT[this.target] = this.target;
        }

        return {
            "actor": this.actor,
            "data": this.data,
            "skill": this.skillData,
            "description": this.description,
            "spec": this.specData,
            "expert": this.expert,
            "skillText": this.skillText,
            "value": this.value,
            "showCha": (this.actor && this.skillData && this.actor.type !== "creature"),
            "chaOnly": this.chaOnly,
            "dm": this.defaultDm,
            "dicetype": "normal",
            "physicalDM": this.penalty,
            "characteristic": this.cha,
            "target": this.target,
            "boonBane": this.boonBane,
            "showEdit": !(this.actor && this.actor.parent),
            "CHA_SELECT": CHA_SELECT,
            "BOON_SELECT": BOON_SELECT,
            "TARGET_SELECT": TARGET_SELECT,
            "MODE_SELECT": MODE_SELECT,
            "mode": this.mode,
            "rollEffects": this._collectRollEffects()
        }
    }

    /**
     * Collect active effects that are relevant to the current roll, for display in the dialog.
     * Returns an array of { name, typeLabel, summary } objects.
     */
    _collectRollEffects() {
        if (!this.actor) return [];
        const effects = [];
        const cha = this.cha;
        const skillPath = this.skillId ? `system.skills.${this.skillId}` : null;
        const specPath = (this.skillId && this.specId)
            ? `system.skills.${this.skillId}.specialities.${this.specId}`
            : null;

        for (const effect of this.actor.allApplicableEffects()) {
            if (effect.disabled) continue;
            const augmentType = effect.flags?.mgt2e?.augmentType ?? null;
            const typeLabel = augmentType
                ? game.i18n.localize("MGT2.Effects.Type." + augmentType)
                : effect.name;

            const relevantChanges = [];
            for (const change of effect.changes) {
                const key = change.key;
                // Characteristic-based effects for the current cha
                if (cha) {
                    if (key === `system.characteristics.${cha}.augdm`) {
                        const val = Number(change.value);
                        relevantChanges.push({
                            label: `MD ${val >= 0 ? "+" : ""}${val}`,
                            target: game.i18n.localize("MGT2." + cha)
                        });
                        continue;
                    }
                    if (key === `system.characteristics.${cha}.augment`) {
                        const val = Number(change.value);
                        relevantChanges.push({
                            label: `${game.i18n.localize("MGT2." + cha)} ${val >= 0 ? "+" : ""}${val}`,
                            target: ""
                        });
                        continue;
                    }
                    if (key === `system.characteristics.${cha}.boon`
                        || key === `system.characteristics.${cha}.bane`) {
                        const isBoon = key.endsWith(".boon");
                        relevantChanges.push({
                            label: isBoon
                                ? game.i18n.localize("MGT2.TravellerSheet.Boon")
                                : game.i18n.localize("MGT2.TravellerSheet.Bane"),
                            target: game.i18n.localize("MGT2." + cha)
                        });
                        continue;
                    }
                    if (key === `system.characteristics.${cha}.min`) {
                        relevantChanges.push({
                            label: `min ${change.value}`,
                            target: game.i18n.localize("MGT2." + cha)
                        });
                        continue;
                    }
                }
                // Skill-based effects for the current skill / spec
                if (skillPath && key === `${skillPath}.augdm`) {
                    const val = Number(change.value);
                    relevantChanges.push({
                        label: `MD ${val >= 0 ? "+" : ""}${val}`,
                        target: skillLabel(this.skillData, this.skillId)
                    });
                    continue;
                }
                if (skillPath && key === `${skillPath}.augment`) {
                    const val = Number(change.value);
                    relevantChanges.push({
                        label: `${val >= 0 ? "+" : ""}${val}`,
                        target: skillLabel(this.skillData, this.skillId)
                    });
                    continue;
                }
                if (specPath && key === `${specPath}.augdm`) {
                    const val = Number(change.value);
                    const specLabel = skillLabel(this.skillData, this.skillId)
                        + " (" + skillLabel(this.specData, this.specId) + ")";
                    relevantChanges.push({ label: `MD ${val >= 0 ? "+" : ""}${val}`, target: specLabel });
                    continue;
                }
                if (specPath && key === `${specPath}.augment`) {
                    const val = Number(change.value);
                    const specLabel = skillLabel(this.skillData, this.skillId)
                        + " (" + skillLabel(this.specData, this.specId) + ")";
                    relevantChanges.push({ label: `${val >= 0 ? "+" : ""}${val}`, target: specLabel });
                    continue;
                }
                // Misc DM (global bonus to all rolls)
                if (key.startsWith("system.modifiers.") && key.endsWith(".effect")) {
                    const val = Number(change.value);
                    if (val !== 0) {
                        relevantChanges.push({ label: `DM ${val >= 0 ? "+" : ""}${val}`, target: "" });
                    }
                    continue;
                }
            }

            if (relevantChanges.length > 0) {
                for (const c of relevantChanges) {
                    effects.push({
                        name: effect.name,
                        typeLabel,
                        label: c.label,
                        target: c.target
                    });
                }
            }
        }
        return effects;
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
        let rollMode = html.find(".skillDialogRollMode")[0].value;
        let difficulty = parseInt(html.find(".skillDialogDifficulty")[0].value);

        if (this.actor) {
            if (remember && this.skillId) {
                if (this.spec) {
                    this.actor.system.skills[this.skillId].specialities[this.specId].default = cha;
                } else {
                    this.actor.system.skills[this.skillId].default = cha;
                }
                this.actor.update({"system.skills": this.actor.system.skills});
            } else if (this.skillId) {
                this.cha = this.actor.system.skills[this.skillId].default;
            }
        }
        let options = {
            "cha": cha,
            "dm": parseInt(dm),
            "rollType": rollType,
            "difficulty": difficulty,
            "description": this.skillOptions.description,
            "success": this.skillOptions.success,
            "failure": this.skillOptions.failure,
            "cost": this.skillOptions.cost,
            "rollMode": rollMode
        };
        if (this.skillOptions.agent) {
            options.agent = this.skillOptions.agent;
            options.level = this.skillOptions.level;
        }
        if (this.skillOptions.expert) {
            options.expert = this.skillOptions.expert;
        }
        await rollSkill(this.actor, this.skillFqn, options);

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
