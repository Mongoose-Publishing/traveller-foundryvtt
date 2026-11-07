import assert from "node:assert/strict";
import test from "node:test";

import {
    getArmedWeaponMounts,
    getMountedWeapon,
    isWeaponMounted,
    chooseWeaponMount,
    executeCrewWeaponAttack,
    executeV2DirectWeaponAttack,
    resolveWeaponMount,
    resolveWeaponMountForAttack,
    WeaponMountSelectionChangedError
} from "../mgt2e/module/helpers/utils/weapon-mount-utils.mjs";

function collection(items) {
    const list = [...items];
    list.get = id => list.find(item => item.id === id);
    return list;
}

function actor({mounts = [], weapons = []} = {}) {
    return {items: collection([...mounts, ...weapons])};
}

function weapon(id, name, mountType = "turret", scale = "spacecraft") {
    return {id, type: "weapon", name, system: {weapon: {mount: mountType, scale}}};
}

function mount(id, name, weapons = {}) {
    return {id, type: "hardware", name, system: {hardware: {system: "weapon", mount: "turret", weapons}}};
}

function vehicleMount(id, name, weaponId, quantity = 1) {
    return {id, type: "option", name, system: {option: {
        type: "weapon", weapon: {weaponId, quantity, mountType: "turret"}
    }}};
}

test("lists only mounts with resolvable attached weapons", () => {
    const ship = actor({
        mounts: [
            mount("empty", "Empty"),
            mount("stale", "Stale", {missing: {quantity: 1}}),
            mount("zero", "Zero", {laser: {quantity: 0}}),
            mount("disabled", "Disabled", {disabledWeapon: {quantity: 1}}),
            {...mount("inactiveMount", "Inactive Mount", {laser: {quantity: 1}}), system: {
                status: "DAMAGED",
                hardware: {system: "weapon", mount: "turret", weapons: {laser: {quantity: 1}}}
            }},
            mount("armed", "Triple Turret", {laser: {quantity: 2}, missile: {quantity: 1}})
        ],
        weapons: [
            weapon("laser", "Beam Laser"),
            weapon("missile", "Missile Rack"),
            {...weapon("disabledWeapon", "Disabled Laser"), system: {status: "INACTIVE"}}
        ]
    });
    assert.deepEqual(getArmedWeaponMounts(ship).map(({id, label}) => ({id, label})), [
        {id: "armed", label: "Triple Turret (Beam Laser x2, Missile Rack)"}
    ]);
});

test("uses real statuses, quantities, weapon schema, scale and mount compatibility", () => {
    const good = weapon("good", "Good", "turret");
    const wrongType = {id: "wrongType", type: "cargo", name: "Cargo", system: {weapon: {mount: "turret"}}};
    const incompatible = weapon("incompatible", "Fixed", "fixed");
    const groundScale = weapon("ground", "Ground", "turret", "traveller");
    const damaged = {...weapon("damaged", "Damaged"), system: {status: "DAMAGED", weapon: {mount: "turret"}}};
    const ship = actor({
        mounts: [
            mount("goodMount", "Good Mount", {good: {quantity: 1}}),
            mount("wrongTypeMount", "Wrong", {wrongType: {quantity: 1}}),
            mount("incompatibleMount", "Incompatible", {incompatible: {quantity: 1}}),
            mount("groundMount", "Ground Mount", {ground: {quantity: 1}}),
            mount("damagedMount", "Damaged Weapon", {damaged: {quantity: 1}}),
            {...mount("zeroMount", "No Mount", {good: {quantity: 1}}), system: {
                quantity: 0, hardware: {system: "weapon", mount: "turret", weapons: {good: {quantity: 1}}}
            }}
        ],
        weapons: [good, wrongType, incompatible, groundScale, damaged]
    });
    assert.deepEqual(getArmedWeaponMounts(ship).map(entry => entry.id), ["goodMount"]);
});

