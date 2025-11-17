import {MGT2} from "../config.mjs";
import {MgT2Item} from "../../documents/item.mjs";
import {MgT2BuyCargoApp} from "../dialogs/buy-cargo-app.mjs";
import {MgT2SellCargoApp} from "../dialogs/sell-cargo-app.mjs";
import {tradeBuyFreightHandler, tradeSellFreightHandler} from "../utils/trade-utils.mjs";
import {MgT2EmbarkPassengerApp} from "../dialogs/embark-passenger-app.mjs";


export async function calculateSpacecraftCost(actor) {
    let data = actor.system;
    let spacecraft = actor.system.spacecraft;

    let totalCost = 0;

    spacecraft.baseCost = Number(spacecraft.dtons) * 0.05;
    spacecraft.baseCost *= MGT2.SHIP_CONFIGURATION[spacecraft.configuration].cost;

    /*
    let options = spacecraft.hullOptions;
    for (let o of options.split(" ")) {
        if (MGT2.SPACECRAFT_HULLS[o]) {
            let option = MGT2.SPACECRAFT_HULLS[o];
            if (option.cost) {
                spacecraft.baseCost = (spacecraft.baseCost * (100 + option.cost) / 100);
            }
        }
    }
    */

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

    //if (actor.permission >= 3 && !(actor?.compendium?.locked)) {
    if (actor.canUserModify(game.user)) {
        console.log("TRYING TO MODIFY");
        await actor.update({"system.spacecraft.baseCost": spacecraft.baseCost});
        await actor.update({"system.spacecraft.cost": spacecraft.cost});
    }
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
    let options = spacecraft.hullOptions;
    let extraCost = 0;
    let hullCostModifier = 100;
    for (let o of options.split(" ")) {
        if (MGT2.SPACECRAFT_HULLS[o]) {
            let option = MGT2.SPACECRAFT_HULLS[o];
            let t = 0, p = 0;
            if (option.tonPc) {
                t = (option.tonPc * spacecraft.dtons) / 100;
            }
            if (option.power) {
                p = option.power * spacecraft.dtons;
            }
            if (option.cost) {
                extraCost = (spacecraft.baseCost * option.cost) / 100;
                hullCostModifier += option.cost;
                data["hull"].push({
                    "name": game.i18n.localize("MGT2.Spacecraft.Hull." + o),
                    "tons": t,
                    "cost": extraCost,
                    "power": p
                })
            } else if (option.tonCost) {
                extraCost = (spacecraft.dtons * option.tonCost);
                data["hull"].push({
                    "name": game.i18n.localize("MGT2.Spacecraft.Hull." + o),
                    "tons": t,
                    "cost": extraCost,
                    "power": p
                })
            }
        }
    }
    //data["hull"][0].cost += extraCost;

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
    let common = [];
    let systems = [];
    let software = [];
    let bulkheads = [];

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
            } else if (hw.system === "weapon" || hw.system === "defence") {
                weapon.push(item);
            } else if (hw.system === "stateroom") {
                stateroom.push(item);
            } else if (hw.system === "common") {
                common.push(item);
            } else {
                systems.push(item);
            }
            if (hw.armouredBulkhead) {
                bulkheads.push(item);
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
                "cost": (armour[0].system.cost)
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
            let d = item.name;
            if (item.system.description) {
                d = item.system.description.replace(/<[^>]*>?/gm, '');
            }
            if (name) {
                name += ", " + d;
            } else {
                name = d;
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
            let bridgeName = "";
            if (item.system.hardware.bridgeType === "standard") {
                if (item.system.hardware.holographicControls) {
                    bridgeName = game.i18n.localize("MGT2.Spacecraft.HolographicControls");
                }
            } else {
                bridgeName = game.i18n.localize("MGT2.Spacecraft.BridgeType." + item.system.hardware.bridgeType);
                if (item.system.hardware.holographicControls) {
                    bridgeName += "; " + game.i18n.localize("MGT2.Spacecraft.HolographicControls");
                }
            }

            data["bridge"].push({
                "name": bridgeName,
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

    if (bulkheads) {
        data["bulkheads"] = [];
        for (let item of bulkheads) {
            data["bulkheads"].push({
                "name": `${item.name}`,
                "tons": item.system.hardware.tons * item.system.quantity * 0.1,
                "cost": item.system.hardware.tons * item.system.quantity * 0.02,
                "quantity": item.system.quantity
            });
        }
    }

    if (systems) {
        data["systems"] = [];

        for (let item of systems) {
            data["systems"].push({
                "name": item.name,
                "tons": item.system.hardware.tons * item.system.quantity,
                "cost": item.system.cost * item.system.quantity,
                "quantity": item.system.quantity,
                "power": item.system.hardware.power * item.system.quantity
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
               "quantity": item.system.quantity,
               "power": item.system.hardware.power * item.system.quantity
            });
        }
    }
    if (common) {
        data["common"] = [];
        for (let item of common) {
            data["common"].push({
                "name": item.name,
                "tons": item.system.hardware.tons * item.system.quantity,
                "cost": item.system.cost * item.system.quantity,
                "quantity": item.system.quantity,
                "power": item.system.hardware.power * item.system.quantity
            })
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
        let t = a.trim().split(" ")[0];
        let n = a.trim().split(" ")[1];

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

export function fuelCost(spacecraft) {
    let jumpRating = 0;
    let jumpFuel = 0;
    let weekFuel = 0;

    for (let i of spacecraft.items) {
        if (i.type === "hardware" && i.system.hardware.system === "j-drive") {
            if (i.system.status === MgT2Item.ACTIVE) {
                jumpRating = i.system.hardware.rating;
                let list = i.system.hardware.advantages.split(",");
                let reduce = 0;
                for (let a of list) {
                    let t = a.trim().split(" ")[0];
                    let n = a.trim().split(" ")[1];
                    let adv = MGT2.SPACECRAFT_ADVANTAGES["j-drive"][t];
                    if (adv) {
                        if (adv.fuel) {
                            reduce += parseInt(adv.fuel) * parseInt(n);
                        }
                    }
                }
                let baseCost = parseFloat(spacecraft.system.spacecraft.dtons) / 10;
                jumpFuel = baseCost * (100 + reduce) / 100;
            }
        } else if (i.type === "hardware" && i.system.hardware.system === "power") {
            if (i.system.status === MgT2Item.ACTIVE && !i.system.hardware.battery) {
                let t = parseFloat(i.system.hardware.tons);
                weekFuel = Math.max(1, t / 10) / 4;
            }
        }
    }

    return { "jumpFuel": jumpFuel, "rating": jumpRating, "weekFuel": weekFuel };
}

export async function embarkPassengerDialog(worldActor, shipActor, item) {
    if (!item || !item.system?.world || item.system.world.datatype !== "passenger") {
        return false;
    }
    new MgT2EmbarkPassengerApp(worldActor, shipActor, item).render(true);

    return false;
}

export async function buyCargoDialog(worldActor, shipActor, item) {
    if (!item || !item.system?.cargo) {
        return false;
    }

    let freeSpace = parseFloat(shipActor.system.spacecraft.cargo);
    for (let i of shipActor.items) {
        if (i.type === "cargo") {
            freeSpace -= parseFloat(i.system.quantity);
        }
    }
    if (freeSpace <= 0) {
        ui.notifications.warn("The ship has no available cargo space");
        return false;
    }

    if (item.system.cargo.freight) {
        let destination = await fromUuid(item.system.cargo.destinationId);

        if (item.system.quantity > freeSpace) {
            ui.notifications.warn("Not enough space");
            return false;
        }

        let data = {
            "item": item,
            "destination": destination,
            "freeSpace": freeSpace,
            "totalPrice": parseInt(item.system.quantity) * parseInt(item.system.cargo.price)
        };

        const content = await renderTemplate("systems/mgt2e/templates/dialogs/transfer-freight.html", data);
        const transferCargo = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: "Transfer Freight?"
            },
            content,
            modal: true
        });

        if (transferCargo) {
            let data = {
                type: "tradeBuyFreight",
                shipActorId: shipActor.uuid,
                worldActorId: worldActor.uuid,
                cargoItemId: item.uuid
            }
            if (worldActor.permission > 2) {
                await tradeBuyFreightHandler(data);
            } else {
                game.socket.emit("system.mgt2e", data);
            }
        }
        return transferCargo;
    } else if (item.system.cargo.speculative) {
        if (!shipActor.system.finance) {
            ui.notifications.warn("Ship has no financial information");
            return false;
        }
        if (parseInt(item.system.quantity < 1)) {
            ui.notifications.warn("World doesn't have any goods of this type");
            return false;
        }
        if (parseInt(item.system.cost) > parseInt(shipActor.system.finance.cash)) {
            ui.notifications.warn("Cargo is too expensive");
            return false;
        }
        new MgT2BuyCargoApp(worldActor, shipActor, item).render(true);
    }
    return false;
}

// Transfer cargo from a ship to a world.
export async function sellCargoDialog(shipActor, worldActor, item) {
    if (!item || !item.system?.cargo) {
        return false;
    }
    if (item.system.cargo.freight) {
        console.log("Sell freight cargo");
        if (item.system.cargo.destinationId !== worldActor.uuid) {
            ui.notifications.warn("Wrong world");
            return;
        }
        let data = {
            type: "tradeSellFreight",
            shipActorId: shipActor.uuid,
            worldActorId: worldActor.uuid,
            cargoItemId: item.uuid
        }
        if (game.user.isGM) {
            await tradeSellFreightHandler(data);
        } else {
            game.socket.emit("system.mgt2e", data);
        }
    } else if (item.system.cargo.speculative) {
        console.log("Sell speculative cargo");
        if (!shipActor.system.finance) {
            ui.notifications.warn("Ship has no financial information");
            return false;
        }
        new MgT2SellCargoApp(shipActor, worldActor, item).render(true);
    } else {
        // This is a raw cargo item. It hasn't been bought from a world.
        item.system.cargo.speculative = true;
        item.system.cargo.salePrice = item.system.cargo.price;
        item.system.cost = item.system.cargo.price;

        new MgT2SellCargoApp(shipActor, worldActor, item).render(true);
    }
}

export async function launchMissiles(shipActor, weaponItem, options) {
    console.log("Launching missiles " + weaponItem.name);

    let salvoSize = options.quantity ? options.quantity : 1;
    let data = {
        name: shipActor.name + " / " + weaponItem.name,
        type: "swarm",
        img: weaponItem.img,
        system: {
            swarmType: "salvo",
            sourceId: shipActor.uuid,
            size: {
                max: salvoSize,
                value: salvoSize,
            },
            salvo: {
                weaponId: weaponItem.uuid,
                endurance: {
                    max: 10,
                    value: 10
                },
                thrust: 10
            }
        },
        prototypeToken: {
            actorLink: true,
            height: 0.5,
            width: 0.5,
            sight: {
                enabled: false
            },
            bar1: {
                attribute: "size"
            },
            bar2: {
                attribute: "salvo.endurance"
            }
        }
    }
    let salvo = await Actor.implementation.create(data);
    let trackingData = shipActor.system.spacecraft.tracking;
    if (!trackingData) {
        trackingData = {
            outgoing: {},
            incoming: {}
        }
    }
    trackingData.outgoing[salvo.uuid] = {};

    await shipActor.update({"system.spacecraft.tracking": trackingData });
}
