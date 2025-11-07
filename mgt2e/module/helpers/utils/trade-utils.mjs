import {Tools} from "../chat/tools.mjs";
import {generateVilaniName} from "./name-utils.mjs";
import {choose, roll} from "../dice-rolls.mjs";
import {npcgen} from "./npcgen-utils.mjs";


export async function passengerTraffic(dm) {
    const roll = await new Roll(`2D6 + ${dm}`, null).evaluate();
    const total = roll.total;

    let die = "0";
    if (total > 1) {
        switch (total) {
            case 2: case 3:
                die = "1D6";
                break;
            case 4: case 5: case 6:
                die = "2D6";
                break;
            case 7: case 8: case 9: case 10:
                die = "3D6";
                break;
            case 11: case 12: case 13:
                die = "4D6";
                break;
            case 14: case 15:
                die = "5D6";
                break;
            case 16:
                die = "6D6";
                break;
            case 17:
                die = "7D6";
                break;
            case 18:
                die = "8D6";
                break;
            case 19:
                die = "9D6";
                break;
            default:
                die = "10D6";
                break;
        }
    } else {
        return 0;
    }

    const passengers = await new Roll(die, null).evaluate();
    return passengers.total;
}


export async function freightTraffic(dm) {
    const roll = await new Roll(`2D6 + ${dm}`, null).evaluate();
    const total = roll.total;

    let die = "0";
    if (total > 1) {
        switch (total) {
            case 2: case 3:
                die = "1D6";
                break;
            case 4: case 5:
                die = "2D6"
                break;
            case 6: case 7: case 8:
                die = "3D6";
                break;
            case 9: case 10: case 11:
                die = "4D6";
                break;
            case 12: case 13: case 14:
                die = "5D6";
                break;
            case 15: case 16:
                die = "6D6";
                break;
            case 17:
                die = "7D6";
                break;
            case 18:
                die = "8D6";
                break;
            case 19:
                die = "9D6";
                break;
            default:
                die = "10D6";
                break;
        }
    } else {
        return 0;
    }

    const lots = await new Roll(die, null).evaluate();
    return lots.total;
}

function freightDm(worldActor) {
    if (!worldActor) {
        return 0;
    }
    const uwp = worldActor.system.world.uwp;
    let dm = 0;

    // Population modifier.
    if (uwp.population <= 1) {
        dm -= 4;
    } else if (uwp.population === 6 || uwp.population === 7) {
        dm +=2;
    } else if (uwp.population >= 8) {
        dm +=4;
    }

    // Starport modifier.
    switch (uwp.port) {
        case "A":
            dm += 2;
            break;
        case "B":
            dm += 1;
            break;
        case "E":
            dm -= 1;
            break;
        case "X":
            dm -= 3;
            break;
    }

    // TL modifier
    if (uwp.techLevel <= 6) {
        dm -= 1;
    } else if (uwp.techLevel >= 9) {
        dm += 2;
    }

    if (uwp.zone === "Amber") {
        dm -= 2;
    } else if (uwp.zone === "Red") {
        dm -= 6;
    }

    return dm;
}

// This does oddq to axial. Also converts to zero based coordinates first.
// https://www.redblobgames.com/grids/hexagons/#conversions-offset
function worldToHex(world) {
    let x = parseInt(world.system.world.location.x)-1;
    let y = parseInt(world.system.world.location.y)-1;

    let parity = x&1;
    let q = x;
    let r = y - (x - parity) / 2;

    return { 'q': q, 'r': r };
}

function axial_subtract(a, b) {
    return { 'q': a.q - b.q, 'r': a.r - b.r };
}

// Count the hexes between two worlds.
// https://www.redblobgames.com/grids/hexagons/
// Using odd-q coordinate system. Also convert to 0 based rather than 1 based.
export function distanceBetweenWorlds(sourceWorld, destinationWorld) {
    let h1 = worldToHex(sourceWorld);
    let h2 = worldToHex(destinationWorld);
    let vec = axial_subtract(h1, h2);
    return (Math.abs(vec.q) + Math.abs(vec.q + vec.r) + Math.abs(vec.r)) / 2;
}

