import {onManageActiveEffect} from "../helpers/effects.mjs";
import {rollAttack} from "../helpers/dice-rolls.mjs";
import {getArmourMultiplier} from "../helpers/spacecraft.mjs";

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

        if (!context.data.quantity) {
            context.data.quantity = 1;
        }

        context.characteristics = game.system.template.Actor.templates.characteristics.characteristics;

        // If this belongs to an actor, the actor might have custom skills, so
        // we need to use the actor's skill list rather than the global one.
        if (context.item.parent && context.item.parent.system.skills) {
            context.skills = context.item.parent.system.skills;
        } else {
            context.skills = game.system.template.Actor.templates.skills.skills;
        }

        if (context.item.type === "hardware" && context.item.parent != null) {
            this.calculateShipHardware(context.item)
        }

        return context;
    }

    /* -------------------------------------------- */

    calculateShipHardware(item) {
        console.log("calculateShipHardware: " + item.name);

        let ship = item.parent;
        if (ship === null || ship.type !== "spacecraft") {
            return;
        }

        // We only do this if the item is part of an existing ship.
        var shipTons = ship.system.spacecraft.dtons;

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
                item.update({"system.hardware.powerPerTon": 1 });
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