test("supports the V2 vehicle option schema and resolves its configured weapon", () => {
    const laser = weapon("laser", "Vehicle Laser", "turret", "traveller");
    const armed = vehicleMount("vehicleMount", "Turret", "laser", 2);
    const empty = vehicleMount("empty", "Empty", "laser", 0);
    const ship = actor({mounts: [armed, empty], weapons: [laser]});
    const entries = getArmedWeaponMounts(ship);
    assert.deepEqual(entries.map(({id, label}) => ({id, label})), [
        {id: "vehicleMount", label: "Turret (Vehicle Laser x2)"}
    ]);
    assert.equal(getMountedWeapon(ship, armed), laser);
    assert.equal(isWeaponMounted(ship, armed, laser), true);
    assert.equal(isWeaponMounted(ship, empty, laser), false);
});

test("preserves an existing armed binding without opening the chooser", async () => {
    const laser = weapon("laser", "Beam Laser");
    const armed = mount("armed", "Turret", {laser: {quantity: 1}});
    const ship = actor({mounts: [armed], weapons: [laser]});
    let opened = false;
    const selected = await resolveWeaponMount(ship, "armed", async () => {
        opened = true;
        return null;
    });
    assert.equal(selected, armed);
    assert.equal(opened, false);
});

test("blank and stale bindings explicitly choose among armed mounts", async () => {
    const laser = weapon("laser", "Beam Laser");
    const missile = weapon("missile", "Missile Rack");
    const first = mount("first", "Turret A", {laser: {quantity: 1}});
    const second = mount("second", "Turret B", {missile: {quantity: 1}});
    const ship = actor({mounts: [first, second], weapons: [laser, missile]});
    for (const requested of [null, "deleted-mount"]) {
        const selected = await resolveWeaponMount(ship, requested, async mounts => {
            assert.deepEqual(mounts.map(entry => entry.id), ["first", "second"]);
            return "second";
        });
        assert.equal(selected, second);
    }
});

test("one armed mount still requires explicit confirmation", async () => {
    const laser = weapon("laser", "Beam Laser");
    const armed = mount("armed", "Turret", {laser: {quantity: 1}});
    const ship = actor({mounts: [armed], weapons: [laser]});
    let opened = 0;
    const selected = await resolveWeaponMount(ship, null, async mounts => {
        opened += 1;
        assert.equal(mounts.length, 1);
        return "armed";
    });
    assert.equal(selected, armed);
    assert.equal(opened, 1);
});

test("zero armed mounts and cancellation return no mount without mutation", async () => {
    const emptyShip = actor({mounts: [mount("empty", "Empty")]});
    let opened = false;
    assert.equal(await resolveWeaponMount(emptyShip, null, async () => {
        opened = true;
    }), null);
    assert.equal(opened, false);

    const laser = weapon("laser", "Beam Laser");
    const armed = mount("armed", "Turret", {laser: {quantity: 1}});
    const ship = actor({mounts: [armed], weapons: [laser]});
    const before = JSON.stringify(armed);
    assert.equal(await resolveWeaponMount(ship, null, async () => null), null);
    assert.equal(JSON.stringify(armed), before);
});

test("DialogV2's explicit cancel action is never treated as a mount id", async () => {
    globalThis.game = {i18n: {localize: key => key}};
    globalThis.foundry = {applications: {api: {DialogV2: {wait: async () => "cancel"}}}};
    assert.equal(await chooseWeaponMount([{id: "armed", label: "Armed"}]), null);
});

test("accepts an unchanged selection after the chooser awaits", async () => {
    const laser = weapon("laser", "Beam Laser");
    const armed = mount("armed", "Turret", {laser: {quantity: 1}});
    const ship = actor({mounts: [armed], weapons: [laser]});
    assert.equal(await resolveWeaponMount(ship, null, async () => "armed"), armed);
});

test("rejects a mount deleted while the chooser awaits", async () => {
    const laser = weapon("laser", "Beam Laser");
    const armed = mount("armed", "Turret", {laser: {quantity: 1}});
    const ship = actor({mounts: [armed], weapons: [laser]});
    await assert.rejects(resolveWeaponMount(ship, null, async () => {
        ship.items.splice(ship.items.indexOf(armed), 1);
        return "armed";
    }), WeaponMountSelectionChangedError);
});

