import { MgT2Item } from "../documents/item.mjs";
import { Tools } from "../helpers/chat/tools.mjs";
import {MGT2} from "../helpers/config.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MgT2Actor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

    /** @override */
    prepareBaseData() {
        // Data modifications in this step occur before processing embedded
        // documents or derived data.
        console.log(`prepareBaseData: [${this.name}]`);

        if (this.system.hits && this.type !== "traveller") {
            let hits = this.system.hits;
            if (hits.value !== (hits.max - hits.damage)) {
                hits.value = parseInt(hits.max) - parseInt(hits.damage);
            }
            hits.tmpDamage = Math.min(hits.tmpDamage, hits.damage);
        }

        for (const effect of this.effects) {
            const source = effect._source._id;
            if (effect.origin) {
                const origin = effect.origin.replaceAll(/.*Item./g, "");
                const item = this.items.get(origin);
                if (item) {
                    effect.isSuppressed = item.system.status !== MgT2Item.EQUIPPED;
                }
            }
        }
    }

    _preUpdate(changes, options, user) {
        if (this.type === "spacecraft") {
            if (changes?.system?.spacecraft?.computer) {
                let tl = this.system.spacecraft.computer.tl;
                let core = this.system.spacecraft.computer.core;
                let fib = this.system.spacecraft.computer.fib;
                let bis = this.system.spacecraft.computer.bis;

                const c = changes.system.spacecraft.computer;
                if (c.tl !== undefined) tl = c.tl;
                if (c.core !== undefined) core = c.core;

                if (core) {
                    changes.system.spacecraft.computer.processing = CONFIG.MGT2.COMPUTERS.techLevel[tl].core;
                } else {
                    changes.system.spacecraft.computer.processing = CONFIG.MGT2.COMPUTERS.techLevel[tl].computer;
                }
            }
        }
    }

    /*
    _onUpdate(changed, options, userId) {
        super._onUpdate(changed, options, userId);
    }
    */

    /**
     * Called when an attribute on a token is directly modified by the user.
     * Used for updating damage on the actor.
     */
    modifyTokenAttribute(attribute, value, isDelta, isBar) {
        if (this.type === "traveller") {
            let damage = parseInt(value);
            if (isDelta && damage < 0) {
                damage = Math.abs(damage);
                console.log("Applying " + damage);
                damage = Tools.applyDamageToCha(damage, this.system, "END");
                damage = Tools.applyDamageToCha(damage, this.system, "STR");
                damage = Tools.applyDamageToCha(damage, this.system, "DEX");
            }
            return this.update({"system.damage": this.system.damage});
        } else {
            let hits = this.system.hits;
            if (isDelta) {
                hits.damage -= parseInt(value);
            } else {
                hits.damage = hits.max - parseInt(value);
            }
            hits.value = hits.max - hits.damage;
            return this.update({"system.hits": this.system.hits });
        }
    }

    /**
     * @override
     * Augment the basic actor data with additional dynamic data. Typically,
     * you'll want to handle most of your calculated/derived data in this step.
     * Data calculated in this step should generally not exist in template.json
     * (such as ability modifiers rather than ability scores) and should be
     * available both inside and outside of character sheets (such as if an actor
     * is queried and has a roll executed directly from it).
     */
    prepareDerivedData() {
        const actorData = this;
        const flags = actorData.flags.traveller || {};

        // Make separate methods for each Actor type (traveller, npc, etc.) to keep
        // things organized.
        this._prepareTravellerData(actorData);
        this._prepareNpcData(actorData);
        this._prepareCreatureData(actorData);
    }


  /**
   * Get the characteristic modifier for a given value.
   * Values are normally 0+, with 6-8 providing a +0 modifier.
   */
  getModifier(value) {
      if (value < 1) {
          return -3;
      } else if (value < 3) {
          return -2;
      } else {
          return parseInt(value / 3) - 2;
      }
  }



    applyActiveEffect(ob1, obj2) {
        console.log("applyActiveEffect:");
        console.log(obj1);
        console.log(obj2);
    }

    _prepareEncumbrance(actorData) {
        if (!actorData.system) {
            return;
        }
        let sys = actorData.system;
        let heavyLoad = 0;

        if (sys.characteristics) {
            const ch = sys.characteristics;
            if (ch['STR']) {
                heavyLoad += parseInt(ch['STR'].current);
            }
            if (ch['END']) {
                heavyLoad += parseInt(ch['END'].current);
            }
        }
        if (sys.skills) {
            if (sys.skills['athletics'] && sys.skills['athletics'].trained) {
                const ath = sys.skills['athletics'];
                if (ath.specialities && ath.specialities.strength) {
                    heavyLoad += parseInt(ath.specialities.strength.value);
                }
                if (ath.specialities && ath.specialities.endurance) {
                    heavyLoad += parseInt(ath.specialities.endurance.value);
                }
            }
        }
        if (sys.modifiers.encumbrance.multiplierBonus) {
            let mult = 1 + parseFloat(sys.modifiers.encumbrance.multiplierBonus);
            heavyLoad *= mult;
        }
        sys.heavyLoad = heavyLoad;
        sys.maxLoad = heavyLoad * 2;
    }

    _prepareInitiative(actorData) {
        if (!actorData.system) {
            return;
        }
        const dex = parseInt(actorData.system.characteristics["DEX"].dm);
        const int = parseInt(actorData.system.characteristics["INT"].dm);

        if (!isNaN(actorData.system.initiative)) {
            actorData.system.initiative = {
                base: 0,
                value: 0
            }
        }
        actorData.system.initiative.base = Math.max(int, dex);
        actorData.system.initiative.value = actorData.system.initiative.base;

        // Also calculate Dodge ability.
        let dodge = Math.max(dex, 0);
        if (actorData.system.skills["athletics"] && actorData.system.skills["athletics"].specialities) {
            let dodgeSkill = parseInt(actorData.system.skills["athletics"].specialities["dexterity"].value);
            if (dodgeSkill > 0) {
                dodge += dodgeSkill;
            }
        }
        actorData.system.dodge = dodge;
    }

    _countSkillLevels(skillData) {
      let total = 0;
      for (var s in skillData) {
          if (skillData[s].trained) {
              total += parseInt(skillData[s].value);
              if (skillData[s].specialities) {
                  for (var sp in skillData[s].specialities) {
                      total += parseInt(skillData[s].specialities[sp].value);
                  }
              }
          }
      }
      return total;
    }

    /**
     * Prepare Character type specific data
     */
    _prepareTravellerData(actor) {
        if (actor.type !== 'traveller') return;
        console.log(`_prepareTravellerData: ${actor.name}`);

        const sys = actor.system;

        if (sys.characteristics.INT && sys.characteristics.EDU) {
            sys.totalSkills = this._countSkillLevels(sys.skills);
            sys.maxSkills = (parseInt(sys.characteristics.INT.value) +
                parseInt(sys.characteristics.EDU.value)) * 3;
        } else {
            sys.maxSkills = 0;
        }

        if (!sys.characteristics.STR || !sys.characteristics.DEX || !sys.characteristics.END) {
            return;
        }

        for (const char in sys.characteristics) {
            let value = sys.characteristics[char].value;
            if (sys.characteristics[char].augment) {
                value += parseInt(sys.characteristics[char].augment);
            }
            let dmg = 0;
            if (sys.damage && sys.damage[char]) {
                dmg = sys.damage[char].value;
                if (dmg < 0) {
                    dmg = 0;
                    sys.damage[char].value = dmg;
                }
                if (dmg > value) {
                    dmg = value;
                    sys.damage[char].value = dmg;
                }
                value -= dmg;
            }
            sys.characteristics[char].current = value;
            sys.characteristics[char].dm = this.getModifier(value);
        }

        if (sys.damage && sys.hits) {
            let hits = sys.characteristics.STR.current + sys.characteristics.DEX.current +
                sys.characteristics.END.current;
            let maxHits = sys.characteristics.STR.value + sys.characteristics.DEX.value +
                sys.characteristics.END.value;

            sys.hits.value = hits;
            sys.hits.max = maxHits;
        }
        this._prepareEncumbrance(actor);
        this._prepareInitiative(actor);
    }

    _prepareNpcData(actor) {
        if (actor.type !== 'npc') return;
        const actorData = actor.system;

        actorData.totalSkills = this._countSkillLevels(actorData.skills);
        actorData.maxSkills = (parseInt(actorData.characteristics.INT.value) +
            parseInt(actorData.characteristics.EDU.value)) * 3;

        for (const char in actorData.characteristics) {
            let value = actorData.characteristics[char].value;
            if (actorData.characteristics[char].augment) {
                value += parseInt(actorData.characteristics[char].augment);
                console.log("Augmented value is " + value);
            }
            actorData.characteristics[char].current = value;
            actorData.characteristics[char].dm = this.getModifier(value);
        }

        if (actorData.hits) {
            let maxHits = actorData.characteristics.STR.value +
                actorData.characteristics.DEX.value +
                actorData.characteristics.END.value;

            actorData.hits.max = maxHits;
            actorData.hits.value = maxHits - actorData.hits.damage;
        }
        this._prepareEncumbrance(actor);
        this._prepareInitiative(actor);
    }

    _prepareCreatureData(actor) {
        if (actor.type !== 'creature') return;

        const actorData = actor.system;

        if (actorData.hits) {
            if (!actorData.hits.damage) {
                actorData.hits.damage = 0;
            }
            actorData.hits.value = parseInt(actorData.hits.max) - parseInt(actorData.hits.damage);
        }
/*
        actorData.initiative = {
            base: 0,
            value: 0
        }
*/
        // Also calculate Dodge ability.
        let dodge = 0;
        let dodgeSkill = parseInt(actorData.skills["athletics"].specialities["dexterity"].value);
        if (dodgeSkill > 0) {
            dodge += dodgeSkill;
        }
        actorData.dodge = dodge;
    }


    /**
     * Override getRollData() that's supplied to rolls.
     */
    getRollData() {
        const data = super.getRollData();

        // Prepare traveller roll data.
        this._getTravellerRollData(data);

        return data;
    }

  /**
   * Prepare character roll data.
   */
  _getTravellerRollData(data) {
    if (this.type !== 'traveller' && this.type !== 'npc') return;

    if (!data.characteristics) {
        console.log("This Traveller has no characteristics");
        return;
    }

    for (let [k,v] of Object.entries(data.characteristics)) {
        data[k] = v.dm ?? -3;
    }

  }

  getCreatureTrait(trait) {
      if (this.type === "creature" && this.system.traits) {
          const traits = this.system.traits;
          if (traits.indexOf(trait) > -1) {
              const regex = new RegExp(`.*\(${trait}[^,$]*\).*`, "g");
              return traits.replace(regex, "$1");
          }
      }
      return null;
  }

  getUntrained() {
      let score = -3;
      if (this.system.skills["jackofalltrades"]) {
          let joat = parseInt(this.system.skills["jackofalltrades"].value);
          if (joat > 0) {
              score += joat;
          }
      }
      return score;
  }

  applyDamage(damage, options) {
      console.log(`applyDamage: [${this.name}] [${damage}]`);
      console.log(options);

      let armour = 0;
      if (this.type === "spacecraft") {
          if (options.scale !== "spacecraft") {
              damage = parseInt(damage / 10);
          }
          let armour = parseInt(this.system.spacecraft.armour);
      } else if (this.type === "npc" || this.type === "creature") {
          if (options.scale === "spacecraft") {
              damage *= 10;
          }
          if (this.system.armour) {
              armour = parseInt(data.armour.protection);
              if (options.damageType !== "") {
                  let armourData = this.system.armour;
                  if (armourData.otherTypes && armourData.otherTypes.indexOf(options.damageType) > -1) {
                      armour += armourData.otherProtection?parseInt(armourData.otherProtection):0;
                  }
              }
              armour = Math.max(0, armour);
          }
      }
      if (options.ap) {
          let ap = parseInt(options.ap);
          armour = Math.max(0, armour - ap);
      }
      damage = Math.max(0, damage - armour);

      if (options.multiplier && parseInt(options.multiplier) > 1) {
          damage *= parseInt(options.multiplier);
      }
      ui.notifications.info(game.i18n.format("MGT2.Info.Damage",
          { "actor": this.name, "damage": damage}))

      this.system.hits.damage += damage;
      this.system.hits.value = this.system.hits.max - this.system.hits.damage;
      this.update({"system.hits": this.system.hits});
  }

  getWeaponSkill(weaponItem, options) {
      let score = this.getUntrained();

      if (weaponItem && weaponItem?.system?.weapon) {
          let skill = weaponItem.system.weapon.skill;
          if (options) {
              if (!options["cha"]) {
                  options["cha"] = weaponItem.system.weapon.characteristic;
              }
          }

          score = this.getSkillValue(skill, options);
          if (options) {
              if (!options.results) {
                  options.results = {};
              }
              options.results["cha"] = weaponItem.system.weapon.characteristic;
          }
      }

      return score;
  }

  getAttackSkill(weaponItem, options) {
      if (weaponItem && weaponItem?.system?.weapon) {
          let score = this.getWeaponSkill(weaponItem, options);

          if (!isNaN(weaponItem.system.weapon.attackBonus)) {
              score += parseInt(weaponItem.system.weapon.attackBonus);
              if (options?.results) {
                  options.results["weapon"] = parseInt(weaponItem.system.weapon.attackBonus);
              }
          }
          return score;
      }
      return this.getUntrained();
  }
    getParrySkill(weaponItem, options) {
        if (weaponItem && weaponItem?.system?.weapon) {
            let score = this.getWeaponSkill(weaponItem, options);

            if (!isNaN(weaponItem.system.weapon.parryBonus)) {
                score += parseInt(weaponItem.system.weapon.parryBonus);
            }
            return score;
        }
        return this.getUntrained();
    }

    /**
     * Gets dice modifier for the given skill. Includes any bonuses for augments and
     * other modifiers on the characteristic or skill. Also includes global modifiers,
     * such as encumbrance or reaction penalties.
     *
     * @param skillId   Skill to get bonus for (skillId or skillId.specId)
     * @param options   Optional modifiers. Breakdown is returned in options.results
     * @returns {number}
     */
  getSkillValue(skillId, options) {
      let score = this.getUntrained();
      console.log(`Untrained: ${skillId} ${score}`);
      if (!options) {
          options = { "results": {} };
      } else {
          options.results = {
              "cha": null,
              "chadm": 0,
              "base": null,
              "expert": 0,
              "augmentation": 0,
              "augdm": 0,
              "bonus": 0,
              "label": this.getSkillLabel(skillId),
              "dice": "2D6"
          };
      }

      let id = skillId;
      let spId = null;
      let cha = null;
      if (skillId.indexOf(".") > -1) {
          id = skillId.split(".")[0];
          spId = skillId.split(".")[1];
      }
      if (this.system.skills[id]) {
          let skill = this.system.skills[id];
          let spec = null;
          if (spId && skill.specialities && skill.specialities[spId]) {
              spec = skill.specialities[spId];
          }
          console.log(skill);
          console.log(spec);

          // Set characteristic to use.
          if (options.cha) {
              cha = options.cha;
          } else {
              if (skill.default) {
                  cha = skill.default;
              }
              if (spec && spec.default) {
                  cha = spec.default;
              }
          }
          options.results.cha = cha;

          if (skill.trained) {
              if (spec) {
                  score = isNaN(spec.value)?0:parseInt(spec.value);
                  options.results.base = score;
                  if (!isNaN(spec.expert) && parseInt(spec.expert) > score) {
                      score = parseInt(spec.expert) - 1;
                      options.results.expert = score;
                  }
                  // Only adds if skill is trained.
                  if (!isNaN(spec.augmentation)) {
                      score += parseInt(spec.augmentation);
                  }
              } else {
                  score = isNaN(skill.value)?0:parseInt(skill.value);
                  options.results.base = score;
                  if (!isNaN(skill.expert) && parseInt(skill.expert) > score) {
                      score = parseInt(skill.expert) - 1;
                  }
                  // Only adds if skill is trained.
                  if (!isNaN(skill.augmentation)) {
                      score += parseInt(skill.augmentation);
                  }
              }
          }
          // The following are always applied. Parent and specialities stack.
          if (!isNaN(skill.bonus)) {
              score += parseInt(skill.bonus);
              options.results.bonus += parseInt(skill.bonus);
          }
          if (!isNaN(skill.augdm)) {
              score += parseInt(skill.augdm);
              options.results.augdm += parseInt(skill.augdm);
          }
          if (spec && !isNaN(spec.bonus)) {
              score += parseInt(spec.bonus);
              options.results.bonus += parseInt(spec.bonus);
          }
          if (spec && !isNaN(spec.augdm)) {
              score += parseInt(spec.augdm);
              options.results.augdm += parseInt(spec.augdm);
          }
      }

      // Apply global modifiers.
      if (!isNaN(options.dm)) {
          score += parseInt(options.dm);
          options.results["dm"] = parseInt(options.dm);
      }
      if (cha && this.system[cha]) {
          score += parseInt(this.system[cha]);
          options.results["chadm"] = parseInt(this.system[cha]);
      }

      return score;
  }

  getSkillIcon(skillId) {
      let skill = this.system.skills[skillId.replaceAll(/\..*/g, "")];
      if (!skill) {
          return "systems/mgt2e/icons/skills/untrained.svg";
      }
      if (skill.icon) {
          return skill.icon;
      }
      return `systems/mgt2e/icons/skills/${skillId}.svg`;
  }

  getSkillLabel(skill, showValue) {
      if (!skill) {
          return "";
      }
      let skillId = skill;
      let specId = null;
      if (skill.indexOf(".") > -1) {
          skillId = skill.replaceAll(/\..*/g, "");
          specId = skill.replaceAll(/.*\./g, "");
      }
      let text = "";
      let spec = null;
      skill = this.system.skills[skillId];
      if (!skill) {
          return "";
      }
      if (skill.label) {
          text = skill.label;
      } else {
          text = game.i18n.localize("MGT2.Skills." + skillId);
          if (text.indexOf("MGT2.Skills") === 0) {
              text = skillId;
          }
      }
      if (specId) {
          if (skill.specialities && skill.specialities[specId]) {
              spec = skill.specialities[specId];
              if (spec.label) {
                  text += ` (${spec.label})`;
              } else {
                let label =  game.i18n.localize("MGT2.Skills." + specId);
                if (label.indexOf("MGT2.Skills") === 0) {
                    text += ` (${specId})`;
                } else {
                    text += ` (${label})`;
                }
              }
          }
      }

      if (showValue) {
          let value = this.getUntrained();
          if (skill.trained && spec) {
              value = spec.value;
          } else if (skill.trained) {
              value = skill.value;
          }
          text += ` ${value}`;
      }

      return text;
  }



}
