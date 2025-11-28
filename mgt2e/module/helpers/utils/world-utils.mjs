/**
 * Utilities to create a world from scratch.
 */
import {roll, roll2D6} from "../dice-rolls.mjs";
import {roll1D6} from "../dice-rolls.mjs";
import {MGT2} from "../config.mjs";
import {getFromNamedTable, getRollTableFolder} from "./table-utils.mjs";



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

    await worldActor.update({"system.world.uwp": worldActor.system.world.uwp});
    await setPortFacilities(worldActor);
    await setBases(worldActor);

    if (worldActor.system.world.uwp.population > 0) {
        await setCulturalDifferences(worldActor);
        await setFactions(worldActor);
    } else {
        worldActor.update({"system.world.extra.culturalDifferences": ""});
    }
}

function modifyTechLevel(data, value) {
    if (data && data[value] && data[value].techBonus) {
        return data[value].techBonus;
    }
    return 0;
}

async function getHighPort(worldActor, target) {
    let dm = 0;
    let uwp = worldActor.system.world.uwp;
    if (uwp.techLevel >= 9) {
        dm++;
    }
    if (uwp.techLevel >= 12) {
        dm++;
    }
    if (uwp.population >= 9) {
        dm++;
    } else if (uwp.population <= 6) {
        dm--;
    }

    const r = await roll(`2D6+${dm}`);
    return (r >= target);
}

async function setBase(worldActor, base, target) {
    let uwp = worldActor.system.world.uwp;

    const r = await roll(`2D6`);
    if (r >= target) {
        console.log("Adding base " + base);
        if (uwp.bases === "") {
            uwp.bases = base;
        } else {
            uwp.bases = `${uwp.bases}, ${base}`;
        }
    }
}

async function setBases(worldActor) {
    let uwp = worldActor.system.world.uwp;
    uwp.bases = "";

    console.log("setBases:");

    switch (worldActor.system.world.uwp.port) {
        case 'A':
            await setBase(worldActor, "M", 8);
            await setBase(worldActor, "N", 8);
            await setBase(worldActor, "S", 10);
            break;
        case 'B':
            await setBase(worldActor, "M", 8);
            await setBase(worldActor, "N", 8);
            await setBase(worldActor, "S", 9);
            break;
        case 'C':
            await setBase(worldActor, "M", 10);
            await setBase(worldActor, "S", 9);
            break;
        case 'D':
            await setBase(worldActor, "S", 8);
            await setBase(worldActor, "C", 12);
            break;
        case 'E':
            await setBase(worldActor, "C", 10);
            break;
        default:
            await setBase(worldActor, "C", 10);
            break;
    }
    console.log(uwp.bases);
    await worldActor.update({"system.world.uwp.bases": uwp.bases});
}

export async function setPortFacilities(worldActor) {
    let extra = worldActor.system.world.extra;

    delete extra.repair;
    delete extra.shipyard;
    delete extra.shipyardJump;
    delete extra.highport;
    delete extra.fuel;

    switch (worldActor.system.world.uwp.port) {
        case 'A':
            extra.shipyard = "capital";
            extra.shipyardJump = true;
            extra.repair = "full";
            extra.highport = await getHighPort(worldActor, 6);
            extra.berthingCost = await roll("1D6 * 1000");
            extra.fuel = "refined";
            break;
        case 'B':
            extra.shipyard = "spacecraft";
            extra.repair = "full";
            extra.highport = await getHighPort(worldActor, 8);
            extra.berthingCost = await roll("1D6 * 500");
            extra.fuel = "refined";
            break;
        case 'C':
            extra.shipyard = "smallcraft";
            extra.repair = "full";
            extra.highport = await getHighPort(worldActor, 10);
            extra.berthingCost = await roll("1D6 * 100");
            extra.fuel = "unrefined";
            break;
        case 'D':
            extra.repair = "limited";
            extra.highport = await getHighPort(worldActor, 12);
            extra.berthingCost = await roll("1D6 * 10");
            extra.fuel = "unrefined";
            break;
        case 'E':
            extra.berthingCost = 0;
            break;
        default:
            extra.berthingCost = 0;
            break;
    }

    await worldActor.update({"system.world.extra": extra});
}

