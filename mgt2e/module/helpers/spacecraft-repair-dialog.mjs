import {rollSkill} from "../helpers/dice-rolls.mjs";
import { MGT2 } from "../helpers/config.mjs";

export class MgT2SpacecraftRepairDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/spacecraft-repair-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = game.i18n.localize("MGT2.SpacecraftRepairDialog.Title");
        options.shareable = true;
        options.popOut = true;
        options.resizable = true;

        return options;
    }

//    constructor(actor, damage, ap, laser, traits) {
    constructor(actorShip, actorCrew) {
        super();
        console.log("SpacecraftRepairDialog:");

        console.log(actorShip);

        this.actorShip = actorShip;
        this.actorCrew = actorCrew;
        this.data = actorShip.system;

        this.crits = {};
        this.crits.effectCrit = false;
        this.crits.effectSeverity = 0;
        this.crits.numCrits = 0;
        if (this.actualDamage > 0 && damageOptions.effect >= 6) {
            this.crits.effectCrit = true;
            this.crits.effectSeverity = damageOptions.effect - 5;
            console.log("Effect Critical: " + damageOptions.effect - 5);
        }
        // Current critical state.
        this.shipCriticals = {};
        for (let c in MGT2.SPACECRAFT_CRITICALS) {
            let severity = this.actorShip.flags.mgt2e["crit_"+c];
            if (severity) {
                this.shipCriticals[c] = parseInt(severity);
            } else {
                this.shipCriticals[c] = 0;
            }
        }
        console.log(this.shipCriticals);
        this.shipDamage = {};
        for (let d in MGT2.SPACECRAFT_DAMAGE) {
            if (this.actorShip.flags.mgt2e["damage_"+d]) {
                let dm = 0 - this.actorShip.flags.mgt2e["damageSev_" + d];
                if (this.actorShip.flags.mgt2e["damageDM_" + d]) {
                    dm += parseInt(this.actorShip.flags.mgt2e["damageDM_" + d]);
                }
                this.shipDamage[d] = {
                    "label": game.i18n.localize("MGT2.Spacecraft.CriticalLabel." + d),
                    "severity": this.actorShip.flags.mgt2e["damageSev_" + d],
                    "dm": dm
                };
            }
        }
        console.log(this.shipDamage);

        this.criticalLabels = { };
        let roll = 2;
        for (let c in MGT2.SPACECRAFT_CRITICALS) {
            this.criticalLabels[c] = game.i18n.format("MGT2.Spacecraft.Criticals." + c) + ` (${roll})`;
            roll++;
        }

        this.skillLabel = "";
        let options = {};
        options.cha = "INT";
        if (actorCrew.system.characteristics["INT"].value < actorCrew.system.characteristics["EDU"].value) {
            options.cha = "EDU";
        }
        let value = actorCrew.getSkillValue("engineer", options);
        this.skillResult = options;
        this.skillText = `${options.cha} (${options.results.chadm}) + Engineer (${value})`;
    }


    getData() {
        return {
            "actor": this.actorShip,
            "crew": this.actorCrew,
            "data": this.data,
            "shipCriticals": this.shipCriticals,
            "shipDamage": this.shipDamage,
            "skillText": this.skillText
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.repair').click(ev => {
            const div = $(ev.currentTarget);
            const id = div.data("id");
            this.repairRoll(event, id, html);
        });

    }

    async repairRoll(event, id, html) {
        console.log(id);

        let result = await rollSkill(this.actorCrew, "engineer.", {
            "cha": this.skillResult.cha,
            "dm": this.shipDamage[id].dm,
            "difficulty": 8,
            "description": "Fixing the ship",
            "success": "Repair successful",
            "failure": "Repair failed"
        });

        if (result >= 8) {
            // Fixed it. Technically, this is a temporary fix. But for now, we
            // just fix is permanently.
            this.actorShip.unsetFlag("mgt2e", "damage_"+id);
            this.actorShip.unsetFlag("mgt2e", "damageSev_"+id);
            this.actorShip.unsetFlag("mgt2e", "damageDM_"+id);
            for (let e of html.find(".row_" + id)) {
                e.remove();
            }
        } else {
            let dm = 0;
            if (this.actorShip.flags.mgt2e["damageDM_" + id]) {
                dm = this.actorShip.flags.mgt2e["damageDM_" + id];
            }
            dm = parseInt(dm) + 1;
            this.actorShip.setFlag("mgt2e", "damageDM_" + id, dm);
            this.setIntValue(html, ".dm_"+id, dm);
            this.shipDamage[id].dm = dm;
        }
    }

    getIntValue(html, field) {
        if (html.find(field) && html.find(field)[0] && html.find(field)[0].value) {
            let v = html.find(field)[0].value;
            if (v === "" || !v) {
                return 0;
            }
            return parseInt(v);
        }
        return 0;
    }

    setIntValue(html, field, value) {
        if (html.find(field) && html.find(field)[0]) {
            html.find(field)[0].innerHTML = value;
        }
    }

    updateDamage(event, html) {
        let dmg = this.getIntValue(html, ".baseDamage");
        let ap = this.getIntValue(html, ".baseAP");

        dmg = parseInt(dmg);
        ap = parseInt(ap);

        let actual = dmg - Math.max(0, this.armour - ap);
        this.setIntValue(html, ".actualDamage", actual);
    }

    updateCrits(event, html, idx) {
        console.log("Update " + idx);
        if (idx === "effect") {
            this.criticalEffectRoll = event.currentTarget.value;
        } else {
            this.crits.criticals[idx].location = event.currentTarget.value;
        }
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2DamageDialog = MgT2DamageDialog;