export async function clearFreight(sourceWorld, destinationWorldId) {
    let list = [];
    for (let i of sourceWorld.items) {
        if (i.type === "cargo" && i.system.cargo.destinationId === destinationWorldId) {
            list.push(i._id);
        }
        if (i.type === "worlddata" && i.system.world.destinationId === destinationWorldId) {
            list.push(i._id);
        }
    }
    await sourceWorld.deleteEmbeddedDocuments("Item", list);
}

/**
 * Calculate available freight between two worlds.
 *
 * @param sourceWorld           This world, where freight is going from.
 * @param destinationWorld      Dropped wrold, where freight is going to.
 * @param effect
 * @returns {Promise<{majorLots: number, minorLots: number, incidentalLots: number}>}
 */
export async function calculateFreightLots(sourceWorld, destinationWorld, effect) {
    let availableFreight = {
        incidentalLots: 0,
        minorLots: 0,
        majorLots: 0
    }

    // First, we need to clear the world of goods to this destination.
    let list = [];
    for (let i of sourceWorld.items) {
        if (i.type === "cargo" && i.system.cargo.destinationId === destinationWorld.uuid) {
            list.push(i._id);
        }
    }
    await sourceWorld.deleteEmbeddedDocuments("Item", list);

    let parsecs = distanceBetweenWorlds(sourceWorld, destinationWorld);
    console.log("Distance: " + parsecs + "pc");

    if (parsecs < 1) {
        ui.notifications.warn("You can't trade with the same world");
        return null;
    }
    if (parsecs > 6) {
        ui.notifications.warn("There is no trade beyond 6 parsecs");
        return null;
    }

    let parsecsDm = parsecs - 1;
    let price = 1000, highPassage = 9000, middlePassage  = 6500, basicPassage = 2000, lowPassage = 700;
    switch (parsecs) {
        case 1:
            highPassage = 9000;
            middlePassage = 6500;
            basicPassage = 2000;
            lowPassage = 700;
            price = 1000;
            break;
        case 2:
            highPassage = 14000;
            middlePassage = 10000;
            basicPassage = 3000;
            lowPassage = 1300;
            price = 1600;
            break;
        case 3:
            highPassage = 21000;
            middlePassage = 14000;
            basicPassage = 5000;
            lowPassage = 2200;
            price = 2600;
            break;
        case 4:
            highPassage = 34000;
            middlePassage = 23000;
            basicPassage = 8000;
            lowPassage = 3900;
            price = 4400;
            break;
        case 5:
            highPassage = 60000;
            middlePassage = 40000;
            basicPassage = 14000;
            lowPassage = 7200;
            price = 8500;
            break;
        case 6:
            highPassage = 210000;
            middlePassage = 130000;
            basicPassage = 55000;
            lowPassage = 27000;
            price = 32000;
            break;
    }

    let worldDm = freightDm(sourceWorld) + freightDm(destinationWorld) - parsecsDm;

    // Major lots
    let majorLots = await freightTraffic(worldDm - 4);
    for (let i=0; i < majorLots; i++) {
        let tonnageRoll = await new Roll("1D6 * 10").evaluate();
        createFreight("Major Lot", sourceWorld, destinationWorld,
            tonnageRoll.total, price, parsecs);
    }
    // Minor lots
    let minorLots = await freightTraffic(worldDm);
    for (let i=0; i < minorLots; i++) {
        let tonnageRoll = await new Roll("1D6 * 5").evaluate();
        createFreight("Minor Lot", sourceWorld, destinationWorld,
            tonnageRoll.total, price, parsecs);
    }
    // Incidental lots
    let incidentalLots = await freightTraffic(worldDm);
    for (let i=0; i < incidentalLots; i++) {
        let tonnageRoll = await new Roll("1D6").evaluate();
        createFreight("Incidental Lot", sourceWorld, destinationWorld,
            tonnageRoll.total, price, parsecs);
    }

    // Passengers
    let passengerDM = 0 - parsecsDm;
    for (let w of [ sourceWorld, destinationWorld ]) {
        console.log(w.name);
        if (parseInt(w.system.world.uwp.population) <= 1) {
            passengerDM -= 4;
        } else if (parseInt(w.system.world.uwp.population) >= 8) {
            passengerDM += 3;
        } else if (parseInt(w.system.world.uwp.population) >= 6) {
            passengerDM += 1;
        }
        switch (w.system.world.uwp.port) {
            case "A":
                passengerDM += 2;
                break;
            case "B":
                passengerDM += 1;
                break;
            case "C": case "D":
                break;
            case "E":
                passengerDM -= 1;
                break;
            default:
                passengerDM -= 3;
        }
        if (w.system.world.uwp.zone === "Amber") {
            passengerDM += 1;
        } else if (w.system.world.uwp.zone === "Red") {
            passengerDM -= 3;
        }
    }
    // Low Passage
    let lowPassengers = await passengerTraffic(passengerDM + 1);
    createPassengers("Low Passage", "low", sourceWorld, destinationWorld, lowPassengers, lowPassage, parsecs);
    let basicPassengers = await passengerTraffic(passengerDM);
    createPassengers("Basic Passage", "basic", sourceWorld, destinationWorld, basicPassengers, basicPassage, parsecs);
    let middlePassengers = await passengerTraffic(passengerDM);
    createPassengers("Middle Passage", "middle", sourceWorld, destinationWorld, middlePassengers, middlePassage, parsecs);
    let highPassengers = await passengerTraffic(passengerDM - 4);
    createPassengers("High Passage", "high", sourceWorld, destinationWorld, highPassengers, highPassage, parsecs);

    return availableFreight;
}

