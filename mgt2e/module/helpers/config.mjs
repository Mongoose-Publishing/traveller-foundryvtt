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
