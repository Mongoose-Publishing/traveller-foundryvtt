import { MGT2 } from "./helpers/config.mjs";
import {getTraitValue} from "./helpers/dice-rolls.mjs";

async function migrateActorData(actor, fromVersion) {
    console.log(`MIGRATE ACTOR ${actor.name} FROM ${fromVersion}`);
    console.log(actor);
    if (actor.items) {
        for (let item of actor.items) {
            console.log(`Actor ${actor.name} has item ${item.name}`);
            console.log(item);
            if (item && item.update) {
                const updateData = migrateItemData(item, fromVersion);
                if (!foundry.utils.isEmpty(updateData)) {
                    console.log(`Migrating Item entity ${item.name} from ${fromVersion} for ${actor.name}`);
                    await item.update(updateData);
                }
            }Mongoo
        }
    }

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
        console.log("Converting to v5 (Spacecraft Naval data)");
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
    }
    if (fromVersion < 6) {
        console.log("Converting to v6 (Creature traits and behaviours)");
        if (actor.type === "creature" && actor.system.behaviour != null) {
            const oldBehaviours = actor.system.behaviour.toLowerCase();
            let updated = "";
            for (let b in CONFIG.MGT2.CREATURES.behaviours) {
                if (oldBehaviours.indexOf(b.toLowerCase()) > -1) {
                    updated += (updated.length>0?" ":"") + b;
                }
            }
            actor.system.behaviour = updated;
        }
        if (actor.type === "creature" && actor.system.traits != null) {
            const oldTraits = actor.system.traits.toLowerCase();
            let updated = "";
            for (let t in CONFIG.MGT2.CREATURES.traits) {
                if (oldTraits.indexOf(t.toLowerCase()) > -1) {
                    updated += (updated.length>0?",":"") + t;
                }
            }
            actor.system.traits = updated;
        }
        return actor.system;
    }

    if (fromVersion < 8) {
        console.log("Converting to v7 (Spacecraft computers)");
        if (actor.type === "spacecraft") {
            if (actor.system.spacecraft.computer) {
                let c = actor.system.spacecraft.computer;

                let system = {
                    "tl": c.tl, "weight": 0, "cost": 0, "notes": "",
                    "active": true, "quantity": 1, "status": null,
                    "hardware": {
                        "system": "computer",
                        "tons": 0,
                        "power": 0,
                        "rating": c.processing,
                        "tonnage": {
                            "tons": 0, "percent": 0, "cost": 0, "minimum": 0
                        },
                        "powerPerTon": 0,
                        "mount": "turret",
                        "advantages": "",
                        "weapons": {},
                        "isComputerCore": c.core,
                        "isComputerBis": c.bis,
                        "isComputerFib": c.fib
                    }
                };

                let itemName = "Hardware";
                const itemData = {
                    "name": "Computer",
                    "img": "systems/mgt2e/icons/hardware/computer.svg",
                    "type": "hardware",
                    "system": system
                };
                Item.create(itemData, { parent: actor } );
            }
        }
    }

    return {};
}

function addWeaponTrait(traits, trait) {
    if (traits && traits.length > 0) {
        return traits + ", " + trait;
    }
    return trait;
}

function migrateItemData(item, fromVersion) {
    console.log(`MIGRATE ITEM DATA ${fromVersion}`);
    if (fromVersion < 4) {
        if (item.system.term) {
            item.system.term.termLength = 4;
            return item.system;
        }
    }
    if (fromVersion < 7) {
        console.log("Converting to v7 (Weapon and armour traits)");
        if (item.system.armour && item.system.armour.otherTypes) {
            item.system.armour.otherTypes = item.system.armour.otherTypes.toLowerCase();
            return item.system;
        }
        if (item.system.weapon && item.system.weapon.traits) {
            let traits = item.system.weapon.traits.toLowerCase();
            let updated = "";
            console.log(item.system.weapon.traits);

            if (traits.match("verybulky") || traits.match("very bulky")) {
                updated = addWeaponTrait(updated, "veryBulky");
            } else if (traits.match("bulky")) {
                updated = addWeaponTrait(updated, "bulky");
            }
            if (traits.match("zerog") || traits.match("zero-g")) {
                updated = addWeaponTrait(updated, "zeroG");
            }
            for (let t of [ "stun", "scope", "destructive", "laserSight", "smart", "radiation"]) {
              if (traits.match(t.toLowerCase())) {
                  updated = addWeaponTrait(updated, t);
              }
            }
            if (traits.match("lopen")) {
                let lopen = getTraitValue(traits, "lopen");
                if (lopen && !isNaN(lopen) && parseInt(lopen) > 0) {
                    updated = addWeaponTrait(updated, "loPen");
                }
            } else if (traits.match("lo-pen")) {
                let lopen = getTraitValue(traits, "lo-pen");
                if (lopen && !isNaN(lopen) && parseInt(lopen) > 0) {
                    updated = addWeaponTrait(updated, "loPen");
                }
            }
            for (let t of [ "ap", "blast", "auto" ]) {
                if (traits.match(t)) {
                    let value = getTraitValue(traits, t);
                    if (value && !isNaN(value) && parseInt(value) > 0) {
                        updated = addWeaponTrait(updated, `${t} ${value}`);
                    }
                }
            }
            console.log(updated);
            item.system.weapon.traits = updated;
            return item.system;
        }
    }
    return {};
}

export async function migrateWorld(fromVersion) {
    console.log("**** MIGRATE SCHEMA TO v8 ****");

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
        const packType = pack.metadata.type;
        if (!["Item"].includes(packType)) {
            console.log(`Ignoring pack ${pack.metadata.label}`);
            continue;
        }
        console.log(`Migrating pack ${pack.metadata.label}`);
        const wasLocked = pack.locked;
        await pack.configure( { locked: false });
        await pack.migrate();
        const documents = await pack.getDocuments();

        for (let document of documents) {
            let updateData = {};
            switch (packType) {
                case "Item":
                    updateData = migrateItemData(document, fromVersion);
                    if (!foundry.utils.isEmpty(updateData)) {
                        console.log(`Migrating pack Item entity ${document.name} from ${fromVersion}`);
                        await document.update(updateData);
                    }
                    break;
            }
        }
        await pack.configure({locked: wasLocked});
    }
}