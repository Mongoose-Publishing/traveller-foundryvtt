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

export async function resolveWeaponMount(actor, requestedId, chooseMount) {
    const mounts = getArmedWeaponMounts(actor);
    const requested = mounts.find(mount => mount.id === requestedId);
    if (requested) return requested.item;
    if (mounts.length === 0) return null;

    const selectedId = await chooseMount(mounts);
    return mounts.find(mount => mount.id === selectedId)?.item ?? null;
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
