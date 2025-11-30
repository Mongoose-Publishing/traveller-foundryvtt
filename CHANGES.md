# Release Notes

## Known Issues

* Career terms aren't always added in the correct order.

# 0.16.0 (Beta)

* Added some initial Spanish translations
* Improvements to use of i18n text strings
* NPCs can now take characteristic damage rather than having a HITS score. This can be
  toggled for individual NPCs. There is also a setting which controls whether new NPCs
  use characteristic damage or HITS. Currently defaults to HITS, but will switch in a
  later release.
* Updates to the characteristic damage control dialog for actors. Now uses DialogV2,
  and includes option to toggle damage type for NPCs.
* Fixes in how some roll tables are processed. V13 makes some backwards incompatible
  changes to roll tables. Try to allow both V12 and V13 tables.
* Added a simple faction generator for worlds using roll tables. An example roll table
  is included in the compendium pack.
* Fixed bug where faction government type was incorrectly calculated.
* Fixed bug where Traveller actor types were no longer setting the 'linked actor' flag
  automatically on their prototype token. Worlds and Travellers automatically have this
  set to true when the actor is created.

# 0.15.8 (Beta)

* Improvements to chat CSS on Foundry V13.
* Fixes to CSS clashes with Foundry V13.
* When the 'split attack/damage roll' option was enabled, the displayed dice results
  was different to the dice result actually used for calculating the attack. Also made
  some improvements to display of split damage rolls.
* Skill DMs from augments was not being correctly included in rolls for speciality skills.
* When rolling a parent skill, specialities weren't displayed if they had a score of zero,
  but had augment bonuses.
* Armour items were not displaying list of installed software packages.
* Include Expert Software bonuses on speciality skills when rolling the parent.

# 0.15.7 (Beta)

* Secret text in World factions and patrons is now hidden from players who don't
  have ownership permission on the World.
* When actors are dropped on the hotbar, they now show the correct label and image.
* Spare Parts can now have their quantity modified, allowing them to be consumed
  whilst repairing a ship.
* Fixed some issues with selling prices in the trade system. Also prevent trade
  goods from being resold back to the same world.
* Common areas now have a flag to specify with to auto calculate the cost or not.
  This allows special common areas (bars, pools, kitchens etc) to have a cost
  other than the standard.
* Cargo holds can have a cost associated with them.
* Fixed problem with some drop down menus, where a null or empty response was causing
  the menu to close as soon as it opened on some browsers.
* On V13, active effects now show an 'empty' option as the default, making it obvious
  that a valid result needs to be selected. Previously, it was displaying the first
  item as selected, but it hadn't actually selected it.
* An overly broad CSS definition was affecting the playlist display on V13. This has
  been tightened up, so playlists should display correctly.
* Added 'Software' to the list of items that can be created directly from an actor's
  sheet.
* Set the verified version of Foundry to be V13.

# 0.15.6 (Beta)

* Expanded some of the options for world codes.
* Changed selling of freight to sell all freight to a world in one action.
* Weapon mounts now display attached weapon names in crew role drop down.
* Added spare parts to the list of speculative trade items.
* Added macros to automatically resize world and ship tokens depending on scale
  of scene.
* Improved support for world factions.
* Added basic support for world patrons.
* Added "DEFAULT TRAVELLER" actor to the compendium.
* Removed freight and mail goods from the list of speculative trade items.

# 0.15.5 (Beta)

* Refactoring of the drop handler for cargo and worlds. Now works a lot better, and
  supports non-GM users dropping and dragging items from worlds which they don't own,
  by using a socket to process the work as a GM user (if available).
* Fixed speculative cargo so that prices are correctly modified by the world trade
  codes.
* When listing speculative cargo on a world, show buy and sell prices, plus the variance
  from the 'norm' for this type of trade good. Speculative cargo is also shown as a table
  rather than as a grid.
* When freight and trade goods are dragged from or to a world from a ship, dialogs are
  used to display profit and loss, and to provide a chance to modify quantity being
  bought or sold.
* Spacecraft now have a finance option, which allows them to carry cash. When trade is
  performed, this value is automatically modified. Attempts to buy trade goods when you
  don't have enough cash are also prevented.
* Passengers are now available at worlds to be given passage to. The world they are going
  to is tracked, so they can be disembarked at their destination.
* Passengers are randomly generated as NPCs, with a random name, profession and basic
  list of skills and a description.
