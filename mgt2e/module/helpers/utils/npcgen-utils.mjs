import {MgT2eMacros} from "../chat/macros.mjs";
import {MGT2} from "../config.mjs";
import {copySkills, rollUPP} from "./character-utils.mjs";
import {choose} from "../dice-rolls.mjs";


function getTable(folder, tableName) {
    let table = folder.contents.find(d => d.name === tableName);
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
    }
    console.log(text);
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
        } else if (t.startsWith("[")) {
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
    if (description) {
        if (npcData.system.description) {
            npcData.system.description += " " + description;
        } else {
            npcData.system.description = description;
        }
    }
    return result.trim();
}

export async function npcgen(npcData, folderName) {

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
    npcData.system.sophont.profession = await getCompoundFromTable(npcData, folder, "Profession");

}
