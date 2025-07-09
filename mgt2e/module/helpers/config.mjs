export const MGT2 = {};

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

MGT2.DEFAULT_ITEM_ICON = "systems/mgt2e/icons/items/item.svg";

MGT2.SHIP_HARDWARE = {
    "j-drive": {
        "cost": 1.5,
        "minimum": 10,
        "tonnage": 5,
        "rating": {
            1: { "tonnage": 2.5, "power": 10, "tl": 9 },
            2: { "tonnage": 5.0, "power": 20, "tl": 11 },
            3: { "tonnage": 7.5, "power": 30, "tl": 12 },
            4: { "tonnage": 10, "power": 40, "tl": 13 },
            5: { "tonnage": 12.5, "power": 50, "tl": 14 },
            6: { "tonnage": 15, "power": 60, "tl": 15 },
            7: { "tonnage": 17.5, "power": 70, "tl": 16 },
            8: { "tonnage": 20, "power": 80, "tl": 17 },
            9: { "tonnage": 22.5, "power": 90, "tl": 18 }
        }
    },
    "m-drive": {
        "cost": 2,
        "rating": {
            0: { "tonnage": 0.5, "power": 0.25, "tl": 9 },
            1: { "tonnage": 1, "power": 10, "tl": 9 },
            2: { "tonnage": 2, "power": 20, "tl": 10 },
            3: { "tonnage": 3, "power": 30, "tl": 10 },
            4: { "tonnage": 4, "power": 40, "tl": 11 },
            5: { "tonnage": 5, "power": 50, "tl": 11 },
            6: { "tonnage": 6, "power": 60, "tl": 12 },
            7: { "tonnage": 7, "power": 70, "tl": 13 },
            8: { "tonnage": 8, "power": 80, "tl": 14 },
            9: { "tonnage": 9, "power": 90, "tl": 15 },
            10: { "tonnage": 10, "power": 100, "tl": 16 },
            11: { "tonnage": 11, "power": 110, "tl": 17 }
        }
    },
    "r-drive": {
        "cost": 0.2,
        "rating": {
            0: { "tonnage": 1, "power": 0, "tl": 7 },
            1: { "tonnage": 2, "power": 0, "tl": 7 },
            2: { "tonnage": 4, "power": 0, "tl": 7 },
            3: { "tonnage": 6, "power": 0, "tl": 7 },
            4: { "tonnage": 8, "power": 0, "tl": 8 },
            5: { "tonnage": 10, "power": 0, "tl": 8 },
            6: { "tonnage": 12, "power": 0, "tl": 8 },
            7: { "tonnage": 14, "power": 0, "tl": 9 },
            8: { "tonnage": 16, "power": 0, "tl": 9 },
            9: { "tonnage": 18, "power": 0, "tl": 9 },
            10: { "tonnage": 20, "power": 0, "tl": 10 },
            11: { "tonnage": 22, "power": 0, "tl": 10 },
            12: { "tonnage": 24, "power": 0, "tl": 10 },
            13: { "tonnage": 26, "power": 0, "tl": 11 },
            14: { "tonnage": 28, "power": 0, "tl": 11 },
            15: { "tonnage": 30, "power": 0, "tl": 11 },
            16: { "tonnage": 32, "power": 0, "tl": 12 }
        }
    }
}

