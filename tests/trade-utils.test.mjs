import assert from "node:assert/strict";
import test from "node:test";
class ApplicationV2 {
    static DEFAULT_OPTIONS = {};
    static PARTS = {};
    render() {}
    close() {}
}

// AppV2 Handlebars mixin (accepts a base class and returns a subclass)
function HandlebarsApplicationMixin(Base) {
    return class extends Base {};
}
globalThis.CONST={ ACTIVE_EFFECT_MODES:{ ADD:2 } };
globalThis.foundry={applications:{api:{ ApplicationV2, HandlebarsApplicationMixin}, handlebars:{renderTemplate:async()=>""},ux:{TextEditor:{enrichHTML:async x=>x}}}};
globalThis.Application = class Application {
    static get defaultOptions() { return {}; }
    render() {}
    close() {}
};
globalThis.window = globalThis;
globalThis.document = {}; // Add if any imported files touch document.*
globalThis.Item = class Item{};

const {distanceBetweenWorlds}=await import(process.env.DODGE_ROLL_MODULE || "../mgt2e/module/helpers/utils/trade-utils.mjs");

function world(name, x, y, sx, sy) {
    return {
        type: "world",
        name: name,
        system: {
            world: {
                location: {
                    x: x,
                    y: y,
                    sectorX: sx,
                    sectorY: sy
                }
            }
        }
    };
}
test("calculate distance between worlds", () => {
    const world1 = world("world1", 1, 1, 0, 0);
    const world2 = world("world2", 1, 2, 0, 0);
    const world3 = world("world3", 2, 2, 0, 0);
    const world4 = world("world4", 32, 40, 0, 0);
    const world5 = world("world5", 1, 1, 1, 1);
    const world6 = world("world6", 0, 40, 0, -1);

    assert.equal(distanceBetweenWorlds(world1, world1), 0, "identity");
    assert.equal(distanceBetweenWorlds(world1, world2), 1, "one below");
    assert.equal(distanceBetweenWorlds(world1, world3), 2, "to the side");
    assert.equal(distanceBetweenWorlds(world4, world5), 1, "sector corner");
    assert.equal(distanceBetweenWorlds(world1, world6), 1, "sector below");
});
