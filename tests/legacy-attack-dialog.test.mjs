import assert from "node:assert/strict";
import test from "node:test";

globalThis.Application = class {
    static get defaultOptions() { return {}; }
    constructor() { this.options = {}; }
};
const formulas = [];
globalThis.Roll = class {
    constructor(formula) { this.formula = formula; this.total = 8; this.dice = [{total: 8}]; formulas.push(formula); }
    async evaluate() { return this; }
    toMessage() {}
};
globalThis.ChatMessage = {getSpeaker: () => ({})};
globalThis.CONST = {ACTIVE_EFFECT_MODES: {ADD: 2}};
globalThis.CONFIG = {MGT2: {WEAPONS: {traits: {}}}};
globalThis.foundry = {applications: {handlebars: {renderTemplate: async () => ""}, ux: {TextEditor: {enrichHTML: async value => value}}}};
globalThis.game = {
    i18n: {localize: key => key, format: key => key},
    users: {current: {targets: []}},
    settings: {get: () => false}
};
globalThis.canvas = {tokens: {controlled: []}, grid: {size: 100, distance: 1}};
const warnings = [];
globalThis.ui = {notifications: {warn: message => warnings.push(message)}};
globalThis.window = globalThis;

const {MgT2AttackDialog} = await import("../mgt2e/module/helpers/attack-dialog.mjs");

function actor() {
    return {
        name: "Test Traveller",
        type: "traveller",
        thumbnail: "test.svg",
        system: {
            skills: {
                guncombat: {
                    id: "guncombat",
                    label: "Gun Combat",
                    trained: true,
                    value: 0,
                    specialities: {slug: {id: "slug", label: "Slug", trained: true, value: 0}}
                },
                jackofalltrades: {trained: false, value: 0}
            },
            characteristics: {DEX: {dm: 0}},
            modifiers: {guncombat: {dm: 0}, melee: {dm: 0}, encumbrance: {dm: 0}, physical: {dm: 0}}
        },
        items: [],
        getEffect: () => null,
        getRollData: () => ({})
    };
}

function weapon(range, scale = "traveller") {
    return {
        name: "Antique Rifle",
        img: "rifle.svg",
        system: {
            quantity: 1,
            weapon: {
                characteristic: "DEX",
                skill: "guncombat.slug",
                traits: "",
                damage: "3D6-3",
                damageType: "standard",
                range,
                scale,
                attackBonus: 0,
                damageBonus: null,
                magazine: 1,
                ammo: 1
            }
        },
        useAmmo: () => false,
        hasTrait: () => false
    };
}

function htmlForAim(aimingActions, autoOption = "single", DM = "0") {
    const values = new Map([
        ["input[class='skillDialogDM']", [{value: DM}]],
        [".skillDialogRollType", [{value: "normal"}]],
        [".attackDialogRange", [{value: "0"}]],
        [".attackDialogAuto", [{value: autoOption}]],
        [".attackDialogAiming", [{value: `${aimingActions}`}]],
        [".attackDialogPsi", []]
    ]);
    return {find: selector => values.get(selector) ?? []};
}

