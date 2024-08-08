import { MGT2 } from "./config.mjs";

// Gets the tonnage multiplier for each point of armour.
export function getArmourMultiplier(ship) {
    console.log("getArmourMultiplier:");
    if (ship === null || ship.type !== "spacecraft") {
        return 0;
    }

    let dtons = ship.system.spacecraft.dtons;
    let configuration = ship.system.spacecraft.configuration;

    let shapeMultiplier = 1.0;
    if (MGT2.SHIP_CONFIGURATION[configuration]) {
        shapeMultiplier = MGT2.SHIP_CONFIGURATION[configuration].armour;
    }

    let sizeMultiplier = 1.0;
    if (dtons < 16) {
        sizeMultiplier = 4.0;
    } else if (dtons < 26) {
        sizeMultiplier = 3.0;
    } else if (dtons < 100) {
        sizeMultiplier = 2.0;
    }

    return shapeMultiplier * sizeMultiplier;
}