export function setTradeCodes(worldActor) {
    let codes = "";
    let uwp = worldActor.system.world.uwp;

    // Force values to numbers. The HTML selects tend to set everything to strings.
    uwp.atmosphere = Number(uwp.atmosphere);
    uwp.size = Number(uwp.size);
    uwp.population = Number(uwp.population);
    uwp.lawLevel = Number(uwp.lawLevel);
    uwp.government = Number(uwp.government);
    uwp.hydrographics = Number(uwp.hydrographics);

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

export async function setCulturalDifferences(worldActor) {
    // Look for the "Cultural Differences" roll table.
    let rollTable = game.tables.getName("Cultural Differences");

    if (!rollTable) {
        // If one is not found, go look for an official one in the Mongoose content.
        let pack = await game.packs.get("mgt2e-core.mgt2e-core-tables");
        if (!pack) {
            // Traveller Core Rules not installed.
            return;
        }
        // Now try to find the roll table.
        const index = await pack.getIndex();
        const entry = index.find(e => e.name === "Cultural Differences");
        if (entry) {
            rollTable = await pack.getDocument(entry._id);
        }
    }

    if (rollTable) {
        if (rollTable) {
            const roll = await rollTable.roll();
            let text = roll.results[0].text;
            worldActor.update({ "system.world.extra.culturalDifferences": text });
        }
    } else {
        worldActor.update({ "system.world.extra.culturalDifferences": "Create a 'Cultural Differences' roll table" });
    }
}

export async function createPatron(worldActor) {
    let itemData = {
        name: "Patron",
        type: "worlddata",
        system: {
            world: {
                datatype: "patron",
                hidden: true,
                species: "Human",
                profession: "Patron"
            }
        }
    };
    let patronFolder = await getRollTableFolder("Patron Generator");
    if (patronFolder) {
        let result = await getFromNamedTable(factionFolder, "Patrons", worldActor.system.world.uwp.lawLevel);
        if (result) {
            itemData.system.description = result.text;
            if (result.name) {
                itemData.name = result.name;
            }
        }
    }

    Item.create(itemData, { parent: worldActor });
}

// Create a faction. If there is a suitable roll table, we also randomly select
// some text for that faction.
export async function createFaction(worldActor) {
    let factionStrength = "";
    switch (await roll("2D6")) {
        case 2: case 3:
            factionStrength = "obscure";
            break;
        case 4: case 5:
            factionStrength = "fringe";
            break;
        case 6: case 7:
            factionStrength = "minor";
            break;
        case 8: case 9:
            factionStrength = "notable";
            break;
        case 10: case 11:
            factionStrength = "significant";
            break;
        case 12:
            factionStrength = "overwhelming";
            break;
    }
    let govLevel = await roll("2D6 - 7");
    govLevel += parseInt(worldActor.system.uwp.population);
    govLevel = Math.max(0, govLevel);
    let itemData = {
        name: "Faction",
        type: "worlddata",
        system: {
            world: {
                datatype: "faction",
                government: govLevel,
                strength: factionStrength
            }
        }
    };
    let factionFolder = await getRollTableFolder("Faction Generator");
    if (factionFolder) {
        let result = await getFromNamedTable(factionFolder, "Factions", itemData.system.world.government);
        if (result) {
            itemData.system.description = result.text;
            if (result.name) {
                itemData.name = result.name;
            }
        }
    }

    await Item.create(itemData, { parent: worldActor });
}

export async function setFactions(worldActor) {
    let dice = "1D3";
    if ([0, 7].includes(worldActor.system.world.uwp.government)) {
        dice = "1D3 + 1";
    } else if (worldActor.system.world.uwp.government > 9) {
        dice = "1D3 - 1";
    }

    for (let i of worldActor.items) {
        if (i.type === "worlddata" && i.system?.world?.datatype === "faction") {
            // If we already have factions, don't add anymore.
            return;
        }
    }

    let numFactions = await roll(dice);
    for (let f=0; f < numFactions; f++) {
        createFaction(worldActor);
    }
}

export async function worldDropBrokerHandler(queryData) {
    let worldActor = await fromUuid(queryData.worldActorId);

    if (worldActor) {
        if (queryData.skill === "broker") {
            worldActor.system.world.meta.brokerActorId = queryData.brokerActorId;
            worldActor.system.world.meta.brokerScore = queryData.skillScore;
        } else if (queryData.skill === "streetwise") {
            worldActor.system.world.meta.streetwiseActorId = queryData.brokerActorId;
            worldActor.system.world.meta.streetwiseScore = queryData.skillScore;
        } else if (queryData.skill === "steward") {
            worldActor.system.world.meta.stewardActorId = queryData.brokerActorId;
            worldActor.system.world.meta.stewardScore = queryData.skillScore;
        }
        worldActor.update({"system.world.meta": worldActor.system.world.meta });
    }

}
