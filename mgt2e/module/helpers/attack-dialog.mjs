import {rollAttack, hasTrait, getTraitValue, skillLabel} from "../helpers/dice-rolls.mjs";
import {getSkillValue} from "../helpers/dice-rolls.mjs";

export class MgT2AttackDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/attack-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = "Attack";

        return options;
    }

    constructor(actor, weapon) {
        super();
        this.actor = actor;
        this.weapon = weapon;

        const data = actor.system;
        this.data = data;
        this.cha = this.weapon.system.weapon.characteristic;
        this.skill = this.weapon.system.weapon.skill.split(".")[0];
        this.speciality = this.weapon.system.weapon.skill.split(".")[1];
        this.hasPsi = false;
        this.auto = 1;
        this.fullAuto = 1; // Full auto uses three times the ammo.
        this.rangeUnit = "m";
        if (hasTrait(this.weapon.system.weapon.traits, "auto")) {
            this.auto = getTraitValue(this.weapon.system.weapon.traits, "auto");
        }
        this.currentAmmo = weapon.useAmmo()?this.weapon.system.weapon.ammo:0;
        this.outOfAmmo = false;
        if (weapon.useAmmo() && this.weapon.system.weapon.magazine > 0) {
            this.fullAuto = Math.min(this.auto, parseInt(this.currentAmmo / 3));
            this.auto = Math.min(this.auto, this.currentAmmo);
            if (this.auto === 0) {
                this.outOfAmmo = true;
            }
        } else if (weapon.system.quantity < 1) {
            this.outOfAmmo = true;
        }
        this.AUTO = {};
        this.AUTO["single"] = `Single Shot`;
        this.AUTO["burst"] = `Burst (+${this.auto})`;
        this.AUTO["full"] = `Full Auto (x${this.fullAuto})`;

        // Work out what the skill bonus is.
        this.score = parseInt(getSkillValue(this.actor, this.skill, this.speciality));
        this.parryScore = this.score;
        if (data.characteristics && data.characteristics[this.cha]) {
            this.score += parseInt(data.characteristics[this.cha].dm);
        } else {
            this.cha = null;
        }

        // Work out the damage.
        this.damage = weapon.system.weapon.damage;
        this.damage = this.damage.toUpperCase().replace(/D6/, "D");
        this.damage = this.damage.replace(/ *\* *10/, "D");

        this.range = parseInt(this.weapon.system.weapon.range);
        console.log("Range: " + this.range);
        this.melee = true;
        if (this.range > 0) {
            this.melee = false;
            this.shortRange = parseInt(this.range / 4);
            this.longRange = parseInt(this.range * 2);
            this.extremeRange = parseInt(this.range * 4);
            if (weapon.system.weapon.scale === "vehicle") {
                this.rangeUnit = "km";
            }

            this.RANGES = {};
            this.RANGES["+1"] = `Short (${this.shortRange}${this.rangeUnit}, +1)`;
            this.RANGES["+0"] = `Medium (${this.range}${this.rangeUnit}, +0)`;
            this.RANGES["-2"] = `Long (${this.longRange}${this.rangeUnit}, -2)`;
            this.RANGES["-4"] = `Extreme (${this.extremeRange}${this.rangeUnit}, -4)`;
        } else {
            this.parryBonus = weapon.system.weapon.parryBonus;
            if (!this.parryBonus) {
                this.parryBonus = 0;
            }
        }

        if (weapon.hasTrait("psiDmg") || weapon.hasTrait("psiAp")) {
            this.hasPsi = true;

            if (actor.system.characteristics["PSI"] && actor.system.characteristics["PSI"].current > 0) {
                let psi = actor.system.characteristics["PSI"];

                this.PSI = {};
                for (let i=0; i <= psi.current; i++) {
                    this.PSI[i] = `PSI ${i}`;
                }
                this.PSI_DM = psi.dm;
                this.psiDmgBonus = getTraitValue(weapon.system.weapon.traits, "psiDmg");
                this.psiApBonus = getTraitValue(weapon.system.weapon.traits, "psiAp");

                if (this.PSI_DM > 0) {
                    this.PSI_BONUS_DMG = this.PSI_DM * this.psiDmgBonus;
                    this.PSI_BONUS_AP = this.PSI_DM * this.psiApBonus;
                } else {
                    this.PSI_BONUS_DMG = 0;
                    this.PSI_BONUS_AP = 0;
                }
            }
        }

        this.ROLLTYPES = {
            "normal": game.i18n.localize("MGT2.TravellerSheet.Normal"),
            "boon": game.i18n.localize("MGT2.TravellerSheet.Boon"),
            "bane": game.i18n.localize("MGT2.TravellerSheet.Bane")
        }


        this.options.title = this.weapon.name;
        if (this.skill) {
        }

        this.calculateTargets();
    }

    async calculateTargets() {
        const user = game.users.current;
        const selected = canvas.tokens.controlled;
        const targets = user.targets;

        console.log(selected);
        console.log(targets);

        if (selected.length !== 1) {
            // We must have exactly one token selected. This is the current user.
            return;
        }
        console.log("We have selected 1 token");

        if (targets.length < 1) {
            // We must also have some targets selected.
            return;
        }
        this.TARGETS = [];

        this.attackerName = selected[0].name;
        const X = parseInt(selected[0].center.x);
        const Y = parseInt(selected[0].center.y);
        console.log("Me: " + X + ", " + Y);

        for (let token of targets) {
            let x = parseInt(token.center.x);
            let y = parseInt(token.center.y);
            let d = 0;
            const dx = Math.abs(X - x);
            const dy = Math.abs(Y - y);

            if (true) {
                // True euclidean distance.
                d = Math.sqrt(dx * dx + dy * dy);
            } else {
                const diagonal = Math.min( dx, dy);
                const straight = Math.abs(dx - dy);
                d = diagonal + straight;
            }
            let metres = (d / canvas.grid.size) * canvas.grid.distance;
            metres = parseFloat(metres.toFixed(1));
            console.log(token.name + " " + metres + "m");

            this.TARGETS.push({ "name": token.name, "distance": metres});
            this.TARGETS.sort((a, b) => {
                if (a.distance !== b.distance) {
                    return a.distance - b.distance;
                } else {
                    return a.name.localeCompare(b.name);
                }
            });
        }

    }


    getData() {
        return {
            "actor": this.actor,
            "data": this.data,
            "weapon": this.weapon,
            "melee": this.melee,
            "damage": this.damage,
            "range": this.range,
            "shortRange": this.shortRange,
            "longRange": this.longRange,
            "extremeRange": this.extremeRange,
            "rangeUnit": this.rangeUnit,
            "hasAuto": this.auto > 1,
            "auto": this.auto,
            "dm": 0,
            "score": this.score,
            "cha": this.cha,
            "skill": skillLabel(this.data.skills[this.skill]),
            "speciality": (this.skill && this.skill.specialities)?skillLabel(this.data.skills[this.skill].specialities[this.speciality]):"",
            "dicetype": "normal",
            "parryBonus": this.parryBonus,
            "parryScore": this.parryScore,
            "outOfAmmo": this.outOfAmmo,
            "currentAmmo": this.currentAmmo,
            "AUTO": this.AUTO,
            "PSI": this.PSI,
            "PSI_DM": this.PSI_DM,
            "PSI_BONUS_DMG": this.PSI_BONUS_DMG,
            "PSI_BONUS_AP": this.PSI_BONUS_AP,
            "psiDmgBonus": this.psiDmgBonus,
            "psiApBonus": this.psiApBonus,
            "RANGES": this.RANGES,
            "ROLLTYPES": this.ROLLTYPES,
            "attackerName": this.attackerName,
            "TARGETS": this.TARGETS
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const attack = html.find("button[class='attackRoll']");
        attack.on("click", event => this.onRollClick(event, html));
        const parry = html.find("button[class='parryRoll']");
        parry.on("click", event => this.onParryClick(event, html));
    }

    async onRollClick(event, html) {
        event.preventDefault();

        let dm = parseInt(html.find("input[class='skillDialogDM']")[0].value);
        let rollType = html.find(".skillDialogRollType")[0].value;
        let rangeDM = null;
        if (html.find(".attackDialogRange")[0]) {
            rangeDM = parseInt(html.find(".attackDialogRange")[0].value);
        }
        let autoOption = "single";
        if (html.find(".attackDialogAuto")[0]) {
            autoOption = html.find(".attackDialogAuto")[0].value;
        }

        let psiPoints = 0;
        if (html.find(".attackDialogPsi")[0]) {
            psiPoints = parseInt(html.find(".attackDialogPsi")[0].value);
        }

        if (psiPoints > 0) {
            if (!this.actor.system.damage["PSI"]) {
                this.actor.system.damage["PSI"] = { "value": 0 };
            }
            this.actor.system.damage["PSI"].value += psiPoints;
            this.actor.update({"system.damage": this.actor.system.damage});
        }


        let shotsFired = 1;
        if (this.weapon.useAmmo()) {
            if (this.outOfAmmo) {
                autoOption = "noammo";
            } else {
                if (autoOption === "full") {
                    shotsFired = this.fullAuto;
                    this.weapon.system.weapon.ammo -= shotsFired * 3;
                } else if (autoOption === "burst") {
                    shotsFired = this.auto;
                    this.weapon.system.weapon.ammo -= shotsFired;
                } else {
                    this.weapon.system.weapon.ammo -= shotsFired;
                }
                this.weapon.update({"system.weapon": this.weapon.system.weapon});
            }
        } else if (hasTrait(this.weapon.system.weapon.traits, "oneUse")) {
            if (this.weapon.system.quantity > 0) {
                this.weapon.update({"system.quantity": this.weapon.system.quantity - 1});
            }
        }

        let attackOptions = {
            "skillDM": this.score,
            "dm": dm,
            "rollType": rollType,
            "rangeDM": rangeDM,
            "autoOption": autoOption,
            "isParry": false,
            "shotsFired": shotsFired,
            "psiDM": this.PSI_DM,
            "psiPoints": psiPoints
        };

        rollAttack(this.actor, this.weapon, attackOptions);
        //rollAttack(this.actor, this.weapon, this.score, dm, rollType, rangeDM, autoOption, false, shotsFired);

        this.close();
    }

    async onParryClick(event, html) {
        event.preventDefault();

        let dm = parseInt(html.find("input[class='skillDialogDM']")[0].value);
        if (this.parryBonus) {
            dm += this.parryBonus;
        }
        let rollType = html.find(".skillDialogRollType")[0].value;

        let attackOptions = {
            "skillDM": this.parryScore,
            "dm": dm,
            "rollType": rollType,
            "isParry": true
        }

        rollAttack(this.actor, this.weapon, attackOptions);
        //rollAttack(this.actor, this.weapon, this.parryScore, dm, rollType, null, null, true);

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2AttackDialog = MgT2AttackDialog;
