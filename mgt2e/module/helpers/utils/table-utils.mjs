
// Look for the named folder. Checks for an i18n version of the folder first.
export async function getRollTableFolder(folderName) {
    if (!folderName) {
        return null;
    }
    let folder = await game.tables.folders.getName(`${folderName} ${game.i18n.lang}`);
    if (!folder) {
        folder = await game.tables.folders.getName(folderName);
        if (!folder) {
            let pack = await game.packs.get("mgt2e.base-tables");
            folder = await pack.folders.getName(folderName);
            if (!folder) {
                ui.notifications.error(`Unable to find folder [${folderName}] for roll tables`);
                return null;
            }
        }
    }
    return folder;
}

async function getNamedTable(folder, tableName, variantName) {
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
export async function getFromNamedTable(folder, tableName, variantName) {
    let table = await folder.contents.find(d => d.name === `${tableName} ${variantName}`);
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
    // If in a compendium, need an extra step to get the actual table.
    if (table.uuid && table.uuid.startsWith("Compendium")) {
        table = await fromUuid(table.uuid);
    }
    let rollResult = await table.roll();
    let result = {
        "name": null,
        "text": null
    }
    // V13 has a different format with more data.
    if (rollResult.results[0].name) {
        result.name = rollResult.results[0].name;
        result.text = rollResult.results[0].description;
    } else {
        result.text = rollResult.results[0].text;
    }
    return result;
}
