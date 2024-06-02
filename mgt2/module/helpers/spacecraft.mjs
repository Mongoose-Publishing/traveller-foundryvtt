import { MGT2 } from "./config.mjs";

// Gets the tonnage multiplier for each point of armour.
export function getArmourMultiplier(ship) {
    console.log("getArmourMultiplier:");
    if (ship === null || ship.type !== "spacecraft") {
        return 0;
    }

    var dtons = ship.system.spacecraft.dtons;
    var configuration = ship.system.spacecraft.configuration;

    var shapeMultiplier = MGT2.SHIP_CONFIGURATION.get(configuration);
    if (shapeMultiplier === null) {
        shapeMultiplier = 1.0;
    }
    console.log("    shape: " + shapeMultiplier);
    var sizeMultiplier = 1.0;
    if (dtons < 16) {
        sizeMultiplier = 4.0;
    } else if (dtons < 26) {
        sizeMultiplier = 3.0;
    } else if (dtons < 100) {
        sizeMultiplier = 2.0;
    }
    console.log("    size: " + sizeMultiplier);

    return shapeMultiplier * sizeMultiplier;
}