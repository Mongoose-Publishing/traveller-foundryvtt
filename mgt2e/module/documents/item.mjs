
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
    static ACTIVE = "ACTIVE";
    static INACTIVE = "INACTIVE";
    static DAMAGED = "DAMAGED";
    static DESTROYED = "DESTROYED";
    static RUNNING = "RUNNING";

    static SOFTWARE_TYPE = {
        "generic": {},
        "interface": {},
        "security": {},
    }

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

    async _onCreate(data, options, userId) {
        await super._onCreate(data, options, userId);
        const actor = this.parent;

        if (actor && actor.type === "traveller" && data.type === "term" && data.system.term.randomTerm) {
            // If dragging career term on a Traveller, roll the term length if it is random.
            let dice = "3D6";
            if (this.system.term.randomTerm) {
                dice = this.system.term.randomLength;
            }
            if (data.system.term.randomTerm) {
                dice = data.system.term.randomLength;
            }
            let r = await new Roll(dice, null).evaluate();
            ui.notifications.info(`Length of career '${data.name}' set to ${r.total} years`);

            this.update({"system.term.termLength": r.total });
            this.update({"system.term.randomTerm": false });
            return;
        }
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
                    rollAttack(this.actor, item, { "skillDM": skillDM });
                } else if (item.system.weapon.magazine === 0) {
                    if (this.hasTrait("oneUse")) {
                        if (item.system.quantity > 0) {
                            this.update({"system.quantity": item.system.quantity - 1});
                            rollAttack(this.actor, item, { "skillDM": skillDM });
                        }
                    } else {
                        rollAttack(this.actor, item, { "skillDM": skillDM });
                    }
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

    hasTrait(trait) {
        if (this.type === "weapon" && this.system.weapon.traits) {
            const regex = new RegExp(`(^|[, ])${trait}[^,]*($|[, ])`, 'gi');
            return this.system.weapon.traits.match(regex) != null;
        }
        return false;
    }

    useAmmo() {
        let weapon = this.system.weapon;
        if (weapon) {
            if (!isNaN(weapon.range) && parseInt(weapon.range) > 0) {
                if (weapon.magazine > 0) {
                    return true;
                }
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

    hasAdvantage(advantage) {
        if (this.type === "hardware" && this.system.hardware.advantages) {
            return this.system.hardware.advantages.indexOf(index) > -1;
        }
        return false;
    }

    getAdvantage(advantage) {
        if (this.type === "hardware" && this.system.hardware.advantages) {
            const adv = this.system.hardware.advantages;
            const regex = new RegExp(`(^|[^a-z])${advantage}[^,]*`, "g");
            const m = adv.match(regex);
            if (m) {
                console.log(m[0]);
                return parseInt(m[0].replaceAll(/[^0-9]/g, ""));
            }
        }
        return 0;
    }

    statusClick() {
        if (this.type === "hardware") {
            if (this.system.status === MgT2Item.ACTIVE) {
                this.system.status = MgT2Item.INACTIVE;
            } else if (this.system.status === MgT2Item.INACTIVE) {
                this.system.status = MgT2Item.ACTIVE;
            } else if (this.system.status === MgT2Item.DAMAGED) {
                this.system.status = MgT2Item.INACTIVE;
            } else if (this.system.status === MgT2Item.DESTROYED) {
                this.system.status = MgT2Item.INACTIVE;
            }
            this.update({"system.status": this.system.status});
        } else if (this.type === "software") {
            if (this.system.status === MgT2Item.RUNNING) {
                this.system.status = MgT2Item.INACTIVE;
            } else if (this.system.status === MgT2Item.INACTIVE) {
                this.system.status = MgT2Item.RUNNING;
            }
            this.update({"system.status": this.system.status});
        }
    }
}
