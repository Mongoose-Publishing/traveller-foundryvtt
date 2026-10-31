import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {getTargetRangeBand, getWeaponRangeBands, rebindTargetById, resolveRangeDM} from "../mgt2e/module/helpers/utils/range-utils.mjs";

const target = id => ({token: {document: {_id: id}}});

test("selected target is rebound after aiming-range recalculation", () => {
    const targets = [target("a"), target("b")];
    assert.equal(rebindTargetById(targets, "b"), targets[1]);
    const bands = getWeaponRangeBands(2.5, "vehicle");
    assert.equal(getTargetRangeBand(2500, bands, {aimed: false, hasScope: true}).dm, -4);
    assert.equal(getTargetRangeBand(2500, bands, {aimed: true, hasScope: true}).dm, 0);
});

test("aiming reset preserves identity and restores scope limit", () => {
    const selected = target("b");
    assert.equal(rebindTargetById([target("a"), selected], "b"), selected);
    assert.equal(getTargetRangeBand(2500, getWeaponRangeBands(2.5, "vehicle"), {aimed: false, hasScope: true}).dm, -4);
});

test("missing and disappeared targets fail to a deterministic eligible target", () => {
    const first = target("a");
    assert.equal(rebindTargetById([first], "missing"), first);
    assert.equal(rebindTargetById([], "missing"), undefined);
});

test("manual override wins until an explicit target selection clears it", () => {
    assert.equal(resolveRangeDM(-2, 1), -2);
    assert.equal(resolveRangeDM(undefined, 1), 1);
});

test("dialog source guards blank and forged targetless ranges", () => {
    const source = fs.readFileSync(new URL("../mgt2e/module/helpers/dialogs/MgT2eAttackApp.mjs", import.meta.url), "utf8");
    assert.match(source, /manualRangeDM === null[\s\S]*Select a valid range/);
    assert.match(source, /!this\.currentTarget && !this\.isMelee && manualRangeDM === null/);
    assert.match(source, /this\.rangeOverrideDM = undefined;[\s\S]*this\.currentTarget = target/);
});

test("template presents an explicit manual-range placeholder", () => {
    const source = fs.readFileSync(new URL("../mgt2e/templates/dialogs/attack-dialog.html", import.meta.url), "utf8");
    assert.match(source, /selectOptions RANGE_SELECT selected=selectedRangeDM/);
    assert.match(source, /manualRangeRequired/);
});

test("dialog resets aiming when target rebinding changes identity and guards Auto conflicts", () => {
    const source = fs.readFileSync(new URL("../mgt2e/module/helpers/dialogs/MgT2eAttackApp.mjs", import.meta.url), "utf8");
    assert.match(source, /resetAimingForTargetChange\(this\.aimingActions, currentTargetId, reboundTargetId\)/);
    assert.match(source, /hasAimingAutoConflict\(aimingActions, formData\.object\.shotType\)/);
});