* Implemented random name generator using Roll Tables. Initially supports Vilani, but
  could be extended to support names in other languages. It is possible for users to
  extend this by adding their own tables.
* Overly complex random NPC generator has been added using Roll Tables. NPC skills
  and characteristics can be added and modified. Descriptions can be set, including
  addition of 'secret' information only visible to the GM. This can be extended by
  users.
* Name generator can be called from a macro with a simple script such as:
  let text = await game.mgt2e.generateText("Vilani Name");
* NPC generator can be called from a macro, allowing it to modify an existing NPC
  or pass it data for a new NPC:
  await game.mgt2e.generateNpc(npcData, "NPC Generator");
* When an attack is made, the weapon's notes field is now output using an enriched
  description. This allows macros to be placed in the text, which can be clicked on.

## 0.15.4 (Beta)

* Fixed bug where Rich trade codes weren't being correctly applied to worlds due to the
  government property being misspelt.
* Allow EDU and SOC to be used by augments. These aren't usually modified by augments, but
  in rare cases they might need to be.

## 0.15.3 (Beta)

* Fix some macro bugs around training Profession skills. Each individual speciality needs to be
  marked as trained if it is raised. Training Profession itself to 0, also now allows player
  to select a speciality to train to zero.
* Fix bug where sitting a 'min' and a 'level' greater than 1 on the training macro could
  give the wrong result. Now correctly applies the bonus before raising to minimum level.


## 0.15.2 (Beta)

* Perform a permission check before updating a spacecraft actor. Sometimes cost calculations
  were causing permission errors for scpacecraft in a locked compendium.
* Move some of the source images out of the package.
* Protection from active effects was only being applied if another armour types was already
  being worn.
* Character description is now displayed after the stat block, when an NPC or Traveller is
  embedded in a journal page.
* Add a /skill chat command to roll a named skill from the chat window. This is designed to allow
  users who can't see the character sheet to make skill checks.
* Update the /skills chat command to display a character's list of skills to the chat.
* Expand the example career, with some documentation and career term items.
* Change CSS of tables to have no background, making them more readable in dark mode.


## 0.15.1 (Beta)

* Automatically enable effects on components if the parent is equipped.
* Allow deck plans to be added to spacecraft sheets.
* Automatically set the player name field on a character sheet if a non-GM user creates
  a Traveller actor.
* If a non-GM creates a Traveller actor, and they don't already have a default character
  set, then we set this actor as this player's default. There is a world setting to
  disable this feature.
* Added example career to demonstrate how to use MgT2e macros and styles.

## 0.15.0 (Beta)

Migration Notes: There is a migration step for fixing active effects. Foundry v13 enforces
some sanity checking which highlights a bug in older versions of MgT2e. 0.15.0 includes a
migration step which fixes items with active effects defined, so that they will work on both
v12 and v13. You should upgrade to v0.15.0 before migrating to v13.

This version is marked as v13 as maximum compatibility, and v12 as verified. It seems to be
working on v13, but use with care.

* Journal styles now apply when editing journal pages.
* Added a world setting to define a default Traveller actor, from which the list of
  skills is taken for new actors and item skill lists.
* Added support for concealed M-Drives.
* Added support for oversized J and M drives.
* Cost of armoured bulkheads corrected. Bulkheads have their own section on the journal sheet.
* Added option for Holographic controls to Bridges.
* Implemented costs for more hull options.
* Display power requirements for general hardware types in ship journal sheet.
* Added basic tracking for defensive ship systems such as screens and point
  defence systems. This doesn't allow them to be used, but is preparation for later.
* Ship hardware is now sorted alphabetically when listed in a journal entry.
* Added repulsors as defensive ship options. Added meson and nuclear as damage types
  on weapons, so that we can later implement nuclear dampers and meson screens.
* Added spinal as a weapon trait, so we can later implement armour as a percentage reduction
  rather than absolute reduction.
* Mounted weapons are listed on the hardware mount on ship sheets.
* Fixed some very old bugs with active effects which 'worked' pre-v13, but which break in
  Foundry v13. Using Foundry v13 prior to 0.15.0 will actually corrupt any active effects.
  A migration has been added to fix things before upgrade.
* Added support for v2 API on active effects dialog, which is needed for v13.
* Improvements to CSS when using dark mode in v13.
* Removed very old migration steps.

