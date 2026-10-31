import assert from "node:assert/strict";
import test from "node:test";

const formulas = [];

class TestRoll {
    constructor(formula) {
        this.formula = formula;
        this.total = 8;
        this.dice = [{total: 8}];
        formulas.push(formula);
    }

    async evaluate() {
        return this;
    }

    toMessage() {}
}

globalThis.Roll = TestRoll;
globalThis.ChatMessage = {getSpeaker: () => ({})};
globalThis.CONST = {ACTIVE_EFFECT_MODES: {ADD: 2}};
globalThis.CONFIG = {MGT2: {WEAPONS: {traits: {}}, SPACE_MOUNTS: {}}};
globalThis.game = {
    i18n: {localize: key => key},
    settings: {
        get: (namespace, key) => namespace === "core" && key === "rollMode" ? "publicroll" : false
    }
};
const warnings = [];
globalThis.ui = {notifications: {warn: message => warnings.push(message)}};
globalThis.foundry = {
    applications: {
        handlebars: {renderTemplate: async () => "<p>roll</p>"},
        ux: {TextEditor: {enrichHTML: async value => value}}
    }
};

const {rollAttack, rollSkill, rollSpaceAttack} = await import("../mgt2e/module/helpers/dice-rolls.mjs");
const {dispatchSkillCheck} = await import("../mgt2e/module/helpers/utils/skill-roll-dispatch.mjs");

function traveller() {
    return {
        name: "Test Traveller",
        type: "traveller",
        thumbnail: "test.svg",
        system: {
            skills: {
                vaccsuit: {trained: true, value: 1},
                stealth: {id: "stealth", label: "Stealth", trained: true, value: 0, default: "DEX", specialities: {}},
                persuade: {id: "persuade", label: "Persuade", trained: true, value: 0, default: "SOC", specialities: {}},
                jackofalltrades: {trained: false, value: 0}
            },
            characteristics: {DEX: {dm: 1, value: 8}, SOC: {dm: 1, value: 8}},
            modifiers: {
                encumbrance: {dm: -2},
                physical: {dm: 0},
                melee: {dm: 0},
                guncombat: {dm: 0}
            }
        },
        items: [{type: "armour", system: {status: "equipped", armour: {skill: "2"}}}],
        getEffect: () => null,
        getAttackSkill: () => 0,
        getRollData: () => ({})
    };
}

test("normal dialog dispatch submits to the real rollSkill consumer", async () => {
    formulas.length = 0;
    const actor = traveller();
    await dispatchSkillCheck({
        actor,
        skillFqn: "stealth",
        speciality: undefined,
        dialogCharacteristic: "DEX",
        quickCharacteristic: "DEX",
        quickRolls: false,
        shiftKey: false,
        openDialog: (dialogActor, skill, options) => rollSkill(dialogActor, skill, {
            ...options,
            rollType: "normal",
            difficulty: 8
        }),
        rollSkill
    });
    const formula = formulas.at(-1);
    assert.match(formula, /\+1\[DEX\]/);
    assert.match(formula, /-2\[Enc\]/);
    assert.match(formula, /- 1\[Armour\]/);
    assert.equal(formula.match(/\[Armour\]/g)?.length, 1);
});

test("Shift inversion dispatches directly to the real rollSkill consumer", async () => {
    formulas.length = 0;
    const actor = traveller();
    let dialogOpened = false;
    await dispatchSkillCheck({
        actor,
        skillFqn: "stealth",
        speciality: undefined,
        dialogCharacteristic: "DEX",
        quickCharacteristic: "DEX",
        quickRolls: false,
        shiftKey: true,
        openDialog: () => { dialogOpened = true; },
        rollSkill
    });
    assert.equal(dialogOpened, false);
    assert.match(formulas.at(-1), /- 1\[Armour\]/);
});

test("actual skill and equipment changes are reflected on the next consumer call", async () => {
    const actor = traveller();
    actor.system.skills.vaccsuit.value = 0;
    formulas.length = 0;
    await rollSkill(actor, "stealth", {cha: "DEX", rollType: "normal", difficulty: 8});
    assert.match(formulas.at(-1), /- 2\[Armour\]/);

    actor.system.skills.vaccsuit.value = 2;
    formulas.length = 0;
    await rollSkill(actor, "stealth", {cha: "DEX", rollType: "normal", difficulty: 8});
    assert.doesNotMatch(formulas.at(-1), /\[Armour\]/);

    actor.system.skills.vaccsuit.value = 0;
    actor.items[0].system.status = "carried";
    formulas.length = 0;
    await rollSkill(actor, "stealth", {cha: "DEX", rollType: "normal", difficulty: 8});
    assert.doesNotMatch(formulas.at(-1), /\[Armour\]/);
});

test("mental and social checks apply armour without physical encumbrance", async () => {
    formulas.length = 0;
    await rollSkill(traveller(), "persuade", {cha: "SOC", rollType: "normal", difficulty: 8});
    const formula = formulas.at(-1);
    assert.match(formula, /- 1\[Armour\]/);
    assert.doesNotMatch(formula, /\[Enc\]/);
    assert.equal(formula.match(/\[Armour\]/g)?.length, 1);
});

