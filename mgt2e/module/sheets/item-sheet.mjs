import {onManageActiveEffect} from "../helpers/effects.mjs";
import {rollAttack, hasTrait, getTraitValue} from "../helpers/dice-rolls.mjs";
import {getArmourMultiplier} from "../helpers/spacecraft.mjs";
import { MGT2 } from "../helpers/config.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MgT2ItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "item"],
            width: 640,
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
        context.system = item.system;
        context.flags = item.flags;
        context.effects = item.effects;
        context.effectTypes = CONFIG.MGT2.EFFECTS;

        if (!context.system.quantity) {
            context.system.quantity = 1;
        }

        context.characteristics = MGT2.CHARACTERISTICS;

        // If this belongs to an actor, the actor might have custom skills, so
        // we need to use the actor's skill list rather than the global one.
        if (context.item.parent && context.item.parent.system.skills) {
            context.skills = context.item.parent.system.skills;
        } else {
            context.skills = MGT2.SKILLS;
        }

        if (context.item.type === "hardware" && context.item.parent != null) {
            this.calculateShipHardware(context, context.item)
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
            console.log(context.energyTypes);
        } else if (context.item.type === "weapon") {
            context.weaponTraits = {};
            context.weaponTraits[""] = "";
            let traits = context.item.system.weapon.traits;
            for (let trait in CONFIG.MGT2.WEAPONS.traits) {
                if (!hasTrait(traits, trait)) {
                    context.weaponTraits[trait] = game.i18n.localize("MGT2.Item.WeaponTrait.Label."+trait);
                }
            }
        }

        return context;
    }

    /* -------------------------------------------- */

    calculateShipHardware(context, item) {
        console.log("calculateShipHardware: " + item.name);

        let ship = item.parent;
        if (ship === null || ship.type !== "spacecraft") {
            return;
        }

        // We only do this if the item is part of an existing ship.
        let shipTons = ship.system.spacecraft.dtons;

        // Calculate armour tonnage.
        if (item.system.hardware.system === "armour") {
            let tons = parseFloat(item.system.hardware.tons);
            let percent = parseFloat(item.system.hardware.tonnage.percent);
            var multiplier = getArmourMultiplier(ship);
            var armour = parseInt(item.system.hardware.rating);

            item.system.hardware.tons = (armour * shipTons * percent * multiplier) / 100.0;
            item.system.cost = parseInt(item.system.hardware.tonnage.cost * item.system.hardware.tons);
            if (tons !== item.system.hardware.tons) {
                item.update({"system.hardware.tons": item.system.hardware.tons})
                item.update({"system.cost": item.system.cost})
            }
        } else if (item.system.hardware.system === "fuel") {
            let tons = parseFloat(item.system.hardware.tons);
            let rating = parseFloat(item.system.hardware.rating);
            if (tons !== rating) {
                item.system.hardware.tons = rating;
                item.update({"system.hardware.tons": item.system.hardware.tons})
                item.update({"system.cost": 0})
            }
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
                if (tons !== parseInt(item.system.hardware.tons)) {
                    item.system.hardware.tons = tons;
                    item.system.cost = item.system.hardware.tonnage.cost * tons;
                    item.update({"system.hardware.tons": item.system.hardware.tons})
                    item.update({"system.cost": item.system.cost})
                }
            }
        } else if (item.system.hardware.system === "weapon") {
            let availableWeapons = [];
            let activeWeapons = [];
            if (item.system.hardware.weapons) {
                for (let wpnId in item.system.hardware.weapons) {
                    let wpn = ship.items.get(wpnId);
                    activeWeapons.push(wpn);
                }
            }

            for (let wpn of ship.items) {
                if (wpn.type === "weapon" && wpn.system.weapon.scale === "spacecraft") {
                    availableWeapons.push(wpn);
                }
            }
            context.availableWeapons = availableWeapons;
            context.activeWeapons = activeWeapons;
        } else {
            let tons = parseFloat(item.system.hardware.tons);
            let percent = parseFloat(item.system.hardware.tonnage.percent);
            let rating = parseInt(item.system.hardware.rating);
            let base = parseInt(item.system.hardware.tonnage.tons);
            let power = parseFloat(item.system.hardware.power);

            item.system.hardware.tons = base + (shipTons * percent * rating) / 100.0;

            if (parseFloat(item.system.hardware.tonnage.cost) > 0) {
                item.system.cost = parseInt(item.system.hardware.tonnage.cost * item.system.hardware.tons);
            }
            if (tons !== item.system.hardware.tons) {
                item.update({"system.hardware.tons": item.system.hardware.tons})
                item.update({"system.cost": item.system.cost})
            }
            if (parseFloat(item.system.hardware.powerPerTon) > 0) {
                item.system.hardware.power = parseFloat(item.system.hardware.powerPerTon) * item.system.hardware.tons;
            }
            if (power !== item.system.hardware.power) {
                item.update({"system.hardware.power": item.system.hardware.power});
            }
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

        html.find(".randomiseRelationship").click(ev => this._randomiseRelationship(this.item));

        // Role Items
        html.find(".role-action-add").click(ev => this._addRollAction(this.item));

        html.find(".role-action-delete").click(ev => {
            const d = $(ev.currentTarget).parents(".role-action");
            const id = d.data("actionId");
            this._deleteRollAction(this.item, id)
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
            const e = $(ev.currentTarget).parents(".energy-item");
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

        html.find(".trait-selector").click(ev => {
            const value = $(ev.currentTarget).val();
            this._selectWeaponTrait(value);
        });

        html.find(".trait-remove").click(ev => {
            const e = $(ev.currentTarget).parents(".trait-item");
            this._removeWeaponTrait(e.data("traitId"));
        });
    }

    async _selectWeaponTrait(selectedTrait) {
        const traitData = MGT2.WEAPONS.traits[selectedTrait];
        if (traitData) {
            let traitText = selectedTrait;

            if (traitData.value) {
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
        const traitData = MGT2.WEAPONS.traits[trait];
        if (traitData) {
            let reg = new RegExp(`${trait}[^,$]*,?`, "g");
            let traits = this.item.system.weapon.traits.toLowerCase().replace(reg, "").replace(/[ ,]*$/g, "");
            await this.item.update({
                'system.weapon.traits': traits
            });
        }
    }

    _rollDamage(item) {
        console.log("_rollDamage:");
        rollAttack(null, item, 0, 0);
    }

    _incrementQuantity(item) {
        if (item.system.quantity) {
            item.system.quantity++;
            item.update({"system.quantity": item.system.quantity });
        }
    }

    _decrementQuantity(item) {
        if (item.system.quantity && parseInt(item.system.quantity) > 1) {
            item.system.quantity--;
            item.update({"system.quantity": item.system.quantity });
        }
    }

    // Used by cargo items.
    _rollQuantity(item) {
        if (item.system.quantity !== undefined && item.system.cargo.tons !== undefined) {
            let tons = item.system.cargo.tons;
            let roll = new Roll(tons, null).evaluate({async: false});
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

    _randomiseRelationship(item) {
        let affinity = "", enmity = "";

        let associate = item.system.associate;
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
        let roll = new Roll(affinity, null).evaluate({async: false});
        associate.affinity = this._getAffinity(roll.total);
        roll = new Roll(enmity, null).evaluate({async: false});
        associate.enmity = 0 - this._getAffinity(roll.total);
        associate.power = this._getPowerOrInfluence();
        associate.influence = this._getPowerOrInfluence();

        item.update({"system.associate": associate});
    }

    _getPowerOrInfluence() {
        const roll = new Roll("2D6", null).evaluate({async: false});
        switch (roll.total) {
            case 2: case 3: case 4: case 5:
                return 0;
            case 6: case 7:
                return 1;
            case 8:
                return 2;
            case 9:
                return 3;
            case 10:
                return 4;
            case 11:
                return 5;
            case 12:
                return 6;
        }
        return 0;
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
}