test("rejects unarmed, zero-quantity, and inactive selections after await", async t => {
    const cases = {
        unarmed: ({armed}) => { armed.system.hardware.weapons.laser.quantity = 0; },
        "zero mount quantity": ({armed}) => { armed.system.quantity = 0; },
        "inactive mount": ({armed}) => { armed.system.status = "INACTIVE"; },
        "inactive weapon": ({laser}) => { laser.system.status = "INACTIVE"; }
    };
    for (const [name, mutate] of Object.entries(cases)) {
        await t.test(name, async () => {
            const laser = weapon("laser", "Beam Laser");
            const armed = mount("armed", "Turret", {laser: {quantity: 1}});
            const ship = actor({mounts: [armed], weapons: [laser]});
            await assert.rejects(resolveWeaponMount(ship, null, async () => {
                mutate({armed, laser});
                return "armed";
            }), WeaponMountSelectionChangedError);
        });
    }
});

test("rejects an attachment replacement after await instead of substituting it", async () => {
    const laser = weapon("laser", "Beam Laser");
    const missile = weapon("missile", "Missile Rack");
    const armed = vehicleMount("armed", "Turret", "laser");
    const ship = actor({mounts: [armed], weapons: [laser, missile]});
    await assert.rejects(resolveWeaponMount(ship, null, async () => {
        armed.system.option.weapon.weaponId = "missile";
        return "armed";
    }), WeaponMountSelectionChangedError);
});

test("rejects displayed composition changes without reading mutable snapshots", async t => {
    const cases = {
        "attachment quantity": ({armed}) => { armed.system.hardware.weapons.laser.quantity = 2; },
        "weapon label": ({laser}) => { laser.name = "Renamed Laser"; },
        "mount label": ({armed}) => { armed.name = "Renamed Turret"; }
    };
    for (const [name, mutate] of Object.entries(cases)) {
        await t.test(name, async () => {
            const laser = weapon("laser", "Beam Laser");
            const armed = mount("armed", "Turret", {laser: {quantity: 1}});
            const ship = actor({mounts: [armed], weapons: [laser]});
            await assert.rejects(resolveWeaponMount(ship, null, async () => {
                mutate({armed, laser});
                return "armed";
            }), WeaponMountSelectionChangedError);
        });
    }
});

test("rejects an attachment order change that would substitute the first weapon", async () => {
    const laser = weapon("laser", "Beam Laser");
    const missile = weapon("missile", "Missile Rack");
    const armed = mount("armed", "Turret", {laser: {quantity: 1}, missile: {quantity: 1}});
    const ship = actor({mounts: [armed], weapons: [laser, missile]});
    await assert.rejects(resolveWeaponMount(ship, null, async () => {
        armed.system.hardware.weapons = {missile: {quantity: 1}, laser: {quantity: 1}};
        return "armed";
    }), WeaponMountSelectionChangedError);
});

test("attack resolver warns and returns no mount after failed revalidation", async () => {
    const laser = weapon("laser", "Beam Laser");
    const armed = mount("armed", "Turret", {laser: {quantity: 1}});
    const ship = actor({mounts: [armed], weapons: [laser]});
    const warnings = [];
    globalThis.game = {i18n: {localize: key => `localized:${key}`}};
    globalThis.ui = {notifications: {warn: message => warnings.push(message)}};
    const selected = await resolveWeaponMountForAttack(ship, null, async () => {
        armed.system.hardware.weapons.laser.quantity = 0;
        return "armed";
    });
    assert.equal(selected, null);
    assert.deepEqual(warnings, ["localized:MGT2.Error.WeaponMountChanged"]);
});

test("attack resolver preserves cancellation and valid saved bindings without warnings", async () => {
    const laser = weapon("laser", "Beam Laser");
    const armed = mount("armed", "Turret", {laser: {quantity: 1}});
    const ship = actor({mounts: [armed], weapons: [laser]});
    const warnings = [];
    globalThis.game = {i18n: {localize: key => `localized:${key}`}};
    globalThis.ui = {notifications: {warn: message => warnings.push(message)}};
    assert.equal(await resolveWeaponMountForAttack(ship, null, async () => null), null);
    assert.equal(await resolveWeaponMountForAttack(ship, "armed", async () => {
        assert.fail("valid saved bindings must not open the chooser");
    }), armed);
    assert.deepEqual(warnings, []);
});

