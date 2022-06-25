
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
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  getDice(data) {
      if (data && data.settings && data.settings.rollType) {
          if (data.settings.rollType === "boon") {
              return "3d6k2";
          } else if (data.settings.rollType === "bane") {
              return "3d6kl2";
          }
      }
      return "2d6";
  }

  getBoon(data) {
      if (data && data.settings && data.settings.rollType) {
          if (data.settings.rollType === "boon") {
              return " (Boon)";
          } else if (data.settings.rollType === "bane") {
              return " (Bane)";
          }
      }
      return "";
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this.data;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;
    const rollData = this.getRollData();

    let  content = item.data.weapon.damage + "; " + item.data.weapon.range + "m";

    console.log("item.Roll:");

    let quickRoll = rollData.settings.quickRolls?true:false;
    if (event.shiftKey) {
        quickRoll = !quickRoll;
    }

    if (item.type == "weapon") {
        if (!quickRoll) {
            new MgT2AttackDialog(this.actor, item).render(true);
        } else {
            console.log("Quick Attack Roll");
            let skillDM = getSkillValue(this.actor, item.data.weapon.skill, null);
            let actorData = this.actor.data.data;
            if (actorData.characteristics && actorData.characteristics[item.data.weapon.characteristic]) {
                skillDM += parseInt(this.actor.data.data.characteristics[item.data.weapon.characteristic].dm)
            }
            rollAttack(this.actor, item, skillDM);
        }
    }
  }
}
