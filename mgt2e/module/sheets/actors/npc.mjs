import {MgT2ActorSheet} from "../actor-sheet.mjs";
import {MgT2MissileAttackApp} from "../../helpers/dialogs/missile-attack-app.mjs";
import {Tools} from "../../helpers/chat/tools.mjs";
import {MgT2Item} from "../../documents/item.mjs";

// This is a very simplified Spacecraft sheet.
export class MgT2NpcActorSheet extends MgT2ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "actor"],
            template: "systems/mgt2e/templates/actor/actor-simple-npc-sheet.html",
            width: 720,
            height: 500,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }

    get template() {
        return "systems/mgt2e/templates/actor/actor-simple-npc-sheet.html";
    }

    prepareBaseData() {
        // Nothing to prepare.
        console.log("npc.prepareBaseData:");
        super.prepareBaseData();
    }

    prepareDerivedData() {
        // Nothing to prepare.
        console.log("npc.prepareDerivedData");
        super.prepareDerivedData();
    }

    _preUpdate(changes, options, user) {
        // Do thing.
        console.log("_preUpdate:");
    }

    _canDragDrop() {
        return true;
    }

    async _onDrop(event) {
        console.log("npc._onDrop()");
        return super._onDrop(event);
    }

    async getData() {
        const context = await super.getData();
        console.log("MgT2NpcActorSheet.getData:");
        console.log(this.actor);
        context.system = this.actor.system;

        const traits = this.actor.system.characteristics;
        context.TRAITS = [];

        let left = [];
        let right = [];
        for (let t of [ "STR", "DEX", "END" ]) {
            left.push({
                trait: t,
                label: t,
                value: traits[t].current,
            });
        }
        for (let t of [ "INT", "EDU", "SOC" ]) {
            if (traits[t].show) {
                right.push({
                    trait: t,
                    label: t,
                    value: traits[t].current,
                });
            }
        }
        for (let t of [ "PSI", "CHA", "TER", "WLT", "LCK", "MRL", "STY", "RES", "FOL", "REP" ]) {
            if (traits[t].show) {
                if (left.length > right.length) {
                    right.push({
                        trait: t,
                        label: t,
                        value: traits[t].current,
                    });
                } else {
                    left.push({
                        trait: t,
                        label: t,
                        value: traits[t].current,
                    });
                }
            }
        }
        for (let t in left) {
            let row = {};
            row.left = left[t];
            if (right[t]) {
                row.right = right[t];
            }
            context.TRAITS.push(row);
        }

        return context;
    }

    _onDrop(event) {
        // Nothing
    }

    _prepareItems(context) {
        context.GEAR = [];
        context.WEAPONS = [];
        context.activeWeapons = [];

        for (let i of context.items) {
            if (i.type === "weapon") {
                context.WEAPONS.push(i);
                if (i.system.status === MgT2Item.EQUIPPED) {
                    context.activeWeapons.push(i);
                }
            } else {
                if ([ MgT2Item.EQUIPPED, MgT2Item.CARRIED].includes(i.system.status)) {
                    context.GEAR.push(i);
                }
            }
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        console.log("NPC LISTENERS");

        html.find(".item-edit").click(ev => {
            const id = $(ev.currentTarget).data("itemId");
            console.log(id);
            const item = this.actor.items.get(id);
            item.sheet.render(true);
        });
        //html.find('.rollable').click(ev => this._onRollWrapper(ev, this.actor));

        let handler = ev => this._onDragStart(ev);
        html.find('img.actor-draggable').each((i, img) => {
            let options = {};
            options.actorId = img.getAttribute("data-actor-id");
            handler = ev => this._onCrewDragStart(ev, options);
            img.setAttribute("draggable", true);
            img.addEventListener("dragstart", handler, options);
        });

    }

    _onRollWrapper(ev, actor) {
        const target = $(ev.currentTarget);

        if (target.data("attackId")) {
            let itemId = target.data("attackId");
            let item = actor.items.get(itemId);
            item.roll();
        } else if (target.data("skillFqn")) {
            let skillFqn = target.data("skillFqn");
            game.mgt2e.rollSkillMacro(skillFqn, {
                actor: this.actor
            });
        } else if (ev.currentTarget?.dataset?.rollType) {
            // Copied from superclass. We seem to be mixing ways of doing things.
            let dataset = ev.currentTarget.dataset;
            if (dataset.rollType === "item") {
                const itemId = ev.currentTarget.closest('.item').dataset.itemId;
                const item = this.actor.items.get(itemId);
                if (item) return item.roll();
            }
        }
    }

    selectTarget() {

    }


    preUpdateActor() {
        // nothing
    }



    async rollImpact() {

    }
}