MGT2.VEHICLES = {
  "CHASSIS": {
      "lightGround": {
          "tl": 4, "skill": "drive.wheel", "agility": 0, "minSpaces": 1, "maxSpaces": 20,
          "cost": 750, "hull": 2, "shipping": 0.5,
          "subtypes": {
              "standard": { },
              "openFrame": {
                  "tl": 0, "agility": 1, "minSpaces": 1, "maxSpaces": 3, "cost": 750,
                  "speed": 1, "traits": "openVehicle"
              },
              "monowheel": {
                  "tl": 9, "agility": 2, "minSpaces": 1, "maxSpaces": 3, "cost": 2500,
                  "speed": 1, "traits": "openVehicle"
              },
              "railRider": {
                  "agility": -2, "cost": 400, "speed": -1
              },
              "roughTerrain": {
                  "cost": 100, "traits": "offRoader"
              },
              "tracks": {
                  "tl": 5, "skill": "drive.track", "cost": 750, "speed": -1, "traits": "tracked"
              }
          }
      },
      "heavyGround": {
        "tl": 4, "skill": "drive.wheel", "agility": -2, "minSpaces": 20, "cost": 3000,
        "hull": 3, "shipping": 0.5,
        "subtypes": {
            "standard": { },
            "afv": { "tl": 5, "cost": 3000, "speed": -1, "traits": "afv offRoader" },
            "railRider": { "agility": -2, "cost": 1000, "speed": 1 },
            "roughTerrain": { "cost": 500, "traits": "offRoader" },
            "tracks": { "tl": 5, "skill": "drive.track", "cost": 2000, "speed": -1, "traits": "tracked" },
            "tunneller": { "tl": 7, "skill": "drive.mole", "cost": 25000, "speed": -1 }
        }
      },
      "lightGrav": {
          "tl": 8, "skill": "flyer.grav", "agility": 1, "minSpaces": 1, "maxSpaces": 20,
          "cost": 30000, "hull": 2, "shipping": 0.5,
          "subtypes": {
              "standard": { },
              "openFrame": {
                  "tl": 0, "agility": 1, "minSpaces": 1, "maxSpaces": 3, "cost": 10000,
                  "speed": 1, "traits": "openVehicle"
              },
              "streamlined": {
                  "tl": 0, "agility": 1, "cost": 30000, "speed": 1
              }
          }
      },
      "heavyGrav": {
          "tl": "8", "skill": "flyer.grav", "agility": -1, "minSpaces": 20,
          "cost": 80000, "hull": 2, "shipping": 0.5,
          "subtypes": {
              "standard": { },
              "afv": {
                  "cost": 100000, "speed": -1, "traits": "afv"
              },
              "streamlined": {
                  "cost": 50000, "speed": 1
              }
          }
      },
      "unpoweredVehicle": {
          "tl": 1, "skill": "drive.wheel", "agility": -1, "minSpaces": 1, "maxSpaces": 10,
          "cost": 100, "hull": 1, "shipping": 0.5,
          "subtypes": {
              "standard": { },
              "windPowered": {
                  "cost": 200
              }
          }
      },
      "unpoweredBoat": {
          "tl": 1, "skill": "seafarer.personal", "agility": -1, "minSpaces": 1,
          "cost": 150, "hull": 1, "shipping": 1,
          "subtypes": {
              "standard": {},
              "outboardMotorSlow": {
                  "tl": 3, "cost": 100, "speed": 0
              },
              "outboardMotorFast": {
                  "tl": 3, "cost": 250, "speed": 1
              }
          }
      },
      "poweredBoat": {
          "tl": 3, "skill": "seafarer.personal", "agility": -2, "minSpaces": 5, "maxSpaces": 50,
          "cost": 2000, "hull": 2, "shipping": 0.5,
          "subtypes": {
              "standard": {},
              "hydrofoil": {
                  "cost": 4000, "speed": 1
              }
          }
      },
      "ship": {
          "tl": 4, "skill": "seafarer.oceanShips", "agility": -6, "minSpaces": 50,
          "cost": 5000, "hull": 4, "shipping": 0.5,
          "subtypes": {
              "standard": {},
              "hydrofoil": {
                  "cost": 8000, "speed": 1
              }
          }
      },
      "lightSubmersible": {
          "tl": 4, "skill": "seafarer.submarine", "agility": -2, "minSpaces": 1, "maxSpaces": 20,
          "cost": 50000, "hull": 3, "shipping": 0.5,
          "subtypes": {
              "standard": {}
          }
      },
      "heavySubmersible": {
          "tl": 4, "skill": "seafarer.submarine", "agility": -4, "minSpaces": 20,
          "cost": 100000, "hull": 3, "shipping": 0.5,
          "subtypes": {
              "standard": {}
          }
      },
      "airship": {
          "tl": 3, "skill": "flyer.airship", "agility": -3, "minSpaces": 10,
          "cost": 300,
          "subtypes": {
              "standard": {},
              "liftingBody": {}
          }
      },
      "lightAeroplane": {
          "tl": 4, "skill": "flyer.wing", "agility": 1, "minSpaces": 1, "maxSpaces": 10,
          "cost": 15000, "hull": 0.5,
          "subtypes": {
              "standard": {}
          }
      },
      "heavyAeroplane": {
          "subtypes": {
              "standard": {}
          }
      },
      "lightJet": {
          "subtypes": {
              "standard": {}
          }
      },
      "heavyJet": {
          "subtypes": {
              "standard": {}
          }
      },
      "helicopter": {
          "subtypes": {
              "standard": {}
          }
      },
      "aerodyne": {
          "subtypes": {
              "standard": {}
          }
      },
      "ornithopter": {
          "subtypes": {
              "standard": {}
          }
      },
      "lightWalker": {
          "subtypes": {
              "standard": {}
          }
      },
      "heavyWalker": {
          "subtypes": {
              "standard": {}
          }
      },
      "lightHovercraft": {
          "subtypes": {
              "standard": {}
          }
      },
      "heavyHovercraft": {
          "subtypes": {
              "standard": {}
          }
      }
  },
  "SPEED": {
      "stopped": { band: 0, max: 0 },
      "idle": { band: 1, max: 1 },
      "verySlow": { band: 2, max: 50 },
      "slow": { band: 3, max: 100 },
      "medium": { band: 4, max: 200 },
      "high": { band: 5, max: 300 },
      "fast": { band: 6, max: 500 },
      "veryFast": { band: 7, max: 800 },
      "subsonic": { band: 8, max: 1200 },
      "supersonic": { band: 9, max: 6000 },
      "hypersonic": { band: 10 }
  }
};

