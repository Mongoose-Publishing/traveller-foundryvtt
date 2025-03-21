
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

export function calculateFreightLots(sourceWorld, destinationWorld, effect) {
    let availableFreight = {
        incidentalLots: 0,
        minorLots: 0,
        majorLots: 0
    }

    let worldDM = freightDm(sourceWorld) + freightDm(destinationWorld);

    return availableFreight;
}

export function createFreight(worldActor, tonnage, price) {
    const itemData = {
        "name": "Freight",
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
                "sourceId": worldActor.uuid
            },
            "description": "Freight from " + worldActor.name
        }
    };
    Item.create(itemData, {parent: worldActor});
}

