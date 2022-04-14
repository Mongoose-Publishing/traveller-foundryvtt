
import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {MgT2SkillDialog } from "../helpers/skill-dialog.mjs";
import {rollSkill} from "../helpers/dice-rolls.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MgT2ActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["mgt2", "sheet", "actor"],
      template: "systems/mgt2/templates/actor/actor-sheet.html",
      width: 720,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
    });
  }

  /** @override */
  get template() {
    return `systems/mgt2/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'traveller') {
        console.log("Actor type is " + actorData.type);
        this._prepareItems(context);
        this._prepareCharacterData(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const features = [];

    const weapons = [];
    const armour = [];
    const augments = [];
    console.log("_prepareItems:");
    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      console.log("Prepare item " + i.name + " of type " + i.type);
      if (i.type === 'item') {
        gear.push(i);
      } else if (i.type === 'weapon') {
          console.log("Adding weapon " + i.name);
          weapons.push(i);
      } else if (i.type === 'armour') {
          armour.push(i);
      } else if (i.type === 'augments') {
          augments.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.weapons = weapons;
    context.armour = armour;
    context.augments = augments;


    context.features = features;
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

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    //html.find('.rollable').click(this._onRoll.bind(this));

    html.find('.rollable').click(ev => this._onRollWrapper(ev, this.actor));

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    html.find(".useCharacteristic").click(ev => this._onUseCharacteristic(ev, this.actor, html));

    html.find(".rollTypeNormal").click(ev => this._onRollTypeChange(ev, this.actor, "normal"));
    html.find(".rollTypeBoon").click(ev => this._onRollTypeChange(ev, this.actor, "boon"));
    html.find(".rollTypeBane").click(ev => this._onRollTypeChange(ev, this.actor, "bane"));

}

  /**
   * Turn the checkboxes for which characteristic to use into zero or one.
   * If one is selected, deselect all the others. If the selected one is
   * selected, then de-select it.
   */
  async _onUseCharacteristic(event, actor, html) {
      const header = event.currentTarget;
      const name = header.name;
      const char = name.replace(/data.characteristics./, "").replace(/.default/, "");
      const value = actor.data.data.characteristics[char].default

      console.log("useCharacteristic " + char);

      const chars = actor.data.data.characteristics;
      for (let ch in chars) {
          chars[ch].default = false;
      }
      html.find(".useCharacteristic").prop("checked", false);
      if (!value) {
        html.find(".use-"+char).prop("checked", true);
        chars[char].default = true;
      }
  }

  async _onRollTypeChange(event, actor, type) {
    actor.data.data.settings.rollType = type;
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  _onRollWrapper(event, actor) {
    console.log("_onRollWrapper:");

    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    if (!dataset.roll) {
      return;
    }
    let label = dataset.label ? `[roll] ${dataset.label}` : '';

    const data = actor.data.data;

    const skill = dataset.skill;
    const spec = dataset.spec;
    const cha = dataset.cha;

    let skillDefault = dataset.cha?dataset.cha:"";
    let speciality = null;

    if (skill) {
      skillDefault = data.skills[skill].default;
      if (data.skills[skill].trained) {
        if (spec) {
          speciality = data.skills[skill].specialities[spec];
        }
      }
    }
    let quickRoll = data.settings.quickRolls?true:false;
    if (event.shiftKey) {
      quickRoll = !quickRoll;
    }

    if (!quickRoll) {
      new MgT2SkillDialog(actor, skill, spec, cha).render(true);
    } else {
      // Roll directly with no options.
      rollSkill(actor, data.skills[skill], speciality, skillDefault, 0, "normal");
    }
}



  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    console.log("_onRoll click event");
    console.log("Button was " + event.button);
    console.log("Shift was " + event.shiftKey);

    if (!dataset.roll) {
      return;
    }
    let label = dataset.label ? `[roll] ${dataset.label}` : '';
    console.log("Roll is " + dataset.roll);
    console.log("Label is " + label);
    console.log("RollType is " + dataset.rolltype);
    console.log("Skill is " + dataset.skill);
    console.log("Spec is " + dataset.spec);
    console.log(dataset);

    const skill = dataset.skill;
    const spec = dataset.spec;


      // Handle rolls that supply the formula directly.
      if (dataset.roll) {
        console.log("Label is " + label);
        console.log("Roll is " + dataset.roll);

        let roller = new Roll(dataset.roll);

        let roll = new Roll(dataset.roll, this.actor.getRollData()).evaluate({async: false});
        if (roll) {
          roll.toMessage({
            speaker: ChatMessage.getSpeaker({actor: this.actor}),
            flavor: label,
            rollMode: game.settings.get('core', 'rollMode'),
          });
        } else {
          console.log("There is no roll");
        }
        return roll;
      }
    }


}
