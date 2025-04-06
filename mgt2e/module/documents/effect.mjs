/**
 * Designed to be part of items, provides bonuses to actors.
 */
import {MgT2Item} from "./item.mjs";

export class MgT2Effect extends ActiveEffect {
    apply(actor, change) {
        if (this.isSuppressed) return null;

        return super.apply(actor, change);
    }

    get isSuppressed() {
        if (this.parent instanceof Item) return this.parent.system.status !== MgT2Item.EQUIPPED;
        return false;
    }

    static onManageActiveEffect(event, owner) {
        event.preventDefault();
        const a = event.currentTarget;

        const li = a.closest("li");
        const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
        switch ( a.dataset.action ) {
            case "create":
                return owner.createEmbeddedDocuments("ActiveEffect", [{
                    label: game.i18n.localize("MGT2.Effects.Create"),
                    icon: "icons/svg/aura.svg",
                    origin: owner.uuid,
                    isSuppressed: false,
                    isTemporary: false,
                    "type": "none",
                    "target": "DEX",
                    "value": 0,
                    disabled: true
                }]);
            case "edit":
                return effect.sheet.render(true);
            case "delete":
                return effect.delete();
            case "toggle":
                return effect.update({disabled: !effect.data.disabled});
        }

    }
}
