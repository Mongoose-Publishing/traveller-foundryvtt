import {onManageActiveEffect} from "../helpers/effects.mjs";
import {rollAttack} from "../helpers/dice-rolls.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MgT2ItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "item"],
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/mgt2/templates/item";
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/item-${this.item.type}-sheet.html`;
    }

  /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve base data structure.
        const context = super.getData();

        // Use a safe clone of the item data for further operations.
        const item = context.item;

        // Retrieve the roll data for TinyMCE editors.
        context.rollData = {};
        let actor = this.object?.parent ?? null;
        if (actor) {
            context.rollData = actor.getRollData();
        }

        console.log(item);

        // Add the actor's data to context.data for easier access, as well as flags.
        context.enrichedDescription = TextEditor.enrichHTML(this.object.system.description, {async: false});
        context.data = item.system;
        context.system = item.system;
        context.flags = item.flags;
        context.effects = item.effects;
        context.effectTypes = CONFIG.MGT2.EFFECTS;

        context.characteristics = game.system.template.Actor.templates.characteristics.characteristics;

        // If this belongs to an actor, the actor might have custom skills, so
        // we need to use the actor's skill list rather than the global one.
        if (context.item.parent) {
            context.skills = context.item.parent.system.skills;
        } else {
            context.skills = game.system.template.Actor.templates.skills.skills;
        }

        return context;
    }

    /* -------------------------------------------- */


    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Render the item sheet for viewing/editing prior to the editable check.
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.sheet.render(true);
        });

        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Active Effect management
        html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.item));

        html.find(".damageDone").click(ev => this._rollDamage(this.item));
    }

    _rollDamage(item) {
        console.log("_rollDamage:");
        rollAttack(null, item, 0, 0);
    }
}
