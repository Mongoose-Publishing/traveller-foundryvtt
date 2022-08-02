import {onManageActiveEffect} from "../helpers/effects.mjs";

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
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item.data;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = itemData.data;
    context.flags = itemData.flags;
    context.effects = itemData.effects;
    context.effectTypes = CONFIG.MGT2.EFFECTS;

    console.log(context.item);

    context.characteristics = game.system.template.Actor.templates.characteristics.characteristics;

    // If this belongs to an actor, the actor might have custom skills, so
    // we need to use the actor's skill list rather than the global one.
    if (context.item.parent) {
      context.skills = context.item.parent.data.data.skills;
    } else {
      context.skills = game.system.template.Actor.templates.skills.skills;
    }

    this._prepareArmour(context);
    this._prepareAugment(context);

    return context;
  }

  _prepareAugment(context) {
    console.log("_prepareAugment: " + context.item.type);
    if (context.item.type === "augment") {
      // This is an actual Augment.
      const item = context.item.data;
      console.log(item);

      if (!item.data.augments || item.data.augments.length === 0) {
        console.log("This has no modifiers");
        item.data.augments = [
          { "type": "", "target": "STR", "value": 0, "active": false }
        ];
      } else if (item.data.augments && item.data.augments.length > 0) {
        console.log("This has some modifiers");
      }
    }
  }

  _prepareArmour(context) {
      // Initialize containers.
      const augments = [];
      if (!context.item.data.data.armour) {
        return;
      }
      console.log("_prepareArmour:");

      let data = context.item.data.data;



      // Assign and return
      context.augments = augments;
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

    /*
    // Add Inventory Item
    if (html.find('.augment-create')) {
      html.find(".augment-create").click(ev => this._onAugmentCreate(ev, this.object.data, html));

      // Delete Inventory Item
      html.find('.augment-delete').click(ev => this._onAugmentDelete(ev, this.object.data, html));
    }
    */
    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.item));
  }

  async _onAugmentCreate(event, item, html) {
    console.log("_onAugmentCreate:");
    if (!item.data.augments) {
      item.data.augments = [];
    }
    let i = Object.keys(item.data.augments).length;
    console.log(i);

    item.data.augments[i] = { "type": "", "target": "STR", "value": 0, "active": false };

    return;
  }

  async _onAugmentDelete(event, item, html) {
    console.log("Delete augment");
    const li = $(event.currentTarget).parents(".aug");
    const aug = li.data("itemId");

    console.log("The aug ID is " + aug);


    delete item.data.augments[aug];

    //item.delete();
    //li.slideUp(200, () => this.render(false));
  }

}
