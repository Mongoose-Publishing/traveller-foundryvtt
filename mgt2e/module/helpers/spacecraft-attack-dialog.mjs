import {rollSpaceAttack, hasTrait, getTraitValue} from "../helpers/dice-rolls.mjs";
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

        if (!this.mount) {
            ui.notifications.error(game.i18n.localize("MGT2.Error.NoWeaponMount"));
            return;
        }

        this.weaponSelect = {};
        this.weaponSelected = null;
        this.weaponItem = null;
        this.dm = isNaN(dm)?0:parseInt(dm);
        this.ranges = {};
        this.range = "medium";

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
        for (let r in CONFIG.MGT2.SPACE_RANGES ) {
            this.ranges[r] = game.i18n.localize("MGT2.Item.SpaceRange." + r) + ` (${CONFIG.MGT2.SPACE_RANGES[r].dm})`;
            if (r === this.weaponItem.system.weapon.spaceRange) {
                break;
            }
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
        let range = null;
        let rangeDM = null;
        if (html.find(".attackDialogRange")[0]) {
            range = html.find(".attackDialogRange")[0].value;
            rangeDM = parseInt(CONFIG.MGT2.SPACE_RANGES[range].dm);
        }

        let options = {
            "DM": dm,
            "skill": 0,
            "range": range,
            "rangeDM": rangeDM,
            "rollType": rollType
        }

        rollSpaceAttack(this.starship, this.gunner, this.weaponItem, options);

        this.close();
    }


    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2AttackDialog = MgT2AttackDialog;
