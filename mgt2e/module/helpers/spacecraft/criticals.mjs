/**
 * Helper functions for spacecraft criticals.
 */

import {MGT2} from "../config.mjs";
import {MgT2Item} from "../../documents/item.mjs";

export async function setSpacecraftCriticalLevel(actor, critical, level) {
    if (actor.type === "spacecraft") {
        level = Math.min(parseInt(level), 6);
        if (level < 1) {
            actor.unsetFlag("mgt2e", "crit_" + critical);
            let hasCrits = false;
            for (let c in MGT2.SPACECRAFT_CRITICALS) {
                if (c != critical && actor.flags.mgt2e["crit_"+c]) {
                    hasCrits = true;
                    break;
                }
            }
            await actor.setFlag("mgt2e", "hasCrits", hasCrits);
        } else if (MGT2.SPACECRAFT_CRITICALS[critical]) {
            let currentLevel = actor.getFlag("mgt2e", "crit_" + critical);
            if (!currentLevel) {
                currentLevel = 0;
            }
            console.log("Applying critical for " + critical +" at level " + level);
            console.log("Current level is " + currentLevel);
            if (level <= currentLevel) {
                level = currentLevel + 1;
            }
            console.log("New modified level is " + currentLevel);
            await actor.setFlag("mgt2e", "crit_" + critical, level);
            await actor.setFlag("mgt2e", "hasCrits", true);
            console.log(`Set critical ${critical} to ${level}`);

            if (MGT2.SPACECRAFT_CRITICALS[critical][level]) {
                let effects = MGT2.SPACECRAFT_CRITICALS[critical][level-1];
                console.log(`Critical for ${critical} level ${level} has effects`);
                console.log(effects);
                switch (critical) {
                    case "armour":
                        applyArmourCritical(actor, effects, level);
                        break;
                    case "powerPlant":
                        applyPowerPlantCritical(actor, effects, level);
                        break;
                    case "fuel":
                        applyFuelCritical(actor, effects, level);
                        break;
                    case "hull":
                        applyHullCritical(actor, effects, level);
                        break;
                    case "cargo":
                        applyCargoCritical(actor, effects, level);
                        break;
                    case "sensors":
                        applySensorCritical(actor, effects, level);
                        break;
                    case "weapon":
                        applyWeaponCritical(actor, effects, level);
                        break;
                    case "mDrive":
                        applyMDriveCritical(actor, effects, level);
                        break;
                    case "jDrive":
                        applyJDriveCritical(actor, effects, level);
                        break;
                    case "crew":
                        applyCrewCritical(actor, effects, level);
                        break;
                    case "bridge":
                        applyBridgeCritical(actor, effects, level);
                        break;
                }
            }

        } else {
            console.log(`WARN: Unknown spacecraft critical [${critical}]`);
        }
    } else {
        console.log(`WARN: Setting critical [${critical}] on unsupported type [${actor.type}]`);
    }
}

async function applyHullCritical(actor, effects, level) {
    console.log("applyHullCritical:");
    console.log(effects);
    if (effects["damage"]) {
        const dmg = effects["damage"];
        const roll = await new Roll(dmg, actor.getRollData()).evaluate();
        let hits = roll.total;
        actor.system.hits.damage += hits;
        actor.update({"system.hits.damage": actor.system.hits.damage });
        ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.Damage",
            {"name": actor.name, "hits": hits }));
    }
    if (effects["hull"]) {
        const sev = effects["hull"];
        const roll = await new Roll(sev, actor.getRollData()).evaluate();
        let levels = roll.total;
        for (let l=1; l <= levels; l++) {
            ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.Hull",
                {"name": actor.name }));
            const e = MGT2.SPACECRAFT_CRITICALS["hull"][Math.max(6, level + l) - 1];
            await applyHullCritical(actor, e, level + l);
        }
        actor.setFlag("mgt2e", "crit_hull", level + levels);
    }
}

async function applyArmourCritical(actor, effects, level) {
    if (effects["armour"]) {
        const armourDamage = effects["armour"];
        const roll = await new Roll(armourDamage, null).evaluate();
        let dmg = roll.total;

        let currentDmg = actor.getFlag("mgt2e", "damage_armour");
        if (!currentDmg) {
            currentDmg = 0;
        }
        dmg = Math.max(actor.system.spacecraft.armour, dmg + currentDmg);
        actor.setFlag("mgt2e", "damage_armour", dmg);
        actor.setFlag("mgt2e", "damageSev_armour", level);
    }

    actor.applyHullCritical(actor, effects, level);
}

async function applySensorCritical(actor, effects, level) {
    if (effects["sensorDM"]) {
        const dm = parseInt(effects["sensorDM"]);
        actor.setFlag("mgt2e", "damage_sensorDM", dm);
        actor.setFlag("mgt2e", "damageSev_sensorDM", level);
        ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.SensorDM",
            {"name": actor.name, "dm": dm }));
    }
    if (effects["sensorMax"]) {
        const maxRange = effects["sensorMax"];
        actor.setFlag("mgt2e", "damage_sensorMax", maxRange);
        actor.setFlag("mgt2e", "damageSev_sensorMax", level);
        ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.SensorMax",
            {"name": actor.name, "range": maxRange }));
    }
    if (effects["sensorsDisabled"]) {
        const sensors = actor.getHardwareList("sensor");
        for (let sensor of sensors) {
            sensor.update({"system.status": MgT2Item.DAMAGED});
            ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.SensorDisabled",
                {"name": actor.name, "item": item.name }));
        }
    }
}

