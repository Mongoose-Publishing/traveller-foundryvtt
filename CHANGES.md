# Release Notes

## Known Issues

* Behaviour drop down on Creature character sheet immediately closes after opening unless mouse button
  is held down.
* Career terms aren't always added in the correct order.
* This has not been fully tested against Foundry 13. Please stick with Foundry 12 unless you plan
  to help track down compatibility bugs.

## 0.12.4 (Beta)

* Use tons value for docking spaces if it is set, rather than the rating.
* Remove black border around images in the journal. Add CSS for two column equipment
  layout with shadow effects on images.
* Multiply explosive damage by the effect of the attack when using explosives skill.
* Fix bug in armour calculation for spacecraft.
* Implement bridge options - small, command, cockpit and dual cockpit.
* Some fixes to how floating point numbers are displayed in ship tons and cost.
* Support for some ship tech advances, such as reduced size and power efficiency.
* Added new icons for ship hardware items.
* Fixed bug in how ship armour is calculated.
* Added macro to allow a roll table to be rolled directly from journal, with a modifier
  for the roll result. Needed for some of the encounter tables in the Core Rules.
* Ship software price is now assumed to be in Credits (not MCr), same as for other software.


## 0.12.3 (Beta)

* When training a skill through a macro, only display speciality skills that can be
  trained (less than level 4, lower than the level being trained to).
