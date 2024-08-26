import {rollAttack, hasTrait, getTraitValue} from "../helpers/dice-rolls.mjs";
import {getSkillValue} from "../helpers/dice-rolls.mjs";

export class MgT2SpacecraftAttackDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/spacecraft-attack-dialog.html";
        options.width = "auto";
        options.height = "auto";
        options.title = "Attack";

        return options;
    }

    constructor(starshipActor, gunnerActor, weaponMount, dm) {
        super();
        this.starship = starshipActor;
        this.gunner = gunnerActor;
        this.mount = weaponMount;

        this.weaponSelect = {};
        this.weaponSelected = null;
        this.weaponItem = null;
        this.dm = isNaN(dm)?0:parseInt(dm);
        this.ranges = {};
        this.range = "medium";

        for (let r in CONFIG.MGT2.SPACE_RANGES ) {
            console.log(r);
            this.ranges[r] = game.i18n.localize("MGT2.Item.SpaceRange." + r) + ` (${CONFIG.MGT2.SPACE_RANGES[r].dm})`;
        }

        if (this.mount.type === "hardware" && this.mount.system.hardware.system === "weapon") {
            console.log(this.mount);
            let weapons = this.mount.system.hardware.weapons;
            // Could have multiple types of weapons. If so, need a select box.
            for (let w in weapons) {
                console.log(`Weapon id in mount: ${w}`);
                let wpnItem = this.starship.items.get(w);
                if (!this.weaponSelected) {
                    this.weaponSelected = w;
                    this.weaponItem = wpnItem;
                }
                if (weapons[w].quantity > 1) {
                    this.weaponSelect[w] = wpnItem.name + " x" + weapons[w].quantity;
                } else {
                    this.weaponSelect[w] = wpnItem.name;
                }
            }
            console.log(this.weaponSelect);
        } else {
            return;
        }

    }

    getData() {
        return {
            "starship": this.starship,
            "gunner": this.gunner,
            "weaponSelect": this.weaponSelect,
            "weaponMount": this.mount,
            "weaponSelected": this.weaponSelected,
            "weaponItem": this.weaponItem,
            "dm": this.dm,
            "ranges": this.ranges,
            "range": this.range,
            "gunnerSkillLabel": this.gunner.getSkillLabel(this.weaponItem.system.weapon.skill, true)

        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const attack = html.find("button[class='attackRoll']");
        attack.on("click", event => this.onRollClick(event, html));
    }

    async onRollClick(event, html) {
        event.preventDefault();
        console.log("onRollClick:");


        let dm = parseInt(html.find("input[class='skillDialogDM']")[0].value);
        let rollType = html.find(".skillDialogRollType")[0].value;
        let rangeDM = null;
        if (html.find(".attackDialogRange")[0]) {
            let range = html.find(".attackDialogRange")[0].value;
            rangeDM = parseInt(CONFIG.MGT2.SPACE_RANGES[range].dm);
        }

        //rollAttack(this.actor, this.weapon, this.score, dm, rollType, rangeDM, autoOption);

        this.close();
    }

    async onParryClick(event, html) {
        event.preventDefault();
        console.log("onParryClick:");

        let dm = parseInt(html.find("input[class='skillDialogDM']")[0].value);
        console.log("Parry DM is equal to " + dm);
        if (this.parryBonus) {
            dm += this.parryBonus;
        }
        let rollType = html.find(".skillDialogRollType")[0].value;
        console.log("Parry DM is equal to " + dm);

        rollAttack(this.actor, this.weapon, this.parryScore, dm, rollType, null, null, true);

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2AttackDialog = MgT2AttackDialog;