MGT2.SHIP_CONFIGURATION = {
  "standard":    {
      "armour": 1.0, "cost": 1.0, "hull": 1.0, "volume": 1.0, "streamlined": "partial", "armourBonus": 0
  },
  "streamlined": {
      "armour": 1.2, "cost": 1.2, "hull": 1.0, "volume": 1.0, "streamlined": "yes", "armourBonus": 0
  },
  "dispersed":   {
      "armour": 2.0, "cost": 0.5, "hull": 0.9, "volume": 1.0, "streamlined": "no", "armourBonus": 0
  },
  "sphere": {
      "armour": 0.9, "cost": 1.1, "hull": 1.0, "volume": 1.0, "streamlined": "partial", "armourBonus": 0
  },
  "close": {
      "armour": 1.5, "cost": 0.8, "hull": 1.0, "volume": 1.0, "streamlined": "partial", "armourBonus": 0
  },
  "planetoid": {
      "armour": 1.0, "cost": 0.08, "hull": 1.25, "volume": 0.8, "streamlined": "no", "armourBonus": 2
  },
  "buffered": {
      "armour": 1.0, "cost": 0.08, "hull": 1.5, "volume": 0.65, "streamlined": "no", "armourBonus": 4
  }
};

MGT2.SPACE_RANGES = {
    "adjacent": { "distance": 1, "dm": 0 },
    "close": { "distance": 10, "dm": 0 },
    "short": { "distance": 1250, "dm": 1 },
    "medium": { "distance": 10000, "dm": 0 },
    "long": { "distance": 25000, "dm": -2 },
    "verylong": { "distance": 50000, "dm": -4 },
    "distant": { "distance": 300000, "dm": -6 },
    "verydistant": { "distance": 5000000, "dm": -12 },
    "far": { "distance": 1000000000, "dm": -18 }
}

MGT2.SPACE_MOUNTS = {
    "fixed": { "multiplier": 1, "hardpoints": 1 },
    "turret": { "multiplier": 1, "hardpoints": 1 },
    "barbette": { "multiplier": 3, "hardpoints": 1 },
    "bay.small": { "multiplier": 10, "hardpoints": 1 },
    "bay.medium": { "multiplier": 20, "hardpoints": 1 },
    "bay.large": { "multiplier": 100, "hardpoints": 5 },
    "spinal": { "multiplier": 1000, "hardpoints": 0.01 }
}

MGT2.SPACECRAFT_ADVANCES = {
    "earlyPrototype": { "tl": -2, "tonnage": 2, "cost": 11, "modifications": -2 },
    "prototype": { "tl": -1, "tonnage": 1, "cost": 6, "modifications": -1 },
    "budget": { "tl": 0, "tonnage": 1, "cost": 0.75, "modifications": -1 },
    "standard": { "tl": 0, "tonnage": 1, "cost": 1, "modifications": 0 },
    "advanced": { "tl": 2, "tonnage": 1, "cost": 1.1, "modifications": 1 },
    "veryAdvanced": { "tl": 2, "tonnage": 1, "cost": 1.25, "modifications": 2 },
    "highTech": { "tl": 3, "tonnage": 1, "cost": 1.5, "modifications": 3 }
}

MGT2.SPACECRAFT_HULLS = {
    "reinforced": { "conflict": [ "light"], "cost": +50, "hits": 1.1 },
    "light": { "conflict": [ "reinforced"], "cost": -25, "hits": 0.9 },
    "military": { "cost": +25, "min": 5000 },
    /*
    "nonGravity": { "cost": 0.5, "max": 500000 },
    "basicStealth": { "conflict": [ "improvedStealth", "enhancedStealth", "advancedStealth"]},
    "improvedStealth": { "conflict": [ "basicStealth", "enhancedStealth", "advancedStealth"]},
    "enhancedStealth": { "conflict": [ "basicStealth", "improvedStealth", "advancedStealth"]},
    "advancedStealth": { "conflict": [ "basicStealth", "improvedStealth", "enhancedStealth"]},
    */
}

