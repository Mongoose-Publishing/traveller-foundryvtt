# Spacecraft Criticals

Some development notes on how to implement criticals for spacecraft.

This isn't easy, because there's a whole load of different, unique, critical results.

When there are penalties to the ship, we have the option to:
* Apply the penalties to the ship as a whole.
* Apply the penalties to a specific hardware item on the ship.

Applying to the ship makes it easier to see what the damage is. Applying to items means we
automatically support backup items. It's already assumed that there are multiple weapons,
so we need to track it per weapon (we will do this per weapon mount).

If we have quantity of items > 1, what then? Maybe assume it applies to all in that
batch. So for big ships, it can apply to whole banks of weapons, rather than individual
weapons.

## Status Effects

* Damaged X. There is a DM penalty to using this item.
  * Sensors
  * Weapon
  * Armour
  * M-Drive
  * J-Drive

* Power X. Reduced to X% of capacity.
  * Power Plant

* Reduced X. Thrust reduced by X G.

* Disabled - Can't be used, could be repaired.
* Destroyed - Can't be used or repaired.
* SlowLeak - Leak of fuel per hour
* FastLeak - Leak of fuel per round
* RangeLimited XXX - For sensors, limited to the specified range. 

* LifeSupport

This means we need hardware types of Bridge and Sensors.

### Flags

Critical levels and effects are stored as flags on the actor.

crit_XXX will store the level of critical on a location.

damage_XXX will store critical effects.
damageSev_XXX will store the severity level of the effect.

The latter is needed so that when an Engineering check is made to fix things, we know
what DM modifiers to apply.