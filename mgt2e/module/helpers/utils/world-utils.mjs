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
    }
    worldActor.system.world.uwp.port = port;
    worldActor.system.world.uwp.size = size;
    worldActor.system.world.uwp.atmosphere = atmosphere;
    worldActor.system.world.uwp.hydrographics = hydrographics;
    worldActor.system.world.uwp.government = government;
    worldActor.system.world.uwp.population = population;
    worldActor.system.world.uwp.lawLevel = lawLevel;
    worldActor.system.world.uwp.techLevel = techLevel;

    worldActor.update({"system.world.uwp": worldActor.system.world.uwp});
}

function modifyTechLevel(data, value) {
    if (data && data[value] && data[value].techBonus) {
        return data[value].techBonus;
    }
    return 0;
}