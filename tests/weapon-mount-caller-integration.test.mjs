import assert from "node:assert/strict";
import test from "node:test";

import {
    executeCrewWeaponAttack,
    executeV2DirectWeaponAttack
} from "../mgt2e/module/helpers/utils/weapon-mount-utils.mjs";

function collection(items) {
    const list = [...items];
    list.get = id => list.find(item => item.id === id);
    return list;
}

function fixture() {
    const weapon = {
        id: "weapon", type: "weapon", name: "Laser",
        system: {weapon: {mount: "turret", scale: "spacecraft"}}
    };
    const mount = {
        id: "mount", type: "hardware", name: "Turret",
        system: {hardware: {system: "weapon", mount: "turret", weapons: {weapon: {quantity: 1}}}}
    };
    const action = {action: "weapon", weapon: "", dm: "0"};
    const role = {id: "role", type: "role", system: {role: {actions: {action}}}};
    const actor = {
        items: collection([mount, weapon, role]),
        system: {crewed: {crew: {crew: {role: {}}}}}
    };
    return {actor, weapon, mount, role, action, crew: {id: "crew"}};
}

function notifications() {
    const warnings = [];
    globalThis.game = {i18n: {localize: key => key}};
    globalThis.ui = {notifications: {warn: message => warnings.push(message)}};
    return warnings;
}

test("production crew orchestration suppresses construction after stale context", async () => {
    const state = fixture();
    const warnings = notifications();
    let constructors = 0;
    const result = await executeCrewWeaponAttack({
        actor: state.actor,
        crewId: "crew",
        roleId: "role",
        actionId: "action",
        chooseMount: async () => {
            state.action.dm = "1";
            return "mount";
        },
        getCrewActor: () => state.crew,
        onAttack: () => constructors++
    });
    assert.equal(result, false);
    assert.equal(constructors, 0);
    assert.deepEqual(warnings, ["MGT2.Error.WeaponActionChanged"]);
});

test("production V2 direct orchestration constructs exactly once for unchanged selection", async () => {
    const state = fixture();
    state.action.weapon = "stale";
    const warnings = notifications();
    let constructors = 0;
    const result = await executeV2DirectWeaponAttack({
        actor: state.actor,
        weaponId: "stale",
        mountId: "stale",
        crewId: "crew",
        roleId: "role",
        actionId: "action",
        actionDm: 0,
        chooseMount: async () => "mount",
        getCrewActor: () => state.crew,
        onAttack: ({mount, weapon}) => {
            constructors++;
            assert.equal(mount, state.mount);
            assert.equal(weapon, state.weapon);
        }
    });
    assert.equal(result, true);
    assert.equal(constructors, 1);
    assert.deepEqual(warnings, []);
    state.action.weapon = "";
});

function installFoundryStubs(renderSpy) {
    class ApplicationStub {
        constructor() {
            this.options = {};
        }
        render() {
            renderSpy();
            return this;
        }
    }
    class DocumentStub {}
    Object.assign(globalThis, {
        window: globalThis,
        Application: ApplicationStub,
        FormApplication: class {},
        ActorSheet: class {},
        Item: DocumentStub,
        Actor: DocumentStub,
        ActiveEffect: DocumentStub,
        Combat: DocumentStub,
        Combatant: DocumentStub,
        ChatMessage: class {},
        Roll: class {},
        Dialog: class {},
        Hooks: {},
        Handlebars: {},
        canvas: {scene: null, tokens: {controlled: [], placeables: []}},
        CONFIG: {MGT2: {}},
        CONST: {ACTIVE_EFFECT_MODES: {
            ADD: 2, MULTIPLY: 1, DOWNGRADE: 3, UPGRADE: 4, OVERRIDE: 5, CUSTOM: 0
        }}
    });
    globalThis.foundry = {
        appv1: {sheets: {ActorSheet: class {}}},
        applications: {
            handlebars: {renderTemplate() {}},
            sheets: {ActorSheetV2: class {}},
            api: {
                ApplicationV2: ApplicationStub,
                HandlebarsApplicationMixin: Base => class extends Base {},
                DialogV2: {wait: async () => "mount"}
            },
            ux: {TextEditor: {}}
        },
        utils: {
            mergeObject: (a, b) => Object.assign({}, a, b),
            duplicate: value => structuredClone(value),
            getProperty() {},
            setProperty() {}
        }
    };
}

