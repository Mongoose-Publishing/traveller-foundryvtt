import assert from "node:assert/strict";
import test from "node:test";

class ApplicationV2 {
    constructor() {}
    _onRender() {}
}

globalThis.foundry = {
    applications: {
        api: {ApplicationV2, HandlebarsApplicationMixin: Base => class extends Base {}},
        handlebars: {renderTemplate: async () => ""},
        ux: {TextEditor: {enrichHTML: async value => value}}
    }
};
globalThis.Application = class {};
globalThis.Actor = class {};
globalThis.Item = class {};
globalThis.Roll = class {};
globalThis.ChatMessage = {getSpeaker: () => ({})};
globalThis.CONST = {ACTIVE_EFFECT_MODES: {ADD: 2}};
globalThis.CONFIG = {MGT2: {WEAPONS: {traits: {}}, SPACE_MOUNTS: {}}};
globalThis.game = {
    i18n: {localize: key => key, format: key => key},
    settings: {get: () => false},
    users: {current: {targets: new Set()}}
};
globalThis.canvas = {scene: null, tokens: {controlled: [], placeables: []}};
globalThis.window = globalThis;
const warnings = [];
globalThis.ui = {notifications: {warn: message => warnings.push(message)}};

const {MgT2eAttackApp} = await import("../mgt2e/module/helpers/dialogs/MgT2eAttackApp.mjs");

function dialog({melee = false, actor = {type: "traveller"}} = {}) {
    const instance = Object.create(MgT2eAttackApp.prototype);
    instance.actor = actor;
    instance.isMelee = melee;
    instance.currentTarget = {rangeDM: 0};
    instance.weaponItem = {system: {weapon: {range: melee ? 0 : 100, scale: "vehicle"}}};
    instance.attackOptions = {};
    instance.rolls = [];
    instance.rollAttack = (customDM, rangeDM) => instance.rolls.push({customDM, rangeDM, options: {...instance.attackOptions}});
    return instance;
}

async function submit(instance, {aimingActions = "0", shotType = "single", DM = "0", range = "0"} = {}) {
    return MgT2eAttackApp.formHandler.call(instance, {type: "submit"}, {}, {
        object: {aimingActions, shotType, DM, range, rollType: "standard"}
    });
}

test("actual vehicle dialog submission sends aiming actions 0, 1 and 6 once", async () => {
    for (const actions of [0, 1, 6]) {
        const instance = dialog();
        await submit(instance, {aimingActions: `${actions}`});
        assert.equal(instance.rolls.length, 1);
        assert.equal(instance.rolls[0].options.aimingActions, actions);
        assert.equal(instance.rolls[0].options.autoOption, "single");
    }
});

test("actual dialog rejects fractional, negative and greater-than-six aiming values", async () => {
    for (const value of ["1.5", "-1", "7", "not-a-number"]) {
        const instance = dialog();
        await submit(instance, {aimingActions: value});
        assert.equal(instance.rolls.length, 0);
    }
});

test("melee, missing character and noncharacter Actor force aiming zero", async () => {
    const melee = dialog({melee: true});
    await submit(melee, {aimingActions: "6"});
    assert.equal(melee.rolls[0].options.aimingActions, 0);

    const crewless = dialog({actor: null});
    await submit(crewless, {aimingActions: "6"});
    assert.equal(crewless.rolls[0].options.aimingActions, 0);

    const vehicleActor = dialog({actor: {type: "vehicle"}});
    await submit(vehicleActor, {aimingActions: "6"});
    assert.equal(vehicleActor.rolls[0].options.aimingActions, 0);
});

test("Burst and Full Auto allow aim zero but reject nonzero aim before roll", async () => {
    for (const mode of ["burst", "full"]) {
        const allowed = dialog();
        await submit(allowed, {aimingActions: "0", shotType: mode, DM: "2"});
        assert.equal(allowed.rolls.length, 1);
        assert.equal(allowed.rolls[0].options.autoOption, mode);
        assert.equal(allowed.rolls[0].options.aimingActions, 0);
        assert.equal(allowed.rolls[0].customDM, 2);

        const aimedThenAuto = dialog();
        await submit(aimedThenAuto, {aimingActions: "6", shotType: mode, DM: "2"});
        assert.equal(aimedThenAuto.rolls.length, 0);
        assert.match(warnings.at(-1), /Auto trait/);

        const autoThenAimed = dialog();
        autoThenAimed.shotType = mode;
        autoThenAimed.aimingActions = 1;
        await submit(autoThenAimed, {aimingActions: "1", shotType: mode});
        assert.equal(autoThenAimed.rolls.length, 0);
    }
});

