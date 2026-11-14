const UNUSABLE_STATUSES = new Set(["INACTIVE", "DAMAGED", "DESTROYED"]);

function itemIsUsable(item) {
    const status = `${item?.system?.status ?? ""}`.toUpperCase();
    if (UNUSABLE_STATUSES.has(status)) return false;
    const quantity = Number(item?.system?.quantity);
    return item?.system?.quantity == null || !Number.isFinite(quantity) || quantity > 0;
}

function weaponIsCompatibleWithMount(mount, weapon) {
    if (weapon?.type !== "weapon" || !weapon.system?.weapon || !itemIsUsable(weapon)) return false;

    // Spacecraft hardware mounts use the same prefix match as the legacy item sheet.
    const hardwareMount = `${mount.system?.hardware?.mount ?? ""}`;
    const weaponMount = `${weapon.system.weapon.mount ?? ""}`;
    if (mount.type === "hardware" && weapon.system.weapon.scale !== "spacecraft") return false;
    if (hardwareMount && weaponMount && !hardwareMount.startsWith(weaponMount)) return false;

    // Vehicle option mounts expose one attached weapon.  Compatibility is enforced
    // when the weapon is attached by the option sheet; retain the exact configured ID.
    return true;
}

function attachedWeapons(actor, mount) {
    const weapons = [];
    if (mount.type === "hardware") {
        for (const [weaponId, attachment] of Object.entries(mount.system?.hardware?.weapons ?? {})) {
            const weapon = actor.items.get(weaponId);
            const quantity = Number(attachment?.quantity);
            if (!Number.isFinite(quantity) || quantity <= 0) continue;
            if (!weaponIsCompatibleWithMount(mount, weapon)) continue;
            weapons.push({item: weapon, quantity});
        }
    } else if (mount.type === "option" && mount.system?.option?.type === "weapon") {
        const configured = mount.system.option.weapon ?? {};
        const quantity = Number(configured.quantity);
        const weapon = actor.items.get(configured.weaponId);
        if (Number.isFinite(quantity) && quantity > 0 && weaponIsCompatibleWithMount(mount, weapon)) {
            weapons.push({item: weapon, quantity});
        }
    }
    return weapons;
}

export function getArmedWeaponMounts(actor) {
    const mounts = [];
    for (const item of actor?.items ?? []) {
        const isHardwareMount = item.type === "hardware" && item.system?.hardware?.system === "weapon";
        const isVehicleMount = item.type === "option" && item.system?.option?.type === "weapon";
        if ((!isHardwareMount && !isVehicleMount) || !itemIsUsable(item)) continue;
        const weapons = attachedWeapons(actor, item);
        if (weapons.length === 0) continue;
        const labels = weapons.map(({item: weapon, quantity}) =>
            quantity > 1 ? `${weapon.name} x${quantity}` : weapon.name
        );
        mounts.push({id: item.id, item, weapons, label: `${item.name} (${labels.join(", ")})`});
    }
    return mounts;
}

export function getMountedWeapon(actor, mount) {
    return getArmedWeaponMounts(actor).find(entry => entry.id === mount?.id)?.weapons[0]?.item ?? null;
}

export function isWeaponMounted(actor, mount, weapon) {
    return getArmedWeaponMounts(actor)
        .find(entry => entry.id === mount?.id)
        ?.weapons.some(entry => entry.item.id === weapon?.id) ?? false;
}

function mountSignature(mount) {
    const weapons = mount.weapons
        .map(({item, quantity}) => ({id: item.id, name: item.name, quantity}));
    return JSON.stringify({id: mount.id, name: mount.item.name, weapons});
}

function crewWeaponActionContext(actor, crewId, roleId, actionId) {
    const assignments = actor.system?.crewed?.crew?.[crewId];
    if (!assignments || !Object.hasOwn(assignments, roleId)) return null;
    const role = actor.items.get(roleId);
    const action = role?.system?.role?.actions?.[actionId];
    if (action?.action !== "weapon") return null;
    return {
        action,
        signature: JSON.stringify({
            crewId,
            roleId,
            actionId,
            type: action.action,
            weapon: action.weapon ?? "",
            dm: action.dm ?? ""
        })
    };
}

function warnWeaponActionChanged() {
    ui.notifications.warn(game.i18n.localize("MGT2.Error.WeaponActionChanged"));
}

function normalizeActionDm(value) {
    return Number.parseInt(value, 10) || 0;
}

export class WeaponMountSelectionChangedError extends Error {
    constructor() {
        super("Weapon mount selection changed while the chooser was open");
        this.name = "WeaponMountSelectionChangedError";
    }
}

