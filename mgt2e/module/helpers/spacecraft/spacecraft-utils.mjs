import {MGT2} from "../config.mjs";


export async function calculateSpacecraftCost(actor) {
    let data = actor.system;
    let spacecraft = actor.system.spacecraft;

    console.log("Calculating cost of " + actor.name);

    let totalCost = 0;

    spacecraft.baseCost = Number(spacecraft.dtons) * 0.05;
    spacecraft.baseCost *= MGT2.SHIP_CONFIGURATION[spacecraft.configuration].cost;
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
        "cost": spacecraft.baseCost,
        "power": spacecraft.dtons / 5
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

    if (armour && armour.length > 0) {
        data["armour"] = [
            {
                "name": armour[0].name + ": " + armour[0].system.hardware.rating,
                "tons": armour[0].system.hardware.tons,
                "cost": armour[0].system.cost
            }
        ];
    }

    if (mDrive) {
        data["mDrive"] = [];
        for (let item of mDrive) {
            data["mDrive"].push({
                "name": "Thrust-" + item.system.hardware.rating,
                "tons": item.system.hardware.tons * item.system.quantity,
                "cost": item.system.cost * item.system.quantity,
                "quantity": item.system.quantity,
                "power": item.system.hardware.power * item.system.quantity
            })
        }
    }
    if (jDrive) {
        data["jDrive"] = [];
        for (let item of jDrive) {
            data["jDrive"].push({
                "name": "Jump-" + item.system.hardware.rating,
                "tons": item.system.hardware.tons * item.system.quantity,
                "cost": item.system.cost * item.system.quantity,
                "quantity": item.system.quantity,
                "power": item.system.hardware.power * item.system.quantity
            })
        }
    }
    if (powerPlant) {
        data["power"] = [];
        for (let item of powerPlant) {
            data["power"].push({
                "name": `${item.name}, Power ${item.system.hardware.rating}`,
                "tons": item.system.hardware.tons * item.system.quantity,
                "cost": item.system.cost * item.system.quantity,
                "quantity": item.system.quantity
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
            totalFuel += item.system.hardware.rating * item.system.quantity;
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
                "tons": item.system.hardware.tons * item.system.quantity,
                "cost": item.system.cost * item.system.quantity,
                "quantity": item.system.quantity
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
                "cost": item.system.cost * item.system.quantity,
                "quantity": item.system.quantity
            });
        }
    }
    if (sensor) {
        data["sensor"] = [];
        for (let item of sensor) {
            data["sensor"].push({
                "name": item.name,
                "tons": item.system.hardware.tons * item.system.quantity,
                "cost": item.system.cost * item.system.quantity,
                "power": item.system.hardware.power * item.system.quantity,
                "quantity": item.system.quantity
            })
        }
    }
    if (weapon) {
        data["weapon"] = [];
        for (let item of weapon) {
            let name = item.name;
            let cost = item.system.cost;
            let power = item.system.hardware.power;

            console.log(item);
            if (item.system.hardware.weapons) {
                for (let wpnId in item.system.hardware.weapons) {
                    let wpn = actor.items.get(wpnId);
                    let n = item.system.hardware.weapons[wpnId].quantity;
                    if (wpn) {
                        power += wpn.system.weapon.power * n;
                        // Weapon costs are in Cr, rather than MCr
                        cost += (wpn.system.cost * n) / 1000000;
                        name += ` (${wpn.name} x${n})`;
                    }
                }
            }

            data["weapon"].push({
                "name": name,
                "tons": item.system.hardware.tons * item.system.quantity,
                "cost": cost * item.system.quantity,
                "power": power * item.system.quantity,
                "quantity": item.system.quantity
            })
        }
    }

    if (systems) {
        data["systems"] = [];
        for (let item of systems) {
            data["systems"].push({
                "name": item.name,
                "tons": item.system.hardware.tons * item.system.quantity,
                "cost": item.system.cost * item.system.quantity,
                "quantity": item.system.quantity
            })
        }
    }

    if (software) {
        data["software"] = [];
        for (let item of software) {
            data["software"].push({
                "name": item.name,
                "tons": 0,
                "cost": item.system.cost / 1000000,
                "quantity": 1
            });
        }
    }
    if (stateroom) {
        data["stateroom"] = [];
        for (let item of stateroom) {
            data["stateroom"].push({
               "name": item.name,
               "tons": item.system.hardware.tons * item.system.quantity,
               "cost": item.system.cost * item.system.quantity,
               "quantity": item.system.quantity
            });
        }
    }

    if (cargo) {
        let totalCargo = 0;
        for (let item of cargo) {
            totalCargo += item.system.hardware.rating * item.system.quantity;
        }
        data["cargo"] = [{
            "name": "",
            "cost": 0,
            "tons": totalCargo,
            "quantity": 1
        }];
    }

    return data;
}

export function calculateHardwareAdvantages(item) {
    console.log("calculateHardwareAdvantages:");
    if (!item || item.type !== "hardware") {
        return;
    }
    let list = item.system.hardware.advantages.split(",");
    let system = item.system.hardware.system;
    if (!MGT2.SPACECRAFT_ADVANTAGES[system]) {
        return;
    }
    let size = 100;
    let power = 100;
    let output = 100;
    for (let a of list) {
        console.log(a);
        let t = a.trim().split(" ")[0];
        let n = a.trim().split(" ")[1];
        console.log(t);
        console.log(n);

        let adv = MGT2.SPACECRAFT_ADVANTAGES[system][t];
        if (adv) {
            for (let i=0; i < parseInt(n); i++) {
                if (adv.size) {
                    size += adv.size;
                }
                if (adv.power) {
                    power += adv.power;
                }
                if (adv.output) {
                    output += adv.output;
                }
            }
        }
    }
    item.system.hardware.tons = (item.system.hardware.tons * size) / 100;
    item.system.hardware.power = (item.system.hardware.power * power) / 100;
    if (system === "power") {
        item.system.hardware.power = (item.system.hardware.rating * output) / 100;
    }
}
