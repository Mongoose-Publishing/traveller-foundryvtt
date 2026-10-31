function itemStatus(item) {
    return item?.system?.status;
}

export function getArmourSkillPenalty(actor) {
    if (!actor || !actor.system || !actor.items) return 0;
    let required = null;
    const items = typeof actor.items.values === "function" ? actor.items.values() : actor.items;
    for (const item of items) {
        if (item?.type !== "armour" || itemStatus(item) !== "equipped") continue;
        const rawValue = item.system?.armour?.skill;
        if (typeof rawValue !== "number" && typeof rawValue !== "string") continue;
        if (typeof rawValue === "string" && !/^\d+$/.test(rawValue.trim())) continue;
        const value = Number(rawValue);
        if (!Number.isInteger(value) || value < 0) continue;
        required = required === null ? value : Math.max(required, value);
    }
    if (required === null) return 0;
    const skill = actor.system.skills?.vaccsuit;
    if (!skill?.trained) return -3;
    const level = Number(skill.value);
    if (!Number.isFinite(level)) return -3;
    return Math.min(0, level - required);
}

export function appendArmourPenalty(formula, actor) {
    const penalty = typeof actor?.getArmourSkillPenalty === "function"
        ? actor.getArmourSkillPenalty()
        : getArmourSkillPenalty(actor);
    return penalty === 0 ? formula : `${formula} - ${Math.abs(penalty)}[Armour]`;
}

export function buildTacticsInitiativeFormula(tacticsDM, actor) {
    return appendArmourPenalty(`2D6 - 8 + ${tacticsDM}`, actor);
}
