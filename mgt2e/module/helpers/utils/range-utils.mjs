const RANGE_DMS = new Set([1, 0, -2, -4, -99]);

export function normaliseWeaponRange(value) {
    const range = Number(value);
    return Number.isFinite(range) && range > 0 ? range : 0;
}

export function getWeaponRangeUnit(scale) {
    return scale === "vehicle" ? "km" : "m";
}

export function distanceToMetres(distance, unit = "m") {
    if (distance === null || distance === undefined || distance === "") return null;
    const value = Number(distance);
    if (!Number.isFinite(value) || value < 0) return null;
    const normalisedUnit = String(unit).trim().toLowerCase();
    if (["km", "kilometer", "kilometers", "kilometre", "kilometres"].includes(normalisedUnit)) return value * 1000;
    if (["m", "meter", "meters", "metre", "metres"].includes(normalisedUnit)) return value;
    return null;
}

export function getWeaponRangeBands(rangeValue, scale) {
    const medium = normaliseWeaponRange(rangeValue);
    const unit = getWeaponRangeUnit(scale);
    const display = {short: medium / 4, medium, long: medium * 2, extreme: medium * 4};
    return {
        unit,
        display,
        metres: Object.fromEntries(Object.entries(display).map(([band, distance]) => [band, distanceToMetres(distance, unit)]))
    };
}

export function renderWeaponRangeTable(weapon, localize = key => key) {
    const bands = getWeaponRangeBands(weapon?.range, weapon?.scale);
    const {short, medium, long, extreme} = bands.display;
    return `<table><tr><th>${localize("MGT2.Attack.short")} (+1)</th><th>${localize("MGT2.Attack.medium")}</th><th>${localize("MGT2.Attack.long")} (-2)</th><th>${localize("MGT2.Attack.extreme")} (-4)</th></tr>` +
        `<tr><td>${short}${bands.unit}</td><td>${medium}${bands.unit}</td><td>${long}${bands.unit}</td><td>${extreme}${bands.unit}</td></tr></table>`;
}

export function getTargetRangeBand(targetDistanceMetres, bands, {aimed = false, hasScope = false} = {}) {
    const distance = distanceToMetres(targetDistanceMetres);
    if (distance === null || !bands || bands.metres.extreme <= 0 || distance > bands.metres.extreme) return {band: "outOfRange", dm: -99};
    const scopeLimitMetres = bands.unit === "km" ? 1000 : 100;
    if (distance > scopeLimitMetres && (!hasScope || !aimed)) return {band: "extreme", dm: -4, limitedByScope: true};
    if (distance <= bands.metres.short) return {band: "short", dm: 1};
    if (distance <= bands.metres.medium) return {band: "medium", dm: 0};
    if (distance <= bands.metres.long) return {band: "long", dm: -2};
    return {band: "extreme", dm: -4};
}

export function getRangeBandDistance(rangeValue, rangeDM) {
    const range = normaliseWeaponRange(rangeValue);
    switch (Number(rangeDM)) {
        case 1: return {band: "Short", distance: range / 4};
        case 0: return {band: "Medium", distance: range};
        case -2: return {band: "Long", distance: range * 2};
        case -4: return {band: "Extreme", distance: range * 4};
        default: return {band: null, distance: range};
    }
}

function parseRangeDM(value) {
    if (!["number", "string"].includes(typeof value) || (typeof value === "string" && value.trim() === "")) return NaN;
    return Number(value);
}

export function resolveRangeDM(selectedRangeDM, computedRangeDM = 0) {
    const selected = parseRangeDM(selectedRangeDM);
    if (RANGE_DMS.has(selected)) return selected;
    const computed = parseRangeDM(computedRangeDM);
    return RANGE_DMS.has(computed) ? computed : 0;
}

export function formatRangeDMOption(rangeDM) {
    const dm = resolveRangeDM(rangeDM);
    return `${dm >= 0 ? "+" : ""}${dm}`;
}

export function rebindTargetById(targets, targetId) {
    if (!Array.isArray(targets) || targets.length === 0) return undefined;
    if (targetId) {
        const match = targets.find(target => target?.token?.document?._id === targetId);
        if (match) return match;
    }
    return targets[0];
}