async function applyPowerPlantCritical(actor, effects, level) {
    // All Power criticals cause power reduction.
    const reduction = parseInt(effects["powerReduction"]);
    console.log(`Reduce power by ${reduction}%`);
    const powerAt = reduction;
    actor.setFlag("mgt2e", "damage_powerPlant", powerAt);
    actor.setFlag("mgt2e", "damageSev_powerPlant", level);
    ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.Power",
        {"name": actor.name, "power": reduction }));

    actor.applyHullCritical(actor, effects, level);
}

function getRandomWeapons(actor, number) {
    let list = [];

    // Do we get a weapon, or a weapon mount? For now, let's get a weapon
    // mount.
    for (let item of actor.items) {
        if (item.type === "hardware" && item.system.hardware.system === "weapon") {
            list.push(item);
        }
    }
    if (list.length === 0) {
        // Return nothing if nothing is available.
        return null;
    }
    if (number >= list.length) {
        // Return the entire list.
        return list;
    }

    let selected = [];
    for (let i=0; i < number; i++) {
        let r = parseInt(Math.random() * list.length);
        selected.push(list[r]);
        // Shouldn't select it more than once.
        list.splice(r, 1);
    }

    return selected;
}

async function applyWeaponCritical(actor, effects, level) {
    console.log("applyWeaponCritical");
    if (effects["weaponDM"]) {
        let listMounts = getRandomWeapons(actor, 1);
        if (listMounts) {
            let item = listMounts[0];
            if (item.system.hardware.weapon.dm) {
                item.system.hardware.weapon.dm--;
            } else {
                item.system.hardware.weapon.dm = -1;
            }
            await item.update({"system.hardware.weapon.dm": item.system.hardware.weapon.dm});
        }
    }
    if (effects["disabled"]) {
        let listMounts = getRandomWeapons(actor, 1);
        if (listMounts) {
            let item = listMounts[0];
            if (item.system.status != MgT2Item.DESTROYED) {
                await item.update({"system.status": MgT2Item.DAMAGED});
            }
        }
    }
    if (effects["destroyed"]) {
        let roll = await new Roll(effects["destroyed"], null).evaluate();
        let number = roll.total;
        let listMounts = getRandomWeapons(actor, number);
        if (listMounts) {
            for (let i=0; i < listMounts.length; i++) {
                let item = listMounts[i];
                if (item.system.status != MgT2Item.DESTROYED) {
                    await item.update({"system.status": MgT2Item.DESTROYED});
                }
            }
        }
    }
    actor.applyHullCritical(actor, effects, level);
}

async function applyCargoCritical(actor, effects, level) {
    console.log("applyCargoCritical:");
    if (effects["cargoLoss"]) {
        const cargoLoss = effects["cargoLoss"];
        const cargoList = actor.getItemsByType("cargo");

        for (let cargo of cargoList) {
            const roll = await new Roll(cargoLoss, null).evaluate();
            const percent = roll.total;
            if (cargo.system.quantity < 1) {
                // Do nothing. Shouldn't happen.
            } else if (cargo.system.quantity === 1) {
                // Only a single item.
                if (Math.random() * 100 < percent) {
                    await actor.deleteEmbeddedDocuments("Item", [cargo._id]);
                    ui.notifications.info(
                        game.i18n.format("MGT2.Spacecraft.CriticalEffects.CargoLost",
                            {"name": actor.name, "dt": 1, "item": cargo.name}
                        )
                    );
                }
            } else {
                // Multiple items.
                let lost = 0;
                for (let c=0; c < cargo.system.quantity; c++) {
                    if (Math.random()*100 < percent) {
                        lost++;
                    }
                }
                if (lost) {
                    if (lost >= cargo.system.quantity) {
                        await actor.deleteEmbeddedDocuments("Item", [cargo._id]);
                    } else {
                        await cargo.update({"system.quantity": (cargo.system.quantity - lost)});
                    }
                    ui.notifications.info(
                        game.i18n.format("MGT2.Spacecraft.CriticalEffects.CargoLost",
                            {"name": actor.name, "dt": lost, "item": cargo.name}
                        )
                    );
                    if (cargo.name !== "Scrap") {
                        // Turn cargo to scrap, if it isn't already. This isn't standard
                        // rules, but seems more interesting to have cargo turned to scrap.
                        // If scrap is destroyed, it is completely destroyed.
                        const itemData = {
                            "name": "Scrap",
                            "img": "systems/mgt2e/icons/cargo/cargo.svg",
                            "type": "cargo",
                            "system": {
                                "quantity": lost,
                                "cargo": {
                                    "price": parseInt(cargo.system.cargo.price / 100),
                                    "availability": "",
                                    "purchaseDM": "",
                                    "saleDM": "",
                                    "tons": "0",
                                    "illegal": false
                                },
                                "description": "Destroyed and worthless " + cargo.name
                            }
                        };
                        Item.create(itemData, {parent: actor});
                    }
                }
            }
        }
    }

    applyHullCritical(actor, effects, level);
}

