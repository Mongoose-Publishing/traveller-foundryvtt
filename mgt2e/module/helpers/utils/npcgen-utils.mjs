import {MgT2eMacros} from "../chat/macros.mjs";
import {MGT2} from "../config.mjs";
import {copySkills, rollUPP} from "./character-utils.mjs";
import {choose} from "../dice-rolls.mjs";


async function getTable(folder, tableName, variantName) {
    let table = folder.contents.find(d => d.name === `${tableName} ${variantName}`);
    if (!table) {
        table = await folder.contents.find(d => d.name === tableName);
        if (!table) {
            for (const child of await folder.children) {
                table = await getTable(child.folder, tableName, variantName);
                if (table) {
                    break;
                }
            }
        }
    }
    return table;
}

// Look for table "X Y". If that doesn't exist, just look for table "X"
async function getFromTable(folder, tableName, variantName) {
    let table = folder.contents.find(d => d.name === `${tableName} ${variantName}`);
    if (!table) {
        table = await folder.contents.find(d => d.name === tableName);
        if (!table) {
            for (const child of await folder.children) {
                let result = await getFromTable(child.folder, tableName, variantName);
                if (result) return result;
            }
            return null;
        }
    }
    let result = await table.roll();
    return result.results[0].text;
}

async function getCompoundFromTable(npcData, folder, tableName, variant) {
    let text = await getFromTable(folder, tableName, variant);
    if (!text) {
        console.log(`getCompoundFromTable: No text for [${tableName} ${variant}]`)
        return "";
    }
    let result = "";
    let tokens = text.split(" ");
    let description = null;
    for (let t of tokens) {
        if (description !== null) {
            description += " " + t;
        } else if (t.startsWith("!")) {
            t = t.substring(1).replaceAll(/_/g, " ");
            t = await getCompoundFromTable(npcData, folder, t);
            if (t) {
                result += " " + t;
            }
        } else if (t.startsWith("$")) {
            console.log(`${tableName}: [${t}]`);
            t = t.substring(1).replaceAll(/_/g, " ");
            let titleCase = false;
            if (t.startsWith("^")) {
                titleCase = true;
                t = t.substring(1);
            }
            t = await getCompoundFromTable(npcData, folder, t);

            if (t) {
                if (titleCase) {
                    t = t.substring(0, 1).toUpperCase() + t.substring(1);
                }
                t = t.replaceAll(/ /g, "");
                result += " " + t;
            }
        } else if (npcData && t.startsWith("[")) {
            t = t.replaceAll(/[\[\]]/g, "");
            let skill = t.split("+")[0];
            let value = t.split("+")[1];

            let args = {
                actor: npcData,
                quiet: true
            };
            skill = choose(skill.split("|"));
            if (skill.toUpperCase() === skill && skill.length === 3) {
                args.cha = skill;
            } else {
                args.skill = skill;
            }
            args.level = parseInt(value);
            MgT2eMacros.skillGain(args);
        } else if (t === "#") {
            description = "";
        } else {
            result += " " + t;
        }
    }
    if (npcData && description) {
        if (npcData.system.description) {
            npcData.system.description += " " + description;
        } else {
            npcData.system.description = description;
        }
    }
    return result.trim();
}

export async function generateText(tableName,variantName, folderName) {
    if (!folderName) {
        folderName = "NPC Generator";
    }
    let folder = await game.tables.folders.getName(folderName);
    if (!folder) {
        return "";
    }
    return await getCompoundFromTable(null, folder, tableName, variantName)
}

export async function generateNpc(npcData, folderName) {
    // npcData is assumed to not be an Actor object, just the data that is passed
    // when an Actor is created. So the Actor needs to be created with this data
    // after the function has returned.
    if (!npcData) {
        console.log("No npc");
        return false;
    }
    if (!npcData.system.characteristics) {
        npcData.system.characteristics = JSON.parse(
            JSON.stringify(MGT2.CHARACTERISTICS)
        );
    }
    copySkills(npcData);
    await rollUPP(npcData, { shift: true, quiet: true });

    if (!folderName) {
        folderName = "NPC Generator";
    }
    let folder = await game.tables.folders.getName(folderName);
    if (!folder) {
        console.log("No folder found");
        return false;
    }

    let species = await getCompoundFromTable(npcData, folder, "Species");
    npcData.system.sophont.species = species;
    let gender = await getCompoundFromTable(npcData, folder, "Gender", species);
    npcData.system.sophont.gender = gender;
    npcData.name = await getCompoundFromTable(npcData, folder, "Name " + species, gender);

    let profession = "";
    let passage = npcData.system.meta?.passage;
    if (passage && await getTable(folder, `Profession ${species}`, passage)) {
        profession = await getCompoundFromTable(npcData, folder, `Profession ${species}`, passage);
    } else {
        profession = await getCompoundFromTable(npcData, folder, "Profession", passage);
    }
    npcData.system.sophont.profession = profession?profession:choose([ "Hitchhiker", "Tourist", "Slacker" ] );
}