export function createPassengers(name, passage, worldActor, destinationWorld, number, price, parsecs) {
    if (number < 1) {
        return;
    }
    const itemData = {
        "name": name,
        "img": `systems/mgt2e/icons/cargo/passenger-${passage}.svg`,
        "type": "worlddata",
        "system": {
            "quantity": number,
            "cost": 0,
            "world": {
                "datatype": "passenger",
                "passage": passage,
                "sourceId": worldActor.uuid,
                "destinationId": destinationWorld.uuid,
                "parsecs": parsecs,
                "price": price
            },
            "description": `Passengers from ${worldActor.name} to ${destinationWorld.name}`
        }
    };
    Item.create(itemData, { parent: worldActor });
}

export function createFreight(name, worldActor, destinationWorld, tonnage, price, parsecs) {
    const itemData = {
        "name": name,
        "img": "systems/mgt2e/icons/cargo/cargo.svg",
        "type": "cargo",
        "system": {
            "quantity": tonnage,
            "cost": 0,
            "cargo": {
                "price": price,
                "availability": "",
                "purchaseDM": "",
                "saleDM": "",
                "tons": "0",
                "illegal": false,
                "sourceId": worldActor.uuid,
                "destinationId": destinationWorld.uuid,
                "destinationName": destinationWorld.name,
                "parsecs": parsecs,
                "freight": true
            },
            "description": "Freight from " + worldActor.name + " to " + destinationWorld.name
        }
    };
    Item.create(itemData, {parent: worldActor});
}

function getModifiedPrice(basePrice, percentage) {
    return Math.round((Number(basePrice) * Number(percentage)) / 100);
}

