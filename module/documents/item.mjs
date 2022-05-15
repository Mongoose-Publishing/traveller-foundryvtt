
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
            skillDM += parseInt(this.actor.data.data.characteristics[item.data.weapon.characteristic].dm)
            rollAttack(this.actor, item, skillDM);
        }
    }


    if (item.type == "weapon") {
        const damage = item.data.weapon.damage;
        const range = parseInt(item.data.weapon.range);
        const char = item.data.weapon.characteristic;
        const skill = (""+item.data.weapon.skill).split(".");
        const traits = item.data.weapon.traits===""?null:(""+item.data.weapon.traits).trim().toLowerCase();
        const dmgChar = item.data.weapon.damageBonus;

        console.log("Using skill " + skill[0] + "(" + skill[1] + ")");
        console.log("Traits are [" + traits + "]");

        console.log(rollData);

        let skillValue = -3;
        let skillUsed = "Unskilled";
        if (rollData.skills[skill[0]].trained) {
            if (skill.length > 1) {
                skillValue = rollData.skills[skill[0]].specialities[skill[1]].value;
                skillUsed = rollData.skills[skill[0]].specialities[skill[1]].label;
            } else {
                skillValue = rollData.skills[skill[0]].value;
                skillUsed = rollData.skills[skill[0]].label;
            }
        } else if (rollData.skills["jackofalltrades"].trained) {
            skillValue += rollData.skills["jackofalltrades"].value;
        }
        console.log("Skill value is " + skillValue);

        let skillRoll = `${this.getDice(rollData)} + @${char} + ${skillValue}[${skillUsed}]`;
        if (traits && traits.indexOf("very bulky") > -1) {
            let str = rollData.STR;
            if (str < 1) {
                let strPenalty = 2 - str;
                skillRoll += ` - ${strPenalty}[Very Bulky]`;
            }
        } else if (traits && traits.indexOf("bulky") > -1) {
            let str = rollData.STR;
            if (str < 2) {
                let strPenalty = 1 - str;
                skillRoll += ` - ${strPenalty}[Bulky]`;
            }
        }


        const label = `<h2>Attack ${item.name}</h2>`;
        let dmg = item.data.weapon.damage;
        if (dmgChar && dmgChar.length > 0) {
            console.log("Damage characteristic is " + dmgChar);
            dmg = dmg + " + @"+dmgChar;
        }
        const roll = new Roll(dmg, this.getRollData()).evaluate({ async: false });
        let content = "";

        if (item.data.notes) {
            content += "<i>" + item.data.notes + "</i><br/><br/>";
        }

        if (traits) {
            content += `Traits: ${item.data.weapon.traits}<br/>`;
        }
        content += `Attack${this.getBoon(rollData)}: [[${skillRoll}]], Damage: [[${dmg}]]<br/><br/>`;
        if (traits && traits.indexOf("radiation") > -1) {
            content += `Radiation: [[2d6 * 20]]<br/>`;
        }

        if (range > 0) {
            content += `Range: ${range}m<br>`;

            let shortRange = parseInt(range / 4);
            let longRange = parseInt(range * 2);
            let extremeRange = parseInt(range * 4);

            content += "<table><tr><th>Short (+1)</th><th>Medium</th><th>Long (-2)</th><th>Extreme (-4)</th></tr>";
            content += `<tr><td>${shortRange}m</td><td>${range}m</td><td>${longRange}m</td><td>${extremeRange}m</td></tr>`;
            content += "</table>";
        } else {
            content += "Range: <i>Melee</i>";
        }

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