* Added a new ship hardware type of common areas.
* Added weapons to ship data sheets in the journal.
* Added new tokens for missing spacecraft and smallcraft from the Core rules.
* Improve display of the ship type/class in the journal sheet.
* Added jammer option for starship sensors.
* Fix for missing DEFAULT_TOKEN definition that was causing problems on Foundry v11 (though we
  don't technically support v11 anymore).
* Added very basic inline display of items with a {{/item uuid}} macro.
* Added 'enforceLimits' flag for spacecrafton the Notes tab. Defaults to true. If disabled,
  limits on tech levels and number of advantages for ship hardware is removed. Allows
  non-standard ships which break the rules to be created.
* Fixed bug with quick rolls, where specialities couldn't be quick rolled.

## 0.12.2 (Beta)

* Fixed bug where lack of width/height attributes on SVG icons that were on a scene could cause
  Firefox to fail to load the page.

## 0.12.1 (Beta)

* Computers can be embedded in standard item type. This will later be expanded to other item types,
  and is first step towards attaching software to computers.
* Add flag to a spacecraft to mark it as a 'standard' design, which gets 10% discount on price.
* Allow active effects to add initiative and armour modifiers. Needed for Combat drugs.
* When adding items from a macro, allow a dice value to be used for the quantity. This also fixes
  a bug where an item defined by uuid seemed to ignore the quantity argument.
* Add inline display of spacecraft journal entries. This displays them in table format, and goes
  some way to calculating their total cost.
* Removed minimum height from actor portrait on character sheet.
* If a user has a default player character set, then when macro are executed, this character
  will be used if no tokens are selected. This simplifies character generation macros, so the
  player doesn't need to create and select a token.
* Added new icon for comms equipment.
* Added World actor type. This is very Alpha at this stage. World UWP can be randomly rolled,
  and this will use the generation tables from the Mongoose rules. Cargo for speculative trade
  can also be automatically generated, and to a limited extent freight. Broker skills can be
  set for a world by dragging an actor to them.
* WorldData item type added, but currently disabled. This will be used for tracking other data
  about a world.
* Added new creature token graphic for insects, specifically for the example in the core rules.
* Fixed bug when applying damage to Creatures in Foundry 13.
* Allow scale and some traits to be specified in journal damage macros.
* Added some attributes to vehicles, and expanded the list of vehicle chassis supported.
* Vehicles can now be embedded in a journal page.

## 0.12.0 (Beta)

Migration Notes: How augments work has been changed. Support for old legacy active effects
has been disabled, which should fix some bugs. This requires a migration step to be run to
remove active effects that are applied directly on an actor.

If effects are behaving strangely on an actor, remove items which apply effects off the actor,
delete any effects (via the settings tab), then move the item back on the actor.

* Legacy active effects have been disabled. This now allows effects to work with tokens.
* Settings tab on Travellers and NPCs now allow effects to be removed. This is needed if the
  move from legacy effects leaves some effects dangling. It may also be useful in future.
* Fix bug where some augments were not displayed on the list of skills.
* Added new augment type to set minimum value for a characteristic.
* Added support for Travellers to the included Heal macro.
* Added a 'Recover PSI' macro to the list of included macros.
* Added a 'cost' attribute to inline skill macros. If set, characteristic will take damage when
  the skill is rolled. This is initial basic implementation for PSI powers.
* Fix for fonts in the status display of some item types.

## 0.11.11 (Beta)

* Cleaned up CSS.
* Fixed bugs in description generated by relationship types on associate item.
* Cleaned up UI of associate item.
* Added macro for assigning associate to a character from a journal.
* Given each macro type a different icon, to make them easier to distinguish.
* Traveller actors are now created with the Link Actor flag automatically ticked on their tokens.
* Added new CSS styling for Foundry specific sections in the rule books.
* Radiation damage now applied to a character as part of damage.
* Damage can be made to a specific characteristic for Travellers using macros.
* Built-int macros given alternative, shorter, names.
* Skill request macro will now use honour the roll mode setting of the user.

## 0.11.10 (Beta)

* Fix regression when rolling just a characteristic.
* Allow skill checks to be made without a characteristic.
* Fixed deprecation warnings in the skill dialog.

## 0.11.9 (Beta)

* Re-written how skill checks are implemented to tidy up technical debt. Should have no functional
  effect on how they work, but the code is cleaner.
* Allow creatures to be displayed inline within a journal, similar to NPCs.
* Improvements to how NPCs are displayed within a journal.
* The spacecraft repair dialog no longer closes after a skill check. Gain a bonus DM
  after a failure to fix a system.
* Spacecraft critical modifiers now negatively effect skill checks made by crew members.
* Updated Engineering role to add a 'Repair' option.
* Added internal journal macro to allow the GM to request a skill check by players. Outputs
  the request to the chat, along with a description. Clicking it will automatically figure out
  success or failure, and output a message.
* Added internal journal macro for causing damage. Outputs a damage box to the chat, which
  can be applied to actors as normal.
* Athletics checks now automatically default to basic characteristic (STR, DEX or END) if they
  are untrained. This means you never get a -3 penalty when making such skill checks.
* Some improvements to skill adding and editing dialog. Skills can now be set as independent,
  which means specialisations function like the Profession skill.
* Spacecraft tonnage, TL, cost and power use are now hardwired for drive components. This should
  be simpler to use, and follow the Mongoose rules better. TL and cost for these components will
  also modify if TL advancements are applied.
* Inline actor sheets are now clickable link to open the full character sheet.

## 0.11.8 (Beta)

* Added prone and in cover status for characters. Cover will add to a character's armour.
* Created macro which can be used to assign cover to a character, or remove it.
* Added support for built-in macros, for use by internal features. These can be called with
  /mgt2e in the journal text.
* Added support for embedded actor sheets in the journal
* Effect combat bonuses now displayed on attack dialog.

## 0.11.7 (Beta)

* Add inline macro support for journals.
* Character sheets now have an "Add Item" option for Travellers and NPCs, to allow
  items to be generated directly from the character sheet.
* Armour weight not forced to integer when weight is reduced when it is worn.
* There is now a UI for defining which characteristics are can have damage applied to them.
* As a consequence of the above, only the three core physical stats list damage options by default.
* Current active effects are now displayed in the actor settings tab.
* Added first aid flag to characters after they are injured.
* Added build number to version string. Used only to track changes during development cycles.
* Improvement to some of the provided macros. Beginning to add support for functionality for
  use in character generation.
* List of Trade Goods is now provided by default in the Items compendium.
* Added further support for spacecraft criticals.

## 0.11.6 (Beta)

* The drop down to add a new role to a spacecraft was only being shown if there were
  already some roles on the ship.
* Spacecraft damage couldn't be applied due to bug in calculation of effect criticals,
  if there were no effect criticals.

## v0.11.5 (Beta)

* Crew role skill actions can now include description of action in chat output.
* Added extra sample crew roles.
* Added ability to create crew roles from the spacecraft character sheet.
* Further improvements to handling of criticals on spacecraft. Criticals are displayed
  on the ship sheet, and can be removed. Some critical effects will be applied when they
  occur. Hardware can be damaged, cargo can be destroyed (turned to scrap).
* Added 'Missile' trait for spacecraft scale weapons. There is no support for this beyond
  being able to define a weapon as being a missile launcher.
* Added Macro compendium. Currently, contains some simple macros for dice rolls.
* Added icons for dice roll types and results.
* Effect is now added to spacecraft damage.
* Added new icons for spacecraft weapon types.
* Added hover text hints to spacecraft sheet, pointing players to the hardware tab
  for values such as jdrive and mdrive.

## v0.11.4 (Beta)

* Always show magazine details on a weapon item.

## v0.11.3 (Beta)

NB: The minimum quantity for an item has been changed from one to zero. The default is set
in the backend template (the default is still one), but enforced on the front end. It is
possible that some items revert to showing a quantity count of zero if they were created prior
to the quantity field being introduced. However, any such data should predate the public
release of the system.

* Weapons with the oneUse trait now decrement their quantity count after being used.
* Minimum quantity for an item has been reduced to 0 (from 1).
* Attacks with a blast radius can now be dragged onto a scene to automatically show the blast template.
* Added a new setting "Blast effect divergence distance" which automatically randomises position of a
  blast effect template if the attack was a miss. Defaults to none, for no divergence.
* Psi traits for weapons are now implemented. Can modify both damage and AP of the attack by
  spending PSI points.
* Psi trait for armour is now implemented. Adds half PSI value to protection if enabled.
* Damage dialog now displays how armour is calculated, based on type of attack and where
  protection is coming from.
* When an attack is made, display distance to all current targets.
* Spacecraft and NPCs now have a configurable to allow HITS to be manually or automatically calculated.
  Previously, they were always calculated automatically, with no option to override.

## v0.11.2 (Beta)

* Added some creature traits from the Companion to the list of those available.
* Added documentation on how to modify what creature traits are available.
* Added rule support for gigantic, dispersed, energy and gossamer creature traits. This also means support for
  reduced and minimum damage from attacks.
* Added 'cutting' damage type for weapons. Needed to support some damage effects of new creature traits.
* Removed CSS definition that was breaking some modules by forcing text editor background to be white. This doesn't
  seem to have impacted our own journal entries.
* Added game settings to specify default vision settings for tokens depending on their actor type.

## v0.11.1 (Beta)

* Fixed bug where all armour was being considered archaic, so was being halved.

## v0.11.0 (Beta)

* Definition of Computers on spacecraft has changed from a simple selectable value to using a Hardware component.
* A 'study notes' section has been added to the XP dialog for each skill.
* It is now possible to delete skills from a character sheet (but not a token).
* Skills marked as deleted from an actor package will now be deleted when package is applied to target actor.
* Spacecraft hardware can now be activated and deactivated. Backend support for damaged hardware now added as well.
* Spacecraft now have a drop down menu to add some basic core hardware options.
* Increased default size of description field for items.
* Added Software item type. This can be added to spacecraft, but currently has no effect.
* Increased maximum TL of items to 25. Hardware TL limited to TL of spacecraft it is installed on.

## v0.10.7 (Beta)

* Added new traits for weapons: Dangerous, Shield, Protection, Smasher, Artillery, Silent, Fire etc
* Added new traits for spacecraft weapons: Ion, Chain Reaction, Orbital Strike etc
* Add support for Protection type for weapons, so it counts as armour.
* Add support for Dangerous and Very Dangerous weapons in attack rolls.
* Reduce what can be seen on an NPC sheet if permissions are Limited.
* Fix CSS bug where Macros were not showing icon or name field.
* Display and set technology modifiers for some spacecraft equipment. They currently have no effect though.
* Backend rewrites to how attacks are implemented, to handle different scales and tidy up the code.
* Added new spacecraft damage dialog, for attacks on spacecraft.
* Set criticals on a spacecraft when it is damaged. They are displayed on the sheet, but currently have no effect.


## v0.10.6 (Beta)

* Fix issue with random cargo tonnage roller not working on v12.
* Prevent an 'empty' modifier from being added to the Purchase and Sale modifier list on cargo items.


## v0.10.5 (Beta)

* Allow characteristics to be rolled from the character sheet.
* Fix some bugs around how career terms are added to character sheets.
* System settings for how chat messages about character updates are broadcast.
* Allow characteristics to be locked to reduce chance of unwanted changes.
* First draft of character sheet for vehicles.
* Update to spacecraft to allow vehicles and other spacecraft to dock with them.
* Track and set initiative for spacecraft.
* Add special actions for ship roles, including make pilot, tactics and leadership.
* Fix bug where v12 changes broke relationship items.
* Packages now correctly set and report species, height and weight fields.
* Can now drag crew members from a spacecraft or vehicle to a scene.

## v0.10.4 (Beta)

* Fix bug with specialities and expert systems
* Change implementation of rules so expert system always gives +1 if you are trained

## v0.10.3 (Beta)

* Fixed application of damage in Foundry v12.
* Fixed display of actor and item descriptions in Foundry v12.
* Updated system configuration to include v12 as supported.

## Reccent

* Allow actors to be dragged out of starships onto the scene.
* When dragging hardware, crew roles or career terms between actors, always use a copy rather than a move.
* Spacecraft dragged onto a spacecraft are put into the docking bay.

## v0.10.2 (Beta)

* Better use of space in armour box for spacecraft.
* Fixed precision bug in display of item costs on character sheets.
* Added profession and species information to passenger cards.
* Prevent roles and weapons from being deleted if in use.
* Fixed bug where creatures weren't being given skills.

## v0.10.1 (Beta)

Started adding support for spacecraft shooting at things. This is currently in alpha.
Damage applied by spacecraft attacks may be inconsistent depending on how it is applied
(dragged to sheet compared to applied to a token, or based on type of actor target).

* Weapon attack option has been added to crew roles.
* Crew role skill check can now specify difficulty of a task, and the characteristic to use.
* Bugs fixed around display of skill labels.
* Bug which prevented spacecraft from being updated if a computer wasn't set fixed.
* Backend reworking of how skills are calculated.
* Fixed bugs with display of the NPC ID card.
* Fixed bug with skill icon.
* Magazine and ammo only displayed for ranged weapons.


## v0.10.0 (Beta)

### Breaking Changes

The changes made to Creatures in 0.9.2 have been replicated to Items. Weapon traits now display
as options in a select box, rather than being a free text field. This requires enforcing the
format being used. This is good, because if it was wrong before a trait would just be ignored.
Conversion is done on migration, trying to preserve any existing weapon traits. We try to be
as generous as we can in interpretation, but only support the core weapon traits.

### Changes

* Moved list of skills and characteristics from template.json to code. This is needed as part
  of migrating to v12. Skills are copied into an actor when one is created.
* Skill names now have some i18n support.
* Weapons and armour now use UX design from Creatures, hardcoding the list of traits and damage
  types and providing a selectable list of options.
* The Cargo sheet now uses the new UX design for trade bonuses.
* Career terms can now specify what dice to roll for random career length, rather than assuming 3D6.
* Fix bug where a stunned NPC would always take stun damage after being stunned once.
* Updates to data structure references in HTML for better v12 support.
* Added initial support for computer systems on spacecraft.
* Changed to using 'cargo' item type to calculate cargo hold on spacecraft, rather than just
  assuming it is all remaining volume.
* Added icons for fuel tanks and cargo hold.
* Adding a template to an actor now outputs the results.
* Added tokens for Lab Ship and Empress Marava.

## v0.9.2 (Beta)

### Breaking Changes

The character sheet for creatures has had radical changes. Behaviours and Traits are now managed rather than
being treated as simple text fields. This means only supported behaviours and traits can be set, however,
they now automatically apply modifiers and provide skill hints based on what is chosen. An attempt is
made to convert from the old format to the new format, but some behaviours and traits may be lost.

### Changes

* Quietly squash warnings about adding careers and associates to NPCs when adding a package
* Handle boon/bane flag correctly on skills which default to boon or bane
* Auto resize starship tokens based on tonnage
* Modification to what players can see on NPCs sheet based on permissions.
* NPCs now have a 'cash' attribute, just like Travellers.
* Skills which have an internal bonus set are now highlighted.

## v0.9.1 (Beta)

* Changed in-built compendium names to use consistent 'MgT2e Base' prefix
* Added validation to make sure dropped items were legal for an actor type.
* Updated docs for better descriptions of actors.

## v0.9.0 (Beta)

Major release. First public release.

