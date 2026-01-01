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
            } else if (currentLevel === 6) {
                applyHullCritical(actor, { "damage": "6D6" }, 0);
                return;
            }
            console.log("Applying critical for " + critical +" at level " + level);
            console.log("Current level is " + currentLevel);
            if (level <= currentLevel) {
                level = Math.min(6, currentLevel + 1);
            }
            await actor.setFlag("mgt2e", "crit_" + critical, level);
            await actor.setFlag("mgt2e", "hasCrits", true);

            if (MGT2.SPACECRAFT_CRITICALS[critical][level-1]) {
                let effects = MGT2.SPACECRAFT_CRITICALS[critical][level-1];
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

        let title = game.i18n.format("MGT2.Spacecraft.Critical.hull.Title", { "severity": level });
        let text = game.i18n.format("MGT2.Spacecraft.Critical.hull." + level);
        let content = game.i18n.format("MGT2.Spacecraft.Critical.hull.Text",
            { "damage": hits }
        );

        criticalToChat(actor, level, title, text, { content: content });
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
        dmg = Math.min(actor.system.spacecraft.armour, dmg + currentDmg);
        actor.setFlag("mgt2e", "damage_armour", dmg);
        actor.setFlag("mgt2e", "damageSev_armour", level);

        let title = game.i18n.format("MGT2.Spacecraft.Critical.armour.Title", { "severity": level });
        let text = game.i18n.format("MGT2.Spacecraft.Critical.armour." + level);
        let content = game.i18n.format("MGT2.Spacecraft.Critical.armour.Text",
            { "damage": dmg }
        );
        criticalToChat(actor, level, title, text, { content: content });
    }

    await applyHullCritical(actor, effects, level);
}

