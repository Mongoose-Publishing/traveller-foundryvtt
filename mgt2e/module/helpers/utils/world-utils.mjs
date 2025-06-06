/**
 * Utilities to create a world from scratch.
 */
import {roll2D6} from "../dice-rolls.mjs";
import {roll1D6} from "../dice-rolls.mjs";
import {MGT2} from "../config.mjs";



/**
 * Use the world creation rules to create a world.
 */
export async function createWorld(worldActor) {
    console.log("Creating world");

    let size = await roll2D6() - 2;
    let atmosphere = Math.max(0, await roll2D6() - 7 + size);
    let hydrographics = Math.max(0, await roll2D6() - 7 + atmosphere);
    if (atmosphere < 2) {
        hydrographics = 0;
    } else if (atmosphere >= 10) {
        hydrographics = Math.max(0, hydrographics - 4);
    }
    let population = Math.max(0, await roll2D6() - 2);
    let government = 0;
    let lawLevel = 0;
    let techLevel = 0;
    let port = "X";

    if (population > 0) {
        government = Math.max(0, await roll2D6() - 7 + population);
        lawLevel = Math.max(0, await roll2D6() - 7 + government);
        let portRoll = await roll2D6();
        if (population === 8 || population === 9) {
            portRoll += 1;
        } else if (population >= 10) {
            portRoll += 2;
        } else if (population === 3 || population === 4) {
            portRoll -= 1;
        } else if (population < 3) {
            portRoll -= 2;
        }
        switch (portRoll) {
            case 0:
            case 1:
            case 2:
                port = "X";
                break;
            case 3:
            case 4:
                port = "E";
                break;
            case 5:
            case 6:
                port = "D";
                break;
            case 7:
            case 8:
                port = "C";
                break;
            case 9:
            case 10:
                port = "B";
                break;
            default:
                port = "A";
        }
        techLevel = await roll1D6();
        techLevel += modifyTechLevel(MGT2.WORLD.starport, port);
        techLevel += modifyTechLevel(MGT2.WORLD.size, size);
        techLevel += modifyTechLevel(MGT2.WORLD.atmosphere, atmosphere);
        techLevel += modifyTechLevel(MGT2.WORLD.hydrographics, hydrographics);
        techLevel += modifyTechLevel(MGT2.WORLD.population, population);
        techLevel += modifyTechLevel(MGT2.WORLD.government, government);

        lawLevel = Math.max(0, lawLevel);
        techLevel = Math.max(0, techLevel);
    }

    let zone = null;
    if (atmosphere >= 10 || government === 0 || government === 7 || government === 10 || lawLevel === 0 || lawLevel >= 9) {
        zone = "Amber";
    }

    worldActor.system.world.uwp.port = port;
    worldActor.system.world.uwp.size = size;
    worldActor.system.world.uwp.atmosphere = atmosphere;
    worldActor.system.world.uwp.hydrographics = hydrographics;
    worldActor.system.world.uwp.government = government;
    worldActor.system.world.uwp.population = population;
    worldActor.system.world.uwp.lawLevel = lawLevel;
    worldActor.system.world.uwp.techLevel = techLevel;
    worldActor.system.world.uwp.zone = zone;
    // Finally, set the trade codes (if any).
    setTradeCodes(worldActor);

    worldActor.update({"system.world.uwp": worldActor.system.world.uwp});
}

function modifyTechLevel(data, value) {
    if (data && data[value] && data[value].techBonus) {
        return data[value].techBonus;
    }
    return 0;
}

function setTradeCodes(worldActor) {
    let codes = "";
    let uwp = worldActor.system.world.uwp;

    // Agricultural
    if (uwp.atmosphere >= 4 && uwp.atmosphere <= 9 &&
        uwp.hydrographics >= 4 && uwp.hydrographics <= 8 &&
        uwp.population >= 5 && uwp.population <= 7) {
        codes += ", Ag";
    }
    // Asteroid
    if (uwp.size === 0 && uwp.atmosphere === 0 && uwp.hydrographics === 0) {
        codes += ", As";
    }
    // Barren
    if (uwp.population === 0) {
        codes += ", Ba";
    }
    // Desert
    if (uwp.atmosphere >= 2 && uwp.atmosphere <= 9 && uwp.hydrographics === 0) {
        codes += ", De";
    }
    // Fluid Oceans
    if (uwp.atmosphere >= 10 && uwp.hydrographics >= 1) {
        codes += ", Fl";
    }
    // Garden
    if (uwp.size >= 6 && uwp.size <= 8 && [5, 6, 8].includes(uwp.atmosphere) && [5,6,7].includes(uwp.hydrographics) ) {
        codes += ", Ga";
    }
    if (uwp.population >= 9) {
        codes += ", Hi";
    }
    if (uwp.techLevel >= 12) {
        codes += ", Ht";
    }
    if (uwp.atmosphere < 2 && uwp.hydrographics >= 1) {
        codes += ", Ic";
    }
    if ([0,1,2,4,7,9,10,11,12].includes(uwp.atmosphere) && uwp.population >= 9) {
        codes += ", In";
    }
    if ([1,2,3].includes(uwp.population)) {
        codes += ", Lo";
    }
    if (uwp.population >= 1 && uwp.techLevel <= 5) {
        codes += ", Lt";
    }
    if (uwp.atmosphere < 4 && uwp.hydrographics < 4 && uwp.population >= 6) {
        codes += ", Na";
    }
    if ([4,5,6].includes(uwp.population)) {
        codes += ", Ni";
    }
    if ([2,3,4,5].includes(uwp.atmosphere) && uwp.hydrographics < 4) {
        codes += ", Po";
    }
    if ([6, 8].includes(uwp.atmosphere) && [6,7,8].includes(uwp.population) && [4,5,6,7,8,9].includes(uwp.government)) {
        codes += ", Ri";
    }
    if (uwp.atmosphere === 0) {
        codes += ", Va";
    }
    if (([3,4,5,6,7,8,9].includes(uwp.atmosphere) || uwp.atmosphere > 13) && uwp.hydrographics >= 10) {
        codes += ", Wa";
    }

    worldActor.system.world.uwp.codes = codes.replace(/^, /, "");
}