MGT2.SPACECRAFT_ADVANTAGES = {
   "j-drive": {
       "decreasedFuel": { "cost": 1, "fuel": -10, "multi": true },
       "earlyJump": { "cost": 1, "multi": true },
       "energyEfficient": { "cost": 1, "power": -25, "multi": true },
       "sizeReduction": { "cost": 1, "size": -10, "multi": true },
       "stealthJump": { "cost": 2 },
       "energyInefficient": { "cost": -1, "power": +30, "multi": true },
       "lateJump": { "cost": -1 },
       "increasedSize": { "cost": -1, "size": +25 }
   },
   "m-drive": {
       "energyEfficient": { "cost": 1, "power": -25, "multi": true },
       "sizeReduction": { "cost": 1, "size": -10, "multi": true },
       "energyInefficient": { "cost": -1, "power": +30, "multi": true },
       "limitedRange": { "cost": -1 },
       "increasedSize": { "cost": -1, "multi": true },
       "orbitalRange": { "cost": -2 }
   },
   "r-drive": {
       "fuelEfficient": { "cost": 1, "fuel": -20, "multi": true },
       "fuelInefficient": { "cost": -1, "fuel": +25, "multi": true }
   },
   "power": {
       "increasedPower": { "cost": 2, "output": +10, "multi": true },
       "sizeReduction": { "cost": 1, "size": -10, "multi": true },
       "energyInefficient": { "cost": -1, "output": -25, "multi": true },
       "increasedSize": { "cost": -1, "size": +25, "multi": true }
   }
};

MGT2.SPACECRAFT_CRITICALS = {
    "sensors": [
        { "sensorDM": -2 },
        { "sensorMax": "medium" },
        { "sensorMax": "short" },
        { "sensorMax": "close" },
        { "sensorMax": "adjacent" },
        { "sensorsDisabled": true }
    ],
    "powerPlant": [
        { "powerReduction": 10 },
        { "powerReduction": 20 },
        { "powerReduction": 70 },
        { "powerReduction": 100 },
        { "powerReduction": 100, "hull": "1" },
        { "powerReduction": 100, "hull": "1D6" }
    ],
    "fuel": [
        { "fuelLeak": "hour" },
        { "fuelLeak": "round" },
        { "lose": "1D6 * 10" },
        { "destroyed": true },
        { "destroyed": true, "hull": "1" },
        { "destroyed": true, "hull": "1D6" }
    ],
    "weapon": [
        { "weaponDM": -1 },
        { "disabled": true },
        { "destroyed": "1" },
        { "destroyed": "1", "hull": 1 },
        { "destroyed": "1D3", "hull": 1 },
        { "destroyed": "1D6", "hull": 1 }
    ],
    "armour": [
        { "armour": "1" },
        { "armour": "1D3" },
        { "armour": "1D6" },
        { "armour": "1D6" },
        { "armour": "2D6", "hull": "1" },
        { "armour": "2D6", "hull": "1" }
    ],
    "hull": [
        { "damage": "1D6" },
        { "damage": "2D6" },
        { "damage": "3D6" },
        { "damage": "4D6" },
        { "damage": "5D6" },
        { "damage": "6D6" }
    ],
    "mDrive": [
        { "pilotDM": -1 },
        { "pilotDM": -2, "thrust": -1 },
        { "pilotDM": -3, "thrust": -2 },
        { "pilotDM": -4, "thrust": -3 },
        { "disabled": true },
        { "disabled": true, "hull": "1" }
    ],
    "cargo": [
        { "cargoLoss": "10" },
        { "cargoLoss": "1D6 * 10" },
        { "cargoLoss": "2D6 * 10" },
        { "cargoLoss": "100" },
        { "cargoLoss": "100", "hull": "1" },
        { "cargoLoss": "100", "hull": "1" }
    ],
    "jDrive": [
        { "jumpDM": -2 },
        { "disabled": true },
        { "destroyed": true },
        { "destroyed": true, "hull": 1 },
        { "destroyed": true, "hull": 1 },
        { "destroyed": true, "hull": 1 }
    ],
    "crew": [
        { "crewDamaged": "1,1D6" },
        { "lifeSupportFails": "hours" },
        { "crewDamaged": "1D6,2D6" },
        { "lifeSupportFails": "rounds" },
        { "crewDamaged": "3D6" },
        { "lifeSupportFails": "immediate" }
    ],
    "bridge": [

    ]
}

