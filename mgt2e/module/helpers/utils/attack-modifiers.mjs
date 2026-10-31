export function parseAimingActions(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === "string" && value.trim() === "") return 0;
    if (!["number", "string"].includes(typeof value)) return null;
    const actions = Number(value);
    return Number.isInteger(actions) && actions >= 0 && actions <= 6 ? actions : null;
}

export function isCharacterAimingActor(actor) {
    return ["traveller", "npc"].includes(actor?.type);
}

export function hasAimingAutoConflict(aimingActions, autoOption) {
    const actions = parseAimingActions(aimingActions);
    return actions !== null && actions > 0 && ["burst", "full"].includes(autoOption);
}

export const AIMING_AUTO_WARNING = "Aiming cannot be combined with Burst or Full Auto because both use the Auto trait.";

export function appendAimedModifier(formula, attackOptions = {}, weapon = null, actor = null) {
    const actions = parseAimingActions(attackOptions.aimingActions);
    if (!isCharacterAimingActor(actor)) return formula;
    const range = Number(weapon?.system?.weapon?.range);
    if (!Number.isFinite(range) || range <= 0) return formula;
    if (weapon.system?.weapon?.scale === "spacecraft") return formula;
    if (hasAimingAutoConflict(actions, attackOptions.autoOption)) return formula;
    return actions > 0 ? `${formula} + ${actions}[Aimed]` : formula;
}

export function resetAimingForTargetChange(aimingActions, previousTargetId, nextTargetId) {
    return previousTargetId !== nextTargetId ? 0 : aimingActions;
}
