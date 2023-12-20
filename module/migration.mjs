
function migrateActorData(actor, fromVersion) {
    if (fromVersion < 1) {
        // Migration from before schema tracking was put in place.
        if (!actor.system.status && (actor.type === "traveller" || actor.type === "npc" || actor.type === "creature")) {
            console.log(`Migrating ${actor.name}`);
            console.log(actor.system)
            actor.system.status = {
                "woundLevel": 0,
                "stunned": false,
                "fatigued": false
            }
        }
    }
    return {};
}

export async function migrateWorld(fromVersion) {
    console.log("**** MIGRATE SCHEMA TO v1 ****");

    for (let actor of game.actors.contents) {
        const updateData = migrateActorData(actor);
        if (!foundry.utils.isEmpty(updateData)) {
            console.log(`Migrating Actor entity ${actor.name}`);
            await actor.update(updateData);
        }
    }

    for (let scene of game.scenes.contents) {
        const tokens = scene.tokens.map(token => {
            const t = token.toJSON();
            if (!t.actorLink) {
                console.log(`Migrating Actor token ${actor.name}`);
                const actor = duplicate(t.delta);
                actor.type = t.actor?.type;
                const update = migrateActorData(actor);
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
        if (pack.metadata.package != "world") {
            continue;
        }
    }
}