test("characteristic-only rollSkill applies armour without a skill object", async () => {
    formulas.length = 0;
    await rollSkill(traveller(), null, {cha: "SOC", rollType: "normal", difficulty: 8});
    const formula = formulas.at(-1);
    assert.match(formula, /\+1\[SOC\]/);
    assert.match(formula, /- 1\[Armour\]/);
    assert.doesNotMatch(formula, /\[Enc\]/);
});

test("armour with no numeric requirement adds no armour term", async () => {
    const actor = traveller();
    actor.items[0].system.armour.skill = "-";
    formulas.length = 0;
    await rollSkill(actor, "stealth", {cha: "DEX", rollType: "normal", difficulty: 8});
    assert.doesNotMatch(formulas.at(-1), /\[Armour\]/);
});

test("rollAttack consumer applies armour independently from attack encumbrance", async () => {
    formulas.length = 0;
    const weapon = {
        name: "Test Rifle",
        img: "rifle.svg",
        system: {
            quantity: 1,
            notes: "",
            weapon: {
                range: 100,
                scale: "traveller",
                skill: "guncombat.slug",
                damage: "1D6",
                damageType: "standard",
                traits: "",
                attackBonus: 0,
                damageBonus: null
            }
        }
    };
    await rollAttack(traveller(), weapon, {skillDM: 0, dm: 0, rangeDM: 0, rollType: "normal"});
    const attackFormula = formulas.find(formula => formula.includes("[Armour]"));
    assert.match(attackFormula, /- 1\[Armour\]/);
    assert.match(attackFormula, /- 2\[Enc\]/);
    assert.equal(attackFormula.match(/\[Armour\]/g)?.length, 1);
});

test("rollAttack adds the selected aiming actions exactly once", async () => {
    const weapon = {
        name: "Test Rifle",
        img: "rifle.svg",
        system: {
            quantity: 1,
            notes: "",
            weapon: {
                range: 100,
                scale: "traveller",
                skill: "guncombat.slug",
                damage: "1D6",
                damageType: "standard",
                traits: "",
                attackBonus: 0,
                damageBonus: null
            }
        }
    };
    formulas.length = 0;
    await rollAttack(traveller(), weapon, {skillDM: 0, dm: 1, rangeDM: -2, rollType: "normal", autoOption: "single", aimingActions: 6});
    const aimed = formulas.find(formula => formula.includes("[Aimed]"));
    assert.equal(aimed.match(/\[Aimed\]/g)?.length, 1);
    assert.match(aimed, /\+ 6\[Aimed\]/);
    assert.match(aimed, /\+ 1\[DM\]/);
    assert.match(aimed, /- 2\[Range\]/);

    formulas.length = 0;
    await rollAttack(traveller(), weapon, {skillDM: 0, dm: 1, rangeDM: -2, rollType: "normal", autoOption: "single", aimingActions: 0});
    const single = formulas.find(formula => formula.includes("[Armour]"));
    assert.doesNotMatch(single, /\[Aimed\]/);
    assert.match(single, /\+ 1\[DM\]/);

    formulas.length = 0;
    const spacecraftWeapon = structuredClone(weapon);
    spacecraftWeapon.system.weapon.scale = "spacecraft";
    await rollAttack(traveller(), spacecraftWeapon, {skillDM: 0, dm: 0, rangeDM: 0, rollType: "normal", aimingActions: 6});
    assert.doesNotMatch(formulas.at(-1), /\[Aimed\]/);

    formulas.length = 0;
    await rollAttack(traveller(), weapon, {skillDM: 0, dm: 0, rangeDM: 0, rollType: "normal"});
    assert.doesNotMatch(formulas.at(-1), /\[Aimed\]/, "quick/default consumer calls use zero aiming actions");

    for (const mode of ["burst", "full"]) {
        formulas.length = 0;
        warnings.length = 0;
        await rollAttack(traveller(), weapon, {skillDM: 0, dm: 3, rangeDM: 0, rollType: "normal", autoOption: mode, aimingActions: 0, shotsFired: 2});
        assert.equal(formulas.some(formula => formula.includes("2D6")), true);
        assert.match(formulas.find(formula => formula.includes("2D6")), /\+ 3\[DM\]/);

        formulas.length = 0;
        const result = await rollAttack(traveller(), weapon, {skillDM: 0, dm: 3, rangeDM: 0, rollType: "normal", autoOption: mode, aimingActions: 1, shotsFired: 2});
        assert.equal(result, null);
        assert.equal(formulas.length, 0);
        assert.match(warnings.at(-1), /Auto trait/);
    }
});

test("rollSpaceAttack applies armour only to an explicit character gunner", async () => {
    const starship = {name: "Test Ship", thumbnail: "ship.svg"};
    const weapon = {
        name: "Test Laser",
        system: {tl: 10, damageType: "standard", weapon: {damage: "1D6", mount: "", traits: "", scale: "spacecraft"}},
        hasTrait: () => false
    };
    const options = {results: {dice: "2D6", label: "Gunner", cha: "INT", chadm: 0, base: 0}, range: "medium", rangeDM: 0, quantity: 1};

    formulas.length = 0;
    await rollSpaceAttack(starship, traveller(), weapon, options);
    const crewed = formulas.find(formula => formula.includes("[Armour]"));
    assert.equal(crewed.match(/\[Armour\]/g)?.length, 1);

    formulas.length = 0;
    await rollSpaceAttack(starship, null, weapon, {...options, attackDM: 0});
    assert.equal(formulas.some(formula => formula.includes("[Armour]")), false);
});
