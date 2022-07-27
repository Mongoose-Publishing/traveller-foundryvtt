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
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.traveller || {};

    // Make separate methods for each Actor type (traveller, npc, etc.) to keep
    // things organized.
    this._prepareEffects(actorData);
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

    /**
     * Check any augments that this actor might have, and modify skills
     * and characteristics.
     *
     * @param actorData
     * @private
     */
  _prepareEffects(actorData) {
    console.log("_prepareEffects: " + actorData.name);
    console.log(actorData);

    for (const effect of actorData.effects) {
        console.log("Has effect");
        console.log(effect);
        for (const change of effect.data.changes) {
            let key = change.key;
            let mode = parseInt(change.mode);
            let value = parseInt(change.value);

            console.log(`[${key}] [${mode}] [${value}]`);

            if (key && key.length === 3 && key.toUpperCase() === key) {
                console.log("Characteristic modifier");
                if (actorData.data.characteristics && actorData.data.characteristics[key]) {
                    let cha = actorData.data.characteristics[key];
                    cha.augmented = parseInt(cha.value) + value;
                }
            } else if (key && key.length > 0) {
                console.log("Skill modifier");
                let skill = key;
                let spec = null;
                if (key.indexOf(".") > -1) {
                    skill = key.split(".")[0];
                    spec = key.split(".")[1];
                }
                console.log(`Skill [${skill}] spec [${spec}]`);
                if (actorData.data.skills[skill]) {
                    let skillData = actorData.data.skills[skill];
                    if (spec && skillData.specialities[spec]) {
                        let score = parseInt(skillData.specialities[spec].value);
                        skillData.specialities[spec].augmented = score + value;
                    } else if (!spec) {
                        let score = parseInt(skillData.value);
                        skillData.augmented = score + value;
                    }
                } else {
                    console.log("No such skill");
                }
            }
        }
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareTravellerData(actorData) {
    if (actorData.type !== 'traveller') return;

    // Make modifications to data here. For example:
    const data = actorData.data;

    for (const char in data.characteristics) {
        let value = data.characteristics[char].value;
        if (data.characteristics[char].augmented) {
            value = data.characteristics[char].augmented;
        }
        let dmg = 0;
        if (data.damage && data.damage[char]) {
            dmg = data.damage[char].value;
            if (dmg < 0) {
                dmg = 0;
                data.damage[char].value = dmg;
            }
            if (dmg > value) {
                dmg = value;
                data.damage[char].value = dmg;
            }
            value -= dmg;
        }
        data.characteristics[char].current = value;

        let dm = this.getModifier(value);
        data.characteristics[char].dm = dm;
    }

    if (data.damage && data.hits) {
        let hits = 0;
        let maxHits = 0;

        hits = data.characteristics.STR.current + data.characteristics.DEX.current + data.characteristics.END.current;
        maxHits = data.characteristics.STR.value + data.characteristics.DEX.value + data.characteristics.END.value;

        data.hits.value = hits;
        data.hits.max = maxHits;
    }

  }

  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const data = actorData.data;

    for (const char in data.characteristics) {
        let value = data.characteristics[char].value;
        if (data.characteristics[char].augmented) {
            value = data.characteristics[char].augmented;
            console.log("Augmented value is " + value);
        }
        let dm = this.getModifier(value);
        data.characteristics[char].dm = dm;
    }

    if (data.hits) {
        let hits = 0;
        let maxHits = 0;

        maxHits = data.characteristics.STR.value + data.characteristics.DEX.value + data.characteristics.END.value;

        //data.hits.value = maxHits;
        data.hits.max = maxHits;
    }
  }

  _prepareCreatureData(actorData) {
      if (actorData.type !== 'creature') return;



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
    if (this.data.type !== 'traveller' && this.data.type !== 'npc') return;

    if (!data.characteristics) {
        console.log("This Traveller has no characteristics");
        return;
    }

    for (let [k,v] of Object.entries(data.characteristics)) {
        data[k] = v.dm ?? -3;
    }

  }

}
