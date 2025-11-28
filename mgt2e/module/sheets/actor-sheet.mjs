
import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {MgT2SkillDialog } from "../helpers/skill-dialog.mjs";
import {MgT2XPDialog } from "../helpers/xp-dialog.mjs";
import {MgT2QuantityDialog } from "../helpers/quantity-dialog.mjs";
import {MgT2ChaDialog } from "../helpers/cha-dialog.mjs";
import {MgT2DamageDialog } from "../helpers/damage-dialog.mjs";
import {MgT2AddSkillDialog } from "../helpers/add-skill-dialog.mjs";
import {MgT2CrewMemberDialog } from "../helpers/crew-member-dialog.mjs";
import {MgT2SpacecraftAttackDialog } from "../helpers/spacecraft-attack-dialog.mjs";
import {MgT2SpacecraftRepairDialog } from "../helpers/spacecraft-repair-dialog.mjs";
import {rollSkill} from "../helpers/dice-rolls.mjs";
import {skillLabel} from "../helpers/dice-rolls.mjs";
import {MgT2Item} from "../documents/item.mjs";
import {Tools} from "../helpers/chat/tools.mjs";
import { MGT2 } from "../helpers/config.mjs";
import {NpcIdCard} from "../helpers/id-card.mjs";
import {randomiseAssociate} from "../helpers/utils/character-utils.mjs";
import {
    buyCargoDialog, embarkPassengerDialog,
    fuelCost,
    sellCargoDialog
} from "../helpers/spacecraft/spacecraft-utils.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MgT2ActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "actor"],
            template: "systems/mgt2e/templates/actor/actor-sheet.html",
            width: 720,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }

    /** @override */
    get template() {
        return `systems/mgt2e/templates/actor/actor-${this.actor.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    async getData() {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the actor object, the data object, whether it's
        // editable, the items array, and the effects array.
        const context = super.getData();

        // Use a safe clone of the actor data for further operations.
        const actorData = context.actor.system;
        const type = context.actor.type;

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = actorData;
        context.enrichedDescription = await TextEditor.enrichHTML(
            actorData.description,
            { secrets: ((context.actor.permission > 2)?true:false) }
        );
        context.flags = actorData.flags;
        context.currentYear = game.settings.get("mgt2e", "currentYear");

        // Prepare character data and items.
        if (type === 'traveller' || type === 'package') {
            this._prepareItems(context);
            let numTerms = context.terms.length;
            let numYears = 0;
            for (let t of context.terms) {
                if (t.system.term?.termLength) {
                    numYears += parseInt(t.system.term.termLength);
                } else if (!t.system.term) {
                    t.system.term = {
                        termLength: 4
                    }
                    numYears += 4;
                }
            }
            let year = parseInt(actorData.entryYear) - numYears;
            for (let t of context.terms) {
                if (t.system.term?.startYear) {
                    t.system.term.startYear = year;
                    year += parseInt(t.system.term.termLength);
                }
            }
            actorData.entryAge = parseInt(actorData.startAge) + numYears;
            actorData.birthYear = parseInt(actorData.entryYear) - parseInt(actorData.entryAge);
            if (actorData.settings.autoAge) {
                actorData.sophont.age = parseInt(game.settings.get("mgt2e", "currentYear")) - actorData.birthYear;
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
        context.effects = prepareActiveEffectCategories(context.actor, context.actor.effects);

        // Work out bonuses and penalties
        if (["npc", "traveller"].includes(type) && actorData.modifiers) {
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
        }

        context.selectColumns = {
            "3": "3 columns",
            "4": "4 columns",
            "6": "6 columns"
        }

        if (type === "creature") {
            context.behaviours = {};
            context.behaviours[""] = "";
            context.haveBehaviours = {};
            for (let b in CONFIG.MGT2.CREATURES.behaviours) {
                if (actorData.behaviour.indexOf(b) === -1) {
                    context.behaviours[b] = game.i18n.localize("MGT2.Creature.Behaviour." + b);
                } else {
                    context.haveBehaviours[b] = {
                        "label": game.i18n.localize("MGT2.Creature.Behaviour." + b),
                        "title": game.i18n.localize("MGT2.Creature.BehaviourText." + b)
                    }
                }
            }
            context.traits = {};
            context.traits[""] = "";
            for (let t in CONFIG.MGT2.CREATURES.traits) {
                if (actorData.traits.indexOf(t) === -1) {
                    if (!CONFIG.MGT2.CREATURES.traits[t].conflict ||
                        actorData.traits.indexOf(CONFIG.MGT2.CREATURES.traits[t].conflict) === -1) {
                        context.traits[t] = game.i18n.localize("MGT2.Creature.Trait." + t);
                    }
                }
            }
            if (CONFIG.MGT2.CREATURES.sizes[actorData.size]) {
                context.suggestedHits = game.i18n.format("MGT2.TravellerSheet.SizeRecommendedHits",
                    {
                        "min": CONFIG.MGT2.CREATURES.sizes[actorData.size].minHits,
                        "max": CONFIG.MGT2.CREATURES.sizes[actorData.size].maxHits
                    });
            } else {
                context.suggestedHits = "";
            }
            context.SIZE_SELECT = [];
            for (let sz=-4; sz <= 6; sz++) {
                let num = `${sz}`;
                let label = CONFIG.MGT2.CREATURES.sizes[num].label;
                context.SIZE_SELECT.push({
                    "id": sz,
                    "value": `${game.i18n.localize("MGT2.TravellerSheet.SizeClass." + label)} (${num})`
                });
            }
        } else if (type === "spacecraft") {
            context.selectShipTL = {};
            for (let tl = 7; tl <= 17; tl++) {
                context.selectShipTL[`${tl}`] = `${tl} - ${game.i18n.localize("MGT2.Item.Tech." + tl)}`;
            }
            context.selectShipConfig = {};
            for (let c in CONFIG.MGT2.SHIP_CONFIGURATION) {
                context.selectShipConfig[c] = game.i18n.localize("MGT2.Spacecraft.Configuration." + c);
            }
            context.selectComputerNodes = {};
            for (let i=0; i < 10; i++) {
                context.selectComputerNodes[i] = "x"+i;
            }
            context.selectSystemTypes = {
                "": "",
                "armour": game.i18n.localize("MGT2.Spacecraft.System.armour"),
                "bridge": game.i18n.localize("MGT2.Spacecraft.System.bridge"),
                "cargo": game.i18n.localize("MGT2.Spacecraft.System.cargo"),
                "common": game.i18n.localize("MGT2.Spacecraft.System.common"),
                "computer": game.i18n.localize("MGT2.Spacecraft.System.computer"),
                "dock": game.i18n.localize("MGT2.Spacecraft.System.dock"),
                "fuel": game.i18n.localize("MGT2.Spacecraft.System.fuel"),
                "general": game.i18n.localize("MGT2.Spacecraft.System.general"),
                "j-drive": game.i18n.localize("MGT2.Spacecraft.System.j-drive"),
                "m-drive": game.i18n.localize("MGT2.Spacecraft.System.m-drive"),
                "r-drive": game.i18n.localize("MGT2.Spacecraft.System.r-drive"),
                "power": game.i18n.localize("MGT2.Spacecraft.System.power"),
                "sensor": game.i18n.localize("MGT2.Spacecraft.System.sensor"),
                "stateroom": game.i18n.localize("MGT2.Spacecraft.System.stateroom"),
                "weapon": game.i18n.localize("MGT2.Spacecraft.System.weapon")
            };
            context.selectRoleTypes = {
                "": "",
                "navigator": game.i18n.localize("MGT2.Role.BuiltIn.Name.Navigator"),
                "broker": game.i18n.localize("MGT2.Role.BuiltIn.Name.Broker"),
                "engineer": game.i18n.localize("MGT2.Role.BuiltIn.Name.Engineer"),
                "gunner": game.i18n.localize("MGT2.Role.BuiltIn.Name.Gunner"),
                "mechanic": game.i18n.localize("MGT2.Role.BuiltIn.Name.Mechanic"),
                "medic": game.i18n.localize("MGT2.Role.BuiltIn.Name.Medic"),
                "pilot": game.i18n.localize("MGT2.Role.BuiltIn.Name.Pilot"),
                "sensors": game.i18n.localize("MGT2.Role.BuiltIn.Name.Sensors"),
                "steward": game.i18n.localize("MGT2.Role.BuiltIn.Name.Steward")
            };

            // Hull Options
            context.selectHullConfig = {
                "": ""
            }
            let hullOptions = actorData.spacecraft.hullOptions;
            for (let o in MGT2.SPACECRAFT_HULLS) {
                if (hullOptions.indexOf(o) >= 0) {
                    continue;
                }
                let option = MGT2.SPACECRAFT_HULLS[o];
                if (option.conflict) {
                    let conflict = false;
                    for (let c of option.conflict) {
                        if (hullOptions.indexOf(c) >= 0) {
                            conflict = true;
                            continue;
                        }
                    }
                    if (conflict) continue;
                }
                context.selectHullConfig[o] = game.i18n.localize("MGT2.Spacecraft.Hull." + o);
            }
        } else if (type === "traveller" || type === "npc" || type === "package") {
            context.selectSize = {
                "-4": "Small -4",
                "-3": "Small -3",
                "-2": "Small -2",
                "-1": "Small -1",
                "0": "0",
                "1": "Large +1",
                "2": "Large +2",
                "3": "Large +3",
                "4": "Large +4",
                "5": "Large +5",
                "6": "Large +6"
            };
            context.CREATE_ITEM_SELECT = {
                "": "",
                "armour": game.i18n.localize("TYPES.Item.armour"),
                "augment": game.i18n.localize("TYPES.Item.augment"),
                "item": game.i18n.localize("TYPES.Item.item"),
                "software": game.i18n.localize("TYPES.Item.software"),
                "weapon": game.i18n.localize("TYPES.Item.weapon")
            }
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
        const software = [];
        const shipWeapons = [];
        const departments = [];
        let bandwidthTotal = 0;
        let bandwidthUsed = 0;
        let cargoUsed = 0;
        let dtonsUsed = 0;
        let powerTotal = 0;
        let powerUsed = parseInt(actorData.spacecraft.dtons) * 0.2;
        let fuelTotal = 0;

        let dtons = parseInt(actorData.spacecraft.dtons);
        let hits = (dtons / 2.5);
        if (dtons >= 100000) {
            hits = (dtons / 1.5);
        } else if (dtons >= 25000) {
            hits = (dtons / 2);
        }
        let options = actorData.spacecraft.hullOptions;
        for (let o of options.split(" ")) {
            if (MGT2.SPACECRAFT_HULLS[o]) {
                let option = MGT2.SPACECRAFT_HULLS[o];
                if (option.hits) {
                    hits *= option.hits;
                }
            }
        }
        let config = null;
        if (actorData.spacecraft.configuration) {
            config = MGT2.SHIP_CONFIGURATION[actorData.spacecraft.configuration];
            if (config) {
                hits = (hits * config.hull);
            }
        }
        hits = parseInt(Math.floor(hits));

        if (hits !== parseInt(actorData.hits.max) && actorData.settings.autoHits) {
            actorData.hits.max = hits;
            actorData.hits.value = hits - actorData.hits.damage;
            context.actor.safeUpdate({"system.hits.max": hits});
        }

        context.fuelRequirements = fuelCost(context.actor);

        let mdrive = 0;
        let rdrive = 0;
        let jdrive = 0;

        context.coreItems = [];
        context.weaponItems = [];
        context.bridgeItems = [];
        context.livingItems = [];
        context.generalItems = [];
        context.cargoItems = [];

        actorData.spacecraft.cargo = 0;
        actorData.spacecraft.armour = config?(config.armourBonus):0;
        for (let i of context.items) {
            if (i.type === 'cargo') {
                cargo.push(i);
                let q = Number(i.system.quantity);
                if (q > 0) {
                    cargoUsed += q;
                }
            } else if (i.type === "role") {
                roles.push(i);
                if (i.system.role.department) {
                    departments.push(i);
                }
            } else if (i.type === "software") {
                software.push(i);
                if (parseInt(i.system.software.bandwidth) > 0 && i.system.status === MgT2Item.RUNNING) {
                    bandwidthUsed += parseInt(i.system.software.bandwidth);
                }
            } else if (i.type === 'hardware') {
                hardware.push(i);
                let h = i.system.hardware;

                if (["computer", "sensor", "bridge"].includes(h.system)) {
                    context.bridgeItems.push(i);
                } else if (["power", "m-drive", "j-drive", "r-drive", "armour", "fuel"].includes(h.system)) {
                    context.coreItems.push(i);
                } else if (["weapon", "defence"].includes(h.system)) {
                    context.weaponItems.push(i);
                } else if (["stateroom", "common"].includes(h.system)) {
                    context.livingItems.push(i);
                } else if (["cargo"].includes(h.system)) {
                    context.cargoItems.push(i);
                } else {
                    context.generalItems.push(i);
                }

                let t = parseFloat(h.tons);
                let rating = parseInt(h.rating);

                // Calculate power if active.
                if (i.system.status === MgT2Item.ACTIVE) {
                    if (h.system === "power") {
                        powerTotal += parseFloat(h.powerPerTon) * t;
                    } else {
                        if (parseFloat(h.power) > 0) {
                            powerUsed += parseFloat(h.power);
                        } else if (parseFloat(h.powerPerTon) > 0) {
                            powerUsed += parseFloat(h.powerPerTon) * t;
                        }
                    }
                    if  (h.system === "computer") {
                        bandwidthTotal += Number(h.rating) * Number(i.system.quantity);
                    }
                }

                if (h.system === "armour") {
                    t = i.system.hardware.tons;
                    context.system.spacecraft.armour += rating;
                } else if (h.system === "fuel") {
                    t = rating;
                    if (i.system.status !== MgT2Item.DESTROYED) {
                        fuelTotal += rating;
                    }
                } else if (h.system === "cargo") {
                    actorData.spacecraft.cargo += parseFloat(i.system.hardware.rating);
                    t = parseFloat(i.system.hardware.rating);
                } else if (h.system === "dock") {
                    if (i.system.hardware.tons === 0) {
                        t = parseFloat(i.system.hardware.rating);
                    }
                } else if (["stateroom", "bridge", "sensor"].includes(h.system)) {
                    // Don't override.
                    //console.log(i);
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
                        i.system.hardware.tons = t * Number(i.system.quantity);
                    }
                }
                //console.log("Tonnage [" + i.name + "]: " + (t * i.system.quantity));
                if (i.system.hardware.armouredBulkhead) {
                    t *= 1.1;
                }
                dtonsUsed += t * i.system.quantity;

                if (h.system === "j-drive" && i.system.status === MgT2Item.ACTIVE) {
                    jdrive = Math.max(jdrive, parseInt(h.rating));
                }
                if (h.system === "m-drive" && i.system.status === MgT2Item.ACTIVE) {
                    if (h.concealedDrive) {
                        mdrive = Math.max(mdrive, parseInt(h.rating / 2));
                    } else {
                        mdrive = Math.max(mdrive, parseInt(h.rating));
                    }
                }
                if (h.system === "r-drive" && i.system.status === MgT2Item.ACTIVE) {
                    rdrive = Math.max(rdrive, parseInt(h.rating));
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
        context.software = software;
        context.roles = roles;
        context.shipWeapons = shipWeapons;
        context.departments = departments;

        for (let o of context.system.spacecraft.hullOptions.split(" ")) {
            if (MGT2.SPACECRAFT_HULLS[o]) {
                let option = MGT2.SPACECRAFT_HULLS[o];
                if (option.tonPc) {
                    dtonsUsed += (context.system.spacecraft.dtons * option.tonPc) / 100;
                }
            }
        }

        context.bandwidthUsed = bandwidthUsed;
        context.dtonsUsed = Math.round(dtonsUsed * 100) / 100;
        context.cargoUsed = Math.round(cargoUsed * 100) / 100;
        context.cargoRemaining = parseFloat(context.system.spacecraft.cargo) - cargoUsed;
        context.dtonsRemaining = Math.floor(context.system.spacecraft.dtons * (config?config.volume:1)) - dtonsUsed;
        context.dtonsRemaining = Number(context.dtonsRemaining.toFixed(3));

        actorData.spacecraft.power.max = powerTotal;
        actorData.spacecraft.power.used = parseFloat(parseFloat(powerUsed).toFixed(2));

        if (context.actor.getFlag("mgt2e", "damage_armour")) {
            let armourDamage = context.actor.getFlag("mgt2e", "damage_armour");
            context.system.spacecraft.armour -= armourDamage;
            context.ARMOUR_STYLE = "damaged";
        } else {
            context.ARMOUR_STYLE = "";
        }

        if (fuelTotal !== actorData.spacecraft.fuel.max) {
            actorData.spacecraft.fuel.max = fuelTotal;
            actorData.spacecraft.fuel.value = Math.min(actorData.spacecraft.fuel.value, fuelTotal);
            context.actor.safeUpdate({"system.spacecraft.fuel": actorData.spacecraft.fuel });
        }
        if (bandwidthTotal !== actorData.spacecraft.processing) {
            actorData.spacecraft.processing = bandwidthTotal;
            context.actor.safeUpdate({"system.spacecraft.processing": bandwidthTotal});
        }

        if (jdrive !== actorData.spacecraft.jdrive) {
            actorData.spacecraft.jdrive = jdrive;
            context.actor.safeUpdate({"system.spacecraft.jdrive": jdrive });
        }
        if (mdrive !== actorData.spacecraft.mdrive) {
            actorData.spacecraft.mdrive = mdrive;
            context.actor.safeUpdate({"system.spacecraft.mdrive": mdrive });
        }
        if (rdrive !== actorData.spacecraft.rdrive) {
            actorData.spacecraft.jdrive = jdrive;
            context.actor.safeUpdate({"system.spacecraft.rdrive": rdrive });
        }
    }

    _prepareSpacecraftCrew(context) {
        const actorData = context.actor.system;
        const crew = [];
        const passengers = [];

        if (!actorData.crewed.selectedDepartment) {
            actorData.crewed.selectedDepartment = "all";
        }
        context.departmentList = {};
        context.departmentList["all"] = "All";
        context.departmentMembers = [];

        for (let r of context.departments) {
            context.departmentList[r._id] = r.name;
        }

        for (let actorId in actorData.crewed.crew) {
            let actor = game.actors.get(actorId);
            if (actor) {
                crew.push(actor);
                let roles = actorData.crewed.crew[actorId];
                if (actorData.crewed.selectedDepartment === "all") {
                    context.departmentMembers.push(actor);
                } else {
                    for (let r in roles) {
                        if (actorData.crewed.selectedDepartment === r) {
                            context.departmentMembers.push(actor);
                            break;
                        }
                    }
                }
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


        const ships = [];
        const vehicles = [];
        for (let actorId in actorData.docks) {
            let actor = game.actors.get(actorId);
            if (actor && actor.type === "spacecraft") {
                ships.push(actor);
            } else if (actor && actor.type === "vehicle") {
                vehicles.push(actor);
            }
        }
        context.dockedShips = ships;
        context.dockedVehicles = vehicles;
    }


    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} context The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareItems(context) {
        // Initialize containers.
        const gear = [];
        const weapons = [];
        const activeWeapons = [];
        const armour = [];
        const terms = [];
        const associates = [];

        let weight = 0;
        let skillNeeded = -3;
        let vs = this.actor.system.skills.vaccsuit;

        // Iterate through items, allocating to containers
        for (let i of context.items) {
            i.img = i.img || MGT2.DEFAULT_ITEM_ICON;
            i.cssStyle = "";

            if (i.system.weight !== undefined) {
                if (i.system.status === MgT2Item.CARRIED) {
                    weight += parseFloat(i.system.weight) * parseFloat(i.system.quantity);
                } else if (i.system.status === MgT2Item.EQUIPPED) {
                    if (i.type === "armour") {
                        if (!i.system.armour.powered || parseInt(i.system.armour.powered) === 0) {
                            weight += parseFloat(i.system.weight / 4);
                        }
                        if (i.system.armour.skill && parseInt(i.system.armour.skill) > skillNeeded) {
                            skillNeeded = parseInt(i.system.armour.skill);
                            if (!vs || !vs.trained || skillNeeded > parseInt(vs.value)) {
                                i.cssStyle = "vaccsuit";
                            }
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
            } else if (i.type === 'term') {
                terms.push(i);
            } else if (i.type === "associate") {
                associates.push(i);
            } else {
                // Everything else.
                gear.push(i);
            }
        }
        this._calculateArmour(context);

        this.actor.system.weightCarried = weight;
        this.actor.system.modifiers.encumbrance.auto = 0;

        // Only update the actor if the flag has changed.
        let wasEncumbered = !!this.actor.getFlag("mgt2e", "encumbered");
        let wasVaccSuit = !!this.actor.getFlag("mgt2e", "vaccSuit");
        let isVaccSuit = false;

        if ( game.settings.get("mgt2e", "useEncumbrance")) {
            if (weight > this.actor.system.heavyLoad) {
                this.actor.system.modifiers.encumbrance.auto = -2;
                if (!wasEncumbered) {
                    this.actor.setFlag("mgt2e", "encumbered", true);
                }
            } else if (wasEncumbered) {
                this.actor.setFlag("mgt2e", "encumbered", false);
            }
        }

        if (skillNeeded >= 0) {
            let vaccSkill = -3;
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
                //this.actor.setFlag("mgt2e", "vaccSuit", true);
            } else {
                // Causes infinite loop. Why?
                //this.actor.setFlag("mgt2e", "vaccSuit", false);
            }
        }

        // Assign and return
        context.gear = gear;
        context.weapons = weapons;
        context.activeWeapons = activeWeapons;
        context.armour = armour;
        context.terms = terms;
        context.associates = associates;
    }

    _setItemStatus(actor, item, status) {
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

    async _calculateArmour(context) {
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
                    'name': null,
                    'tl': 0
                }
                actorData.armour = armour;
            }
            armour.protection = 0;
            armour.otherProtection = 0;
            armour.otherTypes = "";
            armour.rad = 0;
            armour.archaic = 0;
            armour.name = null;
            armour.tl = 0;
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
                            // TODO: What armour needs this?
                            let roll = await new Roll(prot, context.actor.getRollData()).evaluate();
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
                            let roll = await new Roll(other, context.actor.getRollData()).evaluate();
                            other = roll.total;
                            armour.otherProtection += other;
                            used = true;
                        }

                        armour.rad += armourData.rad;
                        if (armourData.otherTypes !== "") {
                            armour.otherTypes = armourData.otherTypes;
                        }
                        if (parseInt(armourData.archaic) === 1) {
                            armour.archaic = 1;
                            armour.tl = i.system.tl;
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
            if (context.actor.system.modifiers.armour?.custom) {
                armour.protection += context.actor.system.modifiers.armour?.custom;
            }
            if (context.actor.system.modifiers.armour?.effect) {
                armour.protection += context.actor.system.modifiers.armour?.effect;
            }
            if (armour.protection > 0 && !armour.name) {
                armour.name = "Protection";
            }
            if (context.actor) {
                context.actor.safeUpdate({"system.armour": armour});
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

        // Read only event.
        html.find('.deck-plan-open').click(ev => {
            const div = $(ev.currentTarget).parents(".deck-plan");
            const idx = div.data("deckId");
            this._openDeckPlan(idx);
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

            if (item && item.type === "role" && item.parent) {
                // Don't allow a role to be deleted if it is in use.
                let parent = item.parent;
                let crew = parent.system.crewed.crew;
                for (let c in parent.system.crewed.crew) {
                    if (crew[c][item._id]) {
                        let actor = game.actors.get(c);
                        ui.notifications.error(
                            game.i18n.format("MGT2.Error.RoleInUse",
                                { "roleName": item.name, "actorName": actor?actor.name:"?" }
                            )
                        );
                        return;
                    }
                }
            } else if (item && item.type === "weapon") {
                let parent = item.parent;
                if (parent && parent.type === "spacecraft" && item.system.weapon.scale === "spacecraft") {
                    // Check to see if item is being used by a weapon mount.
                    for (let i of parent.items) {
                        if (i.type === "hardware" && i.system.hardware.system === "weapon") {
                            let wpns = i.system.hardware.weapons;
                            if (wpns[item._id]) {
                                ui.notifications.error(
                                    game.i18n.format("MGT2.Error.WeaponInUse",
                                        { "wpnName": item.name, "mountName": i.name }
                                    )
                                );
                                return;
                            }
                        }
                    }
                }
            }
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

        html.find('.deck-plan-add').click(ev => {
            this._addDeckPlan(this.actor);
        });

        html.find('.deck-plan-delete').click(ev => {
            const div = $(ev.currentTarget).parents(".deck-plan");
            const idx = div.data("deckId");
            this._removeDeckPlan(idx);
        });

        html.find('.crew-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".actor-crew");
            const actorId = li.data("actorId");
            this._deleteCrewMember(this.actor, actorId);
        });

        html.find('.embedded-actor-portrait').click(ev => {
           const actorId = $(ev.currentTarget).data("actorId");
           game.actors.get(actorId).sheet.render(true);
        });

        html.find('.crew-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".actor-crew");
            const actorId = li.data("actorId");
            const crew = game.actors.get(actorId);
            new MgT2CrewMemberDialog(crew, this.actor, this).render(true);

        });

        html.find('.passenger-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".actor-crew");
            const actorId = li.data("actorId");
            this.actor.update({[`system.crewed.passengers.-=${actorId}`]: null});
        });

        html.find('.crew-passenger').click(ev => {
            const li = $(ev.currentTarget).parents(".actor-crew");
            const actorId = li.data("actorId");
            void this._moveCrewToPassenger(this.actor, actorId);
        });

        html.find('.passenger-crew').click(ev => {
            const li = $(ev.currentTarget).parents(".actor-crew");
            const actorId = li.data("actorId");
            void this._movePassengerToCrew(this.actor, actorId);
        });

        html.find('.role-action-button').click(ev => {
           const div = $(ev.currentTarget);
           const actorId = div.data("crewId");
           const roleId = div.data("roleId");
           const actionId = div.data("actionId");
           void this._runCrewAction(this.actor, actorId, roleId, actionId);
        });

        html.find('.addHardwareSelect').click(ev => {
            const value = $(ev.currentTarget).val();
            this._createHardware(value);
        });
        html.find('.addRoleSelect').click(ev => {
            const value = $(ev.currentTarget).val();
            this._createCrewRole(value);
        });

        // Events that only apply to creatures.
        if (this.actor.type === "creature") {
            html.find('.behaviour-selector').click(ev => {
               const value = $(ev.currentTarget).val();
               void this._creatureSelectBehaviour(value);
            });
            html.find('.behaviour-remove').click(ev => {
                const b = $(ev.currentTarget).parents(".behaviour-item");
                void this._creatureRemoveBehaviour(b.data("behaviourId"));
            });

            html.find('.traits-selector').click(ev => {
                const value = $(ev.currentTarget).val();
                void this._creatureSelectTrait(value);
            });
            html.find('.trait-remove').click(ev => {
                const t = $(ev.currentTarget).parents(".trait-item");
                void this._creatureRemoveTrait(t.data("traitId"));
            });
            html.find('.trait-minus').click(ev => {
                const t = $(ev.currentTarget).parents(".trait-item");
                void this._creatureTraitModify(t.data("traitId"), ev.shiftKey?-5:-1);
            });
            html.find('.trait-plus').click(ev => {
                const t = $(ev.currentTarget).parents(".trait-item");
                void this._creatureTraitModify(t.data("traitId"), ev.shiftKey?5:1);
            });
        } else if (this.actor.type === "spacecraft") {
            // Select which bay to display.
            html.find('.bay-cargo').click(ev => {
               this.actor.system.spacecraft.baySelected = "cargo";
               this.actor.update({"system.spacecraft.baySelected": "cargo"});
            });
            html.find('.bay-ship').click(ev => {
                this.actor.system.spacecraft.baySelected = "ship";
                this.actor.update({"system.spacecraft.baySelected": "ship"});
            });
            html.find('.bay-vehicle').click(ev => {
                this.actor.system.spacecraft.baySelected = "vehicle";
                this.actor.update({"system.spacecraft.baySelected": "vehicle"});
            });

            // Remove spacecraft and vehicles.
            html.find('.docked-delete').click(ev => {
                const li = $(ev.currentTarget).parents(".actor-crew");
                const actorId = li.data("actorId");
                this.actor.update({[`system.docks.-=${actorId}`]: null});
            });
            html.find('.critDel').click(ev => {
                const div = $(ev.currentTarget).parents(".critical");
                const location = div.data("id");
                this.actor.setCriticalLevel(location, 0);
            });
            html.find('.critEffDel').click(ev => {
                const div = $(ev.currentTarget).parents(".critical");
                const location = div.data("id");
                this.actor.fixCriticalEffect(location);
            });

            html.find('.hull-selector').click(ev => {
                const value = $(ev.currentTarget).val();
                void this._spacecraftSelectHullOption(value);
            });

            html.find('.option-remove').click(ev => {
                const o = $(ev.currentTarget).parents(".hull-pill");
                void this._spacecraftRemoveHullOption(o.data("optionId"));
            });

            html.find('.add-finance-data').click(ev => {
               if (!this.actor.system.finance) {
                   this.actor.system.finance = {
                       "cash": 0,
                       "mortage": 0,
                       "totalMortage": 0,
                       "runningCosts": 0
                   }
                   this.actor.update({"system.finance": this.actor.system.finance });
               }
            });

            html.find('.remove-finance-data').click(ev => {
                if (this.actor.system.finance) {
                    this.actor.update({"system.-=finance": null });
                }
            });

            html.find('.add-navy-data').click(ev => {

            });

        } else if (this.actor.type === "traveller" || this.actor.type === "npc") {
            html.find('.roll-upp').click(ev => {
               this.actor.rollUPP({ "shift": ev.shiftKey, "ctrl": ev.ctrlKey });
            });
        }
        html.find('.effect-remove').click(ev => {
            const t = $(ev.currentTarget).parents(".effectPill");
            void this._removeEffect(t.data("effectId"));
        });
        html.find('.addItemSelect').click(ev => {
            const value = $(ev.currentTarget).val();
            this._createEquipmentItem(value);
        });

        html.find('.edit-dmg').click(ev => {
            this._editDamage(ev, this.actor);
        })

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
        html.find('.statusNeedsFirstAid').click(ev => {
            this._clearStatus(this.actor, 'needsFirstAid');
        });
        html.find('.statusNeedsSurgery').click(ev => {
            this._clearStatus(this.actor, 'needsSurgery');
        });
        html.find('.statusProne').click(ev => {
            this._clearStatus(this.actor, 'prone');
        });
        html.find('.statusInCover').click(ev => {
            this._clearStatus(this.actor, 'inCover');
        });
        html.find('initRoll').click(ev => {
            this._rollInit(this.actor);
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

    // Don't have to be owner to manage trade.

    if (this.actor.owner) {
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
    html.find('div.skill-draggable').each((i, div) => {
      if (div.getAttribute("data-rolltype") === "skill") {
        let options = {};
        options.skill = div.getAttribute("data-skill");
        handler = ev => this._onSkillDragStart(ev, options);
        div.setAttribute("draggable", true);
        div.addEventListener("dragstart", handler, options);
      }
    });
    html.find('div.characteristic-draggable').each((i, div) => {
      if (div.getAttribute("data-rolltype") === "characteristic") {
        let options = {};
        options.cha = div.getAttribute("data-cha");
        handler = ev => this._onCharacteristicDragStart(ev, options);
        div.setAttribute("draggable", true);
        div.addEventListener("dragstart", handler, options);
      }
    });
    html.find('img.actor-draggable').each((i, img) => {
        let options = {};
        options.actorId = img.getAttribute("data-actor-id");
        handler = ev => this._onCrewDragStart(ev, options);
        img.setAttribute("draggable", true);
        img.addEventListener("dragstart", handler, options);
    });
    html.find('li.actor-passenger').each((i, li) => {
        let options = {};
        options.actorId = li.getAttribute("data-actor-id");
        options.destinationId = li.getAttribute("data-destination-id");
        if (options.destinationId) {
            handler = ev => this._onCrewDragStart(ev, options);
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, options);
        }
    });
    html.find('li.item').each((i, li) => {
        let options = {};
        handler = ev => this._onDragStart(ev);
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, options);
    });
  }

    async _removeEffect(effectId) {
        console.log("Remove effect " + effectId);
        this.actor.deleteEmbeddedDocuments("ActiveEffect", [ effectId ]);
    }

    async _spacecraftSelectHullOption(selectedOption) {
        console.log(selectedOption);
        if (this.actor.system.spacecraft.hullOptions) {
            this.actor.system.spacecraft.hullOptions += " " + selectedOption;
        } else {
            this.actor.system.spacecraft.hullOptions = selectedOption;
        }
        await this.actor.update({'system.spacecraft.hullOptions': this.actor.system.spacecraft.hullOptions});
    }

    async _spacecraftRemoveHullOption(selectedOption) {
        if (this.actor.system.spacecraft.hullOptions) {
            let o = this.actor.system.spacecraft.hullOptions;
            o = o.replace(selectedOption, "");
            o = o.replace("  ", " ").trim();
            this.actor.system.spacecraft.hullOptions = o;
            await this.actor.update({'system.spacecraft.hullOptions': this.actor.system.spacecraft.hullOptions});
        }
    }

    async _creatureSelectBehaviour(selectedBehaviour) {
        // Creatures can have multiple behaviours.
        if (!selectedBehaviour || selectedBehaviour.length === 0) {
            console.log("BAD");
            return;
        }
        if (this.actor.system.behaviour) {
            this.actor.system.behaviour += " " + selectedBehaviour;
        } else {
            this.actor.system.behaviour = selectedBehaviour;
        }
        await this.actor.update({'system.behaviour': this.actor.system.behaviour });

        // Select skills which this behaviour has associated with it.
        let b = MGT2.CREATURES.behaviours[selectedBehaviour].skills;
        if (!b) return;
        let skills = this.actor.system.skills;
        for (let s in b) {
            let skill = b[s];
            let spec = null;
            if (skill.indexOf(".") > -1) {
                spec = skill.replace(/.*\./, "");
                skill = skill.replace(/\..*/, "");
            }
            if (skills[skill]) {
                skills[skill].trained = true;
                if (spec && skills[skill].specialities && skills[skill].specialities[spec]) {
                    let ss = skills[skill].specialities[spec];
                    if (ss.value < 1) {
                        ss.value = 1;
                    }
                }
            }
        }
        await this.actor.update({'system.skills': this.actor.system.skills});
    }

    async _creatureRemoveBehaviour(removedBehaviour) {
        if (this.actor.system.behaviour) {
            this.actor.system.behaviour = this.actor.system.behaviour.replace(removedBehaviour, "");
            this.actor.system.behaviour = this.actor.system.behaviour.replace("  ", " ");
            await this.actor.update({'system.behaviour': this.actor.system.behaviour });

            // Remove skills associated with this behaviour.
            let b = MGT2.CREATURES.behaviours[removedBehaviour].skills;
            if (!b) return;
            let skills = this.actor.system.skills;
            for (let s in b) {
                let skill = b[s];
                let spec = null;
                if (skill.indexOf(".") > -1) {
                    spec = skill.replace(/.*\./, "");
                    skill = skill.replace(/\..*/, "");
                }
                if (skills[skill]) {
                    if (!spec) {
                        // The simple case.
                        if (skills[skill].trained && skills[skill].value === 0) {
                            skills[skill].trained = false;
                        }
                    } else if (skills[skill].specialities && skills[skill].specialities[spec]) {
                        let ss = skills[skill].specialities[spec];
                        if (ss.value < 2) {
                            ss.value = 0;
                            if (skill.individual) {
                                ss.trained = false;
                            }
                        }
                        // If there are no other specialities defined, untrain the parent skill.
                        let untrainParent = true;
                        for (ss in skills[skill].specialities) {
                            if (skills[skill].specialities[ss].value > 0) {
                                untrainParent = false;
                                break;
                            }
                        }
                        if (untrainParent) {
                            skills[skill].trained = false;
                        }
                    }
                }
            }
            await this.actor.update({'system.skills': this.actor.system.skills});
        }
    }

    async _creatureSelectTrait(selectedTrait) {
        const traitData = MGT2.CREATURES.traits[selectedTrait];
        if (traitData) {
            let traitText = selectedTrait;

            if (traitData.set) {
                if (parseInt(traitData.max) > 0) {
                    traitText += " 1";
                    await this.actor.update({[`system.${traitData.set}`]: 1 });
                } else {
                    traitText += " -1";
                    await this.actor.update({[`system.${traitData.set}`]: -1 });
                }
            } else if (traitData.choices) {
                if (traitData.default) {
                    traitText += ` ${traitData.default}`;
                } else {
                    traitText += ` ${traitData.choices[0]}`;
                }
            } else if (traitData.skills) {
                const skills = this.actor.system.skills;
                for (let s in traitData.skills) {
                    let skill = traitData.skills[s];
                    if (skills[skill.skill]) {
                        skills[skill.skill].bonus = skill.bonus;
                        skills[skill.skill].notes = game.i18n.localize("MGT2.Creature.Trait."+selectedTrait);
                        await this.actor.update({'system.skills': skills});
                    }
                }
            } else if (traitData.value) {
                traitText += ` ${traitData.value}`;
            }
            if (this.actor.system.traits && this.actor.system.traits.length > 0) {
                this.actor.system.traits += ", " + traitText;
            } else {
                this.actor.system.traits = traitText;
            }
        }
        await this.actor.update({'system.traits': this.actor.system.traits });
    }

    async _creatureRemoveTrait(trait) {
        const traitData = MGT2.CREATURES.traits[trait];
        if (traitData) {
            const text = this.actor.getCreatureTrait(trait);
            let reg = new RegExp(`${trait}[^,$]*,?`, "g");
            let traits = this.actor.system.traits.replace(reg, "").replace(/[ ,]*$/g, "");
            await this.actor.update({
                'system.traits': traits
            });
            if (traitData.set) {
                await this.actor.update({
                    [`system.${traitData.set}`]: 0
                });
            } else if (traitData.skills) {
                const skills = this.actor.system.skills;
                for (let s in traitData.skills) {
                    let skill = traitData.skills[s];
                    if (skills[skill.skill]) {
                        skills[skill.skill].bonus = 0;
                        skills[skill.skill].notes = null;
                        await this.actor.update({'system.skills': skills});
                    }
                }
            }
        }
    }

    async _creatureTraitModify(trait, modifier) {
        const traitData = MGT2.CREATURES.traits[trait];
        if (traitData) {
            const text = this.actor.getCreatureTrait(trait);
            if (traitData.set) {
                // Can increment or decrement.
                let value = parseInt(text.replace(/[^-0-9]/g, ""));
                value += parseInt(modifier);
                if (value < parseInt(traitData.min)) {
                    // Too low, don't change.
                } else if (value > parseInt(traitData.max)) {
                    // Too high, don't change.
                } else {
                    // We can change.
                    const updated = trait + " " + value;
                    let traits = this.actor.system.traits;
                    let reg = new RegExp(`${trait}[^,$]*`, "g");
                    await this.actor.update({
                        'system.traits': traits.replace(reg, updated),
                        [`system.${traitData.set}`]: value
                    });
                }
            } else if (traitData.choices) {
                let value = parseInt(text.replace(/[^-0-9]/g, ""));
                value += parseInt(modifier);
                if (value < 0) {
                    // Too low, don't change.
                } else if (value >= traitData.choices.length) {
                    // Too high, don't change.
                } else {
                    // We can change.
                    const updated = trait + " " + value;
                    let traits = this.actor.system.traits;
                    let reg = new RegExp(`${trait}[^,$]*`, "g");
                    await this.actor.update({'system.traits': traits.replace(reg, updated)});
                }
            } else if (traitData.value) {
                let value = parseInt(text.replace(/[^-0-9]/g, ""));
                let min = 1;
                let max = 21;
                if (traitData.min) min = parseInt(traitData.min);
                if (traitData.max) max = parseInt(traitData.max);
                if (Math.abs(modifier) > 1 && Math.abs(value) > 100) {
                    let m = Math.abs(parseInt(Math.log10(value)));
                    console.log(m);
                    modifier = Math.pow(10, m - 1) * Math.sign(modifier);
                    //modifier = Math.abs(parseInt(value / 100) * 10) * Math.sign(modifier);
                    value += modifier;
                    value = parseInt(value / modifier) * modifier;
                    console.log(modifier);
                } else {
                    value += parseInt(modifier);
                }

                if (value < min) {
                    // Too low, don't change.
                } else if (value > max) {
                    // Too high, don't change.
                } else {
                    // We can change.
                    const updated = trait + " " + value;
                    let traits = this.actor.system.traits;
                    let reg = new RegExp(`${trait}[^,$]*`, "g");
                    await this.actor.update({'system.traits': traits.replace(reg, updated)});
                }
            }
        }
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
            let current = actor.getFlag("mgt2e", "reaction");
            if (!current) current = 0;

            actor.setFlag("mgt2e", "reaction", parseInt(current) - 1);
        }
    }

    _clearDodge(actor) {
        actor.unsetFlag("mgt2e", "reaction");
    }

    _clearDead(actor) {
        //actor.system.status.woundLevel = Math.min(actor.system.status.woundLevel, 3);
        //actor.update({"system.status": actor.system.status });
    }

    async _clearStunned(actor) {
        // Unsetting two flags in a row seems to cause problems without an 'await'.
        await actor.unsetFlag("mgt2e", "stunned");
        await actor.unsetFlag("mgt2e", "stunnedRounds");
    }

    _clearStatus(actor, status) {
        actor.unsetFlag("mgt2e", status);
    }

    _rollInit(actor) {
        // Roll initiative and add to combat tracker.
    }

    _reloadWeapon(item) {
        if (item.system.weapon) {
            item.system.weapon.ammo = item.system.weapon.magazine;
            item.update({"system.weapon": item.system.weapon});
        }
    }

    async _deleteCrewMember(actor, actorId) {
        if (Object.keys(actor.system.crewed.crew).length === 1) {
            let crewed = actor.system.crewed;
            crewed.crew = {};
            await actor.update({[`system.crewed`]: crewed});
        } else {
            await actor.update({[`system.crewed.crew.-=${actorId}`]: null});
        }
        console.log(Object.keys(actor.system.crewed.crew).length);
    }

    async _movePassengerToCrew(actor, actorId) {
        await actor.update({[`system.crewed.passengers.-=${actorId}`]: null});
        await actor.update({[`system.crewed.crew.${actorId}`]: { } });
    }

    async _moveCrewToPassenger(actor, actorId) {
        await actor.update({[`system.crewed.crew.-=${actorId}`]: null});
        await actor.update({[`system.crewed.passengers.${actorId}`]: { "role": "STANDARD"}});
    }

    async _runCrewAction(shipActor, actorCrewId, roleId, actionId) {
        console.log("_runCrewAction: " + actorCrewId);
        const actorCrew = game.actors.get(actorCrewId);
        if (!actorCrew) {
            ui.notifications.warn(game.i18n.format("MGT2.Warn.Crew.NoCrewActor", { crewId: actorCrewId}));
            return;
        }
        const itemRole = shipActor.items.get(roleId);
        if (!itemRole) {
            ui.notifications.warn(game.i18n.format("MGT2.Warn.Crew.NoCrewActor", { roleId: roleId}));
            return;
        }
        const action = itemRole.system.role.actions[actionId];

        if (action.action === "chat") {
            console.log(ChatMessage.getSpeaker());
            let chatData = {
                user: game.user.id,
                speaker: {
                    actor: actorCrew._id,
                    alias: game.i18n.format("MGT2.Role.ChatAlias", {
                        "actorName": actorCrew.name, "shipName": shipActor.name
                    }),
                    scene: game.scenes.current.id
                },
                content: `${action.chat}`
            }
            ChatMessage.create(chatData, {});
        } else if (action.action === "skill") {
            let skill = action.skill;
            let cha = action.cha;
            let target = isNaN(action.target)?null:parseInt(action.target);
            let dm = action.dm?action.dm:0;

            if (!skill) {
                return;
            } else if (skill.startsWith("pilot")) {
                if (shipActor.getFlag("mgt2e", "damage_pilotDM")) {
                    dm += parseInt(shipActor.getFlag("mgt2e", "damage_pilotDM"));
                }
            } else if (skill === "engineer.jDrive") {
                if (shipActor.getFlag("mgt2e", "damage_jumpDM")) {
                    dm += parseInt(shipActor.getFlag("mgt2e", "damage_jumpDM"));
                }
            }

            new MgT2SkillDialog(actorCrew, skill, {
                "dm": dm,
                "cha": cha,
                "difficulty": target,
                "text": action.text
            }).render(true);
        } else if (action.action === "weapon") {
            let weaponId = action.weapon;
            let weaponItem = shipActor.items.get(weaponId);
            let dm = parseInt(action.dm);
            console.log(weaponItem);
            new MgT2SpacecraftAttackDialog(shipActor, actorCrew, weaponItem, dm).render(true);
        } else if (action.action === "special") {
            if (action.special === "pilot") {
                let pilotDM = actorCrew.getSkillValue("pilot.spacecraft");
                shipActor.setFlag("mgt2e", "initPilotDM", pilotDM);
                shipActor.setFlag("mgt2e", "initPilotName", actorCrew.name);
            } else if (action.special === "tacticsInit") {
                let tacticsDM = actorCrew.getSkillValue("tactics.naval", { "addcha": true });
                console.log(tacticsDM);
                let roll = await new Roll("2D6 - 8 + " + tacticsDM).evaluate();

                shipActor.setFlag("mgt2e", "initTacticsDM", roll.total);
                shipActor.setFlag("mgt2e", "initTacticsName", actorCrew.name);

                let chatData = {
                    user: game.user.id,
                    speaker: {
                        actor: actorCrew._id,
                        alias: game.i18n.format("MGT2.Role.ChatAlias", {
                            "actorName": actorCrew.name, "shipName": shipActor.name
                        }),
                        scene: game.scenes.current.id
                    },
                    content: `Rolling Tactics (Naval) for ship initiative.`
                }
                ChatMessage.create(chatData, {});

            } else if (action.special === "improveInit") {

            } else if (action.special === "evade") {

            } else if (action.special === "repair") {
                // Open ship repair dialog.
                new MgT2SpacecraftRepairDialog(shipActor, actorCrew).render(true);
            }
        }
    }

    // Add a new deck plan.
    _addDeckPlan() {
        let decks = null;
        if (!this.actor?.system?.spacecraft?.deckplans) {
            decks = {
                1: "systems/mgt2e/images/deck-plan.svg"
            };
        } else {
            decks = this.actor.system.spacecraft.deckplans;
            let keys = Object.keys(decks);
            let n = keys.length + 1;
            decks[n] = "systems/mgt2e/images/deck-plan.svg";
        }
        this.actor.update({"system.spacecraft.deckplans": decks });
    }

    async _removeDeckPlan(idx) {
        let decks = {};
        let count = 1;
        for (let d in this.actor.system.spacecraft.deckplans) {
            if (parseInt(d) === parseInt(idx)) {
                continue;
            }
            decks[count++] = this.actor.system.spacecraft.deckplans[d];
        }
        await this.actor.update({"system.spacecraft.deckplans": null });
        this.actor.update({"system.spacecraft.deckplans": decks });
    }

    async _openDeckPlan(idx) {
        let img = this.actor.system.spacecraft.deckplans[idx];

        const popout = new ImagePopout(img,
            { title: this.actor.name + " Deck Plan " + idx,
              uuid: this.actor.uuid });
        popout.render(true);
    }

    _onCrewDragStart(event, options) {
        console.log("_onCrewDragStart:");
        let dragData = {
            type: "Actor",
            uuid: "Actor." + options.actorId
        }
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
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
        console.log("_onDrop:");
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
        case "Skill":
            return this._onDropSkillRequest(event, data);
        }
        return true;
    }

    async _onDropSkillRequest(event, data) {
        console.log("_onDropSkillRequest:");

        const skillFqn = data.skill;
        const skillOptions = data.options?JSON.parse(data.options):null;

        new MgT2SkillDialog(this.actor, skillFqn, skillOptions).render(true);
    }

    async _onDropActor(event, data) {
        let actor = await fromUuid(data.uuid);
        if (!actor) {
           return;
        }
        if ((this.actor.type === "spacecraft") && (actor.type === "traveller" || actor.type === "npc")) {
            console.log(`Adding new crew member ${actor._id}`);
            if (!this.actor.system.crewed) {
                this.actor.system.crewed = {"crew": {}, "passengers": {}, "roles": []};
            }
            this.actor.update({[`system.crewed.passengers.${actor._id}`]: {roles: ["NONE"]}});
        } else if (this.actor.type === "spacecraft" && (actor.type === "spacecraft" || actor.type === "vehicle")) {
            console.log(`Docking ${actor.name} with ship`);
            if (!this.actor.system.docks) {
                this.actor.system.docks = {};
            }
            this.actor.update({[`system.docks.${actor._id}`]: { quantity: 1 }});
        } else if (actor.type === "package" && (this.actor.type === "traveller" || this.actor.type === "npc")) {
            ui.notifications.info(game.i18n.format("MGT2.Info.Drop.DropPackage",
                { package: actor.name, actor: this.actor.name }));

            let html=`<div class="chat-package">`;
            html += `<h3>${actor.name}</h3>`;
            html += `<p><b>${this.actor.name}</b></p>`;

            if (actor.system.description && actor.system.description.length > 0) {
                html += `<div class="popup-text">${actor.system.description}</div>`;
            }

            if (actor.system.sophont.profession && actor.system.sophont.profession.length > 0) {
                html += `<p><b>Profession:</b> ${actor.system.sophont.profession}</p>`;
            }
            if (!isNaN(actor.system.speed.base) && parseInt(actor.system.speed.base) > 0) {
                if (actor.system.speed.base !== this.actor.system.speed.base && actor.system.speed.base !== null) {
                    html += `<p><b>Speed:</b> ${actor.system.speed.base}</p>`;
                }
                this.actor.system.speed.base = actor.system.speed.base;
                this.actor.system.speed.value = actor.system.speed.base;
                await this.actor.update({"system.speed": this.actor.system.speed });
            }
            if (actor.system.size && !Number.isNaN(actor.system.size)) {
                console.log(`Size [${actor.system.size}]`);
                if (actor.system.size !== this.actor.system.size) {
                    html += `<p><b>Size:</b> ${actor.system.size}</p>`;
                }
                this.actor.system.size = parseInt(actor.system.size);
                await this.actor.update({"system.size": this.actor.system.size });
            }

            html += `<div class="stats grid grid-3col">`;
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
                    let uppRoll = await new Roll(dice, null).evaluate();
                    this.actor.system.characteristics[c].value = uppRoll.total;
                    this.actor.system.characteristics[c].roll = dice;
                    html += `<div class="stat resource"><span class="stat-hdr">${c}</span><span class="stat-val">${dice}<br/>${uppRoll.total}</span></div>`;
                } else {
                    if (!actor.system.characteristics[c].show) {
                        continue;
                    }
                    let bonus = parseInt(actor.system.characteristics[c].value);
                    if (!isNaN(bonus) && bonus !== 0) {
                        this.actor.system.characteristics[c].value += bonus;
                        if (this.actor.system.characteristics[c].value < 1) {
                            this.actor.system.characteristics[c].value = 1;
                        }
                        html += `<div class="stat resource"><span class="stat-hdr">${c}</span><span class="stat-val">${(bonus>0)?"+":""}${bonus}</span></div>`;
                    }
                }
            }
            html += `</div>`;
            await this.actor.update({ "system.characteristics": this.actor.system.characteristics});

            let skillText = "";
            for (let s in actor.system.skills) {
                let skill = actor.system.skills[s];
                let target = this.actor.system.skills[s];
                let text = null;
                if (skill.deleted) {
                    // Remove skill from target character
                    if (target) {
                        await this.actor.update({[`system.skills.-=${s}`]: null});
                        text = `-<b><i>${skillLabel(skill)}</i></b>`;
                    }
                } else if (skill && !target) {
                    target = this.actor.system.skills[s] = JSON.parse(
                        JSON.stringify(skill)
                    )
                    text = `+<b>${skillLabel(skill)}</b>`;
                } else if (skill.trained) {
                    target.trained = true;
                    target.value = Math.min(4, parseInt(target.value) + parseInt(skill.value));
                    if (skill.specialities) {
                        for (let sp in skill.specialities) {
                            let spec = skill.specialities[sp];
                            if (spec.deleted) {
                                if (target.specialities[sp]) {
                                    if (Object.getOwnPropertyNames(skill.specialities).length === 1) {
                                        // If the final speciality is removed, then we need to remove the whole
                                        // structure, so that the parent skill is treated as a normal skill.
                                        delete target.specialities;
                                        await this.actor.update({[`system.skills.${s}.-=specialities`]: null});
                                    } else {
                                        delete target.specialities[sp];
                                        await this.actor.update({[`system.skills.${s}.specialities.-=${sp}`]: null});
                                    }
                                }
                                text = `-<b><i>${skillLabel(skill)} (${skillLabel(spec)})</i></b>`;
                            } else if (target.specialities[sp]) {
                                if (spec.trained) {
                                    target.specialities[sp].trained = true;
                                }
                                target.specialities[sp].value = Math.min(4,
                                    parseInt(target.specialities[sp].value) + parseInt(spec.value));
                                if (spec.boon) {
                                    target.specialities[sp].boon = spec.boon;
                                }
                                if (spec.bonus !== 0) {
                                    target.specialities[sp].bonus = spec.bonus;
                                }
                            } else {
                                if (!target.specialities) {
                                    this.actor.system.skills[s].specialities = {};
                                }
                                this.actor.system.skills[s].specialities[sp] = spec;
                                await this.actor.update({ "system.skills": this.actor.system.skills});
                            }
                            if (spec.trained || spec.value > 0) {
                                text = `${skillLabel(skill)} (${skillLabel(spec)}) ${spec.value}`;
                                if (spec.bonus && spec.bonus !== 0) {
                                    text += ` [${spec.bonus}]`;
                                }
                                if (spec.boon) {
                                    text += ` [${spec.boon}]`;
                                }
                            }
                        }
                    }
                    if (!text) {
                        text = `${skillLabel(skill)} ${skill.value}`;
                    }
                }
                if (skill.bonus !== 0 && target) {
                    target.bonus = skill.bonus;
                }
                if (skill.notes && skill.notes !== "" && target) {
                    target.notes = skill.notes;
                }
                if (skill.boon && target) {
                    target.boon = skill.boon;
                }
                if (text) {
                    skillText += `<li>${text}</li>`;
                }
            }
            if (skillText.length > 0) {
                html += `<h4>Skills</h4>`;
                html += `<ol class="skill-list">${skillText}</ol>`;
            }
            await this.actor.update({ "system.skills": this.actor.system.skills});

            let benefitsText = "";
            if (actor.system.cash && parseInt(actor.system.cash) > 0) {
                if (this.actor.system.finance) {
                    this.actor.system.finance.cash =
                        parseInt(this.actor.system.finance.cash) + parseInt(actor.system.cash);
                    await this.actor.update({"system.finance": this.actor.system.finance});
                }
                benefitsText += `<p>Cash: Cr${actor.system.cash}</p>`;
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
                        weight += Math.floor(Math.random() * 6) - Math.floor(Math.random() * 6);
                        this.actor.system.sophont.weight = weight;
                        html += `<p>Weight: ${weight}kg</p>`;
                    }
                }
                if (actor.system.sophont.height) {
                    let height = parseInt(actor.system.sophont.height);
                    if (height > 0) {
                        height += isMale?7:0;
                        height -= isFemale?7:0;
                        height += parseInt(str/2);
                        height += Math.floor(Math.random()*6) - Math.floor(Math.random()*6);
                        this.actor.system.sophont.height = height;
                        html += `<p>Height: ${height}cm</p>`;
                    }
                }
                await this.actor.update({"system.sophont": this.actor.system.sophont});
            }

            // Now copy any items across
            let term = null;
            for (let item of actor.items) {
                const itemData = {
                    name: item.name,
                    img: item.img,
                    type: item.type,
                    system: foundry.utils.deepClone(item.system)
                };
                if (this.actor.type === "npc" && (itemData.type === "term" || itemData.type === "associate")) {
                    // NPCs don't have career terms or associates.
                    // However, we may need to increment their age.
                    if (itemData.type === "term" && this.actor.system.settings.autoAge) {
                        let years = itemData.system.term.termLength;
                        if (itemData.system.term.randomTerm) {
                            let dice = "3D6";
                            if (itemData.system.term.randomLength) {
                                dice = itemData.system.term.randomLength;
                            }
                            let r = await new Roll(dice, null).evaluate();
                            years = r.total;
                        }
                        years = parseInt(this.actor.system.sophont.age) + years;
                        html += `<p>Age: ${years}</p>`;
                        await this.actor.update({"system.sophont.age": years });
                    }
                    continue;
                }
                if (itemData.type === "term" && itemData.system.term.randomTerm) {
                    let dice = "3D6";
                    if (itemData.system.term.randomLength) {
                        dice = itemData.system.term.randomLength;
                    }
                    let r = await new Roll(dice, null).evaluate();
                    itemData.system.term.termLength = r.total;
                    itemData.system.term.randomTerm = false;
                }
                ui.notifications.info(game.i18n.format("MGT2.Info.Drop.DropPackageItem",
                    { item: item.name, actor: this.actor.name }));
                await Item.create(itemData, {parent: this.actor});

                if (itemData.type !== "term") {
                    if (itemData.type === "associate") {
                        let rel = game.i18n.localize("MGT2.History.Relation." + item.system.associate.relationship);
                        benefitsText += `<p>${rel}: ${item.name}</p>`;
                    } else {
                        benefitsText += `<p>${item.name}</p>`;
                    }
                } else {
                    term = itemData;
                }
            }
            if (benefitsText.length > 0) {
                html += `<h4>Benefits</h4>`;
                html += benefitsText;
            }

            if (term) {
                if (!this.actor.system.settings.autoAge && term.system.term.termLength > 0) {
                    this.actor.update({"system.settings.autoAge": true});
                }
                html += `<h4>Careers</h4>`;
                if (term.system.term.termLength > 0) {
                    html += `<p>${term.name} - ${term.system.term.termLength} years</p>`;
                } else {
                    html += `<p>${term.name}</p>`;
                }
            }

            html += `</div>`;

            let who = null;
            if (game.users.current.isGM) {
                if (game.settings.get("mgt2e", "gmSheetNotification") === "private") {
                    who = [game.user.id];
                }
            } else {
                if (game.settings.get("mgt2e", "playerSheetNotification") === "private") {
                    who = [game.user.id];
                } else if (game.settings.get("mgt2e", "playerSheetNotification") === "gm") {
                    who = [game.user.id, game.users.activeGM ];
                }
            }
            let chatData = {
                user: game.user.id,
                speaker: ChatMessage.getSpeaker(),
                whisper: who,
                content: html
            }
            ChatMessage.create(chatData, {});

        }
    }

    /**
     * Override item drop. Need to remove item from source character.
     */
    async _onDropItem(event, data) {
        console.log("_onDropItem:");

        // Not enough data to do anything with. Simply return without trying any further.
        if (!data || !data.uuid) {
            return false;
        }
        let item = await fromUuid(data.uuid);
        if (!item) {
            // Item doesn't seem to exist, don't do anything.
            ui.notifications.error(`Unable to find item with id [${data.uuid}]`);
            return false;
        }
        if (["associate"].includes(item.type)) {
            // Meta item, so just pass through to the usual item handler.
            return super._onDropItem(event, data);
        } else if (item.type === "term" && [ "traveller", "package"].includes(actor.type)) {
            return await this._onDropTerm(item);
        }

        // If not dragged from another (different) actor, just let the normal item handler deal with things.
        if (!item.parent || this.actor.uuid === item.parent.uuid) {
            return super._onDropItem(event, data);
        }

        let srcActor = item.parent;

        // If moving trade goods between worlds and spacecraft, use the trade system.
        if (srcActor.type === "world" && this.actor.type === "spacecraft") {
            if (item.type === "cargo") {
                await buyCargoDialog(srcActor, this.actor, item);
            } else if (item.type === "worlddata" && item.system.world.datatype === "passenger") {
                await embarkPassengerDialog(srcActor, this.actor, item);
            }
            return false;
        } else if (srcActor.type === "spacecraft" && this.actor.type === "world") {
            if (item.type === "cargo") {
                await sellCargoDialog(srcActor, this.actor, item);
            }
            return false;
        }
        if (["worlddata"].includes(item.type)) {
            // Meta item, so just pass through to the usual item handler.
            return super._onDropItem(event, data);
        }

        // If shift is held down on drop, copy rather than move. Use the standard handler.
        if (event.shiftKey) {
            return super._onDropItem(event, data);
        }

        console.log(`From ${srcActor.name} to ${this.actor.name}`);

        if (srcActor) {
            if (item.type === "hardware" || item.type === "role" || item.type === "term" || item.type === "software") {
                return true;
            }

            if (parseInt(item.system.quantity) > 1) {
                new MgT2QuantityDialog(srcActor, this.actor, item).render(true);
            } else {
                ui.notifications.info(`Moved '${item.name}' from '${srcActor.name}' to '${this.actor.name}'`);
                srcActor.deleteEmbeddedDocuments("Item", [item._id]);
                return super._onDropItem(event, data);
            }
        }
        return true;
    }

    // Drop a Term onto an Actor. Only applies to Travellers or Packages.
    async _onDropTerm(item) {
        let actor = this.actor;
    }

    async _onDropUPP(event, data) {
        const actor = this.actor;

        if (actor.type === "traveller" || actor.type === "npc") {
            if (actor.system.characteristics) {
                let html=`<div class="chat-package">`;
                html += `<p>Drop UPP for <b>${actor.name}</b></p>`;
                html += `<div class="stats grid grid-3col">`;

                if (data.STR) {
                    actor.system.characteristics.STR.value = parseInt(data.STR);
                    html += `<div class="stat resource"><span class="stat-hdr">STR</span><span class="stat-val">${data.STR}</span></div>`;
                }
                if (data.DEX) {
                    actor.system.characteristics.DEX.value = parseInt(data.DEX);
                    html += `<div class="stat resource"><span class="stat-hdr">DEX</span><span class="stat-val">${data.DEX}</span></div>`;
                }
                if (data.END) {
                    actor.system.characteristics.END.value = parseInt(data.END);
                    html += `<div class="stat resource"><span class="stat-hdr">END</span><span class="stat-val">${data.END}</span></div>`;
                }
                if (data.INT) {
                    actor.system.characteristics.INT.value = parseInt(data.INT);
                    html += `<div class="stat resource"><span class="stat-hdr">INT</span><span class="stat-val">${data.INT}</span></div>`;
                }
                if (data.EDU) {
                    actor.system.characteristics.EDU.value = parseInt(data.EDU);
                    html += `<div class="stat resource"><span class="stat-hdr">EDU</span><span class="stat-val">${data.EDU}</span></div>`;
                }
                if (data.SOC) {
                    actor.system.characteristics.SOC.value = parseInt(data.SOC);
                    html += `<div class="stat resource"><span class="stat-hdr">SOC</span><span class="stat-val">${data.SOC}</span></div>`;
                }
                actor.update({ "system.characteristics": actor.system.characteristics});

                html += "</div></div>";
                let who = null;
                if (game.users.current.isGM) {
                    if (game.settings.get("mgt2e", "gmSheetNotification") === "private") {
                        who = [game.user.id];
                    }
                } else {
                    if (game.settings.get("mgt2e", "playerSheetNotification") === "private") {
                        who = [game.user.id];
                    } else if (game.settings.get("mgt2e", "playerSheetNotification") === "gm") {
                        who = [game.user.id, game.users.activeGM ];
                    }
                }
                let chatData = {
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker(),
                    whisper: who,
                    content: html
                }
                ChatMessage.create(chatData, {});


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
                actor.update({ "system.characteristics": actorData.characteristics});
            }
        }
  }

    async _onDropDamage(event, data) {
        const damage = data.damage;
        const damageOptions = data.options?JSON.parse(data.options):null;

        console.log("onDropDamage:");
        console.log(data);

        this.actor.applyDamage(damage, damageOptions);
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
            system: data
        };
        if (header.dataset.img) {
            itemData.img = header.dataset.img;
        }
        if (type === "weapon" && header.dataset.skill) {
            itemData.system.weapon = {};
            itemData.system.weapon.skill = header.dataset.skill;
        }
        if (type === "armour" && header.dataset.form) {
            itemData.system.armour = {};
            itemData.system.armour.form = header.dataset.form;
        }
        if (type === "term") {
            let number = 1;
            for (let i of this.actor.items) {
                if (i.type === "term") {
                    number++;
                }
            }

            itemData.name = `New term ${number}`;
            itemData.system.description = "Events, mishaps and promotions.";
            itemData.system.term = {};
            itemData.system.term.number = number;
        }
        if (type === "associate") {
            console.log("Create associate");
            itemData.name = "Unnamed " + header.dataset.relation;
            itemData.system.associate = {};
            itemData.system.associate.relationship = header.dataset.relation;
            await randomiseAssociate(itemData);
        }
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.system["type"];

        // Finally, create the item!
        return await Item.create(itemData, {parent: this.actor});
    }

    _createCrewRole(roleType) {
        let system = {
            "description": "",
            "role": {
                "actions": {},
                "department": false,
                "colour": null,
                "dei": 0
            }
        }
        let itemName = "Role";
        let img = null;

        let t = Date.now();
        if (roleType === "gunner") {
            itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Gunner");
            img = "systems/mgt2e/icons/items/roles/gunner.svg";
            system.role.actions[(t++).toString(36)]= {
                "title": "Gunner",
                "action": "weapon",
                "dm": 0,
                "weapon": null
            };
        } else if (roleType === "pilot") {
            itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Pilot");
            img = "systems/mgt2e/icons/items/roles/pilot.svg";
            let skill = "pilot.spacecraft";
            if (this.actor.system.spacecraft.dtons < 100) {
                skill = "pilot.smallCraft";
            } else if (this.actor.system.spacecraft.dtons > 5000) {
                skill = "pilot.capitalShips";
            }
            system.role.actions[(t++).toString(36)] = {
                "title": game.i18n.localize("MGT2.Role.BuiltIn.Action.Pilot"),
                "action": "skill", "cha": "DEX", "skill": skill, "target": 8, "dm": 0
            }
            system.role.actions[(t++).toString(36)] = {
                "title": game.i18n.localize("MGT2.Role.BuiltIn.Action.PortLanding"),
                "action": "skill", "cha": "DEX", "skill": skill, "target": 6, "dm": 0
            }
            system.role.actions[(t++).toString(36)] = {
                "title": game.i18n.localize("MGT2.Role.BuiltIn.Action.WildLanding"),
                "action": "skill", "cha": "DEX", "skill": skill, "target": 10, "dm": 0
            }
            system.role.actions[(t++).toString(36)] = {
                "title": game.i18n.localize("MGT2.Role.BuiltIn.Action.Evade"),
                "action": "special", "special": "evade"
            }
            system.role.actions[(t++).toString(36)] = {
                "title": game.i18n.localize("MGT2.Role.BuiltIn.Action.MakePilot"),
                "action": "special", "special": "pilot"
            }
        } else if (roleType === "engineer") {
            itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Engineer");
            img = "systems/mgt2e/icons/items/roles/engineer.svg";
            system.role.actions[(t++).toString(36)] = {
                "title": "Activate Jump",
                "action": "skill", "cha": "EDU", "skill": "engineer.jDrive",
                "target": 4, "dm": 0,
                "text": "Active Jump Drive"
            }
            system.role.actions[(t++).toString(36)] = {
                "title": "Offline System",
                "action": "skill", "cha": "EDU", "skill": "engineer.power",
                "target": 8, "dm": 0,
                "text": "Take systems offline"
            }
            system.role.actions[(t++).toString(36)] = {
                "title": "Overload Drive",
                "action": "skill", "cha": "INT", "skill": "engineer.mDrive",
                "target": 10, "dm": 0,
                "text": "Overload drive"
            }
            system.role.actions[(t++).toString(36)] = {
                "title": "Repair",
                "action": "special", "special": "repair"
            }
        } else if (roleType === "sensors") {
            itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Sensors");
            img = "systems/mgt2e/icons/items/roles/sensors.svg";
            system.role.actions[(t++).toString(36)] = {
                "title": "Sensors",
                "action": "skill", "cha": "INT", "skill": "electronics.sensors", "target": 8, "dm": 0
            }
            system.role.actions[(t++).toString(36)] = {
                "title": "Comms",
                "action": "skill", "cha": "INT", "skill": "electronics.comms", "target": 8, "dm": 0
            }
        } else if (roleType === "navigator") {
            itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Navigator");
            img = "systems/mgt2e/icons/items/roles/navigator.svg";
            system.role.actions[(t++).toString(36)] = {
                "title": "Jump-1",
                "action": "skill", "cha": "EDU", "skill": "astrogation", "target": 4, "dm": -1
            }
            system.role.actions[(t++).toString(36)] = {
                "title": "Jump-2",
                "action": "skill", "cha": "EDU", "skill": "astrogation", "target": 4, "dm": -2
            }
        } else if (roleType === "broker") {
            itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Broker");
            img = "systems/mgt2e/icons/items/roles/broker.svg";
            system.role.actions[(t++).toString(36)] = {
                "title": "Broker",
                "action": "skill", "cha": "INT", "skill": "broker", "target": 8, "dm": 0
            }
        } else if (roleType === "medic") {
            itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Medic");
            img = "systems/mgt2e/icons/items/roles/medic.svg";
            system.role.actions[(t++).toString(36)] = {
                "title": "Medic",
                "action": "skill", "cha": "INT", "skill": "medic", "target": 8, "dm": 0
            }
        } else if (roleType === "steward") {
            itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Steward");
            img = "systems/mgt2e/icons/items/roles/steward.svg";
            system.role.actions[(t++).toString(36)] = {
                "title": "Steward",
                "action": "skill", "cha": "INT", "skill": "steward", "target": 8, "dm": 0
            }
        } else if (roleType === "mechanic") {
            itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Mechanic");
            img = "systems/mgt2e/icons/items/roles/maintenance.svg";
            system.role.actions[(t++).toString(36)] = {
                "title": "Mechanic",
                "action": "skill", "cha": "INT", "skill": "mechanic", "target": 8, "dm": 0
            }
        } else {
            return;
        }
        const itemData = {
            "name": itemName,
            "img": img,
            "type": "role",
            "system": system
        };
        Item.create(itemData, { parent: this.actor } );
    }

    _createEquipmentItem(itemType) {
        if (!itemType) {
            return;
        }

        let itemName = game.i18n.localize("TYPES.Item." + itemType);
        let img = "";
        const itemData = {
            "name": itemName,
            "img": img,
            "type": itemType
        };
        Item.create(itemData, { parent: this.actor } );

    }

    _createHardware(systemType) {
        let system = {
            "tl": 12, "weight": 0, "cost": 0, "notes": "",
            "active": true, "quantity": 1, "status": null,
            "hardware": {
                "system": systemType,
                "tons": 0,
                "power": 0,
                "rating": 0,
                "tonnage": {
                    "tonCalc": "pcByRating",
                    "costCalc": "costByTon",
                    "tons": 0, "percent": 0, "cost": 0, "minimum": 0
                },
                "powerPerTon": 0,
                "mount": "turret",
                "advantages": "",
                "weapons": {}
            }
        };

        let itemName = "Hardware";
        let img = null;
        if (systemType === "general") {
            itemName = "Hardware";
            img = "systems/mgt2e/icons/hardware/hardware.svg";
            system.tl = 9;
        } else if (systemType === "j-drive") {
            itemName = "J-Drive";
            img = "systems/mgt2e/icons/hardware/j-drive.svg";
            system.tl = 9;
            system.hardware.rating = 1;
        } else if (systemType === "m-drive") {
            itemName = "M-Drive";
            img = "systems/mgt2e/icons/hardware/m-drive.svg";
            system.tl = 9;
            system.hardware.rating = 1;
        } else if (systemType === "r-drive") {
            itemName = "R-Drive";
            img = "systems/mgt2e/icons/hardware/r-drive.svg";
            system.tl = 7;
            system.hardware.rating = 1;
        } else if (systemType === "power") {
            itemName = "Fusion Reactor (TL8)";
            img = "systems/mgt2e/icons/hardware/fusion_reactor.svg";
            system.tl = 8;
            system.hardware.rating = 40;
            system.hardware.tonnage.cost = 0.5;
            system.hardware.powerPerTon = 10;
        } else if (systemType === "armour") {
            itemName = "Crystaliron Armour";
            img = "systems/mgt2e/icons/hardware/armour_crystaliron.svg";
            system.tl = 10;
            system.hardware.rating = 2;
            system.hardware.tonnage.percent = 1.25;
            system.hardware.tonnage.cost = 0.2;
        } else if (systemType === "fuel") {
            itemName = "Fuel Tanks";
            img = "systems/mgt2e/icons/hardware/fuel_tank.svg";
            system.tl = 7;
            system.hardware.rating = 10;
        } else if (systemType === "cargo") {
            itemName = "Cargo Hold";
            img = "systems/mgt2e/icons/hardware/cargo_hold.svg";
            system.tl = 7;
            system.hardware.rating = 10;
        } else if (systemType === "dock") {
            itemName = "Docking Bay";
            img = "systems/mgt2e/icons/hardware/cargo_hold.svg";
            system.tl = 7;
            system.hardware.rating = 20;
        } else if (systemType === "weapon") {
            itemName = "Turret";
            img = "systems/mgt2e/icons/hardware/turret.svg";
            system.tl = 7;
            system.hardware.tonnage.tons = 1;
        } else if (systemType === "computer") {
            itemName = "Computer";
            img = "systems/mgt2e/icons/hardware/computer.svg";
            system.tl = this.actor.system.spacecraft.tl;
        } else if (systemType === "bridge") {
            itemName = "Bridge";
            img = "systems/mgt2e/icons/hardware/bridge.svg";
            system.hardware.system = "bridge";
            if (this.actor.system.spacecraft.dtons <= 50) {
                system.hardware.tonnage.tons = 5;
            } else if (this.actor.system.spacecraft.dtons < 100) {
                system.hardware.tonnage.tons = 6;
            } else if (this.actor.system.spacecraft.dtons <= 200) {
                system.hardware.tonnage.tons = 10;
            } else if (this.actor.system.spacecraft.dtons <= 1000) {
                system.hardware.tonnage.tons = 20;
            } else if (this.actor.system.spacecraft.dtons <= 2000) {
                system.hardware.tonnage.tons = 40;
            } else if (this.actor.system.spacecraft.dtons <= 100000) {
                system.hardware.tonnage.tons = 60;
            } else {
                system.hardware.tonnage.tons = 60 + parseInt(this.actor.system.spacecraft.dtons / 100000) * 20;
            }
            system.hardware.tonnage.cost = Math.ceil(this.actor.system.spacecraft.dtons / 100) * 0.5;
        } else if (systemType === "stateroom") {
            itemName = "Stateroom";
            img = "systems/mgt2e/icons/hardware/stateroom.svg";
            system.hardware.system = "stateroom";
            system.hardware.tonnage.tons = 4;
            system.hardware.rating = 1;
            system.cost = 0.5;
        } else if (systemType === "common") {
            itemName = "Common Area";
            img = "systems/mgt2e/icons/hardware/common_area.svg";
            system.hardware.system = "common";
            system.hardware.tonnage.tons = 1;
            system.hardware.rating = 1;
            system.hardware.autoCost = true;
            system.cost = 0.1;
        } else if (systemType === "sensor") {
            itemName = "Basic Sensors";
            img = "systems/mgt2e/icons/hardware/sensor.svg";
            system.tl = 8;
            system.hardware.system = "sensor";
            system.hardware.tonnage.tons = 0;
            system.hardware.rating = -4;
            system.hardware.hasVisual = true;
            system.hardware.hasThermal = true;
            system.hardware.hasLidar = true;
            system.hardware.hasRadar = true;
            system.hardware.hasActiveLidar = true;
            system.hardware.hasActiveRadar = true;
            system.hardware.hasJammers = true;
        } else {
            // Unrecognised, so don't create anything.
            return;
        }

        const itemData = {
            "name": itemName,
            "img": img,
            "type": "hardware",
            "system": system
        };
        Item.create(itemData, { parent: this.actor } );
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

        const skillId = dataset.skill;
        const specId = dataset.spec;
        const cha = dataset.cha;

        let skillFqn = skillId;
        let skillDefault = dataset.cha?dataset.cha:"";
        let specData = null;

        if (skillFqn) {
            skillDefault = data.skills[skillId].default;
            if (specId) {
                specData = data.skills[skillId].specialities[specId];
                if (specData.default) {
                    skillDefault = specData.default;
                }
                skillFqn = skillFqn + "." + specId;
            }
        }
        let quickRoll = game.settings.get("mgt2e", "quickRolls");
        if (event.shiftKey) {
            quickRoll = !quickRoll;
        }
        if (event.ctrlKey || event.metaKey) {
            new MgT2XPDialog(actor, skillId, specId, cha).render(true);
        } else if (!quickRoll) {
            new MgT2SkillDialog(actor, skillFqn, {
                "cha": cha
            }).render(true);
        } else {
            // Roll directly with no options.
            rollSkill(actor, skillFqn, {
                "speciality": specId,
                "cha": skillDefault,
                "rollType": "normal",
                "difficulty": 8
            });
        }
    }

    async _editDamage(ev, actor) {
        if (actor.system.damage) {
            new MgT2ChaDialog(actor).render(true);
        } else {
            // Give the option of switching on damage.
            let confirm = await foundry.applications.api.DialogV2.confirm({
                window: { title: "MGT2.Dialog.EnableDamage.Title" },
                content: `<p>${game.i18n.localize("MGT2.Dialog.EnableDamage.Text")}</p>`
            })
            if (confirm) {
                actor.addDamageValues();
            }
        }
    }

    /*
    async _onSubmit(event, updateData, preventClose, preventRender) {
        console.log("_onSubmit:");
        console.log(updateData);
        console.log(this.actor);
        console.log(preventRender);

        if (this.actor.type === "spacecraft" && game.settings.get("mgt2e", "autoResizeSpacecraft")) {
            let size = 1;
            let dtons = this.actor.system.spacecraft.dtons;
            if (dtons < 30) {
                size = 1;
            } else if (dtons < 100) {
                size = 2;
            } else if (dtons < 300) {
                size = 3;
            } else if (dtons < 1000) {
                size = 4;
            } else if (dtons < 3000) {
                size = 5;
            } else {
                size = 6;
            }
            if (this.actor.prototypeToken) {
                if (this.actor.prototypeToken.width !== size || this.actor.prototypeToken.height !== size) {
                    this.actor.prototypeToken.width = size;
                    this.actor.prototypeToken.height = size;
                    this.actor.update({"prototypeToken": this.actor.prototypeToken });
                }
            }
            //this.actor._source.prototypeToken.width = size;
            //this.actor._source.prototypeToken.height = size;
        }

        await super._onSubmit(event, updateData, preventClose, false);
        this.render();
    }
    */
}

export class MgT2NPCActorSheet extends MgT2ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mgt2e", "sheet", "actor"],
            template: "systems/mgt2e/templates/actor/actor-sheet.html",
            width: 720,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }
}

export class MgT2CreatureActorSheet extends MgT2ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mgt2e", "sheet", "actor"],
            template: "systems/mgt2e/templates/actor/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }
}
