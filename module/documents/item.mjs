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


    if (item.type == "weapon") {
        const damage = item.data.weapon.damage;
        const range = item.data.weapon.range;
        const char = item.data.weapon.characteristic;
        const skill = (""+item.data.weapon.skill).split(".");

        console.log("Using skill " + skill[0] + "(" + skill[1] + ")");

        console.log(rollData);


        let skillValue = -3;
        if (rollData.skills[skill[0]].trained) {
            skillValue = rollData.skills[skill[0]].specialities[skill[1]].value;
        } else if (rollData.skills["jackofalltrades"].trained) {
            skillValue += rollData.skills["jackofalltrades"].value;
        }
        console.log("Skill value is " + skillValue);

        let skillRoll = `${this.getDice(rollData)} + @${char} + ${skillValue}[${skill[1]}]`;


        const label = `<h2>Attack ${item.name}</h2>`;
        const roll = new Roll(item.data.weapon.damage, this.getRollData()).evaluate({ async: false });
        let content = `Attack${this.getBoon(rollData)}: [[${skillRoll}]]<br/><br/>Damage: [[${item.data.weapon.damage}]]<br/><br/>Range: ${range}m`;
        ChatMessage.create({
            speaker: speaker,
            rollMode: rollMode,
            flavor: label,
            content: content
        });
        return roll;
    }

    // If a weapon
    if (item.type == "weapon") {
      let damage = item.data.weapon.damage;
      console.log("Damage is " + damage);

      // Invoke the roll and submit it to chat.
      let roll = new Roll(item.data.weapon.damage, this.getRollData()).evaluate({ async: false });

      console.log(roll);
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    } else if (!this.data.data.formula) {
    // If there's no roll data, send a chat message.
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: content
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData).roll();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }
}
