
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
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async roll() {
        const item = this;

        let quickRoll = game.settings.get("mgt2", "quickRolls");
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
                rollAttack(this.actor, item, skillDM);
            }
        }
    }
}
