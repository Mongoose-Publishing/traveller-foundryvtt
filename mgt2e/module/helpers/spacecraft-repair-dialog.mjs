import {hasTrait} from "../helpers/dice-rolls.mjs";
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
    }


    getData() {
        return {
            "actor": this.actorShip,
            "data": this.data,
            "shipCriticals": this.shipCriticals,
            "shipDamage": this.shipDamage
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const roll = html.find("button[class='damageDone']");
        roll.on("click", event => this.doneClick(event, html));

        const dmg = html.find(".baseDamage");
        dmg.on("change", event => this.updateDamage(event, html));

        const ap = html.find(".baseAP");
        ap.on("change", event => this.updateDamage(event, html));

        const critList = html.find(".criticalSelect");
        critList.on("change", event => this.updateCrits(event, html, critList.data("idx")));

        html.find(".apply-button").click(ev => {
           this.applyDamage(ev, html);
        });
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
        if (html.find(field) && html.find(field)[0] && html.find(field)[0].value) {
            html.find(field)[0].value = value;
        }
    }

    updateDamage(event, html) {
        console.log("Was updated");

        let dmg = this.getIntValue(html, ".baseDamage");
        let ap = this.getIntValue(html, ".baseAP");

        dmg = parseInt(dmg);
        ap = parseInt(ap);

        let actual = dmg - Math.max(0, this.armour - ap);
        this.setIntValue(html, ".actualDamage",actual);
    }

    updateCrits(event, html, idx) {
        console.log("Update " + idx);
        if (idx === "effect") {
            this.criticalEffectRoll = event.currentTarget.value;
        } else {
            this.crits.criticals[idx].location = event.currentTarget.value;
        }
    }

    async doneClick(event, html) {
        console.log("doneClick:");
        event.preventDefault();
        let damage = this.actualDamage;
        console.log(this.crits);

        let critEffect = html.find(".criticalEffectSelect");
        if (critEffect && critEffect[0]) {
            this.criticalEffectRoll = critEffect[0].value;
        }

        let critList = html.find(".criticalSelect");
        for (let c = 0; c < critList.length; c++) {
            if (this.crits.criticals[c]) {
                this.crits.criticals[c].location = critList[c].value;
            }
        }

        // Apply Criticals
        if (this.crits?.criticals) {
            for (let c = 0; c < this.crits.criticals.length; c++) {
                let location = this.crits.criticals[c].location;
                let severity = this.crits.criticals[c].severity;
                console.log(`Apply crit ${c} to ${location} severity ${severity}`);
                await this.actor.setCriticalLevel(location, severity);
            }
        }

        // Apply critical effect
        if (this.crits?.effectCrit) {
            await this.actor.setCriticalLevel(this.criticalEffectRoll, this.crits.effectSeverity);
        }

        // Apply raw damage
        this.actor.applyActualDamageToSpacecraft(damage, this.damageOptions);
        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2DamageDialog = MgT2DamageDialog;
