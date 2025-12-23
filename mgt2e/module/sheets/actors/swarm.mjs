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
                console.log("Have a target id set: " + targetId);
                this.targetActor = await fromUuid(targetId);
                this.targetToken = this.targetActor.token;
                console.log(this.targetActor);
                if (this.targetActor) {
                    context.SMART_DM = this.getSmartDM(this.targetActor);
                    context.SIZE_DM = this.getSizeDM(this.targetActor);
                }
                context.targetToken = this.targetToken;
                context.targetActor = this.targetActor;
            } else {
                this.targetActor = null;
            }
        } else if (this.actor.system.swarmType === "squadron") {
            if (!this.actor.system.squadron) {
                // This isn't created automatically, so create some basic data.
                this.actor.system = {
                    "swarmType": "squadron",
                    "hits": {
                        "value": 0,
                        "max": 0,
                        "damage": 0
                    },
                    "squadron": {
                        "tl": 8,
                        "thrust": 0,
                        "armour": 0,
                        "hull": 0
                    }
                };
                await this.actor.update({"system": this.actor.system });
                this.actor.prototypeToken = {
                    height: 0.5,
                    width: 0.5,
                    sight: {
                        enabled: false
                    },
                    bar1: {
                        attribute: "size"
                    }
                }
                await this.actor.update({"prototypeToken": this.actor.prototypeToken });
                this.render(true);
            }
            context.type = "squadron";
            this._prepareFighters();
            // HITS, divided between all fighters.
            // Multiple types of fighters. Count of each type.
        } else {
            context.type = "unknown";
        }

        return context;
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
            case "Actor":
                return this._onDropActor(event, data);
        }
    }

    async _onDropActor(event, data) {
        if (this.actor.system.swarmType !== "squadron") {
            // Only squadrons can have actors dragged to them. For now.
            return;
        }
        let actor = await fromUuid(data.uuid);
        if (!actor) {
            return;
        }
        if (actor.type !== "spacecraft") {
            // Wrong type.
            return;
        }
        if (actor.system.spacecraft.dtons > 50) {
            ui.notifications.warn("Fighters cannot be heavier than 50 tons");
            return;
        }
        if (!this.actor.system.squadron.fighters) {
            this.actor.system.squadron.fighters = {};
        }
        this.actor.system.squadron.fighters[actor.name] = {
            uuid: actor.uuid,
            img: actor.img,
            dtons: actor.system.spacecraft.dtons,
            hull: parseInt(actor.system.hits.max),
            thrust: parseInt(actor.system.spacecraft.mdrive),
            tl: parseInt(actor.system.spacecraft.tl),
            armour: parseInt(actor.system.spacecraft.armour),
            number: 1
        }
        this.actor.update({"system.squadron.fighters": this.actor.system.squadron.fighters });
    }

    async _prepareFighters() {
        let tl = -1;
        let thrust = -1;
        let armour = -1;
        let hull = -1;
        let maxHits = 0;
        if (this.actor.system.squadron?.fighters) {
            let fighters = this.actor.system.squadron.fighters;
            let number = 0;
            for (let i in fighters) {
                // Find the worst of all the fighters.
                let fighter = fighters[i];
                number += parseInt(fighter.number);
                maxHits += parseInt(fighter.number) * parseInt(fighter.hull);
                if (tl === -1 || fighter.tl < tl) {
                    tl = parseInt(fighter.tl);
                }
                if (thrust === -1 || fighter.thrust < thrust) {
                    thrust = parseInt(fighter.thrust);
                }
                if (hull === -1 || fighter.hull < hull) {
                    hull = parseInt(fighter.hull);
                }
                if (armour === -1 || fighter.armour < armour) {
                    armour = parseInt(fighter.armour);
                }
            }

            tl = Math.max(0, tl);
            thrust = Math.max(0, thrust);
            armour = Math.max(0, armour);
            hull = Math.max(0, hull);

            let sq = this.actor.system.squadron;
            if (tl != sq.tl || thrust != sq.thrust || armour != sq.armour || hull != sq.hull) {
                await this.actor.update({"system.squadron": {
                        "tl": tl,
                        "thrust": thrust,
                        "hull": hull,
                        "armour": armour
                    }
                });
            }
            if (maxHits != this.actor.system.hits.max) {
                await this.actor.update({"system.hits.max": maxHits });
            }
        }
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
            this.rollImpact();
        });
        html.find('.button-clear-target').click(ev => {
            this.clearTarget();
        });
        html.find('.size-dec').click(ev => this.modifySize(-1));
        html.find('.size-inc').click(ev => this.modifySize(+1));
        html.find('.end-dec').click(ev => this.modifyEndurance(-1));
        html.find('.end-inc').click(ev => this.modifyEndurance(+1));

        html.find('.num-dec').click(ev => {
            let f = $(ev.currentTarget).parents(".fighter");
            let id = f.data("fighterId");
            this.modifyFighters(id, -1);
        });
        html.find('.num-inc').click(ev => {
            let f = $(ev.currentTarget).parents(".fighter");
            let id = f.data("fighterId");
            this.modifyFighters(id, +1);
        });

        return;
    }

    selectTarget() {
        console.log("selectTargetAction:");

        let selected = Tools.getSelected();
        for (let token of selected) {
            console.log(token);
            if (token.document.actor._id === this.actor._id) {
                continue;
            }
            if (token.document.actor.type !== "spacecraft") {
                continue;
            }
            console.log("Selected target " + token.document.actor.name);
            this.targetToken = token;
            this.targetActor = token.document.actor;
            this.actor.update({"system.salvo.targetId": token.document.uuid });
        }
        this.render(true);
    }

    clearTarget() {
        this.actor.update({"system.salvo.targetId": null});
    }

    modifyFighters(fighterId, value) {
        console.log(fighterId);
        for (let f in this.actor.system.squadron.fighters) {
            console.log(f);
            let fighter = this.actor.system.squadron.fighters[f];
            if (fighter.uuid === fighterId) {
                fighter.number += value;
                if (fighter.number < 1) {
                    fighter.number = 1;
                }
                this.actor.update({"system.squadron.fighters": this.actor.system.squadron.fighters})
                break;
            }
        }
        let number = 0;
        for (let f in this.actor.system.squadron.fighters) {
            let fighter = this.actor.system.squadron.fighters[f];
            number += fighter.number;
        }
        this.actor.system.size.max = number;
        this.actor.system.size.value = number;
        this.actor.update({"system.size": this.actor.system.size});
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
            let smartTL = parseInt(this.actor.system.salvo?.tl);
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
