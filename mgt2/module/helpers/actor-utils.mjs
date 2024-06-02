import {MGT2} from "../helpers/config.mjs";


export function isPerson(actor) {
    if (actor && actor.type) {
        if (actor.type === "traveller" || actor.type === "npc") {
            return true;
        }
    }
    return false;
}

export function isCharacter(actor) {
    if (actor && actor.type) {
        if (actor.type === "traveller" || actor.type === "npc" || actor.type === "creature") {
            return true;
        }
    }
    return false;
}

function prepPersonStatus(actor) {
    let data = actor.system;
    let isTraveller = (actor.type === "traveller");

    let woundLevel = MGT2.STATUS.OKAY;
    let statsDown = 0;
    if (data.characteristics) {
        if (data.characteristics.END.current < 1) {
            statsDown ++;
        }
        if (data.characteristics.STR.current < 1) {
            statsDown ++;
        }
        if (data.characteristics.DEX.current < 1) {
            statsDown ++;
        }
    } else {
        let dmg = data.hits.max - data.hits.value;
        if (dmg >= data.characteristics.END.current) {
            statsDown ++;
        }
        if (dmg >= data.characteristics.END.current *2) {
            statsDown ++;
        }
        if (data.hits.value === 0) {
            statsDown ++;
        }
    }
}

function prepCreatureStatus(actor) {
    let data = actor.system;
}


export function prepStatus(actor) {
    if (isPerson(actor)) {
        prepPersonHealth(actor);
    } else if (actor.type === "creature") {
        prepCreatureHealth(actor);
    }
}
