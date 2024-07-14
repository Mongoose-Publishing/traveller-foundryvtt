/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
    return loadTemplates([
        // Actor partials.
        "systems/mgt2e/templates/actor/parts/actor-items.html",
        "systems/mgt2e/templates/actor/parts/actor-combat.html",
        "systems/mgt2e/templates/actor/parts/actor-status.html",
        "systems/mgt2e/templates/actor/parts/actor-effects.html",
        "systems/mgt2e/templates/actor/parts/actor-skills.html",
        "systems/mgt2e/templates/actor/parts/actor-weapons.html",
        "systems/mgt2e/templates/actor/parts/actor-terms.html",
        "systems/mgt2e/templates/actor/parts/actor-settings.html",
        "systems/mgt2e/templates/actor/parts/actor-starship-crew.html",
        "systems/mgt2e/templates/item/parts/item-general.html",
        "systems/mgt2e/templates/item/parts/item-techLevel.html"
    ]);
};