function crewAttackFixture({binding = ""} = {}) {
    const laser = weapon("laser", "Beam Laser");
    const armed = mount("armed", "Turret", {laser: {quantity: 1}});
    const action = {action: "weapon", weapon: binding, dm: "1"};
    const role = {id: "role", type: "role", system: {role: {actions: {action}}}};
    const ship = actor({mounts: [armed, role], weapons: [laser]});
    ship.system = {crewed: {crew: {crew: {role: {}}}}};
    const crew = {id: "crew", name: "Gunner"};
    return {ship, crew, role, action, armed, laser};
}

function notificationHarness() {
    const warnings = [];
    globalThis.game = {i18n: {localize: key => `localized:${key}`}};
    globalThis.ui = {notifications: {warn: message => warnings.push(message)}};
    return warnings;
}

test("crew attack executes once for unchanged chooser and valid saved binding", async t => {
    for (const [name, binding] of [["chooser", ""], ["saved binding", "armed"]]) {
        await t.test(name, async () => {
            const {ship, crew} = crewAttackFixture({binding});
            const warnings = notificationHarness();
            const attacks = [];
            const result = await executeCrewWeaponAttack({
                actor: ship,
                crewId: "crew",
                roleId: "role",
                actionId: "action",
                chooseMount: async () => binding ? assert.fail("saved binding opened chooser") : "armed",
                getCrewActor: () => crew,
                onAttack: context => attacks.push(context)
            });
            assert.equal(result, true);
            assert.equal(attacks.length, 1);
            assert.equal(attacks[0].action.dm, "1");
            assert.deepEqual(warnings, []);
        });
    }
});

test("crew attack cancellation warns zero times and attacks zero times", async () => {
    const {ship, crew} = crewAttackFixture();
    const warnings = notificationHarness();
    let attacks = 0;
    assert.equal(await executeCrewWeaponAttack({
        actor: ship,
        crewId: "crew",
        roleId: "role",
        actionId: "action",
        chooseMount: async () => null,
        getCrewActor: () => crew,
        onAttack: () => attacks++
    }), false);
    assert.equal(attacks, 0);
    assert.deepEqual(warnings, []);
});

test("crew attack revalidates assignment, role, action, type, binding, DM, and crew after await", async t => {
    const cases = {
        "assignment removed": ({ship}) => { delete ship.system.crewed.crew.crew.role; },
        "role removed": ({ship, role}) => { ship.items.splice(ship.items.indexOf(role), 1); },
        "action removed": ({role}) => { delete role.system.role.actions.action; },
        "action type changed": ({action}) => { action.action = "skill"; },
        "binding changed": ({action}) => { action.weapon = "armed"; },
        "DM changed": ({action}) => { action.dm = "2"; },
        "crew removed": ({state}) => { state.crew = null; }
    };
    for (const [name, mutate] of Object.entries(cases)) {
        await t.test(name, async () => {
            const fixture = crewAttackFixture();
            const state = {crew: fixture.crew};
            const warnings = notificationHarness();
            let attacks = 0;
            assert.equal(await executeCrewWeaponAttack({
                actor: fixture.ship,
                crewId: "crew",
                roleId: "role",
                actionId: "action",
                chooseMount: async () => {
                    mutate({...fixture, state});
                    return "armed";
                },
                getCrewActor: () => state.crew,
                onAttack: () => attacks++
            }), false);
            assert.equal(attacks, 0);
            assert.deepEqual(warnings, ["localized:MGT2.Error.WeaponActionChanged"]);
        });
    }
});

test("V2 direct attack executes once for unchanged chooser and valid binding", async t => {
    for (const [name, weaponId, mountId] of [
        ["chooser", "stale", "stale"],
        ["saved binding", "laser", "armed"]
    ]) {
        await t.test(name, async () => {
            const laser = weapon("laser", "Vehicle Laser", "turret", "traveller");
            const armed = vehicleMount("armed", "Turret", "laser");
            const ship = actor({mounts: [armed], weapons: [laser]});
            const crew = {id: "crew"};
            const warnings = notificationHarness();
            const attacks = [];
            let chooserCalls = 0;
            assert.equal(await executeV2DirectWeaponAttack({
                actor: ship,
                weaponId,
                mountId,
                crewId: "crew",
                actionDm: 2,
                chooseMount: async () => {
                    chooserCalls++;
                    return "armed";
                },
                getCrewActor: () => crew,
                onAttack: context => attacks.push(context)
            }), true);
            assert.equal(attacks.length, 1);
            assert.equal(attacks[0].weapon, laser);
            assert.equal(chooserCalls, name === "chooser" ? 1 : 0);
            assert.deepEqual(warnings, []);
        });
    }
});

