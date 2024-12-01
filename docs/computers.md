# Computers

Computers can be embedded in several different item types.

Let's just assume that they can be embedded in anything which is a physical object.
They have processing power.
They need to have a list of software.
They need an interface.

The interface is just a software type. We could either hardcode in the interface, or just
treat it as a type of software.

What are the software types?
  * Interface
  * Security - Provides extra security for the computer.
  * Expert System - we already have rules for this.
  * Generic (no set game rules)
  * Task Bonus - similar to skill augment.


## Ship Software

There are tasks for which software is needed, or which it gives a bonus to.

### Ship Tasks

  * Make a jump
  * Evade
  * Fire Control
  * Auto-Repair


### Ship Statistics

What goes where? We can keep base data in flags, or in structure.
If we keep it in flags, then it's easier to update. Things that can be modified
by active effects need to be in template structure though.

#### Flags

  * sizeDM - Modifier from 0 to 6. Bonus to enemy attack rolls to hit this craft.
  * signatureDM - Modifier to enemy sensor checks to detect this craft.

#### Actor template

The following are part of `system.spacecraft.modifiers`:

  * evadeDM
  * stealthDM
  * initDM
  * ewDM
  * tacticsDM
  * fcDM
  * launchDM