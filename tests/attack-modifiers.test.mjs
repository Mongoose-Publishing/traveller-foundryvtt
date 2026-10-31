import assert from "node:assert/strict";
import test from "node:test";
import {appendAimedModifier, hasAimingAutoConflict, isCharacterAimingActor, parseAimingActions, resetAimingForTargetChange} from "../mgt2e/module/helpers/utils/attack-modifiers.mjs";

const actor = {type: "traveller"};

test("aiming actions 0, 1 and 6 add one labelled term", () => {
    const weapon = {system: {weapon: {range: 100, scale: "traveller"}}};
    assert.equal(appendAimedModifier("2D6", {aimingActions: 0}, weapon, actor), "2D6");
    assert.equal(appendAimedModifier("2D6", {aimingActions: 1}, weapon, actor), "2D6 + 1[Aimed]");
    assert.equal(appendAimedModifier("2D6", {aimingActions: 6}, weapon, actor), "2D6 + 6[Aimed]");
});

test("custom DM remains independent from Aimed Shot", () => {
    const weapon = {system: {weapon: {range: 100, scale: "traveller"}}};
    assert.equal(appendAimedModifier("2D6 + 1[DM]", {aimingActions: 2}, weapon, actor), "2D6 + 1[DM] + 2[Aimed]");
});

test("other firing modes receive no Aimed modifier", () => {
    const weapon = {system: {weapon: {range: 100, scale: "traveller"}}};
    assert.equal(appendAimedModifier("2D6", {autoOption: "aimed"}, weapon, actor), "2D6");
});

test("melee, spacecraft scale, Burst and Full Auto exclude aiming", () => {
    const melee = {system: {weapon: {range: 0, scale: "traveller"}}};
    const spacecraft = {system: {weapon: {range: 100, scale: "spacecraft"}}};
    const ranged = {system: {weapon: {range: 100, scale: "vehicle"}}};
    assert.equal(appendAimedModifier("2D6", {aimingActions: 2}, melee, actor), "2D6");
    assert.equal(appendAimedModifier("2D6", {aimingActions: 2}, spacecraft, actor), "2D6");
    assert.equal(appendAimedModifier("2D6", {aimingActions: 2, autoOption: "full"}, ranged, actor), "2D6");
    assert.equal(appendAimedModifier("2D6", {aimingActions: 2, autoOption: "burst"}, ranged, actor), "2D6");
    assert.equal(appendAimedModifier("2D6", {aimingActions: 2}, ranged, null), "2D6");
    assert.equal(appendAimedModifier("2D6", {aimingActions: 2}, ranged, {type: "vehicle"}), "2D6");
    assert.equal(appendAimedModifier("2D6", {aimingActions: 2}, {system: {weapon: {scale: "traveller"}}}, actor), "2D6");
    assert.equal(appendAimedModifier("2D6", {aimingActions: 2}, {system: {weapon: {range: "invalid", scale: "traveller"}}}, actor), "2D6");
});

test("Auto conflict applies only to nonzero valid aim with Burst or Full Auto", () => {
    for (const mode of ["burst", "full"]) {
        assert.equal(hasAimingAutoConflict(0, mode), false);
        assert.equal(hasAimingAutoConflict(1, mode), true);
        assert.equal(hasAimingAutoConflict(6, mode), true);
    }
    assert.equal(hasAimingAutoConflict(6, "single"), false);
    assert.equal(hasAimingAutoConflict("invalid", "burst"), false);
});

test("aiming action validation rejects fractional and out-of-range values", () => {
    for (const value of [-1, 1.5, 7, "1.5", "7", {}, NaN]) assert.equal(parseAimingActions(value), null);
    assert.equal(parseAimingActions("0"), 0);
    assert.equal(parseAimingActions("6"), 6);
    assert.equal(parseAimingActions(""), 0);
});

test("target identity changes reset aiming while same target rerenders preserve it", () => {
    assert.equal(resetAimingForTargetChange(4, "target-a", "target-a"), 4);
    assert.equal(resetAimingForTargetChange(4, "target-a", "target-b"), 0);
    assert.equal(resetAimingForTargetChange(4, "target-a", undefined), 0);
    assert.equal(resetAimingForTargetChange(4, undefined, "target-a"), 0);
});

test("only Traveller and NPC character actors can aim", () => {
    assert.equal(isCharacterAimingActor({type: "traveller"}), true);
    assert.equal(isCharacterAimingActor({type: "npc"}), true);
    assert.equal(isCharacterAimingActor({type: "vehicle"}), false);
    assert.equal(isCharacterAimingActor({type: "spacecraft"}), false);
});
