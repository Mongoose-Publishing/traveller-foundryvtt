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
    // If in a compendium, need an extra step to get the actual table.
    if (table?.uuid && table.uuid.startsWith("Compendium")) {
        table = await fromUuid(table.uuid);
    }
    return table;
}

// Look for table "X Y". If that doesn't exist, just look for table "X"
async function getFromTable(folder, tableName, variantName) {
    let table = await folder.contents.find(d => d.name === `${tableName} ${variantName}`);
    if (!table) {
        table = await folder.contents.find(d => d.name === tableName);
        if (!table) {
            console.log("Looking for children");
            for (const child of await folder.children) {
                let result = await getFromTable(child.folder, tableName, variantName);
                if (result) return result;
            }
            return null;
        }
    }
    // If in a compendium, need an extra step to get the actual table.
    if (table.uuid && table.uuid.startsWith("Compendium")) {
        table = await fromUuid(table.uuid);
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
            let skill = t;
            let value = 0;
            if (t.indexOf("+") > -1) {
                skill = t.split("+")[0];
                value = t.split("+")[1];
            } else if (t.indexOf("-") > -1 ) {
                skill = t.split("-")[0];
                value = t.split("-")[1];
                value = 0 - parseInt(value);
            } else {
                value = 0;
            }
            if (skill === "age") {
                try {
                    let ageRoll = await new Roll(value).evaluate();
                    let inc = parseInt(ageRoll.total);
                    npcData.system.sophont.age += inc;
                } catch (e) {
                    console.log(`Invalid roll value [${value}] for age`);
                }
            } else {
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
            }
        } else if (t === "#") {
            description = "";
        } else {
            result += " " + t;
        }
    }
    if (npcData && description) {
        description = description.replaceAll(/{{(.*?)}}/g, '<section class="secret">$1</section>');

        if (npcData.system.description) {
            npcData.system.description += " " + description;
        } else {
            npcData.system.description = description;
        }
    }
    return result.trim();
}

async function getFolder(folderName) {
    if (!folderName) {
        folderName = "NPC Generator";
    }
    let folder = await game.tables.folders.getName(folderName);
    if (!folder) {
        let pack = await game.packs.get("mgt2e.base-tables");
        folder = await pack.folders.getName("NPC Generator");
        if (!folder) {
            ui.notifications.error(`Unable to find folder [${folderName}] for NPC generation`);
            return null;
        }
    }
    return folder;
}

export async function generateInternalText(tableName, variantName, folderName) {
    if (!folderName) {
        folderName = "NPC Generator";
    }
    let folder = await getFolder(folderName);
    if (!folder) {
        return "";
    }
    return await getCompoundFromTable(null, folder, tableName, variantName)
}

export async function generateText(tableName, variantName, folderName) {
    let text = await generateInternalText(tableName, variantName, folderName);

    console.log(text);
    text = text.replaceAll(/\[.*\]/g, "");
    text = text.replaceAll(/#.*/g, "");
    console.log(text);

    return text;
}

export async function generateNpc(npcData, folderName) {
    // npcData is assumed to not be an Actor object, just the data that is passed
    // when an Actor is created. So the Actor needs to be created with this data
    // after the function has returned.
    if (!npcData) {
        ui.notifications.error("No NPC data passed to generateNpc function");
        return false;
    }
    if (!npcData.system.characteristics) {
        npcData.system.characteristics = JSON.parse(
            JSON.stringify(MGT2.CHARACTERISTICS)
        );
    }
    copySkills(npcData);
    await rollUPP(npcData, { shift: true, quiet: true });

    let folder = await getFolder(folderName);
    if (!folder) {
        return null;
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
    return true;
}
