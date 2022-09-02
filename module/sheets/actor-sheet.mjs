
import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {MgT2SkillDialog } from "../helpers/skill-dialog.mjs";
import {MgT2DamageDialog } from "../helpers/damage-dialog.mjs";
import {MgT2AddSkillDialog } from "../helpers/add-skill-dialog.mjs";
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
        return `systems/mgt2/templates/actor/actor-${this.actor.type}-sheet.html`;
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
        const actorData = context.actor.system;
        const type = context.actor.type;
        console.log("getData: ACTOR-SHEET");
        console.log(context.actor);

        // Add the actor's data to context.data for easier access, as well as flags.
        context.data = actorData;
        context.system = actorData;
        context.enrichedDescription = TextEditor.enrichHTML(actorData.description, {async: false});
        context.flags = actorData.flags;

        // Prepare character data and items.
        if (type == 'traveller') {
            this._prepareItems(context);
            //this._prepareCharacterData(context);
        } else if (type === 'npc') {
            this._prepareItems(context);
        } else if (type === 'creature') {
            this._prepareItems(context);
        }

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        // Prepare active effects
        context.effects = prepareActiveEffectCategories(context.actor.effects);

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
        console.log("_prepareCharacterData:");
        let skills = context.data.skills;
        let changed = false;
        for (let skill in skills) {
            if (skills[skill].individual && skills[skill].specialities) {
                for (let s in skills[skill].specialities) {
                    let spec = skills[skill].specialities[s];
                    if (spec.trained && spec.value < 0) {
                        spec.value = 0;
                        changed = true;
                    }
                }
            }
        }
        if (changed) {
            //context.actor.update({"data.skills": skills });
        }
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareItems(context) {
        console.log("actor-sheet.mjs:_prepareItems()");
        // Initialize containers.
        const gear = [];
        const features = [];

        const weapons = [];
        const armour = [];
        const augments = [];
        console.log(context);
        // Iterate through items, allocating to containers
        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === 'item') {
                gear.push(i);
            } else if (i.type === 'weapon') {
                weapons.push(i);
            } else if (i.type === 'armour') {
                armour.push(i);
                this._calculateArmour(context.actor);
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
        console.log("END _prepareItems()");
    }

    _wearArmour(actor, item) {
        console.log(`wearArmour: [${actor.name}] [${item.name}]`)
        const actorData = actor.system;
        const itemData = item.system;

        console.log(actorData);
        console.log(itemData);

        let form = itemData.armour.form;
        console.log(actor.items);
        for (let i of actor.items) {
            console.log(i);
            if (i.system.armour && i.system.armour.worn && i.system.armour.form === form) {
                i.system.armour.worn = 0;
                i.update({"system.armour.worn": 0});
            }
        }
        itemData.armour.worn = 1;
        item.update({"system.armour.worn": 1});
        this._calculateArmour(actor);
    }

    _removeArmour(actor, item) {
        console.log(`wearArmour: [${actor.name}] [${item.name}]`)
        const actorData = actor.system;
        const itemData = item.system;

        itemData.armour.worn = 0;
        item.update({"system.armour.worn": 0});

        this._calculateArmour(actor);
    }

    _calculateArmour(actor) {
        const actorData = actor.system;

        let armour = actorData.armour;
        armour.protection = 0;
        armour.otherProtection = 0;
        armour.otherTypes = "";
        armour.rad = 0;
        armour.archaic = 0;
        for (let i of actor.items) {
            if (i.system.armour) {
                const armourData = i.system.armour;
                if (armourData.worn || armourData.form === "natural") {
                    let armourData = i.system.armour;

                    armour.protection += armourData.protection;
                    armour.otherProtection += armourData.otherProtection;
                    armour.rad += armourData.rad;
                    if (armourData.otherTypes !== "") {
                        armour.otherTypes = armourData.otherTypes;
                    }
                    if (armourData.archaic) {
                        armour.archaic = 1;
                    }
                }
            }
        }
        actor.update({ "data.armour": armour});
    }

    applyActiveEffect() {
        console.log("sheet.applyActiveEffect:");
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
      this._calculateArmour(this.actor);
    });

    html.find('.item-wear').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      this._wearArmour(this.actor, item);
      console.log("worn");
    });

    html.find('.item-unwear').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      this._removeArmour(this.actor, item);
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    //html.find('.rollable').click(this._onRoll.bind(this));
    // Skill rolls.
    html.find('.rollable').click(ev => this._onRollWrapper(ev, this.actor));

    // Add a new skill
    html.find('.addNewSkill').click(ev => this._onAddNewSkill(ev, this.actor));

    // Drag events for macros.
    let handler = ev => this._onDragStart(ev);
    if (this.actor.owner) {
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });

    }
    html.find('div.skill-draggable').each((i, div) => {
      if (div.getAttribute("data-rolltype") === "skill") {
        //console.log(div.getAttribute("data-skill"));
        let options = {};
        options.skill = div.getAttribute("data-skill");
        handler = ev => this._onSkillDragStart(ev, options);
        div.setAttribute("draggable", true);
        div.addEventListener("dragstart", handler, options);
      }
    });
    html.find('div.characteristic-draggable').each((i, div) => {
      if (div.getAttribute("data-rolltype") === "characteristic") {
        //console.log(div.getAttribute("data-skill"));
        let options = {};
        options.cha = div.getAttribute("data-cha");
        handler = ev => this._onCharacteristicDragStart(ev, options);
        div.setAttribute("draggable", true);
        div.addEventListener("dragstart", handler, options);
      }
    });
  }

    _onSkillDragStart(event, options) {
        console.log("_onSkillDragStart:");
        console.log(options);
        let dragData = {
            actorId: this.actor.id,
            sceneId: this.actor.isToken ? canvas.scene?.id : null,
            tokenId: this.actor.isToken ? this.actor.token.id : null
        }
        dragData.data = {
            dragType: "skill",
            skillName: options.skill
        }
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
      }

    _onCharacteristicDragStart(event, options) {
        let dragData = {
            actorId: this.actor.id,
            sceneId: this.actor.isToken ? canvas.scene?.id : null,
            tokenId: this.actor.isToken ? this.actor.token.id : null
        }
        dragData = {
            dragType: "characteristic",
            type: "characteristic",
            characteristic: options.cha
        }
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    async _onDrop(event) {
        console.log("On Drop!");

        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            console.log("Could not parse data");
            return false;
        }

        console.log(data);
        switch (data.type) {
        case "Item":
            return this._onDropItem(event, data);
        case "Actor":
            return this._onDropActor(event, data);
        case "Damage":
            return this._onDropDamage(event, data);
        case "UPP":
            return this._onDropUPP(event, data);
        case "characteristic":
            return this._onDropCharacteristic(event, data);
        }
    }

    async _onDropUPP(event, data) {
        const actor = this.actor;

        if (actor.type === "traveller" || actor.type === "npc") {

            if (actor.system.characteristics) {
                if (data.STR) {
                    actor.system.characteristics.STR.value = parseInt(data.STR);
                }
                if (data.DEX) {
                    actor.system.characteristics.DEX.value = parseInt(data.DEX);
                }
                if (data.END) {
                    actor.system.characteristics.END.value = parseInt(data.END);
                }
                if (data.INT) {
                    actor.system.characteristics.INT.value = parseInt(data.INT);
                }
                if (data.EDU) {
                    actor.system.characteristics.EDU.value = parseInt(data.EDU);
                }
                if (data.SOC) {
                    actor.system.characteristics.SOC.value = parseInt(data.SOC);
                }
                actor.update({ "system.characteristics": actor.system.characteristics});
            }
        }
    }

    async _onDropCharacteristic(event, data) {
        const actor = this.actor;
        let node = event.target;
        let sourceCha = data.characteristic;
        let targetCha = null;
        while (node) {
            if (node.dataset && node.dataset.cha) {
                targetCha = node.dataset.cha;
                break;
            }
            node = node.parentNode;
        }

        if (targetCha && sourceCha && targetCha != sourceCha) {
            let actorData = actor.data.data;
            if (actorData.characteristics[targetCha] && actorData.characteristics[sourceCha]) {
                let swap = actorData.characteristics[targetCha].value;
                actorData.characteristics[targetCha].value = actorData.characteristics[sourceCha].value;
                actorData.characteristics[sourceCha].value = swap;
                actor.update({ "data.characteristics": actorData.characteristics});
            }
        }
  }

    async _onDropDamage(event, data) {
        const damage = data.damage;
        const laser = data.laser;
        const stun = false;
        const ap = data.ap;
        const actor = this.actor;

        new MgT2DamageDialog(actor, damage, ap, laser, stun).render(true);
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
        let name = `New ${type.capitalize()}`;
        if (header.dataset.name) {
            name = header.dataset.name;
        }
        console.log(data);
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };
        if (header.dataset.img) {
            itemData.img = header.dataset.img;
        }
        if (type === "weapon" && header.dataset.skill) {
            itemData.data.weapon = {};
            itemData.data.weapon.skill = header.dataset.skill;
        }
        if (type === "armour" && header.dataset.form) {
            itemData.data.armour = {};
            itemData.data.armour.form = header.dataset.form;
        }
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];

        // Finally, create the item!
        return await Item.create(itemData, {parent: this.actor});
    }

    _onAddNewSkill(event, actor) {
        console.log("onAddNewSkill:");
        new MgT2AddSkillDialog(actor).render(true);
    }

    _onRollWrapper(event, actor) {
        console.log("_onRollWrapper:");

        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        // Handle item rolls.
        if (dataset.rollType) {
            if (dataset.rollType === 'item') {
                const itemId = element.closest('.item').dataset.itemId;
                const item = this.actor.items.get(itemId);
                if (item) return item.roll();
            }
        }

        if (!dataset.roll) {
            return;
        }
        let label = dataset.label ? `[roll] ${dataset.label}` : '';

        const data = actor.system;

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
        let quickRoll = game.settings.get("mgt2", "quickRolls");
        if (event.shiftKey) {
            quickRoll = !quickRoll;
        }

        if (!quickRoll) {
            new MgT2SkillDialog(actor, skill, spec, cha).render(true);
        } else {
            // Roll directly with no options.
            rollSkill(actor, data.skills[skill], speciality, skillDefault, 0, "normal", 8);
        }
    }
}
