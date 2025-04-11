import { MgT2Item } from "../documents/item.mjs";
import { Tools } from "../helpers/chat/tools.mjs";
import {MGT2} from "../helpers/config.mjs";
import {MgT2DamageDialog} from "../helpers/damage-dialog.mjs";
import {getTraitValue, hasTrait, isNonZero, isNumber, skillLabel} from "../helpers/dice-rolls.mjs";
import {MgT2SpacecraftDamageDialog} from "../helpers/spacecraft-damage-dialog.mjs";
import {setSpacecraftCriticalLevel} from "../helpers/spacecraft/criticals.mjs";

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
                const item = fromUuidSync(effect.origin);
                if (item) {
                    //effect.isSuppressed = (item.system.status !== MgT2Item.EQUIPPED);
                }
            }
        }
    }

    async _preUpdate(changes, options, user) {
        if (this.type === "spacecraft") {
            if (changes?.system?.spacecraft?.dtons) {
                let dtons = parseInt(changes.system.spacecraft.dtons);
                if (dtons < 1) {
                    dtons = changes.system.spacecraft.dtons = 1;
                }
                if (!changes.system.modifiers) {
                    changes.system.spacecraft.modifiers = {
                        baseEvadeDM: 0,
                        signature: 0,
                        stealth: 0
                    };
                }
                let sizeDM = Math.min(6, parseInt(dtons / 1000));
                //changes.system.spacecraft.combat.sizeDM = sizeDM;
                //await this.setFlag("mgt2e", "sizeDM", sizeDM);

                if (dtons < 100) {
                    changes.system.spacecraft.skill = "pilot.smallCraft";
                } else if (dtons <= 5000) {
                    changes.system.spacecraft.skill = "pilot.spacecraft";
                } else {
                    changes.system.spacecraft.skill = "pilot.capitalShips";
                }
            }
        }
    }

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
        this._prepareSpacecraftData(actorData);
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

        if (typeof actorData.system.initiative === "number") {
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
              total += (skillData[s].value>0)?parseInt(skillData[s].value):0;
              if (skillData[s].specialities) {
                  for (var sp in skillData[s].specialities) {
                      total += (skillData[s].specialities[sp].value>0)?parseInt(skillData[s].specialities[sp].value):0;
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

        const sys = actor.system;
        if (sys.characteristics.INT && sys.characteristics.EDU) {
            sys.totalSkills = this._countSkillLevels(sys.skills);
            sys.maxSkills = (parseInt(sys.characteristics.INT.value) +
                Number(sys.characteristics.EDU.value)) * 3;
        } else {
            sys.maxSkills = 0;
        }

        // In case someone has replaced the characteristics.
        if (!sys.characteristics.STR || !sys.characteristics.DEX || !sys.characteristics.END) {
            return;
        }

        for (const char in sys.characteristics) {
            let value = sys.characteristics[char].value;
            if (sys.characteristics[char].augment) {
                value += Number(sys.characteristics[char].augment);
            }
            if (sys.characteristics[char].min) {
                value = Math.max(value, Number(sys.characteristics[char].min));
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
            if (actorData.characteristics[char].min) {
                value = Math.max(value, Number(actorData.characteristics[char].min));
            }
            actorData.characteristics[char].current = value;
            actorData.characteristics[char].dm = this.getModifier(value);
        }

        if (actorData.hits && actorData.settings.autoHits) {
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

    _prepareSpacecraftData(actor) {
        if (actor.type !== "spacecraft") return;
        const actorData = actor.system;

        if (!actorData.spacecraft.combat) {
            actorData.spacecraft.combat = {
                "sizeDM": Math.min(6, parseInt(actorData.spacecraft.dtons / 1000)),
                "evadeThrustUsed": 0,
                "evadeDM": 0,
                "gunnerDM": 0
            }
        } else {
            //actorData.spacecraft.combat.sizeDM = Math.min(6, parseInt(actorData.spacecraft.dtons / 1000));
        }
        if (!actorData.initiative) {
            actorData.initiative = {
                "base": 0,
                "value": 0
            }
        }
        let init = actorData.initiative;
        init.base = parseInt(actorData.spacecraft.mdrive) + parseInt(actorData.spacecraft.rdrive);
        init.value = parseInt(init.base);

        if (this.getFlag("mgt2e","initPilotDM")) {
            init.value += parseInt(this.getFlag("mgt2e", "initPilotDM"));
        }
        if (this.getFlag("mgt2e","initTacticsDM")) {
            init.value += parseInt(this.getFlag("mgt2e", "initTacticsDM"));
        }
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

  hasCreatureTrait(trait) {
    if (this.type === "creature" && this.system.traits) {
      const traits = this.system.traits;
      if (traits.indexOf(trait) > -1) {
        return true;
      }
    }
    return false;
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

  applyDamageToPerson(damage, options) {
      console.log(`******** ACTOR [${this.name}] ********`);
      console.log(`applyDamageToPerson: Damage ${damage}`);

      let armour = 0;
      let armourText = ""
      let radiationDamage = options.radiation ? options.radiation : 0;
      options.armour = 0;

      // Check for characteristic damage
      let damageType = options.damageType ? options.damageType : "standard";
      if (this.system.characteristics[damageType]) {
          // Damage is to a characteristic. Skip usual armour stuff.
          options.ap = 0;
          options.armour = 0;
          options.finalArmour = 0;
      } else {
          if (this.system.armour && isNonZero(this.system.armour.protection)) {
              armour = parseInt(this.system.armour.protection);
              if (!isNumber(armour)) {
                  armour = 0;
              }
              options.armour = armour;
              armourText = game.i18n.localize("MGT2.Armour.Protection") + " " + armour + " ";
              armour = Math.max(0, armour);
              // Halve protection value if armour is archaic and weapon TL is higher.
              if (parseInt(this.system.armour.archaic) === 1 && options.ranged) {
                  if (parseInt(options.tl) > parseInt(this.system.tl)) {
                      armour = parseInt((armour + 1) / 2);
                      armourText += `(${game.i18n.localize("MGT2.Armour.Archaic")}) `;
                  }
              }
          }
          if (this.system.armour && options.damageType !== "") {
              let armourData = this.system.armour;
              if (armourData.otherTypes && armourData.otherTypes.indexOf(options.damageType) > -1) {
                  let otherProt = armourData.otherProtection ? parseInt(armourData.otherProtection) : 0;
                  if (otherProt > 0) {
                      armour += otherProt;
                      armourText += `${options.damageType} + ${otherProt} `;
                  }
              }
          }
          // Look for active weapons which provide protection.
          for (let i of this.items) {
              if (i.type === "weapon" && i.system.status === MgT2Item.EQUIPPED) {
                  if (hasTrait(i.system.weapon.traits, "protection")) {
                      let value = getTraitValue(i.system.weapon.traits, "protection");
                      if (value > 0) {
                          armour += value;
                          armourText += `${i.name} +${value} `;
                      }
                  }
              } else if (i.type === "armour" && i.system.status === MgT2Item.EQUIPPED) {
                  if (i.system.armour.psi === "1") {
                      // Is Psi enhanced armour being worn?
                      let psi = this.system.characteristics["PSI"].current;
                      if (psi > 0) {
                          psi = parseInt((psi + 1) / 2);
                          armour += psi;
                          armourText += `PSI +${psi} `;
                      }
                  }
              }
          }
          // Finally, any cover options?
          if (this.getFlag("mgt2e", "inCover")) {
              const coverBonus = parseInt(this.getFlag("mgt2e", "inCover"));
              if (coverBonus > 0) {
                  armourText += `Cover +${coverBonus} `;
                  armour += coverBonus;
              }
          }
          // Check for radiation damage.
          if (radiationDamage > 0 && this.system.armour && isNonZero(this.system.armour.rad)) {
              options.armourRads = Number(this.system.armour.rad);
              radiationDamage = Math.max(0, Number(radiationDamage - options.armourRads));
          }

          options.finalArmour = armour;
          options.armourText = armourText;

          if (options.ap) {
              // If AP has already been calculated, use that.
              armour = Math.max(0, armour - options.ap);
          } else if (hasTrait(options.traits, "ap")) {
              let ap = parseInt(getTraitValue(options.traits, "ap"));
              armour = Math.max(0, armour - ap);
          } else if (hasTrait(options.traits, "loPen")) {
              let loPen = parseInt(getTraitValue(options.traits, "loPen"));
              if (loPen > 1) {
                  armour *= loPen;
              }
          }
          damage = Math.max(0, damage - armour);
          if (options.multiplier && parseInt(options.multiplier) > 1) {
              damage *= parseInt(options.multiplier);
          }
          if (damage < 1 && radiationDamage < 1) {
              // No damage to be applied.
              ui.notifications.info(
                  game.i18n.format("MGT2.Attack.DamageBounce",
                      {"target": this.name}
                  )
              );
              return;
          }
      }

      if (this.type === "traveller") {
          // This is a Traveller, so more complicated.
          if (options.noUI) {
              this.applyActualDamageToTraveller(damage, options);
          } else {
              new MgT2DamageDialog(this, damage, options).render(true);
          }
      } else {
          this.applyActualDamageToPerson(damage, options);
      }
  }

  applyActualDamageToTraveller(damage, options) {
      let stun = false;
      let stuns = 0;
      if (hasTrait(options.traits, "stun")) {
          stun = true;
      }
      console.log(damage);
      console.log(options);

      if (options.directChaDamage) {
          // Damage it to be applied to specific characteristics, not
          // using the usual END/STR/DEX chain.
          for (let c in options.characteristics) {
              if (!this.system.damage[c]) {
                  this.system.damage[c] = { value: 0 };
              }
              this.system.damage[c].value += options.characteristics[c];
              this.system.damage[c].value = Math.min(this.system.damage[c].value, this.system.characteristics[c].value);
          }
          this.update({"system.damage": this.system.damage});
          return;
      }

      if (options.actualRadiation > 0) {
          this.system.rads += options.actualRadiation;
          this.update({ "system.rads": this.system.rads });
      }

      if (stun) {
          if (options.characteristics) {
              this.system.damage.END.value += parseInt(options.characteristics.END);
          } else {
              this.system.damage.END.value += parseInt(damage);
          }
          if (this.system.damage.END.value > this.system.characteristics.END.value) {
              stuns = this.system.damage.END.value - this.system.characteristics.END.value;
              this.system.damage.END.value = this.system.characteristics.END.value;
          }
      } else {
          let needsFirstAid = false;
          if (options.characteristics) {
              // Apply specific damage to each characteristic.
              this.system.damage.STR.value += parseInt(options.characteristics.STR);
              this.system.damage.DEX.value += parseInt(options.characteristics.DEX);
              this.system.damage.END.value += parseInt(options.characteristics.END);

              let totalDamage = options.characteristics.STR + options.characteristics.DEX + options.characteristics.END;
              ui.notifications.info(game.i18n.format("MGT2.Info.Damage",
                  {"actor": this.name, "damage": totalDamage}))

              if (totalDamage > 0) {
                  needsFirstAid = true;
              }
          } else {
              // Split damage across characteristics.
              let dmgData = this.system.damage;
              let chaData = this.system.characteristics;
              let remaining = damage;
              if (remaining > 0) {
                  needsFirstAid = true;
              }

              if (dmgData.END.value < chaData.END.value) {
                  remaining = Tools.applyDamageToCha(remaining, this.system, "END");
              }
              if (remaining > 0) {
                  let str = this.system.characteristics.STR.current;
                  if (str <= this.system.characteristics.DEX.current && str > remaining) {
                      remaining = Tools.applyDamageToCha(remaining, this.system, "STR");
                      Tools.applyDamageToCha(remaining, this.system, "DEX");
                  } else {
                      remaining = Tools.applyDamageToCha(remaining, this.system, "DEX");
                      Tools.applyDamageToCha(remaining, this.system, "STR");
                  }
              }
              ui.notifications.info(game.i18n.format("MGT2.Info.Damage",
                  {"actor": this.name, "damage": damage}))

          }
          if (needsFirstAid) {
              this.setFlag("mgt2e", "needsFirstAid", true);
          }
      }

      for (let c of [ "STR", "DEX", "END"]) {
          this.system.damage[c].value = Math.min(this.system.damage[c].value, this.system.characteristics[c].value);
      }
      this.update({"system.damage": this.system.damage });
  }

    /**
     * Damage after armour and multiplication.
     * @param damage    Actual damage to be applied.
     * @param options   List of options.
     */
  applyActualDamageToPerson(damage, options) {
      let stun = false;
      if (hasTrait(options.traits, "stun")) {
          stun = true;
      }
      let hits = this.system.hits;
      console.log(hits);

      if (stun) {
          console.log("STUNS");
          if (!hits.tmpDamage) {
              hits.tmpDamage = 0;
          }
          let limit = parseInt(hits.max / 3 + 2);
          let stuns = 0;
          if (this.system.characteristics?.END?.value) {
              limit = this.system.characteristics.END.value;
          }
          // How many new stuns are over the END limit?
          if (hits.tmpDamage > limit) {
              stuns = damage;
          } else if (hits.tmpDamage + damage > limit) {
              stuns = damage - (limit - hits.tmpDamage);
          }

          hits.damage += (damage - stuns);
          hits.tmpDamage += (damage - stuns);
          if (stuns > 0) {
              this.setFlag("mgt2e", "stunned", true);
              this.setFlag("mgt2e", "stunnedRounds",
                  this.getFlag("mgt2e", "stunnedRounds") ?
                      parseInt(this.getFlag("mgt2e", "stunnedRounds")) + stuns : stuns
              );
          }
      } else {
          hits.damage += damage;
      }
      hits.value = hits.max - hits.damage;
      this.update({"system.hits": this.system.hits});
  }

  applyDamageToSpacecraft(damage, options) {
      if (hasTrait(options.traits, "stun")) {
          ui.notifications.info(game.i18n.format("MGT.Info.DamageMsg.SpacecraftNoStun"));
          return;
      }
      let armour = parseInt(this.system.spacecraft.armour);
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

      // Apply the damage to the spacecraft.
      options.originalDamage = this.system.hits.damage;

      new MgT2SpacecraftDamageDialog(this, damage, options).render(true);
  }

    /**
     * Damage after armour and other modifiers
     */
  applyActualDamageToSpacecraft(damage, options) {
      console.log(`applyActualDamageToSpacecraft: [${damage}]`);
        if (damage < 1) {
            return;
        }
        this.system.hits.damage += damage;
        this.system.hits.value = this.system.hits.max - this.system.hits.damage;
        this.update({"system.hits": this.system.hits});
  }

  applyDamageToVehicle(damage, options) {
      if (hasTrait(options.traits, "stun")) {
          ui.notifications.info(game.i18n.format("MGT.Info.DamageMsg.VehicleNoStun"));
          return;
      }

      let armour = 0;
      if (this.system.vehicle.armour && isNonZero(this.system.vehicle.armour.front)) {
          armour = parseInt(this.system.vehicle.armour.front);
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

  applyDamage(damage, options, multiSelect) {
      console.log(`applyDamage: [${this.name}] [${damage}] [${multiSelect?"multi-select":"single"}]`);
      console.log(options);

      if (this.type === "spacecraft") {
          if (options.scale !== "spacecraft") {
              damage = parseInt(damage / 10);
          }
          this.applyDamageToSpacecraft(damage, options);
      } else if (this.type === "vehicle") {
          if (options.scale === "spacecraft") {
              damage *= 10;
          }
          this.applyDamageToVehicle(damage, options);
      } else if (this.type === "creature") {
          // Creatures can have special traits which modify damage.
          if (this.hasCreatureTrait("gigantic")) {
              if (options.scale !== "spacecraft") {
                  damage = parseInt(damage / 10);
              }
          } else if (this.hasCreatureTrait("energy")) {
              damage = 0;
          }
          if (this.hasCreatureTrait("gossamer") && options.minimumDamage) {
              damage = options.minimumDamage;
          } else if (this.hasCreatureTrait("dispersed") && options.reducedDamage) {
              if (options.damageType === "fire" || options.damageType === "cutting") {
                  // Normal damage.
              } else {
                  damage = options.reducedDamage;
              }
          }
          this.applyDamageToPerson(damage, options);
      } else if (this.type === "traveller" || this.type === "npc") {
          if (options.scale === "spacecraft") {
              damage *= 10;
              // TODO: Possibly also add blast effects.
          }
          this.applyDamageToPerson(damage, options);
      } else {
          // Don't apply damage to anything else.
      }
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

          if (isNonZero(weaponItem.system.weapon.attackBonus)) {
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

            if (isNonZero(weaponItem.system.weapon.parryBonus)) {
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
              "dice": "2D6",
              "addcha": false
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
                  score = isNonZero(spec.value)?parseInt(spec.value):0;
                  options.results.base = score;

                  if (isNonZero(spec.expert) && (cha === "INT" || cha === "EDU")) {
                      score = Math.max(score + 1, parseInt(spec.expert) - 1);
                      options.results.expert = spec.expert;
                  }
                  // Only adds if skill is trained.
                  if (isNonZero(spec.augmentation)) {
                      score += parseInt(spec.augmentation);
                  }
              } else {
                  score = isNonZero(skill.value)?parseInt(skill.value):0;
                  options.results.base = score;
                  if (isNonZero(skill.expert) && (cha === "INT" || cha === "EDU")) {
                      score = Math.max(score + 1, parseInt(skill.expert) - 1);
                      options.results.expert = skill.expert;
                  }
                  // Only adds if skill is trained.
                  if (isNonZero(skill.augmentation) === "number") {
                      score += parseInt(skill.augmentation);
                  }
              }
          } else {
              if (spec) {
                  if (isNonZero(spec.expert)) {
                      score = parseInt(spec.expert);
                      options.results.expert = score;
                  }
              } else {
                  if (isNonZero(skill.expert) === "number") {
                      score = parseInt(skill.expert);
                      options.results.expert = score;
                  }
              }
          }
          // The following are always applied. Parent and specialities stack.
          if (isNonZero(skill.bonus) === "number") {
              score += parseInt(skill.bonus);
              options.results.bonus += parseInt(skill.bonus);
          }
          if (isNonZero(skill.augdm) === "number") {
              score += parseInt(skill.augdm);
              options.results.augdm += parseInt(skill.augdm);
          }
          if (spec && isNonZero(spec.bonus)) {
              score += parseInt(spec.bonus);
              options.results.bonus += parseInt(spec.bonus);
          }
          if (spec && isNonZero(spec.augdm)) {
              score += parseInt(spec.augdm);
              options.results.augdm += parseInt(spec.augdm);
          }
      }

      // Apply global modifiers.
      if (isNonZero(options.dm)) {
          score += parseInt(options.dm);
          options.results["dm"] = parseInt(options.dm);
      }
      if (cha && this.system[cha]) {
          if (options.addcha) {
              score += parseInt(this.system[cha]);
          }
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

  async rollUPP(options) {
      let upp = this.system.characteristics;

      if (!options) {
          options = {};
      }

      if (upp) {
          let html=`<div class="chat-package">`;
          html += `<p><b>${this.name}</b></p>`;
          html += `<div class="stats grid grid-3col">`;

          let prefix = options.shift?"~":"";
          for (let c in upp) {
              if (upp[c].show) {
                  let dice = "2D6";
                  if (options.ctrl) {
                      let roll = await new Roll("2D6", this.getRollData()).evaluate();
                      let modifier = 0;
                      switch (roll.total) {
                          case 2:
                              modifier = -2;
                              break;
                          case 3: case 4:
                              modifier = -1;
                              break;
                          case 10: case 11:
                              modifier = +1;
                              break;
                          case 12:
                              modifier = +2;
                              break;
                      }
                      upp[c].value += modifier;
                      html += `<div class="stat resource"><span class="stat-hdr">${c}</span><span class="stat-val">+/-<br/>${(modifier>=0)?("+"+modifier):modifier}</span></div>`;
                  } else {
                      if (upp[c].roll) {
                          dice = upp[c].roll;
                      }
                      if (options.shift) {
                          let totals = [];
                          for (let i=0; i < 5; i++) {
                              let roll = await new Roll(dice, this.getRollData()).evaluate();
                              totals.push(roll.total);
                          }
                          totals = totals.sort(function(a, b) {
                              return a - b;
                          });
                          upp[c].value = totals[2];
                      } else {
                          let roll = await new Roll(dice, this.getRollData()).evaluate();
                          upp[c].value = roll.total;
                      }
                      html += `<div class="stat resource"><span class="stat-hdr">${c}</span><span class="stat-val">${prefix}${dice}<br/>${upp[c].value}</span></div>`;
                  }
              }
          }
          this.update({"system.characteristics": upp});
          html += "</div></div>";

          let who = null;
          if (game.users.current.isGM) {
              if (game.settings.get("mgt2e", "gmSheetNotification") === "private") {
                  who = [game.user.id];
              }
          } else {
              if (game.settings.get("mgt2e", "playerSheetNotification") === "private") {
                  who = [game.user.id];
              } else if (game.settings.get("mgt2e", "playerSheetNotification") === "gm") {
                  who = [game.user.id, game.users.activeGM ];
              }
          }
          let chatData = {
              user: game.user.id,
              speaker: ChatMessage.getSpeaker(),
              whisper: who,
              content: html
          }
          ChatMessage.create(chatData, {});
      }
  }

  getCriticalLevel(critical) {
      if (this.type === "spacecraft") {
          if (MGT2.SPACECRAFT_CRITICALS[critical]) {
              let value = this.getFlag("mgt2e", "crit_" + critical);
              if (value && parseInt(value) > 0) {
                  return Math.min(6, parseInt(value));
              }
          } else {
              console.log(`WARN: Unknown spacecraft critical [${critical}]`);
          }
      }
      return 0;
  }

  async setCriticalLevel(critical, level) {
      await setSpacecraftCriticalLevel(this, critical, level);
  }

  fixCriticalEffect(effect) {
      this.unsetFlag("mgt2e", "damage_" + effect);
      this.unsetFlag("mgt2e", "damageSev_" + effect);
  }


  getHardwareList(type) {
      let list = [];
      for (let i of this.items.contents) {
          if (i.type === "hardware" && i.system.hardware.system === type) {
              list.push(i);
          }
      }
      return list;
  }

  getItemsByType(type) {
      let list = [];
      for (let i of this.items.contents) {
          console.log(i.name);
          if (i.type === type) {
              list.push(i);
              console.log("Adding " + i.name);
          }
      }
      return list;
  }

    printCreatureBehaviours() {
        let text = "";
        if (this.type === "creature" && this.system.behaviour) {
            const behaviours = this.system.behaviour.split(" ");
            for (let b of behaviours) {
                if (CONFIG.MGT2.CREATURES.behaviours[b]) {
                    let label = game.i18n.localize("MGT2.Creature.Behaviour." + b);
                    if (text) {
                        text += ", ";
                    }
                    text += label.replace(/ /g, "&nbsp;");
                }
            }
        }
        return text;
    }

    printCreatureTraits(includeDerived) {
        let text = "";
        if (this.type === "creature" && (includeDerived || this.system.traits)) {

            if (includeDerived) {
                if (this.system.size !== 0) {
                    text += "Size (" + this.system.size + ")";
                }
                if (this.system.armour.protection !== 0) {
                    if (text) {
                        text += ", ";
                    }
                    text += "Armour (" + this.system.armour.protection + ")";
                }
            }

            const traits = this.system.traits.split(",");
            for (let t of traits) {
                const trait = t.replaceAll(/[^a-zA-Z]/g, "");
                const value = t.replaceAll(/[^0-9]/g, "");
                if (CONFIG.MGT2.CREATURES.traits[trait]) {
                    let label = game.i18n.localize("MGT2.Creature.Trait." + trait);
                    if (text) {
                        text += ", ";
                    }
                    text += label.replace(/ /g, "&nbsp;");
                    if (value) {
                        text += " " + value;
                    }
                }
            }
        }
        return text;
    }

    printSkills() {
        const skills = this.system.skills;
        if (!skills) {
            return;
        }
        let html = "";
        for (let key in skills) {
            let skill = skills[key];

            if (skill.trained) {
                let showParent = true;
                if (skill.specialities) {
                    for (let specKey in skill.specialities) {
                        let spec = skill.specialities[specKey];
                        if (spec.value > 0) {
                            showParent = false;
                            html += `<li>${skillLabel(skill, key).replace(/ /, "&nbsp;")}&nbsp;(${skillLabel(spec, specKey).replace(/ /, "&nbsp;")})&nbsp;${spec.value}</li>`;
                        }
                    }
                }
                if (showParent) {
                    html += `<li>${skillLabel(skill, key).replace(/ /, "&nbsp;")}&nbsp;${skill.value}</li>`;
                }
            }
        }
        return `<ul class="skill-list">${html}</ul>`;
    }

    printAttacks() {
      console.log("printAttacks:");
      if (this.type !== "creature" && this.type !== "npc" && this.type !== "traveller") {
          return "";
      }
      let html = "";
      for (let i of this.items) {
          if (i.type === "weapon" && (i.type !== "creature" || i.system.status === MgT2Item.ACTIVE)) {
              if (html) {
                  html += ", ";
              }
              html += `<span>${i.name} (${i.system.weapon.damage})</span>`;
          }
      }

      return html;

    }

}
