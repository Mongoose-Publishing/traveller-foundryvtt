# Release Notes

## Known Issues

* Behaviour drop down on Creature character sheet immediately closes after opening unless mouse button
  is held down.

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