export async function getPurchasePrice(basePrice, total) {
    if (total < -3) {
        return getModifiedPrice(basePrice, 300);
    } else if (total > 25) {
        return getModifiedPrice(basePrice, 15);
    }

    switch (total) {
        case -3: return getModifiedPrice(basePrice, 300);
        case -2: return getModifiedPrice(basePrice, 250);
        case -1: return getModifiedPrice(basePrice, 200);
        case 0: return getModifiedPrice(basePrice, 175);
        case 1: return getModifiedPrice(basePrice, 150);
        case 2: return getModifiedPrice(basePrice, 135);
        case 3: return getModifiedPrice(basePrice, 125);
        case 4: return getModifiedPrice(basePrice, 120);
        case 5: return getModifiedPrice(basePrice, 115);
        case 6: return getModifiedPrice(basePrice, 110);
        case 7: return getModifiedPrice(basePrice, 105);
        case 8: return getModifiedPrice(basePrice, 100);
        case 9: return getModifiedPrice(basePrice, 95);
        case 10: return getModifiedPrice(basePrice, 90);
        case 11: return getModifiedPrice(basePrice, 85);
        case 12: return getModifiedPrice(basePrice, 80);
        case 13: return getModifiedPrice(basePrice, 75);
        case 14: return getModifiedPrice(basePrice, 70);
        case 15: return getModifiedPrice(basePrice, 65);
        case 16: return getModifiedPrice(basePrice, 60);
        case 17: return getModifiedPrice(basePrice, 55);
        case 18: return getModifiedPrice(basePrice, 50);
        case 19: return getModifiedPrice(basePrice, 45);
        case 20: return getModifiedPrice(basePrice, 40);
        case 21: return getModifiedPrice(basePrice, 35);
        case 22: return getModifiedPrice(basePrice, 30);
        case 23: return getModifiedPrice(basePrice, 25);
        case 24: return getModifiedPrice(basePrice, 20);
        case 25: return getModifiedPrice(basePrice, 15);
    }
}

export async function getSalePrice(basePrice, total) {
    if (total < -3) {
        return getModifiedPrice(basePrice, 10);
    } else if (total > 25) {
        return getModifiedPrice(basePrice, 400);
    }

    switch (total) {
        case -3: return getModifiedPrice(basePrice, 10);
        case -2: return getModifiedPrice(basePrice, 20);
        case -1: return getModifiedPrice(basePrice, 30);
        case 0: return getModifiedPrice(basePrice, 40);
        case 1: return getModifiedPrice(basePrice, 45);
        case 2: return getModifiedPrice(basePrice, 50);
        case 3: return getModifiedPrice(basePrice, 55);
        case 4: return getModifiedPrice(basePrice, 60);
        case 5: return getModifiedPrice(basePrice, 65);
        case 6: return getModifiedPrice(basePrice, 70);
        case 7: return getModifiedPrice(basePrice, 75);
        case 8: return getModifiedPrice(basePrice, 80);
        case 9: return getModifiedPrice(basePrice, 85);
        case 10: return getModifiedPrice(basePrice, 90);
        case 11: return getModifiedPrice(basePrice, 100);
        case 12: return getModifiedPrice(basePrice, 105);
        case 13: return getModifiedPrice(basePrice, 110);
        case 14: return getModifiedPrice(basePrice, 115);
        case 15: return getModifiedPrice(basePrice, 120);
        case 16: return getModifiedPrice(basePrice, 125);
        case 17: return getModifiedPrice(basePrice, 130);
        case 18: return getModifiedPrice(basePrice, 140);
        case 19: return getModifiedPrice(basePrice, 150);
        case 20: return getModifiedPrice(basePrice, 160);
        case 21: return getModifiedPrice(basePrice, 175);
        case 22: return getModifiedPrice(basePrice, 200);
        case 23: return getModifiedPrice(basePrice, 250);
        case 24: return getModifiedPrice(basePrice, 300);
        case 25: return getModifiedPrice(basePrice, 400);
    }
}

export function getHighestModifier(worldActor, modifiers) {
    let codes = modifiers.split(",");
    let dm = 0;

    for (let code of codes) {
        let c = code.trim().split(" ")[0];
        let v = code.trim().split(" ")[1];
        if (worldActor.system.world.uwp.codes.indexOf(c) > -1) {
            if (parseInt(v) > dm) {
                dm = parseInt(v);
            }
        }
    }

    return dm;
}