test("V2 direct role-backed attack revalidates crew assignment after chooser", async () => {
    const fixture = crewAttackFixture({binding: "armed"});
    const warnings = notificationHarness();
    let attacks = 0;
    assert.equal(await executeV2DirectWeaponAttack({
        actor: fixture.ship,
        weaponId: "stale",
        mountId: "armed",
        crewId: "crew",
        roleId: "role",
        actionId: "action",
        actionDm: 1,
        chooseMount: async () => {
            delete fixture.ship.system.crewed.crew.crew.role;
            return "armed";
        },
        getCrewActor: () => fixture.crew,
        onAttack: () => attacks++
    }), false);
    assert.equal(attacks, 0);
    assert.deepEqual(warnings, ["localized:MGT2.Error.WeaponActionChanged"]);
});

test("V2 direct role-backed attack rejects stale pre-click binding and DM", async t => {
    for (const [name, mutate] of [
        ["binding", ({action}) => { action.weapon = "other"; }],
        ["DM", ({action}) => { action.dm = "2"; }]
    ]) {
        await t.test(name, async () => {
            const fixture = crewAttackFixture({binding: "armed"});
            mutate(fixture);
            const warnings = notificationHarness();
            let attacks = 0;
            let chooserCalls = 0;
            assert.equal(await executeV2DirectWeaponAttack({
                actor: fixture.ship,
                weaponId: "laser",
                mountId: "armed",
                crewId: "crew",
                roleId: "role",
                actionId: "action",
                actionDm: 1,
                chooseMount: async () => {
                    chooserCalls++;
                    return "armed";
                },
                getCrewActor: () => fixture.crew,
                onAttack: () => attacks++
            }), false);
            assert.equal(chooserCalls, 0);
            assert.equal(attacks, 0);
            assert.deepEqual(warnings, ["localized:MGT2.Error.WeaponActionChanged"]);
        });
    }
});

test("V2 direct role-backed attack accepts an unchanged normalized row", async () => {
    const fixture = crewAttackFixture({binding: "armed"});
    const warnings = notificationHarness();
    let attacks = 0;
    assert.equal(await executeV2DirectWeaponAttack({
        actor: fixture.ship,
        weaponId: "laser",
        mountId: "armed",
        crewId: "crew",
        roleId: "role",
        actionId: "action",
        actionDm: 1,
        chooseMount: async () => assert.fail("unchanged direct row opened chooser"),
        getCrewActor: () => fixture.crew,
        onAttack: () => attacks++
    }), true);
    assert.equal(attacks, 1);
    assert.deepEqual(warnings, []);
});

test("V2 direct attack cancellation and changed mount never attack", async t => {
    for (const [name, mutate, expectedWarnings] of [
        ["cancel", () => null, []],
        ["changed", armed => { armed.system.option.weapon.quantity = 0; return "armed"; },
            ["localized:MGT2.Error.WeaponMountChanged"]]
    ]) {
        await t.test(name, async () => {
            const laser = weapon("laser", "Vehicle Laser", "turret", "traveller");
            const armed = vehicleMount("armed", "Turret", "laser");
            const ship = actor({mounts: [armed], weapons: [laser]});
            const warnings = notificationHarness();
            let attacks = 0;
            assert.equal(await executeV2DirectWeaponAttack({
                actor: ship,
                weaponId: "stale",
                mountId: "stale",
                crewId: "crew",
                actionDm: 0,
                chooseMount: async () => mutate(armed),
                getCrewActor: () => ({id: "crew"}),
                onAttack: () => attacks++
            }), false);
            assert.equal(attacks, 0);
            assert.deepEqual(warnings, expectedWarnings);
        });
    }
});