test("actual legacy and V2 sheet entry points construct once or abort stale context", async t => {
    let renders = 0;
    installFoundryStubs(() => renders++);
    const warnings = notifications();
    globalThis.game.actors = new Map();
    globalThis.game.users = {current: {targets: []}};
    const state = fixture();
    globalThis.game.actors.set("crew", state.crew);

    const {MgT2ActorSheet} = await import("../mgt2e/module/sheets/actor-sheet.mjs");
    const {MgT2eActorV2} = await import("../mgt2e/module/sheets/v2/MgT2eActorV2.mjs");

    await t.test("legacy unchanged", async () => {
        renders = 0;
        await MgT2ActorSheet.prototype._runCrewAction.call({}, state.actor, "crew", "role", "action");
        assert.equal(renders, 1);
    });

    await t.test("V2 role action stale", async () => {
        renders = 0;
        const beforeWarnings = warnings.length;
        globalThis.foundry.applications.api.DialogV2.wait = async () => {
            state.action.dm = "2";
            return "mount";
        };
        await MgT2eActorV2.DEFAULT_OPTIONS.actions.roleAction.call(
            {document: state.actor},
            {target: {dataset: {}}},
            {dataset: {crewId: "crew", roleId: "role", actionId: "action"}}
        );
        assert.equal(renders, 0);
        assert.deepEqual(warnings.slice(beforeWarnings), ["MGT2.Error.WeaponActionChanged"]);
        state.action.dm = "0";
    });

    await t.test("V2 direct unchanged", async () => {
        renders = 0;
        state.action.weapon = "mount";
        globalThis.foundry.applications.api.DialogV2.wait = async () => {
            assert.fail("valid direct row opened chooser");
        };
        await MgT2eActorV2.DEFAULT_OPTIONS.actions.attack.call(
            {document: state.actor},
            {target: {dataset: {}}},
            {dataset: {
                itemId: "weapon", mountId: "mount", actorId: "crew",
                roleId: "role", actionId: "action", dm: "0"
            }}
        );
        assert.equal(renders, 1);
        state.action.weapon = "";
    });

    await t.test("V2 direct cancellation remains silent", async () => {
        renders = 0;
        const beforeWarnings = warnings.length;
        state.action.weapon = "stale";
        globalThis.foundry.applications.api.DialogV2.wait = async () => null;
        await MgT2eActorV2.DEFAULT_OPTIONS.actions.attack.call(
            {document: state.actor},
            {target: {dataset: {}}},
            {dataset: {
                itemId: "stale", mountId: "stale", actorId: "crew",
                roleId: "role", actionId: "action", dm: "0"
            }}
        );
        assert.equal(renders, 0);
        assert.deepEqual(warnings.slice(beforeWarnings), []);
        state.action.weapon = "";
    });

    await t.test("V2 direct stale pre-click row aborts", async () => {
        renders = 0;
        const beforeWarnings = warnings.length;
        state.action.weapon = "other";
        await MgT2eActorV2.DEFAULT_OPTIONS.actions.attack.call(
            {document: state.actor},
            {target: {dataset: {}}},
            {dataset: {
                itemId: "weapon", mountId: "mount", actorId: "crew",
                roleId: "role", actionId: "action", dm: "0"
            }}
        );
        assert.equal(renders, 0);
        assert.deepEqual(warnings.slice(beforeWarnings), ["MGT2.Error.WeaponActionChanged"]);
        state.action.weapon = "";
    });

    await t.test("V2 direct stale pre-click DM aborts", async () => {
        renders = 0;
        const beforeWarnings = warnings.length;
        state.action.weapon = "mount";
        state.action.dm = "1";
        await MgT2eActorV2.DEFAULT_OPTIONS.actions.attack.call(
            {document: state.actor},
            {target: {dataset: {}}},
            {dataset: {
                itemId: "weapon", mountId: "mount", actorId: "crew",
                roleId: "role", actionId: "action", dm: "0"
            }}
        );
        assert.equal(renders, 0);
        assert.deepEqual(warnings.slice(beforeWarnings), ["MGT2.Error.WeaponActionChanged"]);
        state.action.weapon = "";
        state.action.dm = "0";
    });
});