async function createTradeItem(worldActor, item, available) {
    const srcCargo = item.system.cargo;

    // Need to roll for how many tons of this type of good. However,
    // the rules here are a pain. It will be xD6 * y, and the modifier
    // for population needs to modify the (xD6) part.
    let tonnage = srcCargo.tons;
    let modifier = 0;
    if (worldActor.system.world.uwp.population <= 3) {
        modifier = "- 3";
    } else if (worldActor.system.world.uwp.population >= 9) {
        modifier = "+ 3";
    }
    if (modifier && tonnage.indexOf("D6") > -1) {
        tonnage = tonnage.replace(/([0-9]+D6)/i, `($1 ${modifier})`);
    }
    const roll = await new Roll(tonnage).evaluate();
    let tonnes = roll.total;
    if (tonnes <= 0 || !available) {
        // No cargo here due to population modifier.
        // However, we want to display it due to recording the sale price.
        tonnes = 0;
    }

    // First, if this trade item already exists as speculative trade, append it.
    for (let i of worldActor.items) {
        if (item.name === i.name && i.type === "cargo" && i.system.cargo.speculative) {
            i.system.quantity += tonnes;
            i.update({"system.quantity": i.system.quantity });
            return;
        }
    }
    // Calculate cost.
    let dm = 0 - Number(worldActor.system.world.meta.localBrokerScore);
    if (srcCargo.illegal) {
        dm += Number(worldActor.system.world.meta.streetwiseScore);
    } else {
        dm += Number(worldActor.system.world.meta.brokerScore);
    }
    // Now need to modify based on trade codes.
    let purchaseDM =
        getHighestModifier(worldActor, item.system.cargo.purchaseDM) -
        getHighestModifier(worldActor, item.system.cargo.saleDM);
    let saleDM =
        getHighestModifier(worldActor, item.system.cargo.saleDM) -
        getHighestModifier(worldActor, item.system.cargo.purchaseDM);

    const costRoll = await new Roll(`3D6 + ${dm}`, null).evaluate();
    let cost = await getPurchasePrice(srcCargo.price, costRoll.total + purchaseDM);
    let sell = await getSalePrice(srcCargo.price, costRoll.total + saleDM);

    const itemData = {
        "name": item.name,
        "img": item.img,
        "type": "cargo",
        "system": {
            "quantity": tonnes,
            "description": item.system.description,
            "cost": cost,
            "cargo": {
                "price": srcCargo.price,
                "availability": srcCargo.availability,
                "purchaseDM": srcCargo.purchaseDM,
                "saleDM": srcCargo.saleDM,
                "tons": tonnes,
                "illegal": srcCargo.illegal,
                "sourceId": worldActor.uuid,
                "destinationId": null,
                "speculative": true,
                "salePrice": sell
            }
        }
    }
    await Item.create(itemData, { parent: worldActor });
}

