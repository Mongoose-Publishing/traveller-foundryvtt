
function migrateActorData(actor, fromVersion) {
    console.log(`MIGRATE ACTOR DATA ${fromVersion}`);
    if (fromVersion < 1) {
        console.log("Converting to v2 (Status Effects)");
        // No longer used, so no point adding them.
    }
    if (fromVersion < 2) {
        console.log("Converting to v2 (Stun Damage)");
        if (actor.system.damage && actor.type === "traveller") {
            actor.system.damage.END.tmp = parseInt(0);
        }
        if (actor.system.hits && (actor.type === "traveller" || actor.type === "npc" || actor.type === "creature")) {
            actor.system.hits.tmpDamage = parseInt(0);
        }
    }
    if (fromVersion < 3) {
        // Undone.
    }
    if (fromVersion < 5) {
        console.log("Converting to v5 (Spacecraft Naval data");
        if (actor.type === "spacecraft") {
            actor.system.spacecraft.navy = {
                "navy": false,
                "supplies": {
                    "value": 0,
                    "max": 0
                },
                "cei": {
                    "value": 7,
                    "current": 7
                },
                "morale": 7,
                "divisions": { }
            };
        }
        return actor.system;
    }
    return {};
}

function migrateItemData(item, fromVersion) {
    console.log(`MIGRATE ITEM DATA ${fromVersion}`);
    if (fromVersion < 4) {
        if (item.system.term) {
            item.system.term.termLength = 4;
            return item.system;
        }
    }
    return {};
}

export async function migrateWorld(fromVersion) {
    console.log("**** MIGRATE SCHEMA TO v5 ****");

    for (let actor of game.actors.contents) {
        const updateData = migrateActorData(actor, fromVersion);
        if (!foundry.utils.isEmpty(updateData)) {
            console.log(`Migrating Actor entity ${actor.name} from ${fromVersion}`);
            await actor.update(updateData);
        }
    }

    for (let item of game.items.contents) {
        const updateData = migrateItemData(item, fromVersion);
        if (!foundry.utils.isEmpty(updateData)) {
            console.log(`Migrating Item entity ${item.name} from ${fromVersion}`);
            await item.update(updateData);
        }
    }

    for (let scene of game.scenes.contents) {
        const tokens = scene.tokens.map(token => {
            const t = token.toJSON();
            if (!t.actorLink) {
                console.log(`Migrating Actor token ${token.name}`);
                const actor = duplicate(t.delta);
                actor.type = t.actor?.type;
                const update = migrateActorData(actor, fromVersion);
                mergeObject(t.delta, update);
            }
            return t;
        });

        const sceneUpdate = { tokens };

        if (!foundry.utils.isEmpty(sceneUpdate)) {
            console.log(`Migrating Scene ${scene.name}.`);
            await scene.update(sceneUpdate);
        }
    }

    for (let pack of game.packs) {
        if (pack.metadata.package !== "world") {
            continue;
        }
    }
}