async function applyFuelCritical(actor, effects, level) {
    console.log("applyFuelCritical:");
    if (effects["fuelLeak"]) {
        const rate = effects["fuelLeak"];
        if (rate === "hour") {
            console.log(`Fuel loss is ${rate} losing hourly`);
            actor.setFlag("mgt2e", "damage_fuelHour", "1D6");
            actor.setFlag("mgt2e", "damageSev_fuelHour", level);
            ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.FuelLeakHour",
                {"name": actor.name }));
        } else {
            console.log(`Fuel loss is ${rate} losing rounds`);
            actor.setFlag("mgt2e", "damage_fuelRound", "1D6");
            actor.setFlag("mgt2e", "damageSev_fuelRound", level);
            ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.FuelLeakRound",
                {"name": actor.name }));
        }
    }
    if (effects["lose"]) {
        console.log("Losing fuel");
        const currentFuel = parseInt(actor.system.spacecraft.fuel.value);
        const maxFuel = parseInt(actor.system.spacecraft.fuel.max);
        let roll = await new Roll("1D6 * 10", null).evaluate();
        let loss = roll.total;
        let fuel = currentFuel - parseInt((loss * maxFuel) / 100);
        actor.update({"system.spacecraft.fuel.value": Math.max(0, fuel)});
        ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.FuelLoss",
            {"name": actor.name, "percentage": loss }));
    }
    if (effects["destroyed"]) {
        let tanks = actor.getHardwareList("fuel");
        console.log("Found " + tanks.length + " tanks of fuel");
        if (tanks) {
            for (let t of tanks) {
                if (t.system.status !== "DESTROYED") {
                    t.update({"system.status": "DESTROYED"});
                    ui.notifications.info(
                        game.i18n.format("MGT2.Spacecraft.CriticalEffects.Destroyed",
                            { "name": actor.name, "item": t.name }
                        )
                    );
                    break;
                }
            }
        }
    }

    await applyHullCritical(actor, effects, level);
}

async function applyMDriveCritical(actor, effects, level) {
    console.log("applyMDriveCritical:");
    console.log(effects);

    if (effects["pilotDM"]) {
        // Penalty to piloting check.
        actor.setFlag("mgt2e", "damage_pilotDM", parseInt(effects["pilotDM"]));
        actor.setFlag("mgt2e", "damageSev_pilotDM", level);
    }
    if (effects["thrust"]) {
        // Penalty to maximum thrust.
        actor.setFlag("mgt2e", "damage_thrust", parseInt(effects["thrust"]));
        actor.setFlag("mgt2e", "damageSev_thrust", level);
    }
    if (effects["disabled"] || true) {
        // Thrust goes to zero. Disable mdrive.
        for (let item of actor.items) {
            if (item.type === "hardware" && item.system.hardware.system === "m-drive") {
                if (item.system.status !== MgT2Item.DAMAGED && item.system.status !== MgT2Item.DESTROYED) {
                    item.system.status = MgT2Item.DAMAGED;
                    await item.update({"system.status": MgT2Item.DAMAGED});
                    ui.notifications.info("M-Drive on ship is disabled");
                    break;
                }
            }
        }
    }
    await applyHullCritical(actor, effects, level);
}

async function applyJDriveCritical(actor, effects, level) {
    console.log("applyJDriveCritical:");
    console.log(effects);

    if (effects["jumpDM"]) {
        // Penalty to jump engineering check.
        actor.setFlag("mgt2e", "damage_jumpDM", parseInt(effects["jumpDM"]));
        actor.setFlag("mgt2e", "damageSev_jumpDM", level);
    }
    if (effects["disabled"]) {
        // Jump drive disabled.
        for (let item of actor.items) {
            if (item.type === "hardware" && item.system.hardware.system === "j-drive") {
                if (item.system.status !== MgT2Item.DAMAGED && item.system.status !== MgT2Item.DESTROYED) {
                    item.system.status = MgT2Item.DAMAGED;
                    await item.update({"system.status": MgT2Item.DAMAGED});
                    ui.notifications.info("J-Drive on ship is disabled");
                    break;
                }
            }
        }
    }
    if (effects["destroyed"]) {
        // Jump drive destroyed.
        for (let item of actor.items) {
            if (item.type === "hardware" && item.system.hardware.system === "m-drive") {
                if (item.system.status !== MgT2Item.DESTROYED) {
                    item.system.status = MgT2Item.DESTROYED;
                    await item.update({"system.status": MgT2Item.DESTROYED});
                    ui.notifications.info("M-Drive on ship is destroyed````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````");
                    break;
                }
            }
        }
    }

    await applyHullCritical(actor, effects, level);
}

async function applyCrewCritical(actor, effects, level) {
    await applyHullCritical(actor, effects, level);
}

async function applyBridgeCritical(actor, effects, level) {
    await applyHullCritical(actor, effects, level);
}
