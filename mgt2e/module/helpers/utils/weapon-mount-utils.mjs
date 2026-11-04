function attachedWeaponLabel(shipActor, mount) {
    const labels = [];
    for (const [weaponId, attachment] of Object.entries(mount.system?.hardware?.weapons ?? {})) {
        const weapon = shipActor.items.get(weaponId);
        if (!weapon) continue;
        const quantity = Number(attachment?.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) continue;
        const status = `${weapon.system?.status ?? ""}`.toUpperCase();
        if (["INACTIVE", "DISABLED", "DAMAGED", "DESTROYED"].includes(status)) continue;
        labels.push(quantity > 1 ? `${weapon.name} x${quantity}` : weapon.name);
    }
    return labels;
}

export function getArmedWeaponMounts(shipActor) {
    const mounts = [];
    for (const item of shipActor?.items ?? []) {
        if (item.type !== "hardware" || item.system?.hardware?.system !== "weapon") continue;
        const status = `${item.system?.status ?? ""}`.toUpperCase();
        if (["INACTIVE", "DISABLED", "DAMAGED", "DESTROYED"].includes(status)) continue;
        const weapons = attachedWeaponLabel(shipActor, item);
        if (weapons.length === 0) continue;
        mounts.push({id: item.id, item, label: `${item.name} (${weapons.join(", ")})`});
    }
    return mounts;
}

export async function resolveWeaponMount(shipActor, requestedId, chooseMount) {
    const mounts = getArmedWeaponMounts(shipActor);
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
    return selectedId ?? null;
}
