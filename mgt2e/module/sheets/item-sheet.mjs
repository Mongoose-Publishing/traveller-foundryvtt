import {onManageActiveEffect} from "../helpers/effects.mjs";
import {rollAttack, hasTrait, getTraitValue, toFloat, rollSpaceAttack} from "../helpers/dice-rolls.mjs";
import {getArmourMultiplier} from "../helpers/spacecraft.mjs";
import { MGT2 } from "../helpers/config.mjs";
import {MgT2Item} from "../documents/item.mjs";
import {randomiseAssociate} from "../helpers/utils/character-utils.mjs";
import {calculateHardwareAdvantages} from "../helpers/spacecraft/spacecraft-utils.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MgT2ItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "item"],
            width: 680,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/mgt2e/templates/item";
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/item-${this.item.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    async getData() {
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

        // Add the actor's data to context.data for easier access, as well as flags.
        context.enrichedDescription = await TextEditor.enrichHTML(this.object.system.description );
        context.system = item.system;
        context.flags = item.flags;
        context.effects = item.effects;
        context.effectTypes = CONFIG.MGT2.EFFECTS;

        if (context.system.quantity === undefined) {
            context.system.quantity = 1;
        } else if (context.system.quantity < 0) {
            context.system.quantity = 0;
        }

        context.techLevels = {};
        for (let i=0; i <= 25; i++) {
            context.techLevels[i] = i + " (" + game.i18n.localize(`MGT2.Item.Tech.${i}`) + ")";
        }

        context.ARMOUR_LEGALITY = {};
        context.ARMOUR_LEGALITY[0] = "(0) Battledress";
        context.ARMOUR_LEGALITY[1] = "(1) Combat";
        context.ARMOUR_LEGALITY[2] = "(2) Flak";
        context.ARMOUR_LEGALITY[3] = "(3) Cloth";
        context.ARMOUR_LEGALITY[4] = "(4) Mesh";
        context.ARMOUR_LEGALITY[5] = "(5)";
        context.ARMOUR_LEGALITY[6] = "(6)";
        context.ARMOUR_LEGALITY[7] = "(7) Visible";
        context.ARMOUR_LEGALITY[8] = "(8) Hidden";
        context.ARMOUR_LEGALITY[9] = "(9) Clothing";

        context.WEAPON_LEGALITY = {};
        context.WEAPON_LEGALITY[0] = "(0) Explosives";
        context.WEAPON_LEGALITY[1] = "(1) Energy";
        context.WEAPON_LEGALITY[2] = "(2) Military";
        context.WEAPON_LEGALITY[3] = "(3) Assault";
        context.WEAPON_LEGALITY[4] = "(4) Concealed";
        context.WEAPON_LEGALITY[5] = "(5) Firearms";
        context.WEAPON_LEGALITY[6] = "(6) Shotguns";
        context.WEAPON_LEGALITY[7] = "(7) Blades";
        context.WEAPON_LEGALITY[8] = "(8) Weapons";
        context.WEAPON_LEGALITY[9] = "(9) Harmless";

        context.SELECT_PROCESSING = {};
        for (let i=0; i < 6; i++) {
            context.SELECT_PROCESSING[i] = `Computer/${i}`;
        }

        context.characteristics = MGT2.CHARACTERISTICS;

        // If this belongs to an actor, the actor might have custom skills, so
        // we need to use the actor's skill list rather than the global one.
        if (context.item.parent && context.item.parent.system.skills) {
            context.skills = context.item.parent.system.skills;
        } else {
            context.skills = MGT2.SKILLS;
        }

        if (context.item.type === "armour") {
            context.YESNO = {
                "0": game.i18n.localize("MGT2.Base.No"),
                "1": game.i18n.localize("MGT2.Base.Yes")
            }

            context.ARMOUR_FORM = {
                "standard": game.i18n.localize("MGT2.Armour.Form.Standard"),
                "layered": game.i18n.localize("MGT2.Armour.Form.Layered"),
                "stackable": game.i18n.localize("MGT2.Armour.Form.Stackable"),
                "natural": game.i18n.localize("MGT2.Armour.Form.Natural")
            }

            context.VACC_SUIT = [
                { value: "", "label": "-"},
                { value: "0", "label": game.i18n.format("MGT2.Armour.VaccSuit", { "skill": 0 })},
                { value: "1", "label": game.i18n.format("MGT2.Armour.VaccSuit", { "skill": 1 })},
                { value: "2", "label": game.i18n.format("MGT2.Armour.VaccSuit", { "skill": 2 })},
                { value: "3", "label": game.i18n.format("MGT2.Armour.VaccSuit", { "skill": 3 })},
            ];
        }

        if (context.item.type === "hardware") {
            context.SHIP_TL = {};
            let maxTL = 25;
            if (context.item.parent && context.item.parent.type === "spacecraft") {
                if (context.item.parent.system.settings.enforceLimits) {
                    maxTL = Math.max(context.item.parent.system.spacecraft.tl, 7);
                }
            }
            for (let tl = 6; tl <= maxTL; tl++) {
                context.SHIP_TL[tl] = tl;
            }
            context.selectSystemTypes = {
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
                "power": game.i18n.localize("MGT2.Spacecraft.System.power"),
                "r-drive": game.i18n.localize("MGT2.Spacecraft.System.r-drive"),
                "sensor": game.i18n.localize("MGT2.Spacecraft.System.sensor"),
                "stateroom": game.i18n.localize("MGT2.Spacecraft.System.stateroom"),
                "weapon": game.i18n.localize("MGT2.Spacecraft.System.weapon"),
            };

            context.BRIDGE_LIST = {
                "standard": "Bridge",
                "cockpit": "Cockpit",
                "dualCockpit": "Dual Cockpit",
                "small": "Small Bridge",
                "command": "Command Bridge"
            }

            context.HARDWARE_RATING = null;
            let sys = context.item.system.hardware.system;
            if (sys === "j-drive" || sys === "m-drive" || sys === "r-drive") {
                context.HARDWARE_RATING = {};
                for (let i in MGT2.SHIP_HARDWARE[sys].rating) {
                    if (MGT2.SHIP_HARDWARE[sys].rating[i].tl <= maxTL) {
                        context.HARDWARE_RATING[i] = game.i18n.format("MGT2.Item.Hardware.Rating." + sys,
                            {"rating": i});
                    }
                }
            }

            this.calculateHardware(context, context.item);
        }

        if (context.item.type === "hardware" && context.item.parent != null && context.item.parent.type === "spacecraft") {
            this.calculateShipHardware(context, context.item);
            let enforceLimits = true;
            if (item.parent) {
                enforceLimits = item.parent.system.settings.enforceLimits;
            }
            if (MGT2.SPACECRAFT_ADVANTAGES[context.item.system.hardware.system]) {
                // List of prototype/advanced options.
                context.ADVANCES = MGT2.SPACECRAFT_ADVANCES;
                context.ADVANCES_LIST = {};
                for (let a in context.ADVANCES) {
                    context.ADVANCES_LIST[a] = game.i18n.format("MGT2.Spacecraft.Advances." + a);
                }
                if (!context.item.system.hardware.advancement) {
                    context.item.system.hardware.advancement = "standard";
                }
                // Now work out how many we can afford to 'buy'.
                // List of advantages/disadvantages available.
                context.ADVANTAGES = MGT2.SPACECRAFT_ADVANTAGES[context.item.system.hardware.system];
                context.ADVANTAGES_LIST = {};
                context.ADVANTAGES_LIST[""] = "";

                let pointsAvailable = context.ADVANCES[this.item.system.hardware.advancement].modifications;
                let bought = context.item.system.hardware.advantages;
                if (bought && enforceLimits) {
                    for (let a of bought.split(",")) {
                        let t = a.trim().split(" ")[0];
                        let n = a.trim().split(" ")[1];
                        if (!context.ADVANTAGES[t]) {
                            continue;
                        }
                        let c = context.ADVANTAGES[t].cost;
                        c = parseInt(c) * parseInt(n);
                        if (pointsAvailable < 0) {
                            if (c < 0) {
                                pointsAvailable = Math.min(0, pointsAvailable - c);
                            }
                        } else if (pointsAvailable > 0) {
                            if (c > 0) {
                                pointsAvailable = Math.max(0, pointsAvailable - c);
                            }
                        }
                    }
                }
                if (pointsAvailable !== 0) {
                    for (let a in context.ADVANTAGES) {
                        let advantage = context.ADVANTAGES[a];
                        if (pointsAvailable < 0 && (advantage.cost > 0 || advantage.cost < pointsAvailable)) {
                            continue;
                        }
                        if (pointsAvailable > 0 && (advantage.cost < 0 || advantage.cost > pointsAvailable)) {
                            continue;
                        }
                        context.ADVANTAGES_LIST[a] =
                            `${game.i18n.format("MGT2.Spacecraft.Advantages." + a)} (${context.ADVANTAGES[a].cost})`;
                    }
                }
            }
        } else if (context.item.type === "armour") {
            context.energyTypes = {};
            context.energyTypes[""] = "";
            context.haveEnergy = {};
            for (let e of CONFIG.MGT2.WEAPONS.energyTypes) {
                if (context.item.system.armour.otherTypes.toLowerCase().indexOf(e) === -1) {
                    context.energyTypes[e] = game.i18n.localize("MGT2.Item.EnergyType." + e);
                } else {
                    context.haveEnergy[e] = game.i18n.localize("MGT2.Item.EnergyType." + e);
                }
            }
        } else if (context.item.type === "weapon") {
            context.weaponCha = {
                "STR": "STR",
                "DEX": "DEX",
                "INT": "INT",
                "PSI": "PSI"
            }
            context.weaponDamageBonus = {
                "": "-",
                "STR": "STR",
                "PSI": "PSI"
            }
            context.weaponScale = {
                "traveller": game.i18n.localize("MGT2.Item.Scale.traveller"),
                "vehicle": game.i18n.localize("MGT2.Item.Scale.vehicle"),
                "spacecraft": game.i18n.localize("MGT2.Item.Scale.spacecraft"),
            }
            context.weaponSpaceMount = {
                "fixed": game.i18n.localize("MGT2.Item.SpaceMount.Fixed"),
                "turret": game.i18n.localize("MGT2.Item.SpaceMount.Turret"),
                "barbette": game.i18n.localize("MGT2.Item.SpaceMount.Barbette"),
                "bay.small": game.i18n.localize("MGT2.Item.SpaceMount.BaySmall"),
                "bay.medium": game.i18n.localize("MGT2.Item.SpaceMount.BayMedium"),
                "bay.large": game.i18n.localize("MGT2.Item.SpaceMount.BayLarge"),
                "spinal": game.i18n.localize("MGT2.Item.SpaceMount.Spinal"),
            }
            context.weaponSpaceRange = {
                "adjacent": game.i18n.localize("MGT2.Item.SpaceRange.adjacent"),
                "close": game.i18n.localize("MGT2.Item.SpaceRange.close"),
                "short": game.i18n.localize("MGT2.Item.SpaceRange.short"),
                "medium": game.i18n.localize("MGT2.Item.SpaceRange.medium"),
                "long": game.i18n.localize("MGT2.Item.SpaceRange.long"),
                "verylong": game.i18n.localize("MGT2.Item.SpaceRange.verylong"),
                "distant": game.i18n.localize("MGT2.Item.SpaceRange.distant"),
            }
            context.energyTypes = {};
            context.energyTypes["standard"] = game.i18n.localize("MGT2.Item.EnergyType.standard");
            for (let e of CONFIG.MGT2.WEAPONS.energyTypes) {
                context.energyTypes[e] = game.i18n.localize("MGT2.Item.EnergyType." + e);
            }

            context.weaponTraits = {};
            context.weaponTraits[""] = "";
            let traits = context.item.system.weapon.traits;
            for (let trait in CONFIG.MGT2.WEAPONS.traits) {
                if (!hasTrait(traits, trait)) {
                    let t = CONFIG.MGT2.WEAPONS.traits[trait];
                    if (t.scale) {
                        if (t.scale === "spacecraft" && context.item.system.weapon.scale !== "spacecraft") {
                            continue;
                        }
                        if (t.scale === "traveller" && context.item.system.weapon.scale === "spacecraft") {
                            // Vehicle and Traveller scale considered the same - for now.
                            continue;
                        }
                    }
                    if (t.conflict) {
                        let hasConflict = false;
                        for (let c of t.conflict) {
                            if (hasTrait(traits, c)) {
                                hasConflict = true;
                                break;
                            }
                        }
                        if (hasConflict) {
                            continue;
                        }
                    }
                    context.weaponTraits[trait] = game.i18n.localize("MGT2.Item.WeaponTrait.Label."+trait);
                }
            }
            let allSkills = MGT2.SKILLS;
            if (context.item.parent && context.item.parent.system.skills) {
                allSkills = context.item.parent.system.skills;
            }
            context.combatSkills = {
                "": "None"
            };
            for (let skillId in allSkills) {
                let skill = allSkills[skillId];
                if (skill.specialities) {
                    for (let specId in skill.specialities) {
                        let spec = skill.specialities[specId];
                        if (spec.combat) {
                            let label = skill.label?skill.label:game.i18n.localize("MGT2.Skills."+skillId);
                            let specLabel = spec.label?spec.label:game.i18n.localize("MGT2.Skills."+specId);
                            context.combatSkills[skillId+"."+specId] = label + " (" + specLabel + ")";
                        }
                    }
                } else if (skill.combat) {
                    context.combatSkills[skillId] = skill.label?skill.label:game.i18n.localize("MGT2.Skills."+skillId);
                }
            }
        } else if (item.type === "cargo") {
            context.availability = {};
            context.haveAvailability = {};
            context.purchaseTraits = {};
            context.saleTraits = {};

            context.availability[""] = "";
            if (!item.hasCargoAvailability("All")) {
                if (!item.system.cargo.availability) {
                    context.availability["All"] = game.i18n.localize("MGT2.Trade.All");
                }
                for (let trait in CONFIG.MGT2.TRADE.codes) {
                    if (!hasTrait(context.item.system.cargo.availability, trait)) {
                        context.availability[trait] = game.i18n.localize("MGT2.Trade." + trait);
                    } else {
                        context.haveAvailability[trait] = game.i18n.localize("MGT2.Trade." + trait);
                    }
                }
            } else {
                context.haveAvailability["All"] = game.i18n.localize("MGT2.Trade.All");
                context.availability = null;
            }
            context.purchaseTraits[""] = "";
            for (let trait in CONFIG.MGT2.TRADE.codes) {
                if (!hasTrait(item.system.cargo.purchaseDM, trait)) {
                    context.purchaseTraits[trait] = game.i18n.localize("MGT2.Trade." + trait);
                }
            }
            context.saleTraits[""] = "";
            for (let trait in CONFIG.MGT2.TRADE.codes) {
                if (!hasTrait(item.system.cargo.saleDM, trait)) {
                    context.saleTraits[trait] = game.i18n.localize("MGT2.Trade." + trait);
                }
            }
        } else if (item.type === "term") {
            context.showRandom = true;
            if (item.parent && item.parent.type === "traveller") {
                context.showRandom = false;
                // We don't save this, but makes the HTML template logic a lot simpler.
                item.system.term.randomTerm = false;
            }
        } else if (item.type === "role") {
            context.CHARACTERISTIC_SELECT = {
                "": "-",
                "STR": "STR",
                "DEX": "DEX",
                "END": "END",
                "INT": "INT",
                "EDU": "EDU",
                "SOC": "SOC"
            }
            context.SKILL_SELECT = {
                "": "None"
            };
            let allSkills = MGT2.SKILLS;
            for (let skillId in allSkills) {
                let skill = allSkills[skillId];
                context.SKILL_SELECT[skillId] = skill.label?skill.label:game.i18n.localize("MGT2.Skills."+skillId);
                if (skill.specialities) {
                    for (let specId in skill.specialities) {
                        let spec = skill.specialities[specId];
                        let label = skill.label?skill.label:game.i18n.localize("MGT2.Skills."+skillId);
                        let specLabel = spec.label?spec.label:game.i18n.localize("MGT2.Skills."+specId);
                        context.SKILL_SELECT[skillId+"."+specId] = label + " (" + specLabel + ")";
                    }
                }
            }

            context.ACTION_TYPE = {
                "chat": game.i18n.localize("MGT2.Role.ChatType"),
                "skill": game.i18n.localize("MGT2.Role.SkillType"),
                "weapon": game.i18n.localize("MGT2.Role.WeaponType"),
                "special": game.i18n.localize("MGT2.Role.SpecialType")
            }

            context.weapons = {};
            context.weapons[""] = "";
            if (context.item.parent && context.item.parent.type === "spacecraft") {
                const spacecraft = context.item.parent;
                console.log(spacecraft);
                for (let i of spacecraft.items) {
                    if (i.type === "hardware" && i.system.hardware.system === "weapon") {
                        console.log(i);
                        context.weapons[i._id] = i.name;
                    }
                }
            }

            context.SPECIAL_ROLES = {
                "pilot": game.i18n.localize("MGT2.Role.Special.MakePilot"),
                "tacticsInit": game.i18n.localize("MGT2.Role.Special.CombatTactics"),
                "improveInit": game.i18n.localize("MGT2.Role.Special.ImproveInitiative"),
                "evade": game.i18n.localize("MGT2.Role.Special.Evade"),
                "repair": game.i18n.localize("MGT2.Role.Special.Repair"),
            }
        }
        if (context.item.system.computer && context.item.parent) {
            // This item has an embedded computer.
            context.SOFTWARE = [];
            let found = [];
            for (let s of context.item.system.computer.software) {
                let software = context.item.parent.items.get(s);
                if (software) {
                    context.SOFTWARE.push(software);
                    found.push(s);
                }
            }
            // It's easier to track what we found, than it is to track what wasn't
            // found and then remove them from the list.
            if (found.length !== context.item.system.computer.software.length) {
                context.item.update({"system.computer.software": found });
            }
        }

        if (context.item.system.component) {
            // A component is an item that can be attached (linked) to a parent component.
            context.LINK_OPTIONS = {};
            context.LINK_TYPES = {
                "": "Any",
                "armour": "Armour",
                "weapon": "Weapons"
            }
            if (context.item.parent && ["npc", "traveller"].includes(context.item.parent.type)) {
                // Only look for linkable items if on an actor.
                let component = context.item.system.component;
                context.LINK_OPTIONS[""] = "-";
                let foundHardware = false;
                for (let i of context.item.parent.items) {
                    if (component.type) {
                        if (component.type !== i.type) {
                            //continue;
                        }
                    }
                    if (i.system.links) {
                        console.log("Linkable " + i.name);
                        context.LINK_OPTIONS[i._id] = i.name;
                        if (i._id === component.linkedTo) {
                            foundHardware = true;
                        }
                    }
                }
            }
            console.log(context.LINK_TYPES);
        }
        if (context.item.system.links) {
            context.LINKED_COMPONENTS = [];
            let found = [];
            for (let s of context.item.system.links.components) {
                let c = context.item.parent.items.get(s);
                if (c) {
                    context.LINKED_COMPONENTS.push(c);
                    found.push(s);
                }
            }
            // It's easier to track what we found, than it is to track what wasn't
            // found and then remove them from the list.
            if (found.length !== context.item.system.links.components.length) {
                context.item.update({"system.links.components": found });
            }

        }

        return context;
    }

    /* -------------------------------------------- */
    calculateHardware(context, item) {
        // This is run for all hardware, even if not part of a ship.
        if (item.system.hardware.system === "computer") {
            let tl = parseInt(item.system.tl);
            let bw = 0;
            if (tl > 6) {
                tl = "" + Math.min(15, tl);
                bw = MGT2.COMPUTERS.techLevel[tl].computer;
                if (item.system.hardware.isComputerCore) {
                    bw = MGT2.COMPUTERS.techLevel[tl].core;
                }
            }
            if (bw !== parseInt(item.system.hardware.rating)) {
                item.system.hardware.rating = bw;
                item.update({"system.hardware.rating": bw});
            }
        }
    }

    calculateShipHardware(context, item) {
        console.log("calculateShipHardware: " + item.name);

        let ship = item.parent;
        if (ship === null || ship.type !== "spacecraft") {
            return;
        }

        if (!item.system.status) {
            switch (item.system.hardware.system) {
                case "power": case "j-drive": case "m-drive":
                case "r-drive":case "computer": case "weapon":
                case "bridge": case "sensor":
                    item.system.status = MgT2Item.ACTIVE;
                    item.update({"system.status": item.system.status });
                    break;
            }
        }

        // We only do this if the item is part of an existing ship.
        let shipTons = ship.system.spacecraft.dtons;
        // Take a record of the starting values for the item.
        let itemCost = item.system.cost;
        let itemTons = parseFloat(item.system.hardware.tons);
        let itemPower = item.system.hardware.power;
        let itemRating = item.system.hardware.rating;

        // Calculate armour tonnage.
        if (item.system.hardware.system === "armour") {
            let tons = parseFloat(item.system.hardware.tons);
            let percent = parseFloat(item.system.hardware.tonnage.percent);
            var multiplier = getArmourMultiplier(ship);
            var armour = parseInt(item.system.hardware.rating);

            item.system.hardware.tons = (armour * shipTons * percent * multiplier) / 100.0;
            item.system.cost = toFloat(item.system.hardware.tonnage.cost * item.system.hardware.tons);
        } else if (item.system.hardware.system === "bridge") {
            let cost = Math.ceil(shipTons / 100) * 0.5;
            let tons = 3;
            let bridgeType = item.system.hardware.bridgeType;

            if (shipTons <= 50) {
                if (bridgeType === "cockpit") {
                    tons = 1.5
                    cost = 0.01;
                } else if (bridgeType === "dualCockpit") {
                    tons = 2.6;
                    cost = 0.015;
                } else {
                    tons = 3;
                }
            } else if (shipTons > 5000) {
                tons = 40 + 20 * Math.ceil(shipTons / 100000);
                if (bridgeType === "small") {
                    tons -= 20;
                }
                if (bridgeType === "command") {
                    tons += 40;
                    cost += 30;
                }
            } else {
                let breakPoints = [ 50, 99, 200, 1000, 2000, 100000, 200000, 300000 ];
                let bridgeTons = [ 3, 6, 10, 20, 40, 60, 80, 100 ];

                let i = 0;
                for (i=0; i < breakPoints.length; i++) {
                    if (shipTons <= breakPoints[i + ((bridgeType === "small")?1:0)]) {
                        break;
                    }
                }
                tons = bridgeTons[i];
            }
            if (bridgeType === "small") {
                cost *= 0.5;
            }
            item.system.cost = cost;
            item.system.hardware.tons = tons;
        } else if (item.system.hardware.system === "computer") {
            let cost = itemCost;
            if (item.system.hardware.isComputerCore) {
                switch (Number(item.system.tl)) {
                    case 9:
                        cost = 45;
                        break;
                    case 10:
                        cost - 60;
                        break;
                    case 11:
                        cost = 75;
                        break;
                    case 12:
                        cost = 80;
                        break;
                    case 13:
                        cost = 95;
                        break;
                    case 14:
                        cost = 120;
                        break;
                    case 15:
                        cost = 130;
                        break;
                    default:
                        cost = 0;
                }
            } else {
                switch (Number(item.system.tl)) {
                    case 7: case 8:
                        cost = 0.03;
                        break;
                    case 9: case 10:
                        cost = 0.16;
                        break;
                    case 11:
                        cost = 2;
                        break;
                    case 12:
                        cost = 5;
                        break;
                    case 13:
                        cost = 10;
                        break;
                    case 14:
                        cost = 20;
                        break;
                    case 15:
                        cost = 30;
                        break;
                    default:
                        cost = 0;
                }
            }
            if (item.system.hardware.isComputerBis && item.system.hardware.isComputerFib) {
                cost *= 2
            } else if (item.system.hardware.isComputerBis || item.system.hardware.isComputerFib) {
                cost *= 1.5;
            }
            item.system.cost = cost;
        } else if (item.system.hardware.system === "fuel") {
            let tons = parseFloat(item.system.hardware.tons);
            let rating = parseFloat(item.system.hardware.rating);
            item.system.hardware.cost = 0;
            item.system.hardware.tons = rating;
        } else if (item.system.hardware.system === "power") {
            let powerPerTon = parseInt(item.system.hardware.powerPerTon);
            let tons = parseInt(item.system.hardware.tons);
            let rating = parseInt(item.system.hardware.rating);

            if (powerPerTon < 1) {
                item.system.hardware.powerPerTon = 1
                item.update({"system.hardware.powerPerTon": 1});
            } else {
                if (parseInt(rating / powerPerTon) !== tons) {
                    tons = parseInt(rating / powerPerTon);
                    if (tons < 1) tons = 1;
                }
            }
            item.system.hardware.tons = tons;
            item.system.cost = item.system.hardware.tonnage.cost * tons;
            item.system.hardware.power = rating;
        } else if (item.system.hardware.system === "weapon") {
            let availableWeapons = [];
            let activeWeapons = [];
            if (item.system.hardware.weapons) {
                for (let wpnId in item.system.hardware.weapons) {
                    let wpn = ship.items.get(wpnId);
                    if (wpn) {
                        activeWeapons.push(wpn);
                    } else {
                        console.log(`Weapon [${wpnId}] does not exist in [${item.name}]`);
                        delete item.system.hardware.weapons[wpnId];
                        item.update({"system.hardware.weapons": item.system.hardware.weapons});
                    }
                }
            }

            for (let wpn of ship.items) {
                if (wpn.type === "weapon" && wpn.system.weapon.scale === "spacecraft") {
                    availableWeapons.push(wpn);
                }
            }
            context.availableWeapons = availableWeapons;
            context.activeWeapons = activeWeapons;
        } else if (item.system.hardware.system === "j-drive" || item.system.hardware.system === "m-drive" || item.system.hardware.system === "r-drive") {
            let tonnage = 0;
            let tl = item.system.tl;
            let h = item.system.hardware;
            let pow = h.power;
            if (MGT2.SHIP_HARDWARE[h.system].rating[h.rating]) {
                let d = MGT2.SHIP_HARDWARE[h.system].rating[h.rating];
                tonnage = (d.tonnage * ship.system.spacecraft.dtons) / 100.0;
                tl = d.tl;
                pow = (d.power * ship.system.spacecraft.dtons) / 100.0;
            }
            if (MGT2.SHIP_HARDWARE[h.system].tonnage) {
                tonnage += MGT2.SHIP_HARDWARE[h.system].tonnage;
            }
            if (MGT2.SHIP_HARDWARE[h.system].minimum) {
                tonnage = Math.max(tonnage, MGT2.SHIP_HARDWARE[h.system].minimum);
            }
            let cost = tonnage * MGT2.SHIP_HARDWARE[h.system].cost;
            if (h.advancement && h.advancement !== "standard" && MGT2.SPACECRAFT_ADVANCES[h.advancement]) {
                tl += MGT2.SPACECRAFT_ADVANCES[h.advancement].tl;
                tonnage = tonnage * MGT2.SPACECRAFT_ADVANCES[h.advancement].tonnage;
                cost = cost * MGT2.SPACECRAFT_ADVANCES[h.advancement].cost;
            }
            item.system.cost = cost;
            item.system.hardware.power = pow;
            item.system.hardware.tons = tonnage;

            if (tl !== item.system.tl) {
                item.system.tl = tl;
                item.update({"system": item.system});
            }
        } else if (item.system.hardware.system === "common") {
            let h = item.system.hardware;
            let rating = h.rating;
            if (rating < 0) {
                rating = 0;
            }
            item.system.hardware.tons = rating;
            item.system.cost = rating * 0.1;
        } else if (["sensor", "stateroom", "weapon"].includes(item.system.hardware.system)) {
            // Use manual values.
        } else {
            let cost = itemCost;
            let power = itemPower;
            let percent = parseFloat(item.system.hardware.tonnage.percent);
            let rating = parseInt(item.system.hardware.rating);
            let base = parseFloat(item.system.hardware.tonnage.tons);

            item.system.hardware.tons = base + (shipTons * percent * rating) / 100.0;

            if (parseFloat(item.system.hardware.tonnage.cost) > 0) {
                item.system.cost = parseFloat(item.system.hardware.tonnage.cost * item.system.hardware.tons);
            }
            if (parseFloat(item.system.hardware.powerPerTon) > 0) {
                item.system.hardware.power = parseFloat(item.system.hardware.powerPerTon) * item.system.hardware.tons;
            }
        }
        calculateHardwareAdvantages(item);

        item.system.cost = Number(item.system.cost);
        if (isNaN(item.system.cost)) {
            item.system.cost = 0;
        }
        item.system.cost = Number(item.system.cost.toFixed(3));
        item.system.hardware.tons = Number(item.system.hardware.tons);
        if (isNaN(item.system.hardware.tons)) {
            item.system.hardware.tons = 0;
        }
        item.system.hardware.tons = Number(item.system.hardware.tons.toFixed(3));

        if (itemCost !== item.system.cost || itemTons != item.system.hardware.tons || itemPower != item.system.hardware.power) {
            item.update({"system": item.system});
        }
    }


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

        html.find(".quantity-inc").click(ev => this._incrementQuantity(this.item));
        html.find(".quantity-dec").click(ev => this._decrementQuantity(this.item));
        html.find(".quantity-roll").click(ev => this._rollQuantity(this.item));

        // Role Items
        html.find(".role-action-add").click(ev => this._addRollAction(this.item));

        html.find(".role-action-delete").click(ev => {
            const d = $(ev.currentTarget).parents(".role-action");
            const id = d.data("actionId");
            this._deleteRollAction(this.item, id)
        });

        html.find(".show-effects").click(ev => {
            this.item.update({"system.showEffects": true });
        });

        html.find(".hide-effects").click(ev => {
            this.item.update({"system.showEffects": false });
        });

        html.find(".allow-links").click(ev => {
           this.item.system.links = {
               "components": []
           }
           this.item.update({"system.links": this.item.system.links });
        });
        html.find(".disallow-links").click(ev => {
            this.item.system.links = null;
            this.item.update({"system.-=links": null });
        });

        html.find(".link-component").click(ev => {
           this.item.system.component = {
               "linkedTo": null,
               "type": "",
               "slots": 0
           }
           this.item.update({"system.component": this.item.system.component });
        });
        html.find(".unlink-component").click(ev => {
            this.item.system.component = null;
            this.item.update({[`system.-=component`]: null});
        });
        html.find(".linkedTo").click(ev => {
            let selected = $(ev.currentTarget).val();

            // Remove from previous parent
            let previousId = this.item.system.component.linkedTo;
            let previousItem = this.item.parent.items.get(previousId);
            if (previousItem?.system?.links?.components) {
                let list = previousItem.system.links.components;
                previousItem.system.links.components = list.filter(i => i !== this.item._id);
                previousItem.update({"system.links.components": previousItem.system.links.components });
            }
            // Now attach to new parent
            let attachItem = this.item.parent.items.get(selected);
            if (attachItem && attachItem.system.links.components) {
                let components = attachItem.system.links.components;
                if (!components.includes(this.item._id)) {
                    components.push(this.item._id);
                }
                attachItem.update({"system.links.components": components });
            }
        });

        html.find(".embed-computer").click(ev => {
           this.item.system.computer = {
               "processing": 0,
               "software": []
           }
           this.item.update({"system.computer": this.item.system.computer });
        });
        html.find(".remove-computer").click(ev => {
           this.item.system.comuter = null;
           this.item.update({[`system.-=computer`]: null});
        });
        html.find(".exec-software").click(ev => {
           console.log("SOFTWARE EXEC");
           const p = $(ev.currentTarget).parents(".item");
           const id = p.data("id");
           console.log(id);

           const software = this.item.parent.items.get(id);
           this.item.execSoftware(software);

        });

        html.find(".item-add-wpn").click(ev => {
           const w = $(ev.currentTarget).parents(".ship-weapon");
           const id = w.data("itemId");
           if (this.item.system.hardware) {
               const hardware = this.item.system.hardware;
               if (!hardware.weapons) {
                   hardware.weapons = {};
               }
               // Can it fit?
               let currentWeapons = 0;
               for (let w in hardware.weapons) {
                   currentWeapons += hardware.weapons[w].quantity;
               }
               console.log("Current count " + currentWeapons);
               let maxWeapons = parseInt(hardware.mount.replaceAll(/[^0-9]/g, ""));
               if (isNaN(maxWeapons)) maxWeapons = 1;
               if (currentWeapons < maxWeapons) {
                   if (hardware.weapons[id]) {
                       hardware.weapons[id].quantity++;
                   } else {
                       hardware.weapons[id] = {"active": true, "quantity": 1};
                   }
                   this.item.update({"system.hardware.weapons": hardware.weapons});
               }
           }
        });

        html.find(".item-del-wpn").click(ev => {
            const w = $(ev.currentTarget).parents(".ship-weapon");
            const id = w.data("itemId");
            if (this.item.system.hardware) {
                if (this.item.system.hardware.weapons) {
                    if (this.item.system.hardware.weapons[id]) {
                        let q = parseInt(this.item.system.hardware.weapons[id].quantity);
                        if (q > 1) {
                            this.item.update({[`system.hardware.weapons.${id}.quantity`]: q-1});
                        } else {
                            this.item.update({[`system.hardware.weapons.-=${id}`]: null});
                        }
                    }
                }
            }
        });

        html.find(".energy-remove").click(ev => {
            const e = $(ev.currentTarget).parents(".energy-pill");
            const id = e.data("energyId");
            console.log(id);
            console.log(`[${this.item.system.armour.otherTypes}]`);

            let otherTypes = this.item.system.armour.otherTypes.toLowerCase();
            otherTypes = otherTypes.replace(id, "");
            otherTypes = otherTypes.replace("  ", "").trim();

            this.item.update({"system.armour.otherTypes": otherTypes});
        });

        html.find(".energy-selector").click(ev => {
            const value = $(ev.currentTarget).val();
            let otherTypes = this.item.system.armour.otherTypes.toLowerCase();
            otherTypes += " " + value;

            this.item.update({"system.armour.otherTypes": otherTypes.trim()});

        });

        html.find(".item-status").click(ev => {
           this.item.statusClick();
        });

        if (this.item.type === "weapon") {
            html.find(".trait-selector").click(ev => {
                const value = $(ev.currentTarget).val();
                this._selectWeaponTrait(value);
            });

            html.find(".trait-remove").click(ev => {
                const e = $(ev.currentTarget).parents(".weapon-pill");
                this._removeWeaponTrait(e.data("traitId"));
            });
            html.find(".trait-minus").click(ev => {
                const value = $(ev.currentTarget).parents(".weapon-pill");
                this._modifyWeaponTrait(value.data("traitId"), ev.shiftKey ? -5 : -1);
            })
            html.find(".trait-plus").click(ev => {
                const value = $(ev.currentTarget).parents(".weapon-pill");
                this._modifyWeaponTrait(value.data("traitId"), ev.shiftKey ? 5 : 1);
            })
        } else if (this.item.type === "cargo") {
            html.find(".availability-selector").click(ev => {
                const value = $(ev.currentTarget).val();
                if (value) {
                    if (this.item.system.cargo.availability.length > 0) {
                        this.item.system.cargo.availability += `, ${value}`;
                    } else {
                        this.item.system.cargo.availability = `${value}`;
                    }
                    this.item.update({"system.cargo": this.item.system.cargo});
                }
            });
            html.find(".avail-remove").click(ev => {
                const e = $(ev.currentTarget).parents(".cargo-pill");
                this._removeCargoTrait("availability", e.data("traitId"));
            });

            html.find(".purchase-selector").click(ev => {
                const value = $(ev.currentTarget).val();
                if (value) {
                    if (this.item.system.cargo.purchaseDM.length > 0) {
                        this.item.system.cargo.purchaseDM += `, ${value} 0`;
                    } else {
                        this.item.system.cargo.purchaseDM = `${value} 0`;
                    }
                    this.item.update({"system.cargo": this.item.system.cargo});
                }
            });

            html.find(".sale-selector").click(ev => {
                const value = $(ev.currentTarget).val();
                if (value) {
                    if (this.item.system.cargo.saleDM.length > 0) {
                        this.item.system.cargo.saleDM += `, ${value} 0`;
                    } else {
                        this.item.system.cargo.saleDM = `${value} 0`;
                    }
                    this.item.update({ "system.cargo": this.item.system.cargo });
                }
            });

            html.find(".trait-remove").click(ev => {
                const e = $(ev.currentTarget).parents(".cargo-pill");
                let field = null;
                if (e.parents(".purchase").length === 1) {
                    field = "purchaseDM";
                } else if (e.parents(".sale").length === 1) {
                    field = "saleDM";
                }
                this._removeCargoTrait(field, e.data("traitId"));
            });
            html.find(".trait-minus").click(ev => {
                const value = $(ev.currentTarget).parents(".cargo-pill");
                let field = null;
                if (value.parents(".purchase").length === 1) {
                    field = "purchaseDM";
                } else if (value.parents(".sale").length === 1) {
                    field = "saleDM";
                }
                this._modifyCargoTrait(value.data("traitId"), field, -1);
            })
            html.find(".trait-plus").click(ev => {
                const value = $(ev.currentTarget).parents(".cargo-pill");
                let field = null;
                if (value.parents(".purchase").length === 1) {
                    field = "purchaseDM";
                } else if (value.parents(".sale").length === 1) {
                    field = "saleDM";
                }
                this._modifyCargoTrait(value.data("traitId"), field, 1);
            })
        } else if (this.item.type === "hardware") {
            html.find(".advantage-selector").click(ev => {
                const value = $(ev.currentTarget).val();
                if (value) {
                    let adv = this.item.system.hardware.advantages;
                    if (adv == null) {
                        adv = "";
                    }
                    console.log(adv);
                    let count = this.item.getAdvantage(value);
                    if (count > 0) {
                        console.log(`${value}: ${count}`);
                        let reg = new RegExp(`(^|[, ])${value}[^,]*($|[, ])`, "gi");
                        adv = adv.replace(reg, "").replace(/[ ,]*$/g, "");
                        count++;
                    } else {
                        count = 1;
                    }
                    if (adv.trim().length > 2) {
                        adv = adv + ", " + value + " " + count;
                    } else {
                        adv = value + " " + count;
                    }
                    this.item.update({"system.hardware.advantages": adv});
                }
            });
            html.find(".advantage-remove").click(ev => {
                const e = $(ev.currentTarget).parents(".advantage-pill");
                this._removeAdvantage(e.data("advantageId"));
            });
        }
    }

    async _removeAdvantage(selectedAdvantage) {
        let reg = new RegExp(`(^|[, ])${selectedAdvantage}[^,]*($|[, ])`, "gi");
        let advantages = this.item.system.hardware.advantages.replace(reg, "").replace(/[ ,]*$/g, "");
        this.item.system.hardware.advantages = advantages;
        await this.item.update({
            'system.hardware.advantages': advantages
        });
    }

    async _modifyCargoTrait(trait, field, modifier) {
        console.log(`_modifyCargoTrait: [${trait}] [${field}] [${modifier}]`);
        const traitData = MGT2.TRADE.codes[trait];
        if (traitData) {
            const text = this.item.getCargoTrait(field, trait);
            if (traitData) {
                let value = parseInt(text.replace(/[^-0-9]/g, ""));
                value += parseInt(modifier);
                value = Math.min(12, value);
                value = Math.max(-12, value);
                // We can change.
                const updated = trait + " " + value;
                let traits = this.item.system.cargo[field];
                let reg = new RegExp(`${trait}[^,$]*`, "g");
                this.item.system.cargo[field] = traits.replace(reg, updated);
                await this.item.update({"system.cargo": this.item.system.cargo});
            }
        }
    }

    async _removeCargoTrait(field, trait) {
        console.log(`_removeCargoTrait: [${field}] [${trait}]`);
        let reg = new RegExp(`(^|[, ])${trait}[^,]*($|[, ])`, "gi");
        let traits = this.item.system.cargo[field].replace(reg, "").replace(/[ ,]*$/g, "");
        this.item.system.cargo[field] = traits;
        await this.item.update({
            'system.cargo': this.item.system.cargo
        });
    }

    async _selectWeaponTrait(selectedTrait) {
        const traitData = MGT2.WEAPONS.traits[selectedTrait];
        if (traitData) {
            let traitText = selectedTrait;

            if (traitData.value !== undefined) {
                traitText += ` ${traitData.value}`;
            }
            if (this.item.system.weapon.traits && this.item.system.weapon.traits.length > 0) {
                this.item.system.weapon.traits += ", " + traitText;
            } else {
                this.item.system.weapon.traits = traitText;
            }
        }
        await this.item.update({'system.weapon.traits': this.item.system.weapon.traits });
    }

    async _removeWeaponTrait(trait) {
        let reg = new RegExp(`(^|[, ])${trait}[^,]*($|[, ])`, "gi");
        let traits = this.item.system.weapon.traits.replace(reg, "").replace(/[ ,]*$/g, "");
        await this.item.update({
            'system.weapon.traits': traits
        });
    }

    async _modifyWeaponTrait(trait, modifier) {
        console.log(`_modifyWeaponTrait: [${trait}] [${modifier}]`);
        const traitData = MGT2.WEAPONS.traits[trait];
        if (traitData) {
            const text = this.item.getWeaponTrait(trait);
            console.log(text);
            if (traitData.value !== undefined) {
                let value = parseInt(text.replace(/[^-0-9]/g, ""));
                if (Math.abs(modifier) > 1 && Math.abs(value) > 100) {
                    let m = Math.abs(parseInt(Math.log10(value)));
                    modifier *= Math.pow(10, m - 1);
                }

                value += parseInt(modifier);
                if (value < traitData.min) {
                    // Too low, don't change.
                    value = traitData.min;
                } else if (value > traitData.max) {
                    // Too high, don't change.
                    value = traitData.max;
                }
                // We can change.
                const updated = trait + " " + value;
                let traits = this.item.system.weapon.traits;
                let reg = new RegExp(`${trait}[^,$]*`, "g");
                await this.item.update({'system.weapon.traits': traits.replace(reg, updated)});
            }
        }

    }

    _rollDamage(item) {
        console.log("_rollDamage:");
        if (item.system.weapon.scale === "spacecraft") {
            rollSpaceAttack(null, null, item, {
                "skillDM": 0,
                "dm": 0,
                "range": "medium"
            });
        } else {
            rollAttack(null, item, {"skillDM": 0, "dm": 0});
        }
    }

    _incrementQuantity(item) {
        if (item.type === "role") {
            item.system.role.positions++;
            item.update({"system.role.positions": item.system.role.positions });
        } else if (item.system.quantity !== undefined) {
            item.system.quantity++;
            item.update({"system.quantity": item.system.quantity });
        }
    }

    _decrementQuantity(item) {
        if (item.type === "role") {
            if (item.system.role.positions > 1) {
                item.system.role.positions--;
                item.update({"system.role.positions": item.system.role.positions});
            }
        } else if (item.system.quantity && parseInt(item.system.quantity) > 0) {
            item.system.quantity--;
            item.update({"system.quantity": item.system.quantity });
        }
    }

    // Used by cargo items.
    async _rollQuantity(item) {
        if (item.system.quantity !== undefined && item.system.cargo.tons !== undefined) {
            let tons = item.system.cargo.tons;
            let roll = await new Roll(tons, null).evaluate();
            let quantity = parseInt(roll.total);
            item.system.quantity = quantity;
            item.update({"system.quantity": item.system.quantity });
        }
    }

    _addRollAction(item) {
        console.log(item.system);
        let actions = item.system.role.actions;

        if (!actions) {
            actions = {};
            actions[Date.now().toString(36)-1] = {
                "action": item.system.role.action,
                "skill": item.system.role.skill,
                "characteristic": item.system.role.characteristic,
                "chat": item.system.chat
            }
        }
        actions[Date.now().toString(36)] = {
            "title": "Action",
            "action": "chat",
            "chat": ""
        }
        item.update({"system.role.actions": actions });
    }

    _deleteRollAction(item, id) {
        let actions = item.system.role.actions;
        item.update({[`system.role.actions.-=${id}`]: null});
    }

}
