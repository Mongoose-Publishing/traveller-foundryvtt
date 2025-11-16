import {rollSpaceAttack, hasTrait, getTraitValue} from "../helpers/dice-rolls.mjs";
import {getSkillValue} from "../helpers/dice-rolls.mjs";
import {launchMissiles} from "./spacecraft/spacecraft-utils.mjs";
import {MGT2} from "./config.mjs";

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

        this.options.title = `${starshipActor.name} firing ${weaponMount.name}`;

        this.weaponSelect = {};
        this.weaponSelected = null;
        this.weaponItem = null;
        this.dm = isNaN(dm)?0:parseInt(dm);
        this.ranges = {};
        this.range = "medium";

        if (this.mount.type === "hardware" && this.mount?.system?.hardware?.system === "weapon") {
            let weapons = this.mount.system.hardware.weapons;
            // Could have multiple types of weapons. If so, need a select box.
            for (let w in weapons) {
                console.log(`Weapon id in mount: ${w}`);
                let wpnItem = this.starship.items.get(w);
                if (!wpnItem) {
                    ui.notifications.error(`Weapon item [${w}] does not exist`);
                    continue;
                }
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
            if (r === this.weaponItem?.system?.weapon?.spaceRange) {
                break;
            }
        }

        this.calculateTargets();
    }

    calculateTargets() {
        const user = game.users.current;
        const selected = canvas.tokens.controlled;
        const targets = user.targets;

        if (selected.length !== 1) {
            // Must have exactly one token selected.
            return;
        }
        if (targets.length < 1) {
            // We must have some selected targets.
            return;
        }
        this.TARGETS = [];

        this.attackerName = selected[0].name;
        const X = parseInt(selected[0].center.x);
        const Y = parseInt(selected[0].center.y);

        for (let token of targets) {
            let x = parseInt(token.center.x);
            let y = parseInt(token.center.y);
            const dx = Math.abs(X - x);
            const dy = Math.abs(Y - y);
            let d = Math.sqrt(dx * dx + dy * dy);
            let km =  parseInt((d / canvas.grid.size) * canvas.grid.distance);

            let range = null;
            let dm = 0;
            for (let r in MGT2.SPACE_RANGES) {
                console.log(r);
                let rangeData = MGT2.SPACE_RANGES[r];
                if (km < rangeData.distance) {
                    range = r;
                    dm = rangeData.dm;
                    break;
                }
            }

            this.TARGETS.push({
                "name": token.name,
                "distance": km,
                "uuid": token.uuid,
                "range": range,
                "rangeName": game.i18n.localize("MGT2.Spacecraft.Range."+range),
                "dm": dm
            })
        }
        this.TARGETS.sort((a, b) => {
            if (a.distance !== b.distance) {
                return a.distance - b.distance;
            } else {
                return a.name.localeCompare(b.name);
            }
        });
    }

    setRanges(html) {
        let rangeSelect = html.find(".attackDialogRange");

        let text = "";
        let haveSelected = false;
        for (let r in CONFIG.MGT2.SPACE_RANGES) {
            if (!haveSelected && r === this.weaponItem.system.weapon.spaceRange) {
                // If previous selection was a greater range, then switch to maximum range.
                this.range = r;
            }
            let selected = (this.range === r)?("selected=''"):"";
            if (selected) {
                haveSelected = true;
            }
            text += `<option value="${r}" ${selected}>${game.i18n.localize("MGT2.Item.SpaceRange." + r)} (${CONFIG.MGT2.SPACE_RANGES[r].dm})</option>`;
            if (r === this.weaponItem.system.weapon.spaceRange) {
                break;
            }
        }

        rangeSelect[0].innerHTML = text;
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
            "rollTypes": {
                "normal": game.i18n.localize("MGT2.TravellerSheet.Normal"),
                "boon": game.i18n.localize("MGT2.TravellerSheet.Boon"),
                "bane": game.i18n.localize("MGT2.TravellerSheet.Bane"),
            },
            "gunnerSkillLabel": this.gunner.getSkillLabel(this.weaponItem.system.weapon.skill, true),
            "TARGETS": this.TARGETS
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const attack = html.find("button[class='attackRoll']");
        attack.on("click", event => this.onRollClick(event, html));

        html.find(".attackDialogWeapon").click(event => this.onWeaponSelect(event, html));
        html.find(".attackDialogRange").click(event => {
            this.range = html.find(".attackDialogRange")[0].value;
        });

        this.setRanges(html);
    }

    onWeaponSelect(event, html) {
        let wpnId = $(event.currentTarget).val();

        this.weaponSelected = wpnId;
        this.weaponItem = this.starship.items.get(wpnId);
        this.setRanges(html);
    }

    async onRollClick(event, html) {
        event.preventDefault();

        let dm = parseInt(html.find("input[class='skillDialogDM']")[0].value);
        let rollType = html.find(".skillDialogRollType")[0].value;
        let range = null;
        let rangeDM = null;
        if (html.find(".attackDialogRange")[0]) {
            range = html.find(".attackDialogRange")[0].value;
            rangeDM = parseInt(CONFIG.MGT2.SPACE_RANGES[range].dm);
        }

        let options = {
            "dm": dm,
            "skill": 0,
            "range": range,
            "rangedm": rangeDM,
            "boon": rollType
        }
        let weapons = this.mount.system.hardware.weapons
        if (weapons[this.weaponItem.id].quantity > 1) {
            options.quantity = weapons[this.weaponItem.id].quantity;
        }
        if (this.weaponItem.hasTrait("missile")) {
            launchMissiles(this.starship, this.weaponItem, options);
        } else {
            rollSpaceAttack(this.starship, this.gunner, this.weaponItem, options);
        }

        this.close();
    }


    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

window.MgT2AttackDialog = MgT2AttackDialog;
