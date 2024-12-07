# Creatures

Creatures are one of the types of Actors that are used in MgT2e. They are simpler than
any of the other actor types, and represent (normally) non-sophont critters that are
mostly just there as targets in combat.

## Properties

Creatures have two primary properties that are unique to them - *Behaviours* and *Traits*.

These are defined under MGT2.CREATURES. They are a list of hardcoded values which can be
applied to a creature. Some are just markers, others modify the actor's other attributes.

All behaviours and traits have a name, which must be purely alphabetical ([a-zA-Z]), with
no spaces or special characters. It is customary to use camelcase, e.g. "myTrait" or
"superHearing" etc.

It is also important that traits and behaviour names aren't a substring of another one.
So if there is a trait "heightenedSenses", do not create a trait called "height".

### Behaviours

Behaviours are defined by MGT2.CREATURES.behaviours. They represent how the creature
behaves, as per the Mongoose Traveller core rules.

For example:

```json
    "scavenger": { "skills": [], "group": "diet" },
    "metal": { "skills": [], "group": "diet" },
    "carrionEater": { "skills": ["recon"] },
    "chaser": { "skills": [ "athletics.dexterity", "athletics.endurance" ] },
```

`skills` is an array of skills that the behaviour causes to be 'trained'. Any creature
with that behaviour will be trained in the listed skills. The array is required, but
may be empty.

`group` defines a CSS class to apply to the listed behaviour. Currently it is just used
to display the primary behaviours (herbivore, omnivore, carnivore etc) in a darker shade.

There must be a localization value for the behaviour, as well as the hover text that
is associated with the behaviour:

"MGT2.Creature.Behaviour.newBehaviour": "New Behaviour"
"MGT2.Creature.BehaviourText.newBehaviour": "This creature exhibits new behaviour"


### Traits

Traits are defined by MGT2.CREATURES.traits. They represent special abilities that the
creature has. Like behaviours, they are options that are applied to the creature. They
have a more complicated set of properties though.

For example:

```json
    "fastMetabolism": { "set": "initiative.base", "min": 1, "max": 6, "conflict": "slowMetabolism" },
    "floater": {},
    "flyer": { "default": 3, "choices": [ "idle", "verySlow", "slow", "medium", "high", "fast", "veryFast", "subsonic", "supersonic", "hypersonic" ]},
    "gigantic": { "value": 1, "min": 1, "max": 6 },
```

`set` overrides a property on the actor. In the above case, "fastMetabolism" sets initiative.
`min` and `max` define a range for numeric properties. They default to 1 and 21 if not defined.
`conflict` specifies a trait that is incompatible with this trait. Normally there will be pairs
of traits which conflict with each other. If one is selected, then the other can't be.
`choices` provides a list of options for this trait.
`default` defines the default index (zero based) in the list of choice options.
`value` means a number will be shown next to the trait. It doesn't apply to anything, it's
just something for the GM and players to see.

Just as for Behaviours, there must be localization values defined:

"MGT2.Creature.Trait.newTrait": "New Trait"

If a trait has choices defined, then each choice must also be purely alphabetical, and uses
localization to define what text is displayed:

"MGT2.Creature.TraitChoice.newTrait.choice0": "First Choice",
"MGT2.Creature.TraitChoice.newTrait.choice1": "Middle Choice",
"MGT2.Creature.TraitChoice.newTrait.choice2": "Last Choice",
