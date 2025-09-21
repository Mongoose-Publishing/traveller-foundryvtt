/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
 export function onManageActiveEffect(event, owner) {
    event.preventDefault();
    const a = event.currentTarget;
    const action = a?.dataset?.effecttype ? a.dataset.effecttype : null;

    console.log("onManageActiveEffect: " + action);

    if (action) {
        let eff = CONFIG.MGT2.EFFECTS[action];
        if (eff) {
            return owner.createEmbeddedDocuments("ActiveEffect", [{
                label: game.i18n.localize("MGT2.Effects.Type." + action),
                name: game.i18n.localize("MGT2.Effects.Type." + action),
                icon: "icons/svg/aura.svg",
                origin: owner.uuid,
                disabled: false,
                system: {
                    augmentType: action
                },
                flags: { "augmentType": action }
            }]);
        }
    }


    const li = a.closest("li");
    const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
    switch ( a.dataset.action ) {
        case "edit":
          return effect.sheet.render(true);
        case "delete":
          return effect.delete();
        case "toggle":
          return effect.update({disabled: !effect.data.disabled});
    }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(actor, effects) {
    // Define effect header categories
    const categories = {
      temporary: {
        type: "temporary",
        label: "Temporary Effects",
        name: "Temporary Effects",
        effects: []
      },
      passive: {
        type: "passive",
        label: "Passive Effects",
        name: "Passive Effects",
        effects: []
      },
      inactive: {
        type: "inactive",
        label: "Inactive Effects",
        name: "Inactive Effects",
        effects: []
      }
    };

    // Iterate over active effects, classifying them into categories
    for ( let e of actor.allApplicableEffects() ) {
      //e._getSourceName(); // Trigger a lookup for the source name
      if ( e.disabled ) categories.inactive.effects.push(e);
      else if ( e.isTemporary ) categories.temporary.effects.push(e);
      else categories.passive.effects.push(e);
    }
    return categories;
}
