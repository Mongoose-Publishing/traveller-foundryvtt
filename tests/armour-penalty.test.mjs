import assert from "node:assert/strict";
import test from "node:test";
import {appendArmourPenalty, buildTacticsInitiativeFormula, getArmourSkillPenalty} from "../mgt2e/module/helpers/utils/armour-penalty.mjs";

const armour = (requirement, status = "equipped") => ({type: "armour", system: {status, armour: {skill: requirement}}});
const actor = (skill, items = []) => ({system: {skills: {vaccsuit: skill}}, items});

test("requirement 0 applies wholly-unskilled -3", () => {
    assert.equal(getArmourSkillPenalty(actor(null, [armour("0")])), -3);
});

test("armour without a numeric requirement does not penalise an untrained wearer", () => {
    for (const requirement of [null, undefined, "", "   ", "-", "vaccsuit", Number.NaN, false, [], {}]) {
        assert.equal(getArmourSkillPenalty(actor(null, [armour(requirement)])), 0);
    }
});

test("requirement 2 applies trained deficits and reaches zero at level 2", () => {
    assert.equal(getArmourSkillPenalty(actor({trained: true, value: 0}, [armour("2")])), -2);
    assert.equal(getArmourSkillPenalty(actor({trained: true, value: 1}, [armour("2")])), -1);
    assert.equal(getArmourSkillPenalty(actor({trained: true, value: 2}, [armour("2")])), 0);
});

test("highest equipped requirement wins while carried armour is ignored", () => {
    assert.equal(getArmourSkillPenalty(actor({trained: true, value: 0}, [armour("1"), armour("2"), armour("3", "carried")])), -2);
});

test("Foundry Collection-like map values are supported", () => {
    const traveller = actor({trained: true, value: 1});
    traveller.items = new Map([["suit", armour("2")]]);
    assert.equal(getArmourSkillPenalty(traveller), -1);
});

test("equip, unequip and skill edits refresh without sheet preparation", () => {
    const suit = armour("2");
    const traveller = actor({trained: true, value: 0}, [suit]);
    assert.equal(getArmourSkillPenalty(traveller), -2);
    suit.system.status = "carried";
    assert.equal(getArmourSkillPenalty(traveller), 0);
    suit.system.status = "equipped";
    traveller.system.skills.vaccsuit.value = 1;
    assert.equal(getArmourSkillPenalty(traveller), -1);
});

test("repeated calculation is stable and actors remain isolated", () => {
    const first = actor({trained: true, value: 1}, [armour("2")]);
    const second = actor({trained: true, value: 2}, [armour("2")]);
    assert.equal(getArmourSkillPenalty(first), -1);
    assert.equal(getArmourSkillPenalty(first), -1);
    assert.equal(getArmourSkillPenalty(second), 0);
    assert.equal(getArmourSkillPenalty(first), -1);
});

test("armour penalty is independent of characteristic and physical burden", () => {
    const traveller = actor({trained: true, value: 1}, [armour("2")]);
    assert.equal(appendArmourPenalty("2D6 + 1[SOC]", traveller), "2D6 + 1[SOC] - 1[Armour]");
    assert.equal(appendArmourPenalty("2D6 - 2[Enc]", traveller), "2D6 - 2[Enc] - 1[Armour]");
});

test("Tactics initiative formula applies armour only from the explicit crew Actor", () => {
    const crew = actor({trained: true, value: 1}, [armour("2")]);
    assert.equal(buildTacticsInitiativeFormula(2, crew), "2D6 - 8 + 2 - 1[Armour]");
    assert.equal(buildTacticsInitiativeFormula(2, null), "2D6 - 8 + 2");
});