export async function resolveWeaponMount(actor, requestedId, chooseMount) {
    const mounts = getArmedWeaponMounts(actor);
    const requested = mounts.find(mount => mount.id === requestedId);
    if (requested) return requested.item;
    if (mounts.length === 0) return null;

    const displayedSignatures = new Map(mounts.map(mount => [mount.id, mountSignature(mount)]));
    const selectedId = await chooseMount(mounts);
    if (!selectedId) return null;

    const displayedSignature = displayedSignatures.get(selectedId);
    if (!displayedSignature) return null;
    const current = getArmedWeaponMounts(actor).find(mount => mount.id === selectedId);
    if (!current || displayedSignature !== mountSignature(current)) {
        throw new WeaponMountSelectionChangedError();
    }
    return current.item;
}

export async function resolveWeaponMountForAttack(actor, requestedId, chooseMount) {
    try {
        return await resolveWeaponMount(actor, requestedId, chooseMount);
    } catch (error) {
        if (!(error instanceof WeaponMountSelectionChangedError)) throw error;
        ui.notifications.warn(game.i18n.localize("MGT2.Error.WeaponMountChanged"));
        return null;
    }
}

export async function executeCrewWeaponAttack({
    actor,
    crewId,
    roleId,
    actionId,
    chooseMount,
    getCrewActor,
    onAttack
}) {
    const initialCrew = getCrewActor(crewId);
    const initialContext = crewWeaponActionContext(actor, crewId, roleId, actionId);
    if (!initialCrew || !initialContext) {
        warnWeaponActionChanged();
        return false;
    }
    if (getArmedWeaponMounts(actor).length === 0) {
        ui.notifications.warn(game.i18n.localize("MGT2.Error.NoWeaponMount"));
        return false;
    }

    const mount = await resolveWeaponMountForAttack(actor, initialContext.action.weapon, chooseMount);
    if (!mount) return false;

    const currentCrew = getCrewActor(crewId);
    const currentContext = crewWeaponActionContext(actor, crewId, roleId, actionId);
    if (!currentCrew || !currentContext || currentContext.signature !== initialContext.signature) {
        warnWeaponActionChanged();
        return false;
    }

    onAttack({crewActor: currentCrew, mount, action: currentContext.action});
    return true;
}

export async function executeV2DirectWeaponAttack({
    actor,
    weaponId,
    mountId,
    crewId,
    roleId,
    actionId,
    actionDm,
    chooseMount,
    getCrewActor,
    onAttack
}) {
    let weapon = actor.items.get(weaponId);
    let mount = actor.items.get(mountId);
    const initialCrew = crewId ? getCrewActor(crewId) : null;
    const initialContext = roleId && actionId
        ? crewWeaponActionContext(actor, crewId, roleId, actionId)
        : null;
    if ((crewId && !initialCrew) || ((roleId || actionId) && !initialContext)) {
        warnWeaponActionChanged();
        return false;
    }
    if (initialContext && (initialContext.action.weapon !== mountId
        || normalizeActionDm(initialContext.action.dm) !== normalizeActionDm(actionDm))) {
        warnWeaponActionChanged();
        return false;
    }

    if (!mount || !weapon || !isWeaponMounted(actor, mount, weapon)) {
        if (getArmedWeaponMounts(actor).length === 0) {
            ui.notifications.warn(game.i18n.localize("MGT2.Error.NoWeaponMount"));
            return false;
        }
        mount = await resolveWeaponMountForAttack(actor, null, chooseMount);
        if (!mount) return false;
        weapon = getMountedWeapon(actor, mount);
        const currentCrew = crewId ? getCrewActor(crewId) : null;
        const currentContext = initialContext
            ? crewWeaponActionContext(actor, crewId, roleId, actionId)
            : null;
        if (!weapon || (crewId && !currentCrew)
            || (initialContext && (!currentContext || currentContext.signature !== initialContext.signature))) {
            warnWeaponActionChanged();
            return false;
        }
        onAttack({crewActor: currentCrew, mount, weapon, dm: actionDm});
        return true;
    }

    onAttack({crewActor: initialCrew, mount, weapon, dm: actionDm});
    return true;
}

export async function chooseWeaponMount(mounts) {
    const selectedId = await foundry.applications.api.DialogV2.wait({
        window: {title: game.i18n.localize("MGT2.WeaponMount.SelectTitle")},
        content: `<p>${game.i18n.localize("MGT2.WeaponMount.SelectHint")}</p>`,
        buttons: [
            ...mounts.map(mount => ({
                action: mount.id,
                label: mount.label,
                icon: "fa-solid fa-crosshairs",
                default: mounts.length === 1
            })),
            {action: "cancel", label: game.i18n.localize("Cancel"), icon: "fa-solid fa-xmark"}
        ],
        close: () => null
    });
    return selectedId === "cancel" ? null : selectedId ?? null;
}
