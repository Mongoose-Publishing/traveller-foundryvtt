# Mongoose Traveller for FoundryVTT

This is an implementation of Mongoose Traveller 2e for FoundryVTT.
It currently supports Foundry v11.

## Build

### Compendium Packs

Objects in compendium packs are stored as individual JSON files.
  * Use `mkpacks pack` to convert from JSON to binary DB format.
  * Use `mkpacks unpack` to convert from binary DB format to JSON.

These scripts assume that the foundry CLI `fvtt` is present and
configured. The `dataPath` should be set to the local mgt2 directory.

e.g.

```
fvtt configure set dataPath $PWD/mgt2/
```

### Releases

Use `release.sh` to create a release file. This will also increment the
patch version number automatically unless an argument is passed to the
script.

## Object Types

The main supported object types defined in the system are:

### Actors

  * Traveller - A player character
  * NPC - Cut down version of a Traveller
  * Creature - Creatures with even fewer details
  * Spacecraft - A spacecraft, currently partially supported.
  * Package - Contains package of skills, items and attributes for building NPCs or Travellers from.

### Items

  * General Item - Normal equipment without special rules.
  * Weapon - Weapons, used by people and creatures.
  * Armour - Armour, used by people and creatures.
  * Augmentation - Expert Systems, Augments and other things that provide bonuses
  * Term - Represents a Term during character creation.
  * Associate - Represents a contact, ally, enemy or rival gained during character creation.
  * Cargo - Goods to be bought and sold, carried on spacecraft.
  * Spacecraft Hardware - Items a spacecraft is built from.



## Licenses

Code is BSD licensed, based on boilerplate Foundry code from https://github.com/asacolips-projects/boilerplate

Some icons are taken from svgicons.com and game-icons.net. See the READMEs in those directories for details.
