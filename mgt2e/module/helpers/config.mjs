export const MGT2 = {};

// Define constants here, such as:
MGT2.foobar = {
  'bas': 'MGT2.bas',
  'bar': 'MGT2.bar'
};

MGT2.STATUS = {
  OKAY: 0,
  HURT: 1,
  UNCONSCIOUS: 2,
  DISABLED: 3,
  DEAD: 4,
  DESTROYED: 5
};

MGT2.HARDWARE_GENERAL = "general";
MGT2.HARDWARE_ARMOUR = "armour";
MGT2.HARDWARE_JUMP = "jump";

MGT2.SHIP_CONFIGURATION = new Map([
    [ "standard", 1.0 ],
    [ "streamlined", 1.2 ],
    [ "sphere", 0.9 ],
    [ "dispersed", 2.0 ]
]);

MGT2.getStatus = function(actor) {

  const data = actor.data.data;
  console.log(data);

};
MGT2.EFFECT_TYPES = {
  "CHA_AUG": "chaAug",
  "CHA_DM": "chaDM",
  "CHA_BOON": "chaBoon",
  "CHA_BANE": "chaBane",
  "SKILL_AUG": "skillAug",
  "SKILL_DM": "skillDM",
  "SKILL_EXPERT": "skillExpert",
  "DM": "miscDM"
};

MGT2.EFFECTS = {
  "chaAug": { "targets": "char", "value": true, "property": "augment", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
  "chaDM": { "targets": "char", "value": true, "property": "augdm", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
  "chaBoon": { "targets": "char", "value": false, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE },
  "chaBane":  { "targets": "char", "value": false, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE },
  "skillAug":  { "targets": "skills", "value": true, "property": "augment", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
  "skillDM": { "targets": "skills", "value": true, "property": "augdm", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
  "skillExpert": { "targets": "skills", "value": true, "property": "expert", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE },
  "miscDM": { "targets": "misc", "value": true, "property": "effect", mode: CONST.ACTIVE_EFFECT_MODES.ADD }
};

MGT2.CREATURES = {
  "behaviours": {
    "herbivore": { "skills": [], "group": "diet" },
    "omnivore": { "skills": [], "group": "diet" },
    "carnivore": { "skills": [], "group": "diet" },
    "scavenger": { "skills": [], "group": "diet" },
    "metal": { "skills": [], "group": "diet" },
    "carrionEater": { "skills": ["recon"] },
    "chaser": { "skills": [ "athletics.dexterity", "athletics.endurance" ] },
    "eater": { "skills": [ ] },
    "filter": { "skills": [ ] },
    "gatherer": { "skills": [ "stealth" ] },
    "grazer": { "skills": [ ] },
    "hunter": { "skills": [ "survival" ] },
    "hijacker": { "skills": [ ] },
    "intimidator": { "skills": [ "persuade" ] },
    "killer": { "skills": [ "melee.natural" ] },
    "intermittent": { "skills": [ ] },
    "mindless": { "skills": [ ] },
    "pouncer": { "skills": [ "stealth", "recon", "athletic.dexterity", "athletics.strength" ] },
    "reducer": { "skills": [ ] },
    "siren": { "skills": [ "deception" ] },
    "sophont": { "skills": [ ] },
    "trapper": { "skills": [ ] }
  },
  "traits": {
    "alarm": { },
    "amphibious": {},
    "camouflaged": { "skills": [ { skill: "stealth", bonus: 2 }] },
    "diseased": {},
    "echolocation": {},
    "fastMetabolism": { "set": "initiative.base", "min": 1, "max": 6, "conflict": "slowMetabolism" },
    "flyer": { "default": 3, "choices": [ "idle", "verySlow", "slow", "medium", "high", "fast", "veryFast", "subsonic", "supersonic", "hypersonic" ]},
    "heightenedSenses": { "skills": [ { "skill": "recon", "bonus": 1 }, { "skill": "survival", "bonus": 1 }] },
    "iuVision": {},
    "psionic": { "value": 7, "characteristic": "PSI" },
    "slowMetabolism": { "set": "initiative.base", "min": -6, "max": -1, "conflict": "fastMetabolism" }
  },
  "sizes": {
    "-4": { "label": "small", "damage": "1", "minHits": 1, "maxHits": 2, "width": 0.5 },
    "-3": { "label": "small", "damage": "1D3", "minHits": 3, "maxHits": 5, "width": 0.5 },
    "-2": { "label": "small", "damage": "1D3", "minHits": 6, "maxHits": 7, "width": 0.5 },
    "-1": { "label": "small", "damage": "1D6", "minHits": 8, "maxHits": 13, "width": 1 },
    "0": { "label": "medium", "damage": "1D6", "minHits": 14, "maxHits": 28, "width": 1 },
    "1": { "label": "large", "damage": "2D6", "minHits": 29, "maxHits": 35, "width": 2 },
    "2": { "label": "large", "damage": "3D6", "minHits": 36, "maxHits": 49, "width": 2 },
    "3": { "label": "large", "damage": "4D6", "minHits": 50, "maxHits": 70, "width": 2 },
    "4": { "label": "large", "damage": "5D6", "minHits": 71, "maxHits": 90, "width": 3 },
    "5": { "label": "large", "damage": "6D6", "minHits": 91, "maxHits": 125, "width": 3 },
    "6": { "label": "large", "damage": "7D6", "minHits": 125, "maxHits": 250, "width": 4 }
  }
};