export async function createSpeculativeGoods(worldActor, illegal) {
    if (worldActor.system.world.uwp.population === 0) {
        ui.notifications.warn("World has no population, so cannot trade");
        return;
    }

    // When generating speculative trade, remove any previous speculative trade
    // goods and regenerate a new list from scratch.
    let list = [];
    let localGoods = [];
    for (let i of worldActor.items) {
        if (i.type === "cargo" && i.system.cargo.speculative) {
            list.push(i._id);
        } else if (i.type === "cargo" && !i.system.cargo.freight) {
            localGoods.push(i);
        }
    }
    await worldActor.deleteEmbeddedDocuments("Item", list);

    let tradeFolderName = "Trade Goods";
    if (worldActor.system.world.meta?.tradeFolder) {
        tradeFolderName = worldActor.system.world.meta?.tradeFolder;
    }

    let tradeFolder = game.items.folders.getName(tradeFolderName);
    if (!tradeFolder) {
        // Need to look for a compendium entry instead.
        tradeFolder = game.packs.get("mgt2e.base-items")?.folders?.getName("Trade Goods");
        if (!tradeFolder) {
            ui.notifications.error("Unable to find Trade Goods item folder");
            return;
        }
    }
    // First, deal with any local unique goods on this world.
    for (let item of localGoods) {
        await createTradeItem(worldActor, item, true);
    }

    // Second, look for the standard goods available.
    for (let item of tradeFolder.contents) {
        if (item.name === "Spare Parts") {
            // Hack to avoid including spare parts. Need a better way
            // of doing this.
            continue;
        }
        if (!item.system) {
            // If item is from a compendium, we only have a reference at this point so
            // need to fetch the full item.
            item = await fromUuid(item.uuid);
        }
        if (item.system.cargo.illegal && !illegal) {
            continue;
        }
        let availability = item.system.cargo.availability;
        let available = false;
        if (availability.includes("All")) {
            available = true;
        } else {
            for (let a of availability.split(", ")) {
                if (worldActor.system.world.uwp.codes.includes(a)) {
                    available = true;
                }
            }
        }
        await createTradeItem(worldActor, item, available);
    }
    // Now look for the random extras. Roll once per population code.
    let number = tradeFolder.contents.length;
    console.log("Number of options:" + number);
    for (let r=0; r < worldActor.system.world.uwp.population; r++) {
        let item = null;
        while (item === null) {
            let roll = await new Roll(`1D${number} - 1`).evaluate();
            let i = roll.total;
            item = tradeFolder.contents[i];
            if (!item.system) {
                // Fetch from compendium.
                item = await fromUuid(item.uuid);
            }
            if (!illegal && item.system.cargo.illegal) {
                // Re-roll. Only legal stuff.
                item = null;
            }
        }
        await createTradeItem(worldActor, item, true);
    }
}

export function outputTradeChat(actor, title, text) {
    let html = `<div class="chat-trade"><h3>${title}</h3>`;
    html += `${text}`;
    html += `</div>`;

    let chatData = {
        speaker: ChatMessage.getSpeaker({actor: actor}),
        content: html
    };
    ChatMessage.create(chatData, {});
}

/**
 * Handler for buying speculative trade goods.
 * This is only ever executed by the GM.
 */
export async function tradeBuyGoodsHandler(queryData) {
    console.log("tradeBuyGoodsHandler:");
    console.log(queryData);

    let worldActor = await fromUuid(queryData.worldActorId);
    let shipActor = await fromUuid(queryData.shipActorId);
    let cargoItem = await fromUuid(queryData.cargoItemId);
    let quantity = parseInt(queryData.quantity);
    let totalCost = quantity * parseInt(cargoItem.system.cost);

    const itemData = {
        "name": cargoItem.name,
        "img": cargoItem.img,
        "type": "cargo",
        "system": foundry.utils.deepClone(cargoItem.system)
    }
    itemData.system.cargo.meta = {
        purchasePrice: itemData.system.cost
    }
    itemData.system.quantity = quantity;
    Item.create(itemData, { parent: shipActor });
    shipActor.update({"system.finance.cash": parseInt(shipActor.system.finance.cash) - parseInt(totalCost)})

    cargoItem.system.quantity -= quantity;
    if (cargoItem.system.quantity > 0) {
        cargoItem.update({"system.quantity": cargoItem.system.quantity });
    } else {
        worldActor.deleteEmbeddedDocuments("Item", [ cargoItem.id]);
    }

    const title = `${cargoItem.name}`;
    let text = `<p><b>Purchased from:</b> ${worldActor.name}</p>`;
    text += `<p><b>Quantity:</b> ${quantity}dt</p>`;
    text += `<p><b>Unit Price:</b> Cr${Tools.prettyNumber(cargoItem.system.cost, 0)}</p>`;
    text += `<p><b>Total Price:</b> Cr${Tools.prettyNumber(totalCost, 0)}</p>`;
    outputTradeChat(shipActor, title, text);
}

