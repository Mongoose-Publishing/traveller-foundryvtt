import {MgT2AttackDialog} from "../../helpers/attack-dialog.mjs";
import {MgT2CrewMemberDialog} from "../../helpers/crew-member-dialog.mjs";
import {MgT2eAttackApp} from "../../helpers/dialogs/MgT2eAttackApp.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class MgT2eActorV2 extends HandlebarsApplicationMixin(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        tag: "form", // The outer element type
        classes: [ "mgt2e", "sheet", "actor" ],
        position: { width: 720, height: 600 },
        window: {
            resizable: true,
            controls: [] // Header buttons go here
        },
        // Map your HTML [data-action] attributes to JS functions
        actions: {
            attack: MgT2eActorV2.#onAttack,
            reload: MgT2eActorV2.#onReload,
            promoteCrew: MgT2eActorV2.#promoteCrew,
            removeCrew: MgT2eActorV2.#removeCrew,
            demoteCrew: MgT2eActorV2.#demoteCrew,
            editCrew: MgT2eActorV2.#editCrew,
            roleAction: MgT2eActorV2.#roleAction
        },
        form: {
            handler: MgT2eActorV2.onFormSubmit,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        header: {
            template: ""
        },
        tabs: {
            template: ""
        },
        body: {
            template: ""
        }
    };

    _prepareCharacteristics() {
        if (this.document.system.characteristics) {
            for (let c in this.document.system.characteristics) {
                let char = this.document.system.characteristics[c];
                if (char.value < 1) {
                    char.dm = -3;
                } else if (char.value < 3) {
                    char.dm = -2;
                } else {
                    char.dm = parseInt(char.value / 3) - 2;
                }
            }
        }
    }

    onRollCheck(event, target) {
        const rollType = event.target.dataset["rolltype"];

        if (rollType === "skill") {
            const skillId = event.target.dataset["skill"];
            const specId = event.target.dataset["spec"];
            const skillFqn = skillId + (specId?("." + specId):"");
            console.log("Skill: " + skillFqn);

            game.mgt2e.rollSkillMacro(skillFqn);
        }
    }

    static getCrewForMount(actor, mountItem) {
        console.log("getCrewForMount:");
        let actors = [];
        for (const [crewId, assignments] of Object.entries(actor.system.crewed?.crew || {})) {
            console.log(crewId);
            for (const roleId of Object.keys(assignments)) {
                const roleItem = actor.items.get(roleId);
                const weaponActions = Object.values(roleItem?.system.role.actions || {})
                    .filter(action => action.action === "weapon");
                for (const action of weaponActions) {
                    if (action.weapon === mountItem._id) {
                        const a = game.actors.get(crewId)
                        actors.push({
                            actor: a,
                            role: roleItem,
                            action: action
                        });
                        console.log(action);
                    }
                }
            }
        }
        return actors;
    }

    static async #onAttack(event, target) {
        const itemId = event.target.dataset["itemId"];
        const mountId = event.target.dataset["mountId"];
        const actorId = event.target.dataset["actorId"];
        const actionDm = parseInt(event.target.dataset["dm"]) || 0;

        const weaponItem = this.document.items.get(itemId);
        const mountItem = this.document.items.get(mountId);
        const crewActor = game.actors.get(actorId);

        console.log("onAttack:");
        console.log(actionDm);

        if (!mountId) {
            if (weaponItem) {
                new MgT2AttackDialog(this.actor, weaponItem).render(true);
            } else {
                ui.notifications.warn("Cannot find the weapon.");
            }
            return;
        }

        if (!weaponItem || !mountItem) {
            ui.notifications.warn("Cannot find the vehicle weapon or its mount.");
            return;
        }

        new MgT2eAttackApp(crewActor, weaponItem, {
            vehicle: this.document,
            mount: mountItem,
            dm: actionDm
        }).render(true);
    }

    static async #onReload(event, target) {

    }

    static async #demoteCrew(event, target) {
        const parent = target.closest("[data-actor-id]");
        const actorId = parent?.dataset.actorId;
        if (actorId) {
            console.log("Demote");
            this.actor.update({[`system.crewed.crew.-=${actorId}`]: null});
            this.actor.update({[`system.crewed.passengers.${actorId}`]: { } });
        }
    }

    static async #promoteCrew(event, target) {
        const parent = target.closest("[data-actor-id]");
        const actorId = parent?.dataset.actorId;
        if (actorId) {
            await this.actor.update({[`system.crewed.passengers.-=${actorId}`]: null});
            await this.actor.update({[`system.crewed.crew.${actorId}`]: { } });
        }
    }

    static async #removeCrew(event, target) {
        const parent = target.closest("[data-actor-id]");
        const actorId = parent?.dataset.actorId;
        if (actorId) {
            this.actor.update({[`system.crewed.passengers.-=${actorId}`]: null});
        }
    }

    static async #editCrew(event, target) {
        const parent = target.closest("[data-actor-id]");
        const actorId = parent?.dataset.actorId;
        if (actorId) {
            const crew = game.actors.get(actorId);
            new MgT2CrewMemberDialog(crew, this.actor,this).render(true);
        }
    }

    // Vehicle or Spacecraft using a role action.
    static async #roleAction(event, target) {
        console.log("roleAction:");
        const actionId = event.target.dataset["actionId"];
        const roleId = event.target.dataset["roleId"];
        const crewId = event.target.dataset["crewId"];

        const crewActor = game.actors.get(crewId);
        const roleItem = this.document.items.get(roleId);

        if (!crewActor || !roleItem) {
            console.log("Crew or Role not found");
            return;
        }

        const action = roleItem.system.role.actions[actionId];
        if (!action) {
            console.log("No action found");
            return;
        }

        switch (action.action) {
            case "chat":
                let chatData = {
                    user: game.user.id,
                    speaker: {
                        actor: crewActor._id,
                        alias: game.i18n.format("MGT2.Role.ChatAlias", {
                            "actorName": crewActor.name, "shipName": this.document.name
                        }),
                        scene: game.scenes.current.id
                    },
                    content: `${action.chat}`
                }
                ChatMessage.create(chatData, {});
                break;
            case "skill":
                let skill = action.skill;
                let cha = action.cha;
                let target = isNaN(action.target)?null:parseInt(action.target);
                let dm = action.dm?action.dm:0;
                if (skill) {
                    new MgT2SkillDialog(crewActor, skill, {
                        "dm": dm,
                        "cha": cha,
                        "difficulty": target,
                        "text": action.text
                    }).render(true);
                }
                break;
            case "weapon":
                const weaponId = action.weapon;
                const mountItem = this.document.items.get(weaponId);
                const weaponItem = this.document.items.get(mountItem.system.option.weapon.weaponId);
                const wdm = parseInt(action.dm) || 0;
                new MgT2eAttackApp(crewActor, weaponItem, {
                    vehicle: this.document,
                    mount: mountItem,
                    dm: wdm
                }).render(true);
                break;
            default:
                console.log("Unknown action " + action.action);
        }


    }

    onFormSubmit() {

    }

    async _prepareCrew(context) {
        if (!this.document.system.crewed) {
            return;
        }
        context.CREW = [];
        context.PASSENGERS = [];

        for (let c in this.document.system.crewed.crew) {
            let actor = game.actors.get(c);
            if (actor) {
                context.CREW.push({
                    actor: actor,
                    roles: []
                });
            }
        }
        for (let p in this.document.system.crewed.passengers) {
            let actor = game.actors.get(p);
            if (actor) {
                context.PASSENGERS.push({
                    actor: actor
                });
            }
        }
    }

    async _createCrewRole(roleType) {
        console.log("_createCrewRole: " + roleType);
        const system = {
            description: "",
            role: {
                actions: {},
                department: false,
                colour: null,
                dei: 0
            }
        };
        let itemName;
        let img;
        let timestamp = Date.now();
        const addAction = (action) => {
            system.role.actions[(timestamp++).toString(36)] = action;
        };

        switch (roleType) {
            case "gunner":
                itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Gunner");
                img = "systems/mgt2e/icons/items/roles/gunner.svg";
                addAction({ title: itemName, action: "weapon", dm: 0, weapon: null });
                break;
            case "driver":
            case "pilot":
                let skill = "";
                img = "systems/mgt2e/icons/items/roles/pilot.svg";
                if (this.document.type === "vehicle") {
                    itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Driver");
                    skill = this.document.system.vehicle?.skill || "pilot.spacecraft";
                } else {
                    itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Pilot");
                    const dtons = this.document.system.spacecraft?.dtons;
                    if (dtons < 100) {
                        skill = "pilot.smallCraft";
                    } else if (dtons > 5000) {
                        skill = "pilot.capitalShips";
                    }
                }
                addAction({
                    title: itemName,
                    action: "skill", cha: "DEX", skill: skill, target: 8, dm: 0
                });
                break;
            case "engineer":
                itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Engineer");
                img = "systems/mgt2e/icons/items/roles/engineer.svg";
                addAction({
                    title: "Repair", action: "skill", cha: "INT",
                    skill: "mechanic", target: 8, dm: 0
                });
                break;
            case "sensors":
                itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Sensors");
                img = "systems/mgt2e/icons/items/roles/sensors.svg";
                addAction({
                    title: itemName, action: "skill", cha: "INT",
                    skill: "electronics.sensors", target: 8, dm: 0
                });
                break;
            case "navigator":
                itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Navigator");
                img = "systems/mgt2e/icons/items/roles/navigator.svg";
                addAction({
                    title: itemName, action: "skill", cha: "EDU",
                    skill: "navigation", target: 8, dm: 0
                });
                break;
            case "broker":
                itemName = game.i18n.localize("MGT2.Role.BuiltIn.Name.Broker");
                img = "systems/mgt2e/icons/items/roles/broker.svg";
                addAction({
                    title: itemName, action: "skill", cha: "INT",
                    skill: "broker", target: 8, dm: 0
                });
                break;
            default:
                return;
        }

        return this.document.createEmbeddedDocuments("Item", [{
            name: itemName,
            img,
            type: "role",
            system
        }]);
    }

    async _prepareItems(context) {
        context.ITEMS = this.document.items;
        context.ITEMS_WEAPONS = [];
        context.ITEMS_ARMOUR = [];
        context.ITEMS_OPTIONS = [];
        context.ITEMS_GEAR = [];
        context.ITEMS_MOUNTS = [];
        context.ITEMS_ROLES = [];

        for (let item of this.document.items) {
            if ([ "weapon" ].includes(item.type)) {
                context.ITEMS_WEAPONS.push(item);
            } else if ([ "armour" ].includes(item.type)) {
                context.ITEMS_ARMOUR.push(item);
            } else if ([ "role" ].includes(item.type)) {
                context.ITEMS_ROLES.push(item);
            } else if ([ "option" ].includes(item.type)) {
                context.ITEMS_OPTIONS.push(item);
                switch (item.system.option.type) {
                    case "armour":
                        context.ITEMS_ARMOUR.push(item);
                        break;
                    case "weapon":
                        context.ITEMS_MOUNTS.push(item);
                        break;
                }
            } else {
                context.ITEMS_GEAR.push(item);
            }
        }
    }

    async _prepareContext(options) {
        const context = {
            actor: this.document,
            system: this.document.system,
            items: this.document.items,
            config: CONFIG.MGT2,
            tabs: this._getTabs(options)
        };
        return context;
    }
}

