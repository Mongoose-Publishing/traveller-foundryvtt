import assert from "node:assert/strict";
import test from "node:test";

import {getArmedWeaponMounts, resolveWeaponMount} from "../mgt2e/module/helpers/utils/weapon-mount-utils.mjs";

function collection(items) {
    const list = [...items];
    list.get = id => list.find(item => item.id === id);
    return list;
}

function actor({mounts = [], weapons = []} = {}) {
    return {items: collection([...mounts, ...weapons])};
}

function weapon(id, name) {
    return {id, type: "weapon", name, system: {}};
}

function mount(id, name, weapons = {}) {
    return {id, type: "hardware", name, system: {hardware: {system: "weapon", weapons}}};
}

test("lists only mounts with resolvable attached weapons", () => {
    const ship = actor({
        mounts: [
            mount("empty", "Empty"),
            mount("stale", "Stale", {missing: {quantity: 1}}),
            mount("zero", "Zero", {laser: {quantity: 0}}),
            mount("disabled", "Disabled", {disabledWeapon: {quantity: 1}}),
            {...mount("inactiveMount", "Inactive Mount", {laser: {quantity: 1}}), system: {
                status: "DISABLED",
                hardware: {system: "weapon", weapons: {laser: {quantity: 1}}}
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
