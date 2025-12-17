import {MgT2ActorSheet} from "../actor-sheet.mjs";
import {MgT2MissileAttackApp} from "../../helpers/dialogs/missile-attack-app.mjs";
import {createSpeculativeGoods} from "../../helpers/utils/trade-utils.mjs";
import {Tools} from "../../helpers/chat/tools.mjs";
import {rollSpaceAttack} from "../../helpers/dice-rolls.mjs";

// This is a very simplified Spacecraft sheet.
export class MgT2SwarmActorSheet extends MgT2ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "actor"],
            template: "systems/mgt2e/templates/actor/actor-swarm-sheet.html",
            width: 520,
            height: 360,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
        });
    }

    get template() {
        return "systems/mgt2e/templates/actor/actor-swarm-sheet.html";
    }

    prepareBaseData() {
        // Nothing to prepare.
    }

    prepareDerivedData() {
        // Nothing to prepare.
    }

    _preUpdate(changes, options, user) {
        // Do thing.
    }

    async getData() {
        const context = await super.getData();
        console.log("MgT2SwarmActorSheet.getData:");
        console.log(this.actor);

        context.shipActor = await fromUuid(this.actor.system.sourceId);
        if (this.actor.system.swarmType === "salvo") {
            context.type = "salvo";
            context.weaponItem = await fromUuid(this.actor.system.salvo.weaponId);
            if (context.weaponItem) {
                context.damage = context.weaponItem.system.weapon.damage;
            }

            context.TARGET_ICON = "systems/mgt2e/icons/misc/unknown-target.svg";
            let targetId = this.actor.system?.salvo?.targetId;
            if (targetId) {
                this.targetActor = await fromUuid(targetId);
                if (this.targetActor) {
                    context.TARGET_ICON = this.targetActor.img;
                }
            } else {
                this.targetActor = null;
            }

        } else if (this.actor.system.swarmType === "squadron") {

        } else {
            context.type = "unknown";
        }

        return context;
    }

    _onDrop(event) {
        // Nothing
    }

    _prepareItems(context) {
        return;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.selectTarget').click(ev => {
           this.selectTarget();
        });

        html.find('.button-roll-impact').click(ev => {
            console.log("yes");
            this.rollImpact();
        });

        return;
    }

    selectTarget() {
        console.log("selectTargetAction:");

        let selected = Tools.getSelected();
        console.log(selected);
        if (selected.length > 0) {
            let token = selected[0];
            console.log(token.document.uuid);
            this.targetActor = token.document.actor;
            this.actor.update({"system.salvo.targetId": token.document.actor.uuid });
        }
        this.render();
    }

    preUpdateActor() {
        // nothing
    }

    async rollImpact() {
        let targetId = this.actor.system?.salvo?.targetId;
        let targetActor = await fromUuid(targetId);
        if (!targetActor) {
            ui.notifications.warn("No target specified");
            return;
        }

        let dmg = this.actor.system.salvo.damage;
        let size = parseInt(this.actor.system.size.value);
        let smartTL = parseInt(this.actor.system.salvo.tl);
        let targetTL = parseInt(targetActor.system.spacecraft.tl);

        if (size < 1) {
            ui.notifications.warn("There are no missiles left in the salvo");
            return;
        }
        let weaponItem = await fromUuid(this.actor.system.salvo.weaponId);


        let smartDM = 1;
        if (targetTL > smartTL) {
            smartDM = 1;
        } else {
            smartDM = Math.min(6, smartTL - targetTL);
        }

        let attackDM = size + smartDM;

        let attackOptions = {
            "score": attackDM,
            "salvoSize": size
        };
        rollSpaceAttack(this.actor, null, weaponItem, attackOptions);
    }
}
