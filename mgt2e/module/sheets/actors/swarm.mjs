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
            this.weaponItem = context.weaponItem;

            let targetId = this.actor.system?.salvo?.targetId;
            if (targetId) {
                console.log("Have a target id set");
                this.targetActor = await fromUuid(targetId);
                if (this.targetActor) {
                    context.SMART_DM = this.getSmartDM(this.targetActor);
                    context.SIZE_DM = this.getSizeDM(this.targetActor);
                }
                context.targetActor = this.targetActor;
            } else {
                this.targetActor = null;
            }

        } else if (this.actor.system.swarmType === "squadron") {
            context.type = "squadron";
            // HITS, divided between all fighters.
            // Multiple types of fighters. Count of each type.
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
        html.find('.size-dec').click(ev => this.modifySize(-1));
        html.find('.size-inc').click(ev => this.modifySize(+1));
        html.find('.end-dec').click(ev => this.modifyEndurance(-1));
        html.find('.end-inc').click(ev => this.modifyEndurance(+1));

        return;
    }

    selectTarget() {
        console.log("selectTargetAction:");

        let selected = Tools.getSelected();
        console.log(selected);
        for (let token of selected) {
            console.log(token.name);
            if (token.document.actor._id === this.actor._id) {
                console.log("Not me");
                continue;
            }
            if (token.document.actor.type !== "spacecraft") {
                console.log("Not a spacecraft");
                console.log(token.document.actor.type);
                continue;
            }
            console.log(token.document.uuid);
            console.log("Selected target " + token.document.actor.name);
            this.targetActor = token.document.actor;
            this.actor.update({"system.salvo.targetId": token.document.actor.uuid });
        }
        this.render(true);
    }

    modifySize(value) {
        let s = parseInt(this.actor.system.size.value) + value;
        s = Math.max(0, s);
        s = Math.min(this.actor.system.size.max, s);
        this.actor.update({"system.size.value": s});
    }
    modifyEndurance(value) {
        let s = parseInt(this.actor.system.salvo.endurance.value)+ value;
        s = Math.max(0, s);
        s = Math.min(this.actor.system.salvo.endurance.max, s);
        this.actor.update({"system.salvo.endurance.value": s});
    }

    preUpdateActor() {
        // nothing
    }

    getSmartDM(targetActor) {
        if (this.actor.system.salvo && targetActor) {
            console.log(this.actor);
            let smartTL = parseInt(this.actor.system.salvo?.tl);
            console.log(targetActor);
            let targetTL = parseInt(targetActor.system.spacecraft.tl);

            if (targetTL > smartTL) {
                return 1;
            } else {
                return Math.min(6, smartTL - targetTL);
            }
        } else {
            return 0;
        }
    }

    getSizeDM(targetActor) {
        if (this.actor.system.salvo && targetActor) {
            if (targetActor.system.spacecraft.dtons >= 2000) {
                return 0;
            }
            let dm = 0;
            if (this.weaponItem) {
                if (this.weaponItem.hasTrait("torpedo")) {
                    dm = -2;
                }
            }
            return dm;
        } else {
            return 0;
        }
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
            "attackDM": attackDM,
            "salvoSize": size
        };
        new MgT2MissileAttackApp(this.actor, targetActor, weaponItem, attackOptions).render(true);
        //rollSpaceAttack(this.actor, null, weaponItem, attackOptions);
    }
}