test("legacy personal attack dialog renders fractional Short range", () => {
    const dialog = new MgT2AttackDialog(actor(), weapon(25));
    const context = dialog.getData();
    assert.equal(context.shortRange, 6.25);
    assert.equal(context.range, 25);
    assert.equal(context.longRange, 50);
    assert.equal(context.extremeRange, 100);
    assert.equal(dialog.RANGES["+1"], "MGT2.Attack.short (6.25m, +1)");
    assert.deepEqual(dialog.AIMING_ACTIONS, {0: "0", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6"});
    assert.equal(context.aimingActions, 0);
});

test("legacy handler allows aim-zero Auto modes and rejects aimed Auto before ammo or rolls", async () => {
    for (const mode of ["burst", "full"]) {
        formulas.length = 0;
        warnings.length = 0;
        const allowed = new MgT2AttackDialog(actor(), weapon(25));
        allowed.close = () => {};
        await allowed.onRollClick({preventDefault() {}}, htmlForAim(0, mode));
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(formulas.some(formula => formula.includes("2D6")), true);

        formulas.length = 0;
        const rejectedWeapon = weapon(25);
        rejectedWeapon.useAmmo = () => true;
        rejectedWeapon.updateCalls = 0;
        rejectedWeapon.update = () => { rejectedWeapon.updateCalls += 1; };
        const rejected = new MgT2AttackDialog(actor(), rejectedWeapon);
        rejected.close = () => {};
        const ammoBefore = rejectedWeapon.system.weapon.ammo;
        await rejected.onRollClick({preventDefault() {}}, htmlForAim(1, mode, "2"));
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(formulas.length, 0);
        assert.equal(rejectedWeapon.system.weapon.ammo, ammoBefore);
        assert.equal(rejectedWeapon.updateCalls, 0);
        assert.match(warnings.at(-1), /Auto trait/);
    }
});

test("legacy melee dialog exposes no aiming actions", () => {
    const dialog = new MgT2AttackDialog(actor(), weapon(0));
    assert.equal(dialog.getData().AIMING_ACTIONS, undefined);
});

test("legacy dialog reopen or weapon change starts aiming at zero", () => {
    const first = new MgT2AttackDialog(actor(), weapon(25));
    first.aimingActions = 6;
    const reopened = new MgT2AttackDialog(actor(), weapon(25));
    const changedWeapon = new MgT2AttackDialog(actor(), weapon(100));
    assert.equal(reopened.getData().aimingActions, 0);
    assert.equal(changedWeapon.getData().aimingActions, 0);
});

test("actual legacy personal handler submits 0, 1 and 6 aiming actions to rollAttack", async () => {
    for (const actions of [0, 1, 6]) {
        formulas.length = 0;
        const dialog = new MgT2AttackDialog(actor(), weapon(25));
        dialog.close = () => {};
        await dialog.onRollClick({preventDefault() {}}, htmlForAim(actions));
        await new Promise(resolve => setImmediate(resolve));
        const attack = formulas.find(formula => formula.includes("2D6"));
        if (actions === 0) assert.doesNotMatch(attack, /\[Aimed\]/);
        else assert.match(attack, new RegExp(`\\+ ${actions}\\[Aimed\\]`));
    }
});

test("actual legacy personal handler rejects invalid aiming values", async () => {
    formulas.length = 0;
    const dialog = new MgT2AttackDialog(actor(), weapon(25));
    dialog.close = () => {};
    await dialog.onRollClick({preventDefault() {}}, htmlForAim("1.5"));
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(formulas.length, 0);
});

test("legacy aiming guidance explicitly requires reset after target change", async () => {
    const template = await import("node:fs").then(fs => fs.readFileSync(new URL("../mgt2e/templates/attack-dialog.html", import.meta.url), "utf8"));
    assert.match(template, /#if AIMING_ACTIONS[\s\S]*class="aiming"[\s\S]*\/if/);
    assert.match(template, /Reset to 0 if the target changes/);
});

test("legacy context omits aiming control data for noncharacter and spacecraft attacks", () => {
    const noncharacter = actor();
    noncharacter.type = "vehicle";
    assert.equal(new MgT2AttackDialog(noncharacter, weapon(25)).getData().AIMING_ACTIONS, undefined);
    assert.equal(new MgT2AttackDialog(actor(), weapon(25, "spacecraft")).getData().AIMING_ACTIONS, undefined);
});

test("legacy vehicle attack dialog preserves fractional kilometre bands", () => {
    const dialog = new MgT2AttackDialog(actor(), weapon(2.5, "vehicle"));
    assert.equal(dialog.RANGES["+1"], "MGT2.Attack.short (0.625km, +1)");
});
