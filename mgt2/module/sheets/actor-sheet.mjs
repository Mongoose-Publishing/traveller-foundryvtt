
import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {MgT2SkillDialog } from "../helpers/skill-dialog.mjs";
import {MgT2XPDialog } from "../helpers/xp-dialog.mjs";
import {MgT2QuantityDialog } from "../helpers/quantity-dialog.mjs";
import {MgT2DamageDialog } from "../helpers/damage-dialog.mjs";
import {MgT2AddSkillDialog } from "../helpers/add-skill-dialog.mjs";
import {MgT2CrewMemberDialog } from "../helpers/crew-member-dialog.mjs";
import {rollSkill} from "../helpers/dice-rolls.mjs";
import {MgT2Item} from "../documents/item.mjs";
import {Tools} from "../helpers/chat/tools.mjs";
import {NpcIdCard} from "../helpers/id-card.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MgT2ActorSheet extends ActorSheet {
    static BEHAVIOUR = [
        "carrionEater", "chaser", "eater", "filter", "gatherer", "grazer",
        "hunter", "hijacker", "intimidator", "killer", "intermittent", "pouncer",
        "reducer", "siren", "trapper"
    ];
    static TRAITS = [
      "alarm", "amphibious", "armour", "bioelectricity", "camouflaged",
        "diseased", "echolocation", "fastMetabolism", "flyer", "heightenedSenses",
        "irVision", "uvVision", "large", "poison", "psionic", "slowMetabolosim",
        "small"
    ];

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

        // Add the actor's data to context.data for easier access, as well as flags.
        context.data = actorData;
        context.system = actorData;
        context.enrichedDescription = TextEditor.enrichHTML(actorData.description, {async: false});
        context.flags = actorData.flags;

        // Prepare character data and items.
        if (type === 'traveller' || type === 'package') {
            this._prepareItems(context);
            let numTerms = context.terms.length;
            let numYears = 0;
            for (let t of context.terms) {
                numYears += parseInt(t.system.term.termLength);
            }
            let year = parseInt(actorData.entryYear) - numYears;
            for (let t of context.terms) {
                t.system.term.startYear = year;
                year += parseInt(t.system.term.termLength);
            }
            actorData.entryAge = parseInt(actorData.startAge) + parseInt(actorData.termLength) * numTerms;
            actorData.birthYear = parseInt(actorData.entryYear) - parseInt(actorData.entryAge);
            if (actorData.settings.autoAge) {
                actorData.sophont.age = parseInt(game.settings.get("mgt2", "currentYear")) - actorData.birthYear;
            }
        } else if (type === 'npc') {
            this._prepareItems(context);
        } else if (type === 'creature') {
            this._prepareItems(context);
        } else if (type === 'spacecraft') {
            this._prepareSpacecraftItems(context);
            this._prepareSpacecraftCrew(context);
        }

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        // Prepare active effects
        context.effects = prepareActiveEffectCategories(context.actor.effects);

        // Work out bonuses and penalties
        if (actorData.modifiers) {
            let enc = actorData.modifiers.encumbrance;
            enc.dm = enc.custom + enc.auto + enc.effect;
            let phy = actorData.modifiers.physical;
            phy.dm = phy.custom + phy.auto + phy.effect;
            let melee = actorData.modifiers.melee;
            melee.dm = melee.custom + melee.auto + melee.effect;
            let guncombat = actorData.modifiers.guncombat;
            if (!guncombat) {
                guncombat = { "dm": 0, "custom": 0, "auto": 0, "effect": 0 };
            } else {
                if (isNaN(guncombat.custom)) {
                    guncombat.custom = 0;
                }
                if (isNaN(guncombat.auto)) {
                    guncombat.auto = 0;
                }
                if (isNaN(guncombat.effect)) {
                    guncombat.effect = 0;
                }
            }
            guncombat.dm = guncombat.custom + guncombat.auto + guncombat.effect;
        } else {
            actorData.modifiers = {
                encumbrance: { custom: 0, auto: 0, effect: 0, dm: 0, multiplierBonus: 0 },
                physical: { custom: 0, auto: 0, effect: 0, dm: 0 },
                melee: { custom: 0, auto: 0, effect: 0, dm: 0 },
                guncombat: { custom: 0, auto: 0, effect: 0, dm: 0 }
            };
        }
        return context;
    }

    /**
     * Similar to prepareItems, but optimised for spacecraft.
     * Spacecraft have a locker, which has standard items in it.
     * They have cargo, which is freight being transported for sale.
     * They have hardware, which is ship systems.
     * @param context
     * @private
     */
    _prepareSpacecraftItems(context) {
        const actorData = context.actor.system;
        const cargo = [];
        const locker = [];
        const hardware = [];
        const roles = [];
        const shipWeapons = [];
        let cargoUsed = 0;
        let dtonsUsed = 0;
        let powerTotal = 0;
        let powerUsed = parseInt(actorData.spacecraft.dtons) * 0.2;

        let hits = parseInt(actorData.spacecraft.dtons) / 2.5;
        if (actorData.spacecraft.dtons >= 100000) {
            hits = parseInt(actorData.spacecraft.dtons / 1.5);
        } else if (actorData.spacecraft.dtons >= 25000) {
            hits = parseInt(actorData.spacecraft.dtons / 2);
        }
        if (hits !== actorData.hits.max) {
            actorData.hits.max = hits;
            actorData.hits.value = hits - actorData.hits.damage;
        }

        actorData.spacecraft.mdrive = 0;
        actorData.spacecraft.rdrive = 0;
        actorData.spacecraft.jdrive = 0;

        for (let i of context.items) {
            if (i.type === 'cargo') {
                cargo.push(i);
                let q = parseInt(i.system.quantity);
                if (q > 0) {
                    cargoUsed += q;
                }
            } else if (i.type === "role") {
                roles.push(i);
            } else if (i.type === 'hardware') {
                hardware.push(i);
                let h = i.system.hardware;
                let t = parseFloat(h.tons);
                let rating = parseInt(h.rating);
                console.log(i.name);

                if (h.system === "power") {
                    powerTotal += parseFloat(h.powerPerTon) * t;
                } else {
                    if (parseFloat(h.power) > 0) {
                        powerUsed += parseFloat(h.power);
                    } else if (parseFloat(h.powerPerTon) > 0) {
                        powerUsed += parseFloat(h.powerPerTon) * t;
                    }
                }

                if (h.system === "armour") {
                    t = (rating * h.tonnage.percent * parseInt(context.system.spacecraft.dtons)) / 100;
                    let conf = context.system.spacecraft.configuration;
                    if (conf === "streamlined") {
                        t *= 1.2;
                    } else if (conf === "sphere") {
                        t *= 0.9;
                    } else if (conf === "close") {
                        t *= 1.5;
                    } else if (conf === "dispersed") {
                        t *= 2;
                    }
                    context.system.spacecraft.armour = rating;
                    i.system.hardware.tons = t;
                    //i.update({"system.hardware.tons": t });
                } else if (h.system === "fuel") {
                    t = rating;
                    console.log("Fuel is " + t);
                    context.system.spacecraft.fuel.max = rating;
                } else {
                    if (t === 0) {
                        t = parseFloat(h.tonnage.percent);
                        t = (t * parseInt(context.system.spacecraft.dtons)) / 100;
                        t += parseInt(h.tonnage.tons);
                    }
                    if (t < parseInt(h.tonnage.minimum)) {
                        t = parseInt(h.tonnage.minimum);
                    }
                    if (t !== i.system.hardware.tons) {
                        i.system.hardware.tons = t * i.system.quantity;
                        console.log(i);
                    }
                }
                dtonsUsed += t * i.system.quantity;

                if (h.system === "j-drive") {
                    context.system.spacecraft.jdrive = parseInt(h.rating);
                }
                if (h.system === "m-drive") {
                    context.system.spacecraft.mdrive = parseInt(h.rating);
                }
                if (h.system === "r-drive") {
                    context.system.spacecraft.rdrive = parseInt(h.rating);
                }
            } else if (i.type === "weapon" && i.system.weapon.scale === "spacecraft") {
                shipWeapons.push(i);
            } else {
                locker.push(i);
            }
        }
        context.cargo = cargo;
        context.locker = locker;
        context.hardware = hardware;
        context.roles = roles;
        context.shipWeapons = shipWeapons;

        actorData.spacecraft.cargo = parseInt(actorData.spacecraft.dtons) - parseFloat(dtonsUsed);
        context.cargoUsed = cargoUsed;
        context.cargoRemaining = parseFloat(context.system.spacecraft.cargo) - cargoUsed;
        context.dtonsUsed = dtonsUsed;
        context.dtonsRemaining = parseFloat(context.system.spacecraft.dtons) - dtonsUsed;

        actorData.spacecraft.power.max = powerTotal;
        actorData.spacecraft.power.used = powerUsed;
    }

    _prepareSpacecraftCrew(context) {
        const actorData = context.actor.system;
        const crew = [];
        const passengers = [];

        for (let actorId in actorData.crewed.crew) {
            let actor = game.actors.get(actorId);
            if (actor) {
                crew.push(actor);
            }
        }
        for (let actorId in actorData.crewed.passengers) {
            let actor = game.actors.get(actorId);
            if (actor) {
                passengers.push(actor);
            }
        }
        context.crew = crew;
        context.passengers = passengers;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} context The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareItems(context) {
        console.log("actor-sheet.mjs:_prepareItems()");
        // Initialize containers.
        const gear = [];
        const weapons = [];
        const activeWeapons = [];
        const armour = [];
        const terms = [];
        const associates = [];

        let weight = 0;
        let skillNeeded = -3;

        console.log("_prepareItems: " + this.actor.name);
        // Iterate through items, allocating to containers
        for (let i of context.items) {
            i.img = i.img || DEFAULT_TOKEN;

            if (i.system.weight !== undefined) {
                if (i.system.status === MgT2Item.CARRIED) {
                    weight += parseFloat(i.system.weight) * parseFloat(i.system.quantity);
                } else if (i.system.status === MgT2Item.EQUIPPED) {
                    if (i.type === "armour") {
                        if (!i.system.armour.powered || parseInt(i.system.armour.powered) === 0) {
                            weight += parseInt(i.system.weight / 4);
                        }
                        if (i.system.armour.skill && parseInt(i.system.armour.skill) > skillNeeded) {
                            skillNeeded = parseInt(i.system.armour.skill);
                        }
                    } else {
                        weight += parseFloat(i.system.weight) * parseFloat(i.system.quantity);
                    }
                }
            }
            // Append to gear.
            if (i.type === 'weapon') {
                weapons.push(i);
                if (i.system.status === MgT2Item.EQUIPPED) {
                    activeWeapons.push(i);
                }
            } else if (i.type === 'armour') {
                armour.push(i);
                this._calculateArmour(context);
            } else if (i.type === 'term') {
                terms.push(i);
            } else if (i.type === "associate") {
                associates.push(i);
            } else {
                // Everything else.
                gear.push(i);
            }
        }

        this.actor.system.weightCarried = weight;
        this.actor.system.modifiers.encumbrance.auto = 0;

        // Only update the actor if the flag has changed.
        let wasEncumbered = !!this.actor.getFlag("mgt2", "encumbered");
        let wasVaccSuit = !!this.actor.getFlag("mgt2", "vaccSuit");
        let isVaccSuit = false;

        console.log(`wasEncumbered ${wasEncumbered} wasVaccSuit ${wasVaccSuit}`);
        if ( game.settings.get("mgt2", "useEncumbrance")) {
            if (weight > this.actor.system.heavyLoad) {
                this.actor.system.modifiers.encumbrance.auto = -2;
                if (!wasEncumbered) {
                    this.actor.setFlag("mgt2", "encumbered", true);
                }
            } else if (wasEncumbered) {
                this.actor.setFlag("mgt2", "encumbered", false);
            }
        }

        if (skillNeeded >= 0) {
            let vaccSkill = -3;
            let vs = this.actor.system.skills.vaccsuit;
            if (vs && vs.trained) {
                vaccSkill = parseInt(vs.value);
                if (vaccSkill < skillNeeded) {
                    this.actor.system.modifiers.encumbrance.auto -= (skillNeeded - vaccSkill);
                    isVaccSuit = true;
                }
            } else {
                this.actor.system.modifiers.encumbrance.auto += vaccSkill;
                isVaccSuit = true;
            }
        }
        if (isVaccSuit !== wasVaccSuit) {
            if (isVaccSuit) {
                // Causes infinite loop. Why?
                //this.actor.setFlag("mgt2", "vaccSuit", true);
            } else {
                // Causes infinite loop. Why?
                //this.actor.setFlag("mgt2", "vaccSuit", false);
            }
        }

        // Assign and return
        context.gear = gear;
        context.weapons = weapons;
        context.activeWeapons = activeWeapons;
        context.armour = armour;
        context.terms = terms;
        context.associates = associates;
        console.log("END _prepareItems()");
    }

    _setItemStatus(actor, item, status) {
        console.log(`activateItem: [${actor.name}] [${item.name}] to [${status}]`)
        const itemData = item.system;

        if (item.type === "armour") {
            let form = itemData.armour.form;
            if (status === MgT2Item.EQUIPPED) {
                for (let i of actor.items) {
                    if (i.system.armour && i.system.status === MgT2Item.EQUIPPED && i.system.armour.form === form) {
                        i.system.status = MgT2Item.CARRIED;
                        i.update({"system.status": MgT2Item.CARRIED });
                    }
                }
            }
        }
        const isActive = (status === MgT2Item.EQUIPPED);

        itemData.status = status;
        item.update({ "system.status": status });
    }

    _calculateArmour(context) {
        const actorData = context.system;

        if (context.actor && (context.actor.type === 'traveller' || context.actor.type === 'npc' || context.actor.type === 'creature')) {
            let armour = actorData.armour;
            if (!armour) {
                armour = {
                    'protection': 0,
                    'otherProtection': 0,
                    'otherTypes': "",
                    'rad': 0,
                    'archaic': 0,
                    'name': null
                }
                actorData.armour = armour;
            }
            armour.protection = 0;
            armour.otherProtection = 0;
            armour.otherTypes = "";
            armour.rad = 0;
            armour.archaic = 0;
            armour.name = null;
            for (let i of context.items) {
                if (i.system.armour) {
                    const armourData = i.system.armour;
                    if (armourData.form === "natural" || i.system.status === MgT2Item.EQUIPPED) {
                        let armourData = i.system.armour;
                        let used = false;

                        // Handle standard protection
                        let prot = armourData.protection;

                        if (prot === "") {
                            // Nothing to do.
                        } else if (!isNaN(prot)) {
                            armour.protection += parseInt(prot);
                            used = true;
                        } else {
                            // Not a number, so might be a formula.
                            let roll = new Roll(prot, context.actor.getRollData()).evaluate({async: false});
                            prot = roll.total;
                            armour.protection += prot;
                            used = true;
                        }

                        // Handle energy protection.
                        let other = armourData.otherProtection;
                        if (other === "") {
                            // Nothing to do.
                        } else if (!isNaN(other)) {
                            armour.otherProtection += parseInt(other);
                            used = true;
                        } else {
                            // Other protection is not a number, so might be a formula.
                            let roll = new Roll(other, context.actor.getRollData()).evaluate({async: false});
                            other = roll.total;
                            armour.otherProtection += other;
                            used = true;
                        }

                        armour.rad += armourData.rad;
                        if (armourData.otherTypes !== "") {
                            armour.otherTypes = armourData.otherTypes;
                        }
                        if (armourData.archaic) {
                            armour.archaic = 1;
                        }

                        if (used) {
                            if (armour.name) {
                                armour.name = armour.name + "; " + i.name;
                            } else {
                                armour.name = i.name;
                            }
                        }
                    }
                }
            }
            if (context.actor) {
                context.actor.update({"system.armour": armour});
            }
        }
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

        // Skill rolls.
        // Anyone who can see the skills should be able to roll them.
        html.find('.rollable').click(ev => this._onRollWrapper(ev, this.actor));

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

        html.find('.item-reload').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            this._reloadWeapon(item);
        });

        html.find('.item-activate').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            this._setItemStatus(this.actor, item, MgT2Item.EQUIPPED);
        });
        html.find('.item-deactivate').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            this._setItemStatus(this.actor, item, MgT2Item.CARRIED);
        });
        html.find('.item-store').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            this._setItemStatus(this.actor, item, MgT2Item.OWNED);
        });
        html.find('.item-carry').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            this._setItemStatus(this.actor, item, MgT2Item.CARRIED);
        });

        html.find('.crew-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".actor-crew");
            const actorId = li.data("actorId");
            this.actor.update({[`system.crewed.crew.-=${actorId}`]: null});
        });

        html.find('.embedded-actor-portrait').click(ev => {
           const actorId = $(ev.currentTarget).data("actorId");
           game.actors.get(actorId).sheet.render(true);
        });

        html.find('.crew-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".actor-crew");
            const actorId = li.data("actorId");
            const crew = game.actors.get(actorId);
            new MgT2CrewMemberDialog(crew, this.actor).render(true);

        });

        html.find('.passenger-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".actor-crew");
            const actorId = li.data("actorId");
            this.actor.update({[`system.crewed.passengers.-=${actorId}`]: null});
        });

        html.find('.crew-passenger').click(ev => {
            const li = $(ev.currentTarget).parents(".actor-crew");
            const actorId = li.data("actorId");
            this._moveCrewToPassenger(this.actor, actorId);
        });

        html.find('.passenger-crew').click(ev => {
            const li = $(ev.currentTarget).parents(".actor-crew");
            const actorId = li.data("actorId");
            console.log(`Passenger to crew for ${actorId}`);
            this._movePassengerToCrew(this.actor, actorId);
        });

        html.find('.role-action-button').click(ev => {
           const div = $(ev.currentTarget);
           const actorId = div.data("crewId");
           const roleId = div.data("roleId");
           const actionId = div.data("actionId");
           console.log(actorId + ", " + roleId + ", " + actionId);
           this._runCrewAction(this.actor, actorId, roleId, actionId);
        });

        // Dodge reaction
        html.find('.dodgeRoll').click(ev => {
            this._rollDodge(ev, this.actor);
        });
        html.find('.statusReaction').click(ev => {
            this._clearDodge(this.actor);
        });
        html.find('.statusStunned').click(ev => {
            this._clearStunned(this.actor);
        });
        html.find('.statusFatigued').click(ev => {
            this._clearStatus(this.actor, "fatigued");
        });
        html.find('.statusHighGravity').click(ev => {
           this._clearStatus(this.actor, 'highGravity');
        });
        html.find('.statusLowGravity').click(ev => {
            this._clearStatus(this.actor, 'lowGravity');
        });
        html.find('.statusZeroGravity').click(ev => {
            this._clearStatus(this.actor, 'zeroGravity');
        });
        html.find('.statusDiseased').click(ev => {
            this._clearStatus(this.actor, 'diseased');
        });
        html.find('.statusPoisoned').click(ev => {
            this._clearStatus(this.actor, 'poisoned');
        });
        html.find('.statusUnconscious').click(ev => {
            this._clearStatus(this.actor, 'unconscious');
        });
        html.find('.statusDisabled').click(ev => {
            this._clearStatus(this.actor, 'disabled');
        });
        html.find('.statusDead').click(ev => {
            this._clearStatus(this.actor, 'dead');
        });
        html.find('initRoll').click(ev => {
            this._initRoll(this.actor);
        });
        html.find('.showIdCard').click(ev => {
            new NpcIdCard(this.actor).render(true);
        });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));


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
    html.find('li.item').each((i, li) => {
        let options = {};
        handler = ev => this._onDragStart(ev);
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, options);
    });
  }

    _rollDodge(event, actor) {
        let dodge = 0;
        const dex = Math.max(0, parseInt(actor.system["DEX"]));
        if (dex > 0) {
            dodge = dex;
        }
        const skill = parseInt(actor.system.skills["athletics"].specialities["dexterity"].value);
        if (skill > 0) {
            dodge += skill;
        }
        if (dodge > 0) {
            let current = actor.getFlag("mgt2", "reaction");
            if (!current) current = 0;

            actor.setFlag("mgt2", "reaction", parseInt(current) - 1);
        }
    }

    _clearDodge(actor) {
        actor.unsetFlag("mgt2", "reaction");
    }

    _clearDead(actor) {
        //actor.system.status.woundLevel = Math.min(actor.system.status.woundLevel, 3);
        //actor.update({"system.status": actor.system.status });
    }

    async _clearStunned(actor) {
        // Unsetting two flags in a row seems to cause problems without an 'await'.
        await actor.unsetFlag("mgt2", "stunned");
        await actor.unsetFlag("mgt2", "stunnedRounds");
    }

    _clearStatus(actor, status) {
        actor.unsetFlag("mgt2", status);
    }

    _rollInit(actor) {

    }

    _reloadWeapon(item) {
        if (item.system.weapon) {
            item.system.weapon.ammo = item.system.weapon.magazine;
            item.update({"system.weapon": item.system.weapon});
        }
    }

    async _movePassengerToCrew(actor, actorId) {
        await actor.update({[`system.crewed.passengers.-=${actorId}`]: null});
        await actor.update({[`system.crewed.crew.${actorId}`]: { } });
    }

    async _moveCrewToPassenger(actor, actorId) {
        await actor.update({[`system.crewed.crew.-=${actorId}`]: null});
        await actor.update({[`system.crewed.passengers.${actorId}`]: { "role": "STANDARD"}});
    }

    _runCrewAction(shipActor, actorCrewId, roleId, actionId) {
        const actorCrew = game.actors.get(actorCrewId);
        if (!actorCrew) {
            return;
        }
        const itemRole = shipActor.items.get(roleId);
        if (!itemRole) {
            return;
        }
        const action = itemRole.system.role.actions[actionId];

        if (action.action === "chat") {
            let chatData = {
                user: game.user.id,
                speaker: ChatMessage.getSpeaker(),
                content: `<b>${actorCrew.name} aboard '${shipActor.name}':</b><br/>${action.chat}`
            }
            ChatMessage.create(chatData, {});
        } else if (action.action === "skill") {
            let skill = action.skill.replaceAll(/\..*/g, "");
            let spec = (action.skill.indexOf(".") > 0)?(action.skill.replaceAll(/.*\./g, "")):null;

            new MgT2SkillDialog(actorCrew, skill, spec, null, parseInt(action.dm?action.dm:0)).render(true);
        }
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
            dragType: "characteristic",
            type: "characteristic",
            characteristic: options.cha
        }
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    async _onDrop(event) {
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            console.log("Could not parse data");
            return false;
        }
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
        return true;
    }

    async _onDropActor(event, data) {
        console.log("_onDropActor:");
        let actorId = data.uuid.replace(/Actor\./, "");
        let actor = game.actors.get(actorId);

        if (!actor) {
            return;
        }
        if (this.actor.type === "spacecraft" && (actor.type === "traveller" || actor.type === "npc")) {
            console.log(`Adding new crew member ${actor._id}`);
            if (!this.actor.system.crewed) {
                this.actor.system.crewed = { "crew": {}, "passengers": {}, "roles": [] };
            }
            // this.actor.update(
            //     { key: { roles: ['UNDESIGNATED'] }}
            // );
            this.actor.update({[`system.crewed.passengers.${actor._id}`]: { roles: [ "NONE" ] }});

            // this.actor.system.crewed.crew[actor._id] = {
            //    "roles": [ "UNDESIGNATED" ]
            // };
            // await this.actor.update({"system.crewed": this.actor.system.crewed });
        } else if (actor.type === "package" && (this.actor.type === "traveller" || this.actor.type === "npc")) {
            console.log("Dropping a package " + actor.name);

            for (let c in actor.system.characteristics) {
                if (actor.system.settings.useCustomDice) {
                    // Rather than this being a bonus, it is a new dice roll.
                    if (!actor.system.characteristics[c].show) {
                        this.actor.system.characteristics[c].show = false;
                        continue;
                    }
                    this.actor.system.characteristics[c].show = true;
                    let dice = actor.system.characteristics[c].dice;
                    if (!dice || dice === "") {
                        dice = "2D6";
                    }
                    console.log(c + ": " + dice);
                    let uppRoll = new Roll(dice, null).evaluate({async: false});
                    this.actor.system.characteristics[c].value = uppRoll.total;
                } else {
                    let bonus = parseInt(actor.system.characteristics[c].value);
                    console.log(c + ":" + bonus);
                    if (bonus !== 0) {
                        this.actor.system.characteristics[c].value += bonus;
                        if (this.actor.system.characteristics[c].value < 1) {
                            this.actor.system.characteristics[c].value = 1;
                        }
                    }
                }
            }
            await this.actor.update({ "system.characteristics": this.actor.system.characteristics});

            for (let s in actor.system.skills) {
                let skill = actor.system.skills[s];
                let target = this.actor.system.skills[s];
                if (skill.trained) {
                    target.trained = true;
                    target.value = Math.min(4, parseInt(target.value) + parseInt(skill.value));
                    if (skill.specialities) {
                        for (let sp in skill.specialities) {
                            let spec = skill.specialities[sp];
                            if (target.specialities[sp]) {
                                if (spec.trained) {
                                    target.specialities[sp].trained = true;
                                }
                                target.specialities[sp].value = Math.min(4,
                                    parseInt(target.specialities[sp].value) + parseInt(spec.value));
                                if (spec.boon) {
                                    target.specialities[sp].boon = spec.boon;
                                }
                            } else {
                                target.specialities[sp] = spec;
                            }
                        }
                    }
                }
                if (skill.bonus !== 0) {
                    target.bonus = skill.bonus;
                }
                if (skill.notes && skill.notes !== "") {
                    target.notes = skill.notes;
                }
                if (skill.boon) {
                    target.boon = skill.boon;
                }
            }
            await this.actor.update({ "system.skills": this.actor.system.skills});

            if (actor.system.cash && parseInt(actor.system.cash) > 0) {
                if (this.actor.system.finance) {
                    this.actor.system.finance.cash =
                        parseInt(this.actor.system.finance.cash) + parseInt(actor.system.cash);
                    await this.actor.update({"system.finance": this.actor.system.finance});
                }
            }
            if (this.actor.system.sophont) {
                let isMale = false, isFemale = false;

                if (this.actor.system.sophont.gender) {
                    let gender = this.actor.system.sophont.gender.toLowerCase();
                    if (gender.startsWith("m")) {
                        isMale = true;
                    } else if (gender.startsWith("f")) {
                        isFemale = true;
                    }
                }
                let str = parseInt(this.actor.system.characteristics["STR"].value) - 7;
                let dex = parseInt(this.actor.system.characteristics["DEX"].value) - 7;
                let end = parseInt(this.actor.system.characteristics["END"].value) - 7;

                if (actor.system.sophont.species) {
                    this.actor.system.sophont.species = actor.system.sophont.species;
                }
                if (actor.system.sophont.profession) {
                    this.actor.system.sophont.profession = actor.system.sophont.profession;
                }
                if (actor.system.sophont.weight) {
                    let weight = parseInt(actor.system.sophont.weight);
                    if (weight > 0) {
                        weight += isMale?7:0;
                        weight -= isFemale?7:0;
                        weight += str + parseInt(end/2) - parseInt(dex / 2);
                        this.actor.system.sophont.weight = weight +
                            Math.floor(Math.random() * 6) - Math.floor(Math.random() * 6);
                    }
                }
                if (actor.system.sophont.height) {
                    let height = parseInt(actor.system.sophont.height);
                    if (height > 0) {
                        height += isMale?7:0;
                        height -= isFemale?7:0;
                        height += parseInt(str/2);
                        this.actor.system.sophont.height = height +
                            Math.floor(Math.random()*6) - Math.floor(Math.random()*6);
                    }
                }
                await this.actor.update({"system.sophont": this.actor.system.sophont});
            }

            // Now copy any items across
            for (let item of actor.items) {
                const itemData = {
                    name: item.name,
                    img: item.img,
                    type: item.type,
                    system: deepClone(item.system)
                };
                if (itemData.type === "term" && itemData.system.term.randomTerm) {
                    itemData.system.term.termLength = new Roll("3D6", null).evaluate({async: false}).total;
                }
                await Item.create(itemData, {parent: this.actor});
            }
        }
    }

    /**
     * Override item drop. Need to remove item from source character.
     */
    async _onDropItem(event, data) {
        super._onDropItem(event, data);
        console.log("**** _onDropItem() ****");
        console.log(data);
        if (!data || !data.uuid || data.uuid.indexOf("Actor") !== 0) {
            // This hasn't been dragged from another actor.

            // Is it a non-physical item, such as a Term or Relationship?
            let itemId = data.uuid.replace(/Item\./, "");
            let item = game.items.get(itemId);

            if (item && item.type === "term" && (this.actor.type === "traveller" || this.actor.type === "package")) {
                await this._onDropTerm(item);
            }

            return true;
        }

        if (event.shiftKey) {
            // If shift is held down on drop, copy rather than move.
            return;
        }

        let actor = this.actor;
        let srcActorId = data.uuid.replace(/Actor\.([a-z0-9]*)\..*/gi, "$1");
        let itemId = data.uuid.replace(/Actor\.[a-z0-9]*\.Item\.([a-z0-9]*)/gi, "$1");

        console.log("Trying the drop item stuff");
        if (actor.uuid.indexOf(srcActorId) === -1) {
            console.log("uuid is -1");
            // Move between different actors.
            let srcActor = game.actors.get(srcActorId);
            if (srcActor) {
                console.log("Source actor");
                let item = srcActor.items.get(itemId);

                if (parseInt(item.system.quantity) > 1) {
                    new MgT2QuantityDialog(srcActor, actor, item).render(true);
                } else {
                    srcActor.deleteEmbeddedDocuments("Item", [itemId]);
                    ui.notifications.info(`Moved '${item.name}' from '${srcActor.name}' to '${actor.name}'`);
                }
            }
        }
        return true;
    }

    // Drop a Term onto an Actor. Only applies to Travellers or Packages.
    async _onDropTerm(item) {
        let actor = this.actor;

        console.log(`Dropping term ${item.name} on ${actor.name}`);

        // Need to ensure that this item is added to the end of the list of
        // term items.
        console.log(actor.items);
        let lastSort = 1;
        let countTerms = 0;
        let updates = [];
        for (let i of actor.items) {
            if (i.type === "term") {
                countTerms ++;
                console.log(i.name);
                if (i.sort > lastSort) {
                    lastSort = i.sort;
                }
            }
        }
        /*
        let update = duplicate(item);
        update.system.term.number = countTerms +1;
        update.sort = lastSort + 100;
        update.name = update.name + " " + update.system.term.number;
        console.log(`Dragged in a term item ${update.name} at term ${update.system.term.number} / ${countTerms}`);
        console.log(update);
        await item.update({ "system.term": item.system.term });
//        updates.push(update);
//        actor.updateEmbeddedDocuments("Item", updates);
  //      item.update({ "sort": item.sort, "name": item.name });
*/
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

        if (targetCha && sourceCha && targetCha !== sourceCha) {
            let actorData = actor.system;
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

        if (actor.type === "traveller") {
            new MgT2DamageDialog(actor, damage, ap, laser, stun).render(true);
        } else {
            // NPC, Creature or something else.
            Tools.applyDamageTo(damage, ap, data.tl, data.options, data.traits, actor, null);
        }
    }

    async _onRollTypeChange(event, actor, type) {
        actor.system.settings.rollType = type;
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemCreate(event) {
        console.log("_onItemCreate:");
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
        if (type === "term") {
            let number = 1;
            for (let i of this.actor.items) {
                if (i.type === "term") {
                    number++;
                }
            }

            itemData.name = `New term ${number}`;
            itemData.data.description = "Events, mishaps and promotions.";
            itemData.data.term = {};
            itemData.data.term.number = number;
        }
        if (type === "associate") {
            itemData.name = "Unnamed " + header.dataset.relation;
            itemData.data.associate = {};
            itemData.data.associate.relationship = header.dataset.relation;
            itemData.data.description = this._setAssociate(itemData.data.associate);
        }
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];

        // Finally, create the item!
        return await Item.create(itemData, {parent: this.actor});
    }

    _setAssociate(associate) {
        let affinity = "", enmity = "";

        if (associate.relationship === "contact") {
            affinity = "1d6+1";
            enmity = "1d6-1";
        } else if (associate.relationship === "ally") {
            affinity = "2d6";
            enmity = "0";
        } else if (associate.relationship === "rival") {
            affinity = "1d6-1";
            enmity = "1d6+1";
        } else if (associate.relationship === "enemy") {
            affinity = "0";
            enmity = "2d6";
        } else {
            return "";
        }
        let roll = new Roll(affinity, this.actor.getRollData()).evaluate({async: false});
        associate.affinity = this._getAffinity(roll.total);
        roll = new Roll(enmity, this.actor.getRollData()).evaluate({async: false});
        associate.enmity = 0 - this._getAffinity(roll.total);

        let description = "";
        switch (associate.affinity) {
            case 1:
                description += "Vaguely well inclined. ";
                break;
            case 2:
                description += "Positively inclined. "
                break;
            case 3:
                description += "Very positively inclined. ";
                break;
            case 4:
                description += "Loyal friend. "
                break;
            case 5:
                description += "Love. ";
                break;
            case 6:
                description += "Fanatical. "
                break;
        }
        switch (associate.enmity) {
            case 1:
                description += "Mistrustful. ";
                break;
            case 2:
                description += "Negatively inclined. ";
                break;
            case 3:
                description += "Very negatively inclined. ";
                break;
            case 4:
                description += "Hatred. ";
                break;
            case 5:
                description += "Bitter hatred. ";
                break;
            case 6:
                description += "Blinded by hate. ";
                break;
        }
        roll = new Roll("2D6", this.actor.getRollData()).evaluate({async: false});
        let power = roll.total;
        roll = new Roll("2D6", this.actor.getRollData()).evaluate({async: false});
        let influence = roll.total;

        switch (power) {
            case 2: case 3: case 4: case 5:
                associate.power = 0;
                break;
            case 6: case 7:
                associate.power = 1;
                description += "Weak. ";
                break;
            case 8:
                associate.power = 2;
                description += "Useful. ";
                break;
            case 9:
                associate.power = 3;
                description += "Moderately powerful. "
                break;
            case 10:
                associate.power = 4;
                description += "Powerful. ";
                break;
            case 11:
                associate.power = 5;
                description += "Very Powerful. ";
                break;
            case 12:
                associate.power = 6;
                description += "Major Player. ";
                break;
        }
        switch (influence) {
            case 2: case 3: case 4: case 5:
                associate.influence = 0;
                break;
            case 6: case 7:
                associate.power = 1;
                description += "Little influence. ";
                break;
            case 8:
                associate.power = 2;
                description += "Some Influence. ";
                break;
            case 9:
                associate.power = 3;
                description += "Influential. ";
                break;
            case 10:
                associate.power = 4;
                description += "Highly Influential. ";
                break;
            case 11:
                associate.power = 5;
                description += "Extremely Influential. ";
                break;
            case 12:
                associate.power = 6;
                description += "Kingmaker.";
                break;
        }


        return "<p>" + description + "</p>";
    }

    _getAffinity(affinity) {
        if (affinity <= 2) {
            return 0;
        } else if (affinity <= 4) {
            return 1;
        } else if (affinity <= 6) {
            return 2;
        } else if (affinity <= 8) {
            return 3;
        } else if (affinity <= 10) {
            return 4;
        } else if (affinity === 11) {
            return 5;
        } else {
            return 6;
        }
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
        if (event.ctrlKey) {
            new MgT2XPDialog(actor, skill, spec, cha).render(true);
        } else if (!quickRoll) {
            new MgT2SkillDialog(actor, skill, spec, cha).render(true);
        } else {
            // Roll directly with no options.
            rollSkill(actor, data.skills[skill], speciality, skillDefault, 0, "normal", 8);
        }
    }
}

export class MgT2NPCActorSheet extends MgT2ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "actor"],
            template: "systems/mgt2/templates/actor/actor-sheet.html",
            width: 720,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }
}

export class MgT2CreatureActorSheet extends MgT2ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "actor"],
            template: "systems/mgt2/templates/actor/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }
}
