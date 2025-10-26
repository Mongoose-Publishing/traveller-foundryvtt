
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

    if (uwp.zone === "AMBER") {
        dm -= 2;
    } else if (uwp.zone === "RED") {
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
function distanceBetweenWorlds(sourceWorld, destinationWorld) {
    let h1 = worldToHex(sourceWorld);
    let h2 = worldToHex(destinationWorld);
    let vec = axial_subtract(h1, h2);
    return (Math.abs(vec.q) + Math.abs(vec.q + vec.r) + Math.abs(vec.r)) / 2;
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
    let name = "Cargo to " + destinationWorld.name;

    // Major lots
    let majorLots = await freightTraffic(worldDm - 4);
    for (let i=0; i < majorLots; i++) {
        let tonnageRoll = await new Roll("1D6 * 10").evaluate();
        createFreight(name, sourceWorld, destinationWorld, tonnageRoll.total, price);
    }
    // Minor lots
    let minorLots = await freightTraffic(worldDm);
    for (let i=0; i < minorLots; i++) {
        let tonnageRoll = await new Roll("1D6 * 5").evaluate();
        createFreight(name, sourceWorld, destinationWorld, tonnageRoll.total, price);
    }
    // Incidental lots
    let incidentalLots = await freightTraffic(worldDm);
    for (let i=0; i < incidentalLots; i++) {
        let tonnageRoll = await new Roll("1D6").evaluate();
        createFreight(name, sourceWorld, destinationWorld, tonnageRoll.total, price);
    }

    return availableFreight;
}

export function createFreight(name, worldActor, destinationWorld, tonnage, price) {
    const itemData = {
        "name": name,
        "img": "systems/mgt2e/icons/cargo/cargo.svg",
        "type": "cargo",
        "system": {
            "quantity": tonnage,
            "cargo": {
                "price": price,
                "availability": "",
                "purchaseDM": "",
                "saleDM": "",
                "tons": "0",
                "illegal": false,
                "sourceId": worldActor.uuid,
                "destinationId": destinationWorld.uuid,
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

async function getPurchasePrice(basePrice, total) {
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

async function getSalePrice(basePrice, total) {
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
    const costRoll = await new Roll(`3D6 + ${dm}`, null).evaluate();
    let cost = await getPurchasePrice(srcCargo.price, costRoll.total);
    let sell = await getSalePrice(srcCargo.price, costRoll.total);

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
    for (let i of worldActor.items) {
        if (i.type === "cargo" && i.system.cargo.speculative) {
            list.push(i._id);
        }
    }
    await worldActor.deleteEmbeddedDocuments("Item", list);

    let tradeFolder = game.items.folders.getName("Trade Goods");
    if (!tradeFolder) {
        // Need to look for a compendium entry instead.
        tradeFolder = game.packs.get("mgt2e.base-items")?.folders?.getName("Trade Goods");
        if (!tradeFolder) {
            ui.notifications.error("Unable to find Trade Goods item folder");
            return;
        }
    }
    // First, look for the standard goods available.
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
    let html = `<div class="chat-package"><h3>${title}</h3>`;
    html += `${text}`;
    html += `</div>`;

    let chatData = {
        speaker: ChatMessage.getSpeaker({actor: actor}),
        content: html
    };
    ChatMessage.create(chatData, {});
}