MGT2.SPACECRAFT_DAMAGE = {
  "fuelHour": {},
  "fuelRound": {},
  "powerPlant": {},
  "armour": {},
  "control": {},
  "thrust": {},
  "pilotDM": {},
  "jumpDM": {},
  "lifeSupport": {},
  "sensorDM": {},
  "sensorMax": {}
};

MGT2.getStatus = function(actor) {
  const data = actor.data.data;
  console.log(data);

};

MGT2.TRADE = {
    "codes": {
        "Ag": {},
        "As": {},
        "Ba": {},
        "De": {},
        "Fl": {},
        "Ga": {},
        "Hi": {},
        "Ht": {},
        "Ic": {},
        "In": {},
        "Lo": {},
        "Lt": {},
        "Na": {},
        "Ni": {},
        "Po": {},
        "Ri": {},
        "Va": {},
        "Wa": {}
    },
    "zones": {
        "Amber": {},
        "Red": {}
    }
}

MGT2.CHARACTERISTICS = {
  "STR": { "value": 7, "current": 7, "show": true,  "default": false  },
  "DEX": { "value": 7, "current": 7, "show": true,  "default": false  },
  "END": { "value": 7, "current": 7, "show": true,  "default": false  },
  "INT": { "value": 7, "current": 7, "show": true,  "default": false  },
  "EDU": { "value": 7, "current": 7, "show": true,  "default": false  },
  "SOC": { "value": 7, "current": 7, "show": true,  "default": false  },
  "CHA": { "value": 7, "current": 7, "show": false, "default": false  },
  "TER": { "value": 0, "current": 0, "show": false, "default": false  },
  "PSI": { "value": 0, "current": 0, "show": false, "default": false  },
  "WLT": { "value": 7, "current": 7, "show": false, "default": false  },
  "LCK": { "value": 7, "current": 7, "show": false, "default": false  },
  "MRL": { "value": 7, "current": 7, "show": false, "default": false  },
  "STY": { "value": 7, "current": 7, "show": false, "default": false  },
  "RES": { "value": 7, "current": 7, "show": false, "default": false  },
  "FOL": { "value": 0, "current": 0, "show": false, "default": false  },
  "REP": { "value": 0, "current": 0, "show": false, "default": false  }
};

