
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

    let parsecsDm = 0;
    let price = 1000;
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

async function getPurchasePrice(basePrice, dm) {
    let roll = await new Roll(`3D6 + ${dm}`, null).evaluate();
    let total = roll.total;

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

async function getSalePrice(basePrice, dm) {
    let roll = await new Roll(`3D6 + ${dm}`, null).evaluate();
    let total = roll.total;

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


async function createTradeItem(worldActor, item) {
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
    if (roll.total <= 0) {
        // No cargo here due to population modifier.
        return;
    }

    // First, if this trade item already exists as speculative trade, append it.
    for (let i of worldActor.items) {
        if (item.name === i.name && i.type === "cargo" && i.system.cargo.speculative) {
            i.system.quantity += roll.total;
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
    let cost = await getPurchasePrice(srcCargo.price, dm);

    const itemData = {
        "name": item.name,
        "img": item.img,
        "type": "cargo",
        "system": {
            "quantity": roll.total,
            "description": item.system.description,
            "cost": cost,
            "cargo": {
                "price": srcCargo.price,
                "availability": srcCargo.availability,
                "purchaseDM": srcCargo.purchaseDM,
                "saleDM": srcCargo.saleDM,
                "tons": roll.total,
                "illegal": srcCargo.illegal,
                "sourceId": worldActor.uuid,
                "destinationId": null,
                "speculative": true
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

    const tradeFolder = game.items.folders.getName("Trade Goods");
    // First, look for the standard goods available.
    for (let item of tradeFolder.contents) {
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
        if (available) {
            await createTradeItem(worldActor, item);
        }
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
            if (!illegal && item.system.cargo.illegal) {
                // Re-roll. Only legal stuff.
                item = null;
            }
        }
        await createTradeItem(worldActor, item);
    }

}
