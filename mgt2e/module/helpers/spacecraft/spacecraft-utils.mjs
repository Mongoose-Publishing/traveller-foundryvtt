import {MGT2} from "../config.mjs";


export async function calculateSpacecraftCost(actor) {
    let data = actor.system;
    let spacecraft = actor.system.spacecraft;

    console.log("Calculating cost of " + actor.name);

    let totalCost = 0;

    spacecraft.baseCost = Number(spacecraft.dtons) * 50000;
    spacecraft.baseCost * MGT2.SHIP_CONFIGURATION[spacecraft.configuration].cost;
    totalCost = spacecraft.baseCost;

    spacecraft.cost = totalCost;

    for (let item of actor.items) {
        if (item.type === "hardware") {
            // Iterate over all the hardware, calculating and adding up the costs.
            const hw = item.system.hardware;
            if (hw.system === "armour") {
                let cost = 0;
            }

        }
    }


    await actor.update({"system.spacecraft.baseCost": spacecraft.baseCost });
    await actor.update({"system.spacecraft.cost": spacecraft.cost });
}

export function getShipData(actor) {
    let data = {};

    let spacecraft = actor.system.spacecraft;
    data["hull"] = [{
        "name": `${spacecraft.dtons} tons, ${game.i18n.localize("MGT2.Spacecraft.Configuration." + spacecraft.configuration)}`,
        "tons": 0,
        "cost": spacecraft.baseCost
    }];

    // Break everything down into smaller piles.
    let armour = [];
    let mDrive = [];
    let jDrive = [];
    let powerPlant = [];
    let fuel = [];
    let bridge = [];
    let cargo = [];
    let computer = [];
    let sensor = [];
    let weapon = [];
    let stateroom = [];
    let systems = [];
    let software = [];

    for (let item of actor.items) {
        if (item.type === "hardware") {
            let hw = item.system.hardware;
            if (hw.system === "armour") {
                armour.push(item);
            } else if (hw.system === "j-drive") {
                jDrive.push(item);
            } else if (hw.system === "m-drive") {
                mDrive.push(item);
            } else if (hw.system === "power") {
                powerPlant.push(item);
            } else if (hw.system === "fuel") {
                fuel.push(item);
            } else if (hw.system === "bridge") {
                bridge.push(item);
            } else if (hw.system === "cargo") {
                cargo.push(item);
            } else if (hw.system === "computer") {
                computer.push(item);
            } else if (hw.system === "sensor") {
                sensor.push(item);
            } else if (hw.system === "weapon") {
                weapon.push(item);
            } else if (hw.system === "stateroom") {
                stateroom.push(item);
            } else {
                systems.push(item);
                console.log(`${item.name} : ${hw.system}`);
            }
        } else if (item.type === "software") {
            software.push(item);
        }
    }

    data["armour"] = [
        {
            "name": armour[0].name + ": " + armour[0].system.hardware.rating,
            "tons": armour[0].system.hardware.tons,
            "cost": armour[0].system.cost
        }
    ];

    if (mDrive) {
        data["mDrive"] = [];
        for (let item of mDrive) {
            data["mDrive"].push({
                "name": "Thrust-" + item.system.hardware.rating,
                "tons": item.system.hardware.tons,
                "cost": item.system.cost
            })
        }
    }
    if (jDrive) {
        data["jDrive"] = [];
        for (let item of jDrive) {
            data["jDrive"].push({
                "name": "Jump-" + item.system.hardware.rating,
                "tons": item.system.hardware.tons,
                "cost": item.system.cost
            })
        }
    }
    if (powerPlant) {
        data["power"] = [];
        for (let item of powerPlant) {
            data["power"].push({
                "name": `${item.name}, Power ${item.system.hardware.rating}`,
                "tons": item.system.hardware.tons,
                "cost": item.system.cost
            })
        }
    }
    if (fuel) {
        data["fuel"] = [];
        let totalFuel = 0;
        let name = "";
        for (let item of fuel) {
            if (name) {
                name += ", " + item.name;
            } else {
                name = item.name;
            }
            totalFuel += item.system.hardware.rating;
        }
        data["fuel"].push({
            "name": name,
            "tons": totalFuel,
            "cost": 0
        });
    }
    if (bridge) {
        data["bridge"] = [];
        for (let item of bridge) {
            data["bridge"].push({
                "name": item.name,
                "tons": item.system.hardware.tons,
                "cost": item.system.cost
            });
        }
    }
    if (computer) {
        data["computer"] = [];
        for (let item of computer) {
            let name = "Computer/" + item.system.hardware.rating;

            if (item.system.hardware.isComputerBis) {
                name +="bis";
            }
            if (item.system.hardware.isComputerFib) {
                name +="fib";
            }
            if (item.system.hardware.isComputerCore) {
                name +=" Core";
            }

            data["computer"].push({
                "name": name,
                "tons": 0,
                "cost": item.system.cost
            });
        }
    }
    if (sensor) {
        data["sensor"] = [];
        for (let item of sensor) {
            data["sensor"].push({
                "name": item.name,
                "tons": item.system.hardware.tons,
                "cost": item.system.cost
            })
        }
    }
    if (weapon) {
        data["weapon"] = [];
    }

    if (systems) {
        data["systems"] = [];
        for (let item of stateroom) {
            data["systems"].push({
                "name": item.name,
                "tons": item.system.hardware.tons,
                "cost": item.system.cost
            });
        }
    }

    if (software) {
        data["software"] = [];
        for (let item of software) {
            data["software"].push({
                "name": item.name,
                "tons": 0,
                "cost": item.system.cost
            });
        }
    }
    if (stateroom) {
        data["stateroom"] = [];
        for (let item of stateroom) {
            data["stateroom"].push({
               "name": item.name,
               "tons": item.system.hardware.tons,
               "cost": item.system.cost
            });
        }
    }

    if (cargo) {
        let totalCargo = 0;
        for (let item of cargo) {
            totalCargo += item.system.hardware.rating;
        }
        data["cargo"] = [{
            "name": "",
            "cost": 0,
            "tons": totalCargo
        }];
    }

    return data;
}