MGT2.SKILLS = {
    "admin": { "default": "EDU", "background": true, "requires": "INT" },
    "advocate": { "default": "EDU", "requires": "INT" },
    "animals": { "default": "INT", "background": true, "requires": "INT",
      "specialities": {
        "handling": { "default": "DEX" },
        "vetinary": { "default": "EDU" },
        "training": { "default": "INT" }
      }
    },
    "art": { "default": "INT", "background": true, "requires": "INT",
      "specialities": {
        "performer": { },
        "holography": { },
        "instrument": { },
        "visualMedia": { },
        "write": { }
      }
    },
    "astrogation": { "default": "EDU", "requires": "INT" },
    "athletics": { "default": "DEX", "background": true, "creature": true, "requires": "DEX",
      "specialities": {
        "dexterity": { "default": "DEX", "combat": true },
        "endurance": { "default": "END" },
        "strength": { "default": "STR", "combat": true }
      }
    },
    "broker": { "default": "INT", "requires": "INT" },
    "carouse": { "default": "SOC", "background": true, "requires": "INT" },
    "deception": { "default": "INT", "requires": "INT", "creature": true },
    "diplomat": { "default": "SOC", "requires": "INT" },
    "drive": { "default": "DEX", "background": true, "requires": "DEX",
      "specialities": {
        "hovercraft": { },
        "mole": { },
        "track": { },
        "walker": { },
        "wheel": { }
      }
    },
    "electronics": { "default": "EDU", "background": true, "requires": "INT",
      "specialities": {
        "comms": {  },
        "computers": {  },
        "remoteOps": {  },
        "sensors": {  }
      }
    },
    "engineer": { "default": "EDU", "requires": "INT",
      "specialities": {
        "mDrive": {  },
        "jDrive": {  },
        "lifeSupport": {  },
        "power": { }
      }
    },
    "explosives": {
      "default": "EDU",
      "requires": "INT",
      "combat": true
    },
    "flyer": { "default": "DEX", "background": true, "requires": "DEX", "specialities": {
        "airship": { }, "grav": { }, "ornithopter": { }, "rotor": { }, "wing": { } }
    },
    "gambler": { "default": "INT", "requires": "INT"  },
    "gunner": { "default": "DEX", "requires": "INT", "specialities": {
        "turret": { "combat": true },
        "ortillery": { "combat": true },
        "screen": { "combat": true },
        "capital": { "default": "INT", "combat": true }
      }
    },
    "guncombat": { "default": "DEX", "requires": "DEX", "creature": true,
      "specialities": {
        "archaic": {
          "combat": true
        },
        "energy": {
          "combat": true
        },
        "slug": {
          "combat": true
        }
      }
    },
    "heavyweapons": {
      "default": "DEX",
      "requires": "INT",
      "specialities": {
        "artillery": {
          "combat": true
        },
        "portable": {
          "combat": true
        },
        "vehicle": {
          "combat": true
        }
      }
    },
    "independence": {
      "default": "INT",
      "requires": "TER"
    },
    "investigate": {
      "default": "INT",
      "requires": "INT"
    },
    "jackofalltrades": {
      "default": "INT",
      "requires": "INT"
    },
    "language": {
      "default": "EDU",
      "background": true,
      "requires": "INT",
      "specialities": {
        "galanglic": {
        },
        "vilani": {
        },
        "zdetl": {
        },
        "oynprith": {
        },
        "trokh": {
        },
        "gvegh": {
        }
      }
    },
    "leadership": {
      "default": "SOC",
      "requires": "INT"
    },
    "mechanic": {
      "default": "EDU",
      "background": true,
      "requires": "INT"
    },
    "medic": {
      "default": "EDU",
      "background": true,
      "requires": "INT"
    },
    "melee": {
      "default": "DEX",
      "requires": "DEX",
      "creature": true,
      "specialities": {
        "unarmed": {
          "combat": true
        },
        "blade": {
          "combat": true
        },
        "bludgeon": {
          "combat": true
        },
        "natural": {
          "combat": true
        }
      }
    },
    "navigation": {
      "default": "INT",
      "requires": "INT"
    },
    "persuade": {
      "default": "SOC",
      "requires": "INT",
      "creature": true
    },
    "pilot": {
      "default": "DEX",
      "requires": "INT",
      "specialities": {
        "smallCraft": {
        },
        "spacecraft": {
        },
        "capitalShips": {
        }
      }
    },
    "profession": {
      "default": "INT",
      "background": true,
      "requires": "INT",
      "individual": true,
      "specialities": {
        "belter": {
        },
        "biologicals": {
        },
        "civilEngineering": {
        },
        "construction": {
        },
        "hydroponics": {
        },
        "polymers": {
        },
        "robotics": {
        }
      }
    },
    "recon": {
      "default": "INT",
      "requires": "INT",
      "creature": true
    },
    "science": {
      "default": "EDU",
      "background": true,
      "requires": "INT",
      "specialities": {
        "archaeology": {
        },
        "astronomy": {
        },
        "biology": {
        },
        "chemistry": {
        },
        "cosmology": {
        },
        "cybernetics": {
        },
        "economics": {
        },
        "genetics": {
        },
        "history": {
        },
        "linquistics": {
        },
        "philosophy": {
        },
        "physics": {
        },
        "planetology": {
        },
        "psionicology": {
        },
        "psycology": {
        },
        "robotics": {
        },
        "sophontology": {
        },
        "xenology": {
        }
      }
    },
    "seafarer": {      "default": "INT",      "background": true,      "requires": "INT",      "specialities": {
      "oceanShips": { },
        "personal": { },
        "sail": { },
        "submarine": { }
      }
    },
    "stealth": { "default": "DEX", "requires": "INT", "creature": true },
    "steward": { "default": "SOC", "requires": "INT" },
    "streetwise": { "default": "INT", "background": true, "requires": "INT" },
    "survival": { "default": "EDU", "background": true, "requires": "INT", "creature": true },
    "tactics": { "default": "EDU",  "requires": "INT", "specialities": { "military": { }, "naval": { } } },
    "vaccsuit": { "default": "DEX", "background": true, "requires": "INT" },
    "telepathy": { "default": "PSI", "requires": "PSI", "trait": "psionic", "icon": "systems/mgt2e/icons/skills/psi.svg"    },
    "clairvoyance": { "default": "PSI", "requires": "PSI", "trait": "psionic", "icon": "systems/mgt2e/icons/skills/psi.svg"    },
    "telekinesis": { "default": "PSI", "requires": "PSI", "trait": "psionic", "icon": "systems/mgt2e/icons/skills/psi.svg"    },
    "awareness": { "default": "PSI", "requires": "PSI", "trait": "psionic", "icon": "systems/mgt2e/icons/skills/psi.svg"    },
    "teleportation": { "default": "PSI", "requires": "PSI", "trait": "psionic", "icon": "systems/mgt2e/icons/skills/psi.svg"    },
    "untrained": { "default": "INT", "requires": "XXX" }
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
  "chaMin": { "targets": "char", "value": true, "property": "min", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE },
  "skillAug":  { "targets": "skills", "value": true, "property": "augment", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
  "skillDM": { "targets": "skills", "value": true, "property": "augdm", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
  "skillExpert": { "targets": "skills", "value": true, "property": "expert", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE },
  "miscDM": { "targets": "misc", "value": true, "property": "effect", mode: CONST.ACTIVE_EFFECT_MODES.ADD }
};

MGT2.SOFTWARE_EFFECTS = {
    "spacecraft": {
        "type": [ "generic", "interface", "bonus" ],
        "bonus": {
            "evade": "system.spacecraft.modifiers.evadeDM",
            "init": "system.spacecraft.modifiers.initDM",
            "fireControl": "system.spacecraft.modifiers.fcDM"
        }
    },
    "personal": {
        "type": [ "generic", "interface", "bonus" ],
        "bonus": {
            "chaDM": { "targets": "char", "value": true, "property": "augdm", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
            "skillAug":  { "targets": "skills", "value": true, "property": "augment", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
            "skillDM": { "targets": "skills", "value": true, "property": "augdm", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
            "skillExpert": { "targets": "skills", "value": true, "property": "expert", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE }
        }
    }
}
MGT2.COMPUTERS = {
  "techLevel": {
    "7": { computer: 5, core: 0 },
    "8": { computer: 5, core: 0 },
    "9": { computer: 10, core: 40 },
    "10": { computer: 10, core: 50 },
    "11": { computer: 15, core: 60 },
    "12": { computer: 20, core: 70 },
    "13": { computer: 25, core: 80 },
    "14": { computer: 30, core: 90 },
    "15": { computer: 35, core: 100 }
  }
};

MGT2.WEAPONS = {
    "energyTypes": [ "laser", "plasma", "fire", "energy", "cutting" ],
    "traits": {
        "artillery": { "scale": "traveller" },
        "ap": {  "value": 1, "min": 1, "max": 999, "conflict": [ "loPen" ] },
        "auto": {  "value": 2, "min": 2, "max": 99, "conflict": [ "oneUse" ] },
        "blast": { "scale": "traveller", "value": 1, "min": 1, "max": 10000 },
        "bulky": { "scale": "traveller", "conflict": [ "veryBulky" ] },
        "chainReaction": { "scale": "spacecraft" },
        "dangerous": { "scale": "traveller", "conflict": [ "veryDangerous" ] },
        "destructive": { },
        "fire": { "scale": "traveller" },
        "ion": { "scale": "spacecraft" },
        "laserSight": { "scale": "traveller" },
        "loPen": { "value": 2, "min": 2, "max": 99, "conflict": [ "ap" ] },
        "missile": { "scale": "spacecraft", "value": 1, "min": 1, "max": 120 },
        "oneUse": { "conflict": [ "auto" ] },
        "orbitalBombardment": { "scale": "spacecraft" },
        "orbitalStrike": { "scale": "spacecraft" },
        "protection": { "scale": "traveller", "value": 1, "min": 1, "max": 20 },
        "psiDmg": { "value": 1, "min": 1, "max": 10 },
        "psiAp": { "value": 1, "min": 1, "max": 10 },
        "radiation": { "scale": "any" },
        "reductor": { "scale": "spacecraft" },
        "scope": { "scale": "traveller" },
        "shield": { "scale": "traveller", "value": 0, "min": 0, "max": 6 },
        "silent": { "scale": "traveller" },
        "smart": { },
        "smasher": { "scale": "traveller" },
        "stun": { "scale": "traveller" },
        "veryBulky": { "scale": "traveller", "conflict": [ "bulky" ] },
        "veryDangerous": { "scale": "traveller", "conflict": [ "dangerous" ] },
        "zeroG": { "scale": "traveller" }
    }
}

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
    "clever": { },
    "diseased": {},
    "dispersed": {},
    "echolocation": {},
    "energy": {},
    "explosive": {},
    "fastMetabolism": { "set": "initiative.base", "min": 1, "max": 6, "conflict": "slowMetabolism" },
    "floater": {},
    "flyer": { "default": 3, "choices": [ "idle", "verySlow", "slow", "medium", "high", "fast", "veryFast", "subsonic", "supersonic", "hypersonic" ]},
    "gigantic": { },
    "gossamer": {},
    "heightenedSenses": { "skills": [ { "skill": "recon", "bonus": 1 }, { "skill": "survival", "bonus": 1 }] },
    "iuVision": {},
    "ornery": {},
    "particulate": {  },
    "psionic": { "value": 7, "characteristic": "PSI" },
    "slowMetabolism": { "set": "initiative.base", "min": -6, "max": -1, "conflict": "fastMetabolism" },
    "strange": {},
    "tough": {},
    "toxic": {},
    "vacuum": {}
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

MGT2.WORLD = {
    "starport": {
        "A": { "berthCost": "1D6 * 1000", "fuel": true, "refined": true, "techBonus": 6 },
        "B": { "berthCost": "1D6 * 500", "fuel": true, "refined": true, "techBonus": 4 },
        "C": { "berthCost": "1D6 * 100", "fuel": true, "refined": false, "techBonus": 2 },
        "D": { "berthCost": "1D6 * 10", "fuel": true, "refined": false, "techBonus": 0 },
        "E": { "berthCost": "0", "fuel": false, "refined": false, "techBonus": 0 },
        "X": { "berthCost": "0", "fuel": false, "refined": false, "techBonus": -4 }
    },
    "size": {
        0: { "diameter": "< 1,000km", "techBonus": 2 },
        1: { "diameter": "1,600km", "techBonus": 2 },
        2: { "diameter": "3,200km", "techBonus": 1  },
        3: { "diameter": "4,800km", "techBonus": 1  },
        4: { "diameter": "6,400km", "techBonus": 1  },
        5: { "diameter": "8,000km"  },
        6: { "diameter": "9,600km"  },
        7: { "diameter": "11,200km"  },
        8: { "diameter": "12,800km"  },
        9: { "diameter": "14,400km"  },
        10: { "diameter": "16,000km"  }
    },
    "atmosphere": {
        0: { "techBonus": 1 },
        1: { "techBonus": 1  },
        2: { "techBonus": 1  },
        3: { "techBonus": 1  },
        4: {  },
        5: {  },
        6: {  },
        7: {  },
        8: {  },
        9: {  },
        10: { "techBonus": 1  },
        11: { "techBonus": 1  },
        12: { "techBonus": 1  },
        13: { "techBonus": 1  },
        14: { "techBonus": 1  },
        15: { "techBonus": 1  }
    },
    "hydrographics": {
        0: { "techBonus": 1  },
        1: {  },
        2: {  },
        3: {  },
        4: {  },
        5: {  },
        6: {  },
        7: {  },
        8: {  },
        9: { "techBonus": 1  },
        10: { "techBonus": 2  }
    },
    "population": {
        0: { "range": 0 },
        1: { "range": 10, "techBonus": 1  },
        2: { "range": 100, "techBonus": 1  },
        3: { "range": 1000, "techBonus": 1  },
        4: { "range": 10000, "techBonus": 1  },
        5: { "range": 100000, "techBonus": 1  },
        6: { "range": 1000000  },
        7: { "range": 10000000  },
        8: { "range": 100000000, "techBonus": 1  },
        9: { "range": 1000000000, "techBonus": 2  },
        10: { "range": 10000000000, "techBonus": 4  },
        11: { "range": 100000000000  },
        12: { "range": 1000000000000  }
    },
    "government": {
        0: { "techBonus": 1 },
        1: {  },
        2: {  },
        3: {  },
        4: {  },
        5: { "techBonus": 1 },
        6: {  },
        7: { "techBonus": 2 },
        8: {  },
        9: {  },
        10: {  },
        11: {  },
        12: {  },
        13: { "techBonus": -2 },
        14: { "techBonus": -2 },
        15: {  }
    },
    "lawLevel": {
        0: {  },
        1: {  },
        2: {  },
        3: {  },
        4: {  },
        5: {  },
        6: {  },
        7: {  },
        8: {  },
        9: {  }
    },
    "techLevel": {
        0: {  },
        1: {  },
        2: {  },
        3: {  },
        4: {  },
        5: {  },
        6: {  },
        7: {  },
        8: {  },
        9: {  },
        10: {  },
        11: {  },
        12: {  },
        13: {  },
        14: {  },
        15: {  },
        16: {  }
    },
    "bases": {
        "C": {},
        "D": {},
        "M": {},
        "N": {},
        "S": {},
        "W": {}
    }
}
