# Advanced Items

Thoughts about how to handle some advanced features about items.


## Augments

These could be used to add natural effects to a character.
An option of "equipment" or "effect".

If an 'effect', does not show in equipment list, but instead in the status panel.
This could be used to add things such as starvation mechanic from Stranded.


## Ammunition

A weapon currently tracks ammo and magazines on the item itself. Which is nice and easy.
But what happens if you need lots of magazines?

D&D does it by having a consumable type. But we have lots of different types of ammo in Traveller, so
defining each type seems a bit complicated.

So maybe we go for a more general approach?

### Ammo Type

Damage, plus Weapon Trait types.
These can override what is on the weapon itself.

Maybe there's a switch on a Weapon type?

This is low priority.


## Item Actions

Some items can do things. Initially just for general items.

Have `actions` array.
Can be added manually. Each action has:
    * Type:
        * Chat - just outputs something to the chat
        * Skill Check - Make a skill check using owner's skill


## Software

If an item has an embedded computer, then:
* Provide drop down to select software which the actor has.
* If the item is not part of an actor, there is no drop down.
* Selecting a software adds it to array.
