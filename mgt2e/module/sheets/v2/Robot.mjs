
import { MgT2eActorV2 } from "./MgT2eActorV2.mjs";
import {MgT2VehicleDamageApp} from "../../helpers/dialogs/vehicle-damage-app.mjs";
import {skillLabel} from "../../helpers/dice-rolls.mjs";

export class MgT2eRobotSheet extends MgT2eActorV2 {

    constructor(options = {}) {
        super(options);
        this.#dragDrop = this.#createDragDropHandlers();
    }

    #createDragDropHandlers() {
        return this.options.dragDrop.map((d) => {
            d.permissions = {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this),
            };
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                drop: this._onDrop.bind(this)
            };
            return new DragDrop(d);
        });
    }

    #dragDrop;

    get dragDrop() {
        return this.#dragDrop;
    }

    static DEFAULT_OPTIONS = {
        classes: ["mgt2e", "sheet", "actor" ],
        position: {width: 720, height: 640},
        window: {
            resizable: true,
            controls: [] // Header buttons go here
        },
        // Map your HTML [data-action] attributes to JS functions
        actions: {
            rollCheck: MgT2eActorV2.onRollCheck,
            addFeature: {
                handler: MgT2eRobotSheet.#addFeature,
                buttons: [0, 1, 2],
                event: "change"
            },
            removeFeature: MgT2eRobotSheet.#removeFeature,
            editItem: MgT2eRobotSheet.#editItem,
            deleteItem: MgT2eRobotSheet.#deleteItem,
            editImage: MgT2eRobotSheet.#onEditImage,
            calculate: MgT2eRobotSheet.#calculate
        },
        dragDrop: [ { dragSelector: '[data-drag]', dropSelector: null }],
        form: {
            handler: MgT2eRobotSheet.#onFormSubmit,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        main: {
            template: "systems/mgt2e/templates/actor/v2/robot/robot.html",
            scrollable: ['']
        },
        tabs: {
            template: "templates/generic/tab-navigation.hbs",
            scrollable: [""]
        },
        description: {
            template: "systems/mgt2e/templates/actor/v2/robot/description.html",
            scrollable: ['']
        },
        design: {
            template: "systems/mgt2e/templates/actor/v2/robot/design.html",
            scrollable: [""],
            classes: ["vehicle-design-tab"],
        },
        combat: {
            template: "systems/mgt2e/templates/actor/v2/robot/combat.html",
            scrollable: ['']
        },
        skills: {
            template: "systems/mgt2e/templates/actor/v2/robot/skills.html",
            scrollable: ['']
        },
        equipment: {
            template: "systems/mgt2e/templates/actor/v2/robot/equipment.html",
            scrollable: ['']
        },
        footer: {
            template: "systems/mgt2e/templates/actor/v2/footer.html"
        }
    };

    static TABS = {
        primary: {
            tabs: [
                { id: "description" },
                { id: "skills" },
                { id: "design" },
                { id: "combat" },
                { id: "equipment" },
            ],
            labelPrefix: "MGT2.RobotTab",
            initial: "design"
        }
    }

    static async #onEditImage(event, target) {
        const field = target.dataset.field || "img";
        const current = foundry.utils.getProperty(this.document, field) || "";
        const fp = new foundry.applications.apps.FilePicker({
            type: "image",
            current: current,
            callback: async (path) => {
                await this.document.update({ [field]: path});
            }
        }).render(true);
    }

    static async #addFeature(event, target) {
        console.log("addFeature:");

    }

    static async #removeFeature(event, target) {
    }

    static async #editItem(event, target) {
        let itemId = event.target.dataset["itemId"];

        const item = this.document.items.get(itemId);
        if (item) {
            item.sheet.render(true);
        }
    }

    static async #deleteItem(event, target) {
        let itemId = event.target.dataset["itemId"];

        const item = this.document.items.get(itemId);
        if (item) {
            item.delete();
        }
    }

    static async #calculate(event, target) {
        this.calculateStats();
    }


    prepareData() {
        console.log("prepareDerivedData:");
    }

    async calculateStats() {
        console.log("Calculate stats");
        const system = this.document.system;
        const robot = this.document.system.robot;
        const ROBOTS = CONFIG.MGT2.ROBOTS;
        let sz = robot.size;
        if (!ROBOTS.SIZE[sz]) {
            sz = 4;
        }
        robot.slots = ROBOTS.SIZE[sz].slots;
        system.hits.max = ROBOTS.SIZE[sz].hits;

        // Characteristics
        system.characteristics["STR"].value = 0;
        system.characteristics["DEX"].value = 0;
        system.characteristics["END"].value = Math.max(6, sz);
        system.characteristics["SOC"].value = 0;

        for (let item of this.document.items) {
            if (item.type === "option" && item.system.option.model === "robot") {
                console.log("item " + item.name);
                console.log(item);
                switch (item.system.option.type) {
                    case "manipulator":
                        let str = parseInt(item.system.option.manipulators.str);
                        let dex = parseInt(item.system.option.manipulators.dex);
                        console.log(str);
                        console.log(dex);

                        system.characteristics["STR"].value =
                            Math.max(parseInt(item.system.option.manipulators.str),
                                system.characteristics["STR"].value);
                        system.characteristics["DEX"].value =
                            Math.max(parseInt(item.system.option.manipulators.dex),
                                system.characteristics["DEX"].value);
                }
            }
        }


        this._prepareCharacteristics();

        this.document.update({"system": system });

    }

    async _prepareRobotOption(context, item) {
        context.OPTIONS.push(item);
        switch (item.system.option.type) {
            case "manipulators":
                break;
        }
    }

    async _prepareItems(context) {
        super._prepareItems(context);
        context.slotsUsed = 0;
        for (let item of context.OPTIONS) {
            console.log(item.name);
            if (item.type === "option" && item.system.option.model === "robot") {

            }

        }
    }

    async _prepareContext(options) {
        const context = {
            actor: this.document,
            owner: this.document.permission > 2,
            system: this.document.system,
            ROBOT: this.document.system.robot,
            items: this.document.items,
            config: CONFIG.MGT2,
            tabs: this._prepareTabs("primary")
        };
        this._prepareItems(context);

        context.SELECT_SIZE = {};

        for (let s= 1; s <= 8; s++) {
            context.SELECT_SIZE[s] = s;
        }

        context.SELECT_LOCOMOTION = {};
        for (let l in CONFIG.MGT2.ROBOTS.LOCOMOTION) {
            context.SELECT_LOCOMOTION[l] = game.i18n.localize(`MGT2.Robot.LocomotionType.${l}`);
        }

        context.SELECT_SKILLS = {};
        context.SELECT_SKILLS[""] = "Add skill";
        const BASE_SKILLS = CONFIG.MGT2.getDefaultSkills();
        for (let s in BASE_SKILLS) {
            const skill = BASE_SKILLS[s];
            const label = skillLabel(skill, s)
            context.SELECT_SKILLS[s] = label;
            if (skill.specialities) {
                for (let sp in skill.specialities) {
                    const spec = skill.specialities[sp];
                    context.SELECT_SKILLS[`${s}.${sp}`] = `${label} (${skillLabel(spec, sp)})`;
                }
            }
        }


        return context;
    }

    async _preparePartContext(partId, context) {
        context.tab = context.tabs[partId];

        if (partId === "description") {
            context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
                this.document.system.description,
                { secrets: ((this.document.permission > 2)) }
            );
        }


        return context;
    }

    static async #addSkill(event, target) {
        let skillFqn = event.target.value;
        console.log(skillFqn);

        const BASE_SKILLS = CONFIG.MGT2.getDefaultSkills();
        const parts = skillFqn.split(".");
        const skillId = parts[0];
        const specId = (parts.length > 1)?parts[1]:null;

        if (!this.document.system.skills) {
            this.document.system.skills = {};
        }

        if (BASE_SKILLS[skillId]) {
            BASE_SKILLS[skillId].id = skillId;

            this.document.system.skills[skillId] = BASE_SKILLS[skillId];
        }
        this.document.update({"system.skills": this.document.system.skills });

    }


    _onRender(context, options) {
        super._onRender(context, options);

        const addSkill = this.element.querySelector('select[data-action="addSkill"]');
        if (addSkill) {
            addSkill.addEventListener("change", (ev) => {
                MgT2eRobotSheet.#addSkill.call(this, ev, ev.currentTarget);
            })
        }

        this.#dragDrop.forEach((d) => d.bind(this.element));
    }

    _onDragStart(event) {
        const el = event.currentTarget;
        // Dragging an actor. Set up actor drag data, so it can be dropped on other
        // sheets or on the canvas.
        if ('actorId' in event.target.dataset) {
            let dragData = {
                type: "Actor",
                uuid: event.target.dataset.actorId
            }
            event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        }
    }

    static async #onFormSubmit(event, form, formData) {
        console.log("onFormSubmit:");
        await this.document.update(formData.object);
        this.calculateStats();
    }

    async _onDrop(event) {
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
        } catch (err) {
            return false;
        }
        console.log(data);
        switch (data.type) {
            case "Item":
                await this._onDropItem(event, data);
                break;
            case "Damage":
                await this._onDropDamage(event, data);
                break;
        }
    }

    async _onDropItem(event, data) {
        const item = await Item.fromDropData(data);

        if (!item || this.document.uuid === item.parent?.uuid) {
            console.log("Not allowed");
            return;
        }
        const itemData = item.toObject();
        try {
            const r = await this.document.createEmbeddedDocuments("Item", [ itemData ]);
            return r;
        } catch (err) {
            console.error("Failed to create", err);
            return false;
        }
    }

    async _onDropDamage(event, data) {
        console.log("DAMAGE:");

        const damageOptions = JSON.parse(data.options);
        console.log(damageOptions);
        this.applyDamageToRobot(damageOptions);


    }

    // Apply damage to a vehicle. This uses the damage rules from the Vehicle Update book.
    async applyDamageToRobot(options) {


    }

}