// Moving goods from ship to world.
export async function tradeSellGoodsHandler(queryData) {
    let worldActor = await fromUuid(queryData.worldActorId);
    let shipActor = await fromUuid(queryData.shipActorId);
    let cargoItem = await fromUuid(queryData.cargoItemId);
    let matchedItem = queryData.matchedItemId?(await fromUuid(queryData.matchedItemId)):null;
    let salePrice = parseInt(queryData.salePrice);
    let quantity = parseInt(queryData.quantity);

    let totalCost = parseInt(cargoItem.system.cost) * quantity;
    let totalProfit = (salePrice - parseInt(cargoItem.system.cost)) * quantity;
    if (totalCost === NaN) {
        totalCost = 0;
    }
    if (totalProfit === NaN) {
        totalProfit = 0;
    }

    shipActor.system.finance.cash = parseInt(shipActor.system.finance.cash) + parseInt(totalCost);
    shipActor.update({"system.finance": shipActor.system.finance})

    cargoItem.system.quantity -= quantity;
    if (cargoItem.system.quantity > 0) {
        cargoItem.update({"system.quantity": cargoItem.system.quantity });
    } else {
        console.log("Deleting item from ship " + shipActor.name);
        shipActor.deleteEmbeddedDocuments("Item", [ cargoItem.id]);
    }
    if (matchedItem) {
        matchedItem.system.quantity += quantity;
        matchedItem.update({"system.quantity": quantity});
    }

    // Output sale information to the chat.
    const title = `${cargoItem.name}`;
    let text = `<p><b>Sold at:</b> ${worldActor.name}</p>`;
    text += `<p><b>Quantity:</b> ${Tools.prettyNumber(quantity, 0)}dt</p>`;
    text += `<p><b>Unit Sale Price:</b> Cr${Tools.prettyNumber(salePrice, 0)}</p>`;
    text += `<p><b>Total Sale Price:</b> Cr${Tools.prettyNumber(totalCost, 0)}</p>`;
    text += `<p><b>Total Profit:</b> Cr${Tools.prettyNumber(totalProfit, 0, true)}</p>`;
    outputTradeChat(shipActor, title, text);
}

export async function tradeBuyFreightHandler(queryData) {
    // Remove from world.
    let worldActor = await fromUuid(queryData.worldActorId);
    let shipActor = await fromUuid(queryData.shipActorId);
    let freightItem = await fromUuid(queryData.cargoItemId);

    let destinationWorld = await fromUuid(freightItem.system.cargo.destinationId);

    worldActor.deleteEmbeddedDocuments("Item", [ freightItem.id ]);
    const itemData = {
        "name": freightItem.name,
        "img": freightItem.img,
        "type": "cargo",
        "system": foundry.utils.deepClone(freightItem.system)
    }
    Item.create(itemData, { parent: shipActor });

    // Output purchase information to the chat.
    const title = `Freight Contracted`;
    let text = `<p><b>Contracted at:</b> ${worldActor.name}</p>`;
    text += `<p><b>To be taken to:</b> ${destinationWorld.name}</p>`;
    text += `<p><b>Quantity:</b> ${Tools.prettyNumber(freightItem.system.quantity, 0)}dt</p>`;
    text += `<p><b>Contracted Price:</b> Cr${Tools.prettyNumber(freightItem.system.cost * freightItem.system.quantity, 0)}</p>`;
    outputTradeChat(shipActor, title, text);
}

export async function tradeSellFreightHandler(queryData) {
    // Remove from ship. We don't bother adding it to the world, because
    // the world won't be giving an option to buy it back.
    let worldActor = await fromUuid(queryData.worldActorId);
    let shipActor = await fromUuid(queryData.shipActorId);
    let freightItem = await fromUuid(queryData.cargoItemId);

    let price = parseInt(freightItem.system.cost) * parseInt(freightItem.system.quantity);

    shipActor.deleteEmbeddedDocuments("Item", [ freightItem.id ]);
    shipActor.update({"system.finance.cash": parseInt(shipActor.system.finance.cash) + price});

    // Output sale information to the chat.
    const title = `Freight Delivered`;
    let text = `<p><b>Delivered to:</b> ${worldActor.name}</p>`;
    text += `<p><b>Quantity:</b> ${Tools.prettyNumber(freightItem.system.quantity, 0)}dt</p>`;
    text += `<p><b>Total Payment:</b> Cr${Tools.prettyNumber(freightItem.system.cost * freightItem.system.quantity, 0)}</p>`;
    outputTradeChat(shipActor, title, text);
}