## 0.14.0 (Beta)

Migration Notes: Ship Hardware of the 'General' type has a number of options on how
to automatically calculate tonnage, cost and power. Items will be migrated when the
item sheet is opened, but it's possible behaviour may change.

* Armoured status is now shown for all ship hardware types.
* Characteristics can now be trained according to Companion rules.
* Parent skills (those with specialities) no longer show option for training.
* Added name field to active effects, which is required by Foundry 13.
* General ship hardware items now provide more options for how tonnage, cost and power is
  calculated. This should cover a lot more of the options from High Guard. This changes
  how General ship hardware works.
* Journal CSS styles have been put back (white background, black text), with some better
  handling for v13. This style is used even in dark mode, and is designed to match the
  Mongoose style.
* Checking added to ensure items are writable before updating automatically
  generated values.

## 0.13.5 (Beta)

* Added option for adding Armoured Bulkheads to ship hardware.
* Client configurable added to split attack rolls into separate attack and damage rolls
  for those players who want to roll them separately. Not implemented for spacecraft yet.

## 0.13.4 (Beta)

* Bases can be edited and added on the world sheet.
* World sheet now includes description field.
* Starport facilities are now generated and displayed on the world sheet.
* Secret blocks are now supported in actor and item descriptions.
* Updated token for the Mercenary Cruiser.

## 0.13.3 (Beta)

* On world sheet, the government type was actually displaying the population code.
* Fixed bug where world map was not correctly displayed/set on a world sheet.
* Factions are now generated when a world is randomly generated.
* Factions are displayed on a world sheet, and can be edited.
* Use a roll table if available to generate world culture details.
* Generate information about bases and port facilities when randomly generating a world.
* Allow use of G and H in UWP hex codes.

## 0.13.2 (Beta)

* Fix bug in actor link within inline journal character sheets.
* Remove some CSS styling which breaks with Foundry 13. This removes the white background on journals.
* Fix breaking bug with Software items, which was preventing them from being created correctly.
* Fixed case on trade good codes.

## 0.13.1 (Beta)

* Fixed version numbering in the system.json file
* World trade codes are now recalculated when a UWP value is changed.
* Profession specialisation skills are now displayed if they are at level zero but trained.
* Skill training macro now supports adding new skills and specialisations.
* CSS for journal headings now focused on the page content, rather than the entire journal window
  (it was overriding the window title bar as well, which was undesirable).
* When buying an item, a dialog is now presented to confirm who is buying it.
* Weapon mount sheet was giving an error that prevented it from being opened if it wasn't a child of a spacecraft.

## 0.13.0 (Beta)

* Added agent option to skill macros, so a skill can be rolled without reference to an actor.
* Added `installedOn` field to software, to specify which device it is installed on.
* Updated software item sheet, to allow skills and interface to be set.
* Software items can now be added to an item with an embedded computer. Computers display a list
  of software they are running, and it can be executed from the item sheet.
* Skills can now be rolled from computer items, making use of software installed.
* Item icons can now be any height on the item sheet.
* Compendium packs now collected together into a folder by default.
* General items now include options for active effects.
* Increased maximum weapon AP to 999.
* Weapon traits now accelerate +/- rate when shift is held for large values.
* Pass attack traits down from a damage macro to the damage calculation.
* Active effect names can now be changed. Removed deprecated use of 'label' ready for Foundry 13.
* Possible fix for ctrl-key issue on Macs on Firefox where the XP Dialog for skills couldn't be accessed.
  I don't have a Mac so can't replicate or test.

## 0.12.5 (Beta)

* Added new icons for extra ship roles and several ship hardware item types.
* Engineering skills in some ship roles were wrong, this has been fixed.
* Added more common ship roles to the list in the 'add role' drop down.
* Fixed some cost calculations for spacecraft.
* Spacecraft listed in a journal now show up in the table of contents.
* Fixed bug where cost of small bridge wasn't halved.
* Added support for reinforced and light hulls.
* Fixed bug when parrying with a weapon.
* Fixed implementation of Shield trait for weapons.
* Reinforced and Light hulls for spacecraft now selectable and implemented.
* Added documentation for the implemented weapon traits.
* Fixed cost calculation of small bridges.
* Fixed display of some dynamic variables on spacecraft sheet which were forcing
  an actor update every time sheet was opened.
* Updated and resized vehicle tokens.

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

