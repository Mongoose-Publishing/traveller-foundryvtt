import assert from "node:assert/strict";
import test from "node:test";
import {
    distanceToMetres, formatRangeDMOption, getRangeBandDistance, getTargetRangeBand,
    getWeaponRangeBands, normaliseWeaponRange, renderWeaponRangeTable, resolveRangeDM
} from "../mgt2e/module/helpers/utils/range-utils.mjs";

const cases = [
    ["decimal range preserved", () => assert.equal(normaliseWeaponRange("2.5"), 2.5)],
    ["blank range becomes zero", () => assert.equal(normaliseWeaponRange(""), 0)],
    ["negative range becomes zero", () => assert.equal(normaliseWeaponRange(-1), 0)],
    ["metres alias", () => assert.equal(distanceToMetres(4.1, "m"), 4.1)],
    ["kilometres alias", () => assert.equal(distanceToMetres(2.5, "km"), 2500)],
    ["spelled kilometre alias", () => assert.equal(distanceToMetres(2.5, "kilometres"), 2500)],
    ["unknown unit fails closed", () => assert.equal(distanceToMetres(10, "ft"), null)],
    ["blank unit fails closed", () => assert.equal(distanceToMetres(10, ""), null)],
    ["fractional vehicle bands", () => assert.deepEqual(getWeaponRangeBands(2.5, "vehicle").display, {short: .625, medium: 2.5, long: 5, extreme: 10})],
    ["personal bands stay metres", () => assert.equal(getWeaponRangeBands(100, "traveller").metres.extreme, 400)],
    ["vehicle bands convert to metres", () => assert.equal(getWeaponRangeBands(2.5, "vehicle").metres.short, 625)],
    ["exact short boundary", () => assert.equal(getTargetRangeBand(625, getWeaponRangeBands(2.5, "vehicle"), {aimed: true, hasScope: true}).dm, 1)],
    ["just beyond short boundary", () => assert.equal(getTargetRangeBand(625.1, getWeaponRangeBands(2.5, "vehicle"), {aimed: true, hasScope: true}).dm, 0)],
    ["exact medium boundary", () => assert.equal(getTargetRangeBand(2500, getWeaponRangeBands(2.5, "vehicle"), {aimed: true, hasScope: true}).dm, 0)],
    ["just beyond medium boundary", () => assert.equal(getTargetRangeBand(2500.1, getWeaponRangeBands(2.5, "vehicle"), {aimed: true, hasScope: true}).dm, -2)],
    ["exact long boundary", () => assert.equal(getTargetRangeBand(5000, getWeaponRangeBands(2.5, "vehicle"), {aimed: true, hasScope: true}).dm, -2)],
    ["just beyond long boundary", () => assert.equal(getTargetRangeBand(5000.1, getWeaponRangeBands(2.5, "vehicle"), {aimed: true, hasScope: true}).dm, -4)],
    ["exact extreme boundary", () => assert.equal(getTargetRangeBand(10000, getWeaponRangeBands(2.5, "vehicle"), {aimed: true, hasScope: true}).dm, -4)],
    ["out of range", () => assert.equal(getTargetRangeBand(10000.1, getWeaponRangeBands(2.5, "vehicle"), {aimed: true, hasScope: true}).dm, -99)],
    ["scope limitation remains explicit", () => assert.equal(getTargetRangeBand(2500, getWeaponRangeBands(2.5, "vehicle")).limitedByScope, true)],
    ["range label short preserves fraction", () => assert.deepEqual(getRangeBandDistance(2.5, 1), {band: "Short", distance: .625})],
    ["range label long preserves fraction", () => assert.deepEqual(getRangeBandDistance(2.5, -2), {band: "Long", distance: 5})],
    ["missing override falls back", () => assert.equal(resolveRangeDM("", -2), -2)],
    ["forged override falls back", () => assert.equal(resolveRangeDM("7", 1), 1)],
    ["option formatting is stable", () => assert.equal(formatRangeDMOption(0), "+0")]
];

for (const [name, assertion] of cases) test(name, assertion);

test("Vehicle Sheet 2 weapon range table preserves fractional kilometre labels", () => {
    const html = renderWeaponRangeTable({range: 2.5, scale: "vehicle"});
    assert.match(html, /<td>0\.625km<\/td><td>2\.5km<\/td><td>5km<\/td><td>10km<\/td>/);
});