async function applySensorCritical(actor, effects, level) {
    if (effects["sensorDM"]) {
        const dm = parseInt(effects["sensorDM"]);
        actor.setFlag("mgt2e", "damage_sensorDM", dm);
        actor.setFlag("mgt2e", "damageSev_sensorDM", level);
        ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.SensorDM",
            {"name": actor.name, "dm": dm }));

        let title = game.i18n.format("MGT2.Spacecraft.Critical.sensors.Title", { "severity": level });
        let text = game.i18n.format("MGT2.Spacecraft.Critical.sensors.penalty", { "penalty": 2 });
        criticalToChat(actor, level, title, text, null);
    }
    if (effects["sensorMax"]) {
        const maxRange = effects["sensorMax"];
        actor.setFlag("mgt2e", "damage_sensorMax", maxRange);
        actor.setFlag("mgt2e", "damageSev_sensorMax", level);
        ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.SensorMax",
            {"name": actor.name, "range": maxRange }));

        let title = game.i18n.format("MGT2.Spacecraft.Critical.sensors.Title", { "severity": level });
        let text = game.i18n.format("MGT2.Spacecraft.Critical.sensors.reduced", { "range": maxRange });
        criticalToChat(actor, level, title, text, null);
    }
    if (effects["sensorsDisabled"] || true) {
        const sensors = actor.getHardwareList("sensor");
        let list = [];
        for (let sensor of sensors) {
            sensor.update({"system.status": MgT2Item.DAMAGED});
            ui.notifications.info(game.i18n.format("MGT2.Spacecraft.CriticalEffects.SensorDisabled",
                {"name": actor.name, "item": sensor.name }));
            list.push(sensor)
        }
        let title = game.i18n.format("MGT2.Spacecraft.Critical.sensors.Title", { "severity": level });
        let text = game.i18n.format("MGT2.Spacecraft.Critical.sensors.disabled");
        if (list.length === 0) {
            criticalToChat(actor, level, title, text, {
                content: game.i18n.format("MGT2.Spacecraft.Critical.sensors.NoSensors")
            });
        } else {
            criticalToChat(actor, level, title, text, {
                content: game.i18n.format("MGT2.Spacecraft.Critical.sensors.ListOfDisabled"),
                items: list
            });
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

    let title = game.i18n.format("MGT2.Spacecraft.Critical.power.Title", { "severity": level });
    let text = game.i18n.format("MGT2.Spacecraft.Critical.power." + level);
    criticalToChat(actor, level, title, text, {
        content: game.i18n.format("MGT2.Spacecraft.Critical.power.Text", {
            "level": 100 - powerAt
        })
    });

    await applyHullCritical(actor, effects, level);
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
        let list = [];
        if (listMounts) {
            let item = listMounts[0];
            item.system.hardware.dm = -1;
            await item.update({"system.hardware.weapon.dm": item.system.hardware.dm});
            list.push(item);
        }
        let title = game.i18n.format("MGT2.Spacecraft.Critical.weapon.Title", { "severity": level });
        let text = game.i18n.format("MGT2.Spacecraft.Critical.weapon." + level);
        let content = null;

        if (list.length === 0) {
            content = game.i18n.format("MGT2.Spacecraft.Critical.weapon.NoWeapons");
            list = null;
        } else {
            content = game.i18n.format("MGT2.Spacecraft.Critical.weapon.ListOfWeaponsDamaged");
        }

        criticalToChat(actor, level, title, text, {
            content: content,
            items: list
        });
    }
    if (effects["disabled"]) {
        let listMounts = getRandomWeapons(actor, 1);
        let list = [];
        if (listMounts) {
            let item = listMounts[0];
            if (item.system.status != MgT2Item.DESTROYED) {
                await item.update({"system.status": MgT2Item.DAMAGED});
            }
            list.push(item);
        }
        let title = game.i18n.format("MGT2.Spacecraft.Critical.weapon.Title", { "severity": level });
        let text = game.i18n.format("MGT2.Spacecraft.Critical.weapon." + level);
        let content = null;

        if (list.length === 0) {
            content = game.i18n.format("MGT2.Spacecraft.Critical.weapon.NoWeapons");
            list = null;
        } else {
            content = game.i18n.format("MGT2.Spacecraft.Critical.weapon.ListOfWeaponsDisabled");
        }

        criticalToChat(actor, level, title, text, {
            content: content,
            items: list
        });
    }
    if (effects["destroyed"]) {
        let roll = await new Roll(effects["destroyed"], null).evaluate();
        let number = roll.total;
        let listMounts = getRandomWeapons(actor, number);
        let list = [];
        if (listMounts) {
            for (let i=0; i < listMounts.length; i++) {
                let item = listMounts[i];
                if (item.system.status != MgT2Item.DESTROYED) {
                    await item.update({"system.status": MgT2Item.DESTROYED});
                    list.push(item);
                }
            }
        }
        let title = game.i18n.format("MGT2.Spacecraft.Critical.weapon.Title", { "severity": level });
        let text = game.i18n.format("MGT2.Spacecraft.Critical.weapon." + level);
        let content = null;

        if (list.length === 0) {
            content = game.i18n.format("MGT2.Spacecraft.Critical.weapon.NoWeapons");
            list = null;
        } else {
            content = game.i18n.format("MGT2.Spacecraft.Critical.weapon.ListOfWeaponsDestroyed");
        }

        criticalToChat(actor, level, title, text, {
            content: content,
            items: list
        });
    }
    await applyHullCritical(actor, effects, level);
}