test("actual constructor and reopened dialog state default to zero without persistence", () => {
    const actor = {id: "actor-a", type: "traveller"};
    const weapon = {system: {weapon: {range: 100, scale: "vehicle"}}};
    const first = new MgT2eAttackApp(actor, weapon, {});
    first.aimingActions = 5;
    const reopened = new MgT2eAttackApp(actor, weapon, {});
    assert.equal(reopened.aimingActions, 0);
});

function token(id, metres) {
    return {
        id,
        name: id,
        center: {x: metres * 100, y: 0},
        document: {_id: id, id, rotation: 0, actor: {system: {size: 0}}},
        actor: {type: "traveller", system: {size: 0, modifiers: {}}, effects: []}
    };
}

function preparedDialog() {
    const instance = Object.create(MgT2eAttackApp.prototype);
    instance.actor = {
        type: "traveller",
        system: {characteristics: {DEX: {dm: 0}}},
        getSkillValue: () => 0,
        getSkillLabel: () => "Gunner"
    };
    instance.weaponItem = {
        name: "Scoped vehicle weapon",
        system: {weapon: {range: 2.5, scale: "vehicle", characteristic: "DEX", skill: "gunner.turret", traits: "scope"}},
        useAmmo: () => false
    };
    instance.attackOptions = {dm: 0};
    instance.shotType = "single";
    instance.aimingActions = 2;
    instance.ATTACKER_TOKEN = {
        id: "attacker",
        name: "attacker",
        center: {x: 0, y: 0},
        document: {id: "attacker", _id: "attacker"}
    };
    return instance;
}

test("actual context resets and recomputes Scope range when fallback target identity changes", async () => {
    const near = token("near", 2500);
    const disappeared = token("old", 11000);
    game.users.current.targets = new Set([near, disappeared]);
    canvas.scene = {};
    canvas.grid = {size: 100, distance: 1, units: "m"};

    const instance = preparedDialog();
    instance.currentTarget = {token: disappeared};
    instance.currentTargetId = "old";
    const context = await instance._prepareContext({window: {}});

    assert.equal(instance.aimingActions, 0);
    assert.equal(context.aimingActions, 0);
    assert.equal(context.currentTarget.token.document._id, "near");
    assert.equal(context.currentTarget.rangeDM, -4);
    assert.equal(context.currentTarget.rangeText, "MGT2.AttackDialog.NoScope");
});

test("actual context resets targetless manual aim when a new target appears", async () => {
    const near = token("new-target", 100);
    game.users.current.targets = new Set([near]);
    canvas.scene = {};
    canvas.grid = {size: 100, distance: 1, units: "m"};

    const instance = preparedDialog();
    instance.currentTarget = undefined;
    instance.currentTargetId = undefined;
    instance.aimingActions = 4;
    const context = await instance._prepareContext({window: {}});

    assert.equal(context.currentTarget.token.document._id, "new-target");
    assert.equal(context.aimingActions, 0);
});

test("actual context hides aiming for spacecraft scale even with a character actor", async () => {
    game.users.current.targets = new Set();
    canvas.scene = null;
    const instance = preparedDialog();
    instance.weaponItem.system.weapon.scale = "spacecraft";
    const context = await instance._prepareContext({window: {}});
    assert.equal(context.canAim, false);
});

test("rejected Auto modes do not receive Scope aiming range benefit", () => {
    const instance = preparedDialog();
    instance.rangeBands = {
        unit: "km",
        metres: {short: 625, medium: 2500, long: 5000, extreme: 10000}
    };
    instance.aimingActions = 1;
    const target = {distanceMetres: 2500};
    instance.shotType = "single";
    assert.equal(instance._getRangeDM({...target}), 0);
    for (const mode of ["burst", "full"]) {
        instance.shotType = mode;
        assert.equal(instance._getRangeDM({...target}), -4);
    }
});
