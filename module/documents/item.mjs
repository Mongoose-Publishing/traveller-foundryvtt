
import {MgT2AttackDialog } from "../helpers/attack-dialog.mjs";
import {rollAttack} from "../helpers/dice-rolls.mjs";
import {getSkillValue} from "../helpers/dice-rolls.mjs";

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class MgT2Item extends Item {
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
        console.log("item.mjs: getRollData()");
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
        console.log("item.mjs:roll()");
        const item = this.data;

        // Initialize chat data.
        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const rollMode = game.settings.get('core', 'rollMode');
        const label = `[${item.type}] ${item.name}`;
        const rollData = this.getRollData();

        console.log("item.Roll:");

        let quickRoll = game.settings.get("mgt2", "quickRolls");
        if (event.shiftKey) {
            quickRoll = !quickRoll;
        }

        if (item.type === "weapon") {
            if (!quickRoll) {
                new MgT2AttackDialog(this.actor, item).render(true);
            } else {
                console.log("Quick Attack Roll");
                let skillDM = getSkillValue(this.actor, item.data.weapon.skill, null);
                let actorData = this.actor.system;
                if (actorData.characteristics && actorData.characteristics[item.data.weapon.characteristic]) {
                    skillDM += parseInt(this.actor.data.data.characteristics[item.data.weapon.characteristic].dm)
                }
                rollAttack(this.actor, item, skillDM);
            }
        }
    }
}
