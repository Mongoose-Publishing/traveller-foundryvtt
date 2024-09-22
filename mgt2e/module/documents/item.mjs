
import {MgT2AttackDialog } from "../helpers/attack-dialog.mjs";
import {rollAttack} from "../helpers/dice-rolls.mjs";
import {getSkillValue} from "../helpers/dice-rolls.mjs";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class MgT2Item extends Item {
    static EQUIPPED = "equipped";
    static CARRIED = "carried";
    static OWNED = "owned";

    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        // As with the actor class, items are documents that can have their data
        // preparation methods overridden (such as prepareBaseData()).
        super.prepareData();
    }

    /**
     * Prepare a data object which is passed to any Roll formulas which are created related to this Item
     * @private
     */
    getRollData() {
        // If present, return the actor's roll data.
        if ( !this.actor ) return null;
        const rollData = this.actor.getRollData();
        rollData.item = foundry.utils.deepClone(this.system);

        return rollData;
    }

    /**
     * Used to do some validation when item is dropped onto an actor.
     * Not all actors support all item types.
     */
    _preCreate(data, options, userId) {
        if (this.actor) {
            console.log(`Adding item '${this.type}' to '${this.actor.type}'`);
            // This item is being dropped onto an Actor object.
            if (this.actor.type === "spacecraft") {
                if (this.type === "term" || this.type === "associate") {
                    ui.notifications.warn(game.i18n.format("MGT2.Warn.Drop.OnlyOnCharacter",
                        {item: this.name, type: this.type}));
                    return false;
                }
            } else if (this.actor.type === "vehicle") {
                if (this.type === "term" || this.type === "associate") {
                    ui.notifications.warn(game.i18n.format("MGT2.Warn.Drop.OnlyOnCharacter",
                        {item: this.name, type: this.type}));
                    return false;
                }
            } else {
                if (this.type === "cargo" || this.type === "hardware" || this.type === "role") {
                    ui.notifications.warn(game.i18n.format("MGT2.Warn.Drop.NotOnCharacter",
                        { item: this.name, type: this.type }));
                    return false;
                }
                if (this.actor.type === "npc" || this.actor.type === "creature") {
                    if (this.type === "term" || this.type === "associate") {
                        ui.notifications.warn(game.i18n.format("MGT2.Warn.Drop.CareerOnNPC"))
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async roll() {
        const item = this;

        let quickRoll = game.settings.get("mgt2e", "quickRolls");
        if (event.shiftKey) {
            quickRoll = !quickRoll;
        }

        if (item.type === "weapon") {
            if (!quickRoll) {
                new MgT2AttackDialog(this.actor, item).render(true);
            } else {
                let skillDM = getSkillValue(this.actor, item.system.weapon.skill, null);
                let actorData = this.actor.system;
                if (actorData.characteristics && actorData.characteristics[item.system.weapon.characteristic]) {
                    skillDM += parseInt(this.actor.system.characteristics[item.system.weapon.characteristic].dm)
                }
                if (item.system.weapon.magazine > 0 && item.system.weapon.ammo > 0) {
                    item.system.weapon.ammo --;
                    this.update({"system.weapon": item.system.weapon });
                    rollAttack(this.actor, item, skillDM);
                } else if (item.system.weapon.magazine === 0) {
                    rollAttack(this.actor, item, skillDM);
                } else {
                    // No Ammo.
                }
            }
        }
    }

    getWeaponTrait(trait) {
        if (this.type === "weapon" && this.system.weapon) {
            const traits = this.system.weapon.traits;
            const regex = new RegExp(`(^|[^a-z])${trait}[^,]*`, "gi");
            const m = traits.match(regex);
            if (m) {
                return m[0].replace(",", "").trim();
            }
        }
        return null;
    }

    printWeaponTraits() {
        let text = "";
        if (this.type === "weapon" && this.system.weapon) {
            const traits = this.system.weapon.traits.split(",");
            for (let t of traits) {
                const trait = t.replaceAll(/[^a-zA-Z]/g, "");
                const value = t.replaceAll(/[^0-9]/g, "");
                if (CONFIG.MGT2.WEAPONS.traits[trait]) {
                    let label = game.i18n.localize("MGT2.Item.WeaponTrait.Label." + trait);
                    if (text) {
                        text += ", ";
                    }
                    text += label;
                    if (value) {
                        text += " " + value;
                    }
                }
            }
        }
        return text;
    }

    getCargoTrait(field, code) {
        if (this.type === "cargo" && this.system.cargo) {
            const traits = this.system.cargo[field];
            const regex = new RegExp(`(^|[^a-z])${code}[^,]*`, "g");
            const m = traits.match(regex);
            if (m) {
                return m[0].replace(",", "").trim();
            }
        }
        return null;
    }

    hasCargoAvailability(code) {
        if (this.type === "cargo" && this.system.cargo) {
            const traits = this.system.cargo.availability;
            const regex = new RegExp(`(^|[^a-z])${code}[^,]*`, "g");
            if (traits.match(regex)) {
                return true;
            }
        }
        return false;
    }

    useAmmo() {
        let weapon = this.system.weapon;
        if (weapon) {
            if (!isNaN(weapon.range) && parseInt(weapon.range) > 0) {
                return true;
            }
            if (weapon.scale === "spacecraft") {
                return true;
            }
            if (weapon.scale === "vehicle") {
                return true;
            }
        }
        return false;
    }
}