export async function tradeEmbarkPassengerHandler(queryData) {
    let worldActor = await fromUuid(queryData.worldActorId);
    let shipActor = await fromUuid(queryData.shipActorId);
    let passengerItem = await fromUuid(queryData.passengerItemId);
    let destinationActor = await fromUuid(passengerItem.system.world.destinationId);
    let quantity = parseInt(queryData.quantity);

    console.log("Creating passenger NPC");

    let folderName = "NPC Passengers";
    let npcFolder = await game.actors.folders.getName(folderName);
    if (!npcFolder) {
        npcFolder = await Folder.create({"name": folderName, "type": "Actor", color: "#FF0000" });
    }

    let passengers = [];
    let description = `Passenger from ${worldActor.name} to ${destinationActor.name} on the ${shipActor.name}.`;
    for (let p=0; p < quantity; p++) {
        let name = generateVilaniName();
        let npcData = {
            "type": "npc",
            "name": name,
            "img": `systems/mgt2e/icons/cargo/passenger-${passengerItem.system.world.passage}.svg`,
            "folder": npcFolder._id,
            "system": {
                "settings": {
                    hideUntrained: true,
                    lockCharacteristis: true
                },
                "sophont": {
                    age: await roll("2D6 + 20"),
                    /*
                    species: choose(["Vilani", "Vilani", "Vilani", "Solomani", "Solomani", "Vargr", "Aslan", "Bwap"]),
                    gender: choose(["Male", "Female"]),
                    profession: choose(["Tourist", "Office Worker", "Manager", "Refugee", "Specialist"]),
                    */
                    homeworld: worldActor.name
                },
                "meta": {
                    passage: passengerItem.system.world.passage,
                    price: passengerItem.system.world.price,
                    destinationName: destinationActor.name,
                    destinationId: passengerItem.system.world.destinationId,
                    spacecraftId: shipActor.uuid
                },
                "description": description
            }
        }
        await npcgen(npcData);

        let npc = await Actor.implementation.create(npcData);
        passengers.push(npc);
        shipActor.system.crewed.passengers[npc._id] = {
            roles: [ "NONE" ],
            passage: passengerItem.system.world.passage,
            destinationId: passengerItem.system.world.destinationId
        }
    }
    shipActor.update({"system.crewed.passengers": shipActor.system.crewed.passengers });
    if (shipActor.system.finance) {
        let gain = parseInt(passengerItem.system.world.price) * parseInt(quantity);
        let cash = parseInt(shipActor.system.finance.cash) + gain;
        shipActor.update({"system.finance.cash": cash});
    }

    passengerItem.system.quantity -= quantity;
    if (passengerItem.system.quantity > 0) {
        passengerItem.update({"system.quantity": passengerItem.system.quantity });
    } else {
        worldActor.deleteEmbeddedDocuments("Item", [ passengerItem.id ]);
    }
}

export async function tradeDisembarkPassengerHandler(queryData) {
    const shipActor = await fromUuid(queryData.shipActorId);
    const worldActor = await fromUuid(queryData.worldActorId);
    const actorList = [];

    for (let p in queryData.passengerList) {
        let id = queryData.passengerList[p];
        let data = shipActor.system.crewed.passengers[id];
        shipActor.update({ [`system.crewed.passengers.-=${id}`]: null});

        let npc = await fromUuid(`Actor.${id}`);
        let folder = await npc.folder;
        if (folder.name === "NPC Passengers") {
            npc.delete();
        }
    }
}
