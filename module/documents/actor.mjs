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
        const actorData = this;
        const data = actorData;
        const flags = actorData.flags.traveller || {};

        console.log("preapreDerivedData:");
        console.log(actorData);

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
/*
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
            */
        }
    }


  }

  applyActiveEffect(ob1, obj2) {
    console.log("applyActiveEffect:");
    console.log(obj1);
    console.log(obj2);
  }

    /**
     * Prepare Character type specific data
     */
    _prepareTravellerData(actorData) {
        if (actorData.type !== 'traveller') return;

        // Make modifications to data here. For example:
        const data = actorData.system;

        for (const char in data.characteristics) {
            let value = data.characteristics[char].value;
            if (data.characteristics[char].augment) {
                value += parseInt(data.characteristics[char].augment);
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
            data.characteristics[char].dm = this.getModifier(value);
        }

        if (data.damage && data.hits) {
            let hits = data.characteristics.STR.current + data.characteristics.DEX.current +
                data.characteristics.END.current;
            let maxHits = data.characteristics.STR.value + data.characteristics.DEX.value +
                data.characteristics.END.value;

            data.hits.value = hits;
            data.hits.max = maxHits;
        }
    }

    _prepareNpcData(actor) {
        if (actor.type !== 'npc') return;
        const actorData = actor.system;

        for (const char in actorData.characteristics) {
            let value = actorData.characteristics[char].value;
            if (actorData.characteristics[char].augment) {
                value += parseInt(actorData.characteristics[char].augment);
                console.log("Augmented value is " + value);
            }
            actorData.characteristics[char].current = value;
            actorData.characteristics[char].dm = this.getModifier(value);;
        }

        if (actorData.hits) {
            let hits = 0;
            let maxHits = 0;

            maxHits = actorData.characteristics.STR.value + actorData.characteristics.DEX.value +
                actorData.characteristics.END.value;

            //data.hits.value = maxHits;
            actorData.hits.max = maxHits;
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
    if (this.type !== 'traveller' && this.type !== 'npc') return;

    if (!data.characteristics) {
        console.log("This Traveller has no characteristics");
        return;
    }

    for (let [k,v] of Object.entries(data.characteristics)) {
        data[k] = v.dm ?? -3;
    }

  }

}