async function applyCargoCritical(actor, effects, level) {
    console.log("applyCargoCritical:");
    if (effects["cargoLoss"]) {
        let title = game.i18n.format("MGT2.Spacecraft.Critical.cargo.Title", { "severity": level });
        let text = game.i18n.format("MGT2.Spacecraft.Critical.cargo." + level);
        let content = null;

        const cargoLoss = effects["cargoLoss"];
        const cargoList = actor.getItemsByType("cargo");

        let list = [];
        // We don't destroy 10% of cargo, but have a 10% chance of each ton of cargo being destroyed.
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
                    list.push(`1t x ${cargo.name}`);
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
                        list.push(`${cargo.system.quantity}t ${cargo.name}`);
                        await actor.deleteEmbeddedDocuments("Item", [cargo._id]);
                    } else {
                        list.push(`${lost}t ${cargo.name}`);
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
        if (list.length > 0) {
            criticalToChat(actor, level, title, text, {
                content: game.i18n.format("MGT2.Spacecraft.Critical.cargo.CargoDestroyed"),
                list: list
            });
        } else {
            criticalToChat(actor, level, title, text, {
                content: game.i18n.format("MGT2.Spacecraft.Critical.cargo.NoCargo")
            });
        }

    }

    await applyHullCritical(actor, effects, level);
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

function getRandomOccupants(actor, number) {
    let victims = [];
    let occupants = [];

    let crew = actor.system.crewed.crew;
    for (let o in crew) {
        occupants.push(o);
    }

    let passengers = actor.system.crewed.passengers;
    for (let o in passengers) {
        occupants.push(o);
    }

    if (occupants.length > 0) {
        if (number === 0 || occupants.length <= number) {
            // Everybody gets hit.
            return occupants;
        }
        for (let i = 0; i < number; i++) {
            let v = parseInt(Math.random() * occupants.length);
            victims.push(occupants[v]);
            occupants.splice(v, 1);
        }
    }

    return victims;
}

async function applyCrewCritical(actor, effects, level) {
    await applyHullCritical(actor, effects, level);

    console.log("applyCrewCritical:");

    if (effects["crewDamaged"]) {
        let numberDice = 0; // Zero means everyone.
        let damageDice = effects["crewDamaged"];

        // If this is just a single value, then it applies to all occupants.
        // If it's comma separated, it applies to a limited number.
        if (effects["crewDamaged"].indexOf(",") > -1) {
            numberDice = effects["crewDamaged"].split(",")[0];
            damageDice = effects["crewDamaged"].split(",")[1];
        }

        const numberRoll = await new Roll(numberDice, null).evaluate();
        const number = numberRoll.total;

        let victims = getRandomOccupants(actor, number);

        let results = [];
        for (let v in victims) {
            let victimId = victims[v];
            let victimActor = await game.actors.get(victimId);
            if (victimActor) {
                let dmgRoll = await new Roll(damageDice, null).evaluate();
                let dmg = dmgRoll.total;
                console.log(`${victimActor.name} is going to take ${dmg} damage`);
                victimActor.applyDamageToPerson(dmg, {
                    damage: dmg
                });
                results.push({
                    "actor": victimActor,
                    "damage": dmg
                })
            }
        }

        let contentData = {
            shipActor: actor,
            severity: level,
            victimCount: victims.length,
            damageDice: damageDice,
            criticalTitle: game.i18n.format("MGT2.Spacecraft.Critical.crew.Title", { "severity": level }),
            criticalText: game.i18n.format("MGT2.Spacecraft.Critical.crew." + level),
            victims: results
        }
        const content = await renderTemplate("systems/mgt2e/templates/chat/spaceship-critical.html", contentData);

        let chatData = {
            content: content
        }
        ChatMessage.create(chatData);
    }

}

async function criticalToChat(actor, level, title, text, options) {
    console.log("criticalToChat:");
    console.log(actor);
    if (!options) {
        options = {};
    }
    let shipName = actor.name;
    if (actor.token?.name) {
        shipName = actor.token.name;
    }
    let contentData = {
        shipName: shipName,
        shipActor: actor,
        severity: level,
        criticalTitle: title,
        criticalText: text,
        content: options.content,
        list: options.list,
        items: options.items,
        actors: options.actors
    }
    const html = await renderTemplate("systems/mgt2e/templates/chat/spaceship-critical.html", contentData);
    let chatData = {
        content: html
    }
    ChatMessage.create(chatData);
}


async function applyBridgeCritical(actor, effects, level) {
    await applyHullCritical(actor, effects, level);
}


function getCriticalTemplate() {

}
