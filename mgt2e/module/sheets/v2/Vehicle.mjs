
import { MgT2eActorV2 } from "./MgT2eActorV2.mjs";
import {MgT2VehicleDamageApp} from "../../helpers/dialogs/vehicle-damage-app.mjs";

export class MgT2eVehicleSheet extends MgT2eActorV2 {

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
            test: MgT2eVehicleSheet.#test,
            addFeature: {
                handler: MgT2eVehicleSheet.#addFeature,
                buttons: [0, 1, 2],
                event: "change"
            },
            removeFeature: MgT2eVehicleSheet.#removeFeature,
            editItem: MgT2eVehicleSheet.#editItem,
            deleteItem: MgT2eVehicleSheet.#deleteItem,
        },
        form: {
            handler: MgT2eVehicleSheet.#onFormSubmit,
            submitOnChange: true,
            closeOnSubmit: false
        }
    };

    static PARTS = {
        main: {
            template: "systems/mgt2e/templates/actor/v2/vehicle/vehicle.html",
            scrollable: ['']
        },
        tabs: {
            template: "templates/generic/tab-navigation.hbs",
            scrollable: [""]
        },
        description: {
            template: "systems/mgt2e/templates/actor/v2/vehicle/description.html",
            scrollable: ['']
        },
        design: {
            template: "systems/mgt2e/templates/actor/v2/vehicle/design.html",
            scrollable: [""],
            classes: ["vehicle-design-tab"],
        },
        combat: {
            template: "systems/mgt2e/templates/actor/v2/vehicle/combat.html",
            scrollable: ['']
        },
        crew: {
            template: "systems/mgt2e/templates/actor/v2/vehicle/crew.html",
            scrollable: ['']
        },
        equipment: {
            template: "systems/mgt2e/templates/actor/v2/vehicle/equipment.html",
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
                { id: "design" },
                { id: "combat" },
                { id: "crew" },
                { id: "equipment" },
            ],
            labelPrefix: "MGT2.VehicleTab",
            initial: "design"
        }
    }

    static async #addFeature(event, target) {
        console.log("addFeature:");

        let feature = event.target.value;

        if (this.document.system.vehicle.features === "") {
            this.document.system.vehicle.features = feature;
        } else {
            this.document.system.vehicle.features += "," + feature;
        }
        this.document.update({"system.vehicle.features": this.document.system.vehicle.features});
    }

    static async #removeFeature(event, target) {
        let featureId = event.target.dataset["featureId"];

        let features = this.document.system.vehicle.features;
        let re = new RegExp(` ?${featureId},?`, "g");
        let b = features.replaceAll(re, "").replaceAll(/,$/g, "").trim();
        b = b.replaceAll(/,,/g, ",");
        this.actor.update({"system.vehicle.features": b});
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

    static async #test(event, target) {
        console.log("TEST");
    }

    async _calculateTypes() {
        const vehicleType = this.document.system.vehicle.type;
        const typeConfig = CONFIG.MGT2.VEHICLES.TYPE[vehicleType];

        if (!typeConfig) {
            console.log(`Unknown vehicle type [${vehicleType}]`);
            return;
        }
        let traits = this.document.system.vehicle.traits;
        for (let t of typeConfig.traits) {
            if (traits.indexOf(t) === -1) {
                traits = traits + "," + t;
            }
        }
        if (traits !== this.document.system.vehicle.traits) {
            await this.document.update({"system.vehicle.traits": traits});
        }

        const hull = Math.max(1, parseInt(typeConfig.hull * this.document.system.vehicle.spaces));
        console.log("HULL: " + hull);
        if (hull !== parseInt(this.document.system.hits.hull)) {
            console.log("UPDATING HITS FOR VEHICLE");
            const HITS = this.document.system.hits;
            HITS.hull = hull;
            HITS.structure = Math.ceil(HITS.hull / 10);
            HITS.max = 10;
            HITS.value = HITS.max - HITS.damage;
            await this.document.update({"system.hits": HITS});
        }
        console.log("VEHICLE HITS");
        console.log(this.document.system.hits);
    }

    async _calculateHits() {

    }

    getVehicleHitDM() {
        const spaces = parseInt(this.document.system.vehicle.spaces);

        if (isNaN(spaces)) {
            return 0;
        }
        if (spaces < 4) {
            return 0;
        } else if (spaces < 20) {
            return 1;
        } else if (spaces < 100) {
            return 2;
        } else if (spaces < 200) {
            return 3;
        } else if (spaces < 1000) {
            return 4;
        } else if (spaces < 2000) {
            return 5;
        }
        return 6;
    }

    getVehicleSize() {
        const spaces = parseInt(this.document.system.vehicle.spaces);

        if (spaces < 4) {
            return "small";
        } else if (spaces < 20) {
            return "light";
        } else if (spaces < 200) {
            return "heavy";
        } else if (spaces < 2000) {
            return "huge";
        }
        return "massive";
    }

    prepareData() {
        console.log("prepareDerivedData:");
    }

    async _prepareContext(options) {
        const context = {
            actor: this.document,
            owner: this.document.permission > 2,
            system: this.document.system,
            items: this.document.items,
            config: CONFIG.MGT2,
            tabs: this._prepareTabs("primary")
        };

        // BASIC TYPE AND SIZE OF VEHICLE
        await this._calculateTypes();
        context.VEHICLE_SIZE = this.getVehicleSize();

        // STRUCTURE AND HITS
        const HITS = this.document.system.hits;
        context.MAX_DAMAGE = context.structure * 10;
        context.VEHICLE_DAMAGE = HITS.damage;

        // List Items
        context.ITEMS_OPTIONS = [];
        context.ITEMS_ROLES = [];
        context.ITEMS_GEAR = [];
        for (let item of this.document.items) {
            if (["option"].includes(item.type)) {
                context.ITEMS_OPTIONS.push(item);
            } else if (["role"].includes(item.type)) {
                contetxt.ITEMS_ROLES.push(item);
            } else {
                context.ITEMS_GEAR.push(item);
            }
        }

        context.TYPE_SELECT = {};
        for (let t in CONFIG.MGT2.VEHICLES.TYPE) {
            context.TYPE_SELECT[t] = game.i18n.localize(`MGT2.Vehicle.Type.${t}`);
        }

        context.SELECT_FEATURES = {};
        context.SELECT_FEATURES[""] = "";
        if (CONFIG.MGT2.VEHICLES.TYPE[this.document.system.vehicle.type]) {
            let allowedFeatures = CONFIG.MGT2.VEHICLES.TYPE[this.document.system.vehicle.type].allowedFeatures;
            if (allowedFeatures) {
                for (let f of allowedFeatures) {
                    let conflict = false;
                    if (CONFIG.MGT2.VEHICLES.FEATURES[f]?.conflicts) {
                        for (let c of CONFIG.MGT2.VEHICLES.FEATURES[f].conflicts) {
                            if (this.document.system.vehicle?.features?.indexOf(c) > -1) {
                                conflict = true;
                                continue;
                            }
                        }
                    }
                    if (!conflict && this.document.system.vehicle?.features?.indexOf(f) === -1) {
                        context.SELECT_FEATURES[f] = game.i18n.localize("MGT2.Vehicle.Feature." + f);
                    }
                }
            }
        }
        context.SELECT_TECHLEVEL = {};
        for (let tl=0; tl < 20; tl++) {
            context.SELECT_TECHLEVEL[tl] = tl;
        }

        const TL = parseInt(this.document.system.vehicle.tl);
        context.SELECT_POWER = {};
        context.SELECT_SECOND_POWER = {}
        for (let p in CONFIG.MGT2.VEHICLES.POWER) {
            if (CONFIG.MGT2.VEHICLES.POWER[p].conflicts?.includes(this.document.system.vehicle.type)) {
                continue;
            }
            if (CONFIG.MGT2.VEHICLES.POWER[p].tl > TL) {
                continue;
            }
            if (CONFIG.MGT2.VEHICLES.POWER[p].tl) {
                context.SELECT_POWER[p] = game.i18n.localize(`MGT2.Vehicle.Power.${p}`);
            }
            if (CONFIG.MGT2.VEHICLES.POWER[p].secondary) {
                context.SELECT_SECOND_POWER[p] = game.i18n.localize(`MGT2.Vehicle.Power.${p}`);
            }
        }


        context.SELECT_SPEED = null;
        if (TL >= 4) {
            context.SELECT_SPEED = { };
            let max = Math.min(3,TL - 3);
            for (let i=-max; i <= max; i++) {
                let v = (i<0)?i:"+"+i;
                context.SELECT_SPEED[v] = game.i18n.localize("MGT2.Vehicle.SpeedModification"+v);
            }
        } else {
            this.document.system.vehicle.speedModification = 0;
        }
        context.SELECT_EFFICIENCY = null;
        if (TL >= 3) {
            context.SELECT_EFFICIENCY = { };
            let max = Math.min(3,TL - 2);
            for (let i=-max; i <= max; i++) {
                let v = (i<0)?i:"+"+i;
                context.SELECT_EFFICIENCY[v] = game.i18n.localize("MGT2.Vehicle.FuelEfficiency"+v);
            }
        } else {
            this.document.system.vehicle.fuelEfficiency = 0;
        }
        context.SELECT_FUEL_CAPACITY = null;
        if (TL >= 3) {
            context.SELECT_FUEL_CAPACITY = { };
            for (let i=-2; i <= 10; i++) {
                let v = (i<0)?(i*25):"+"+(i*25);
                context.SELECT_FUEL_CAPACITY[v] = game.i18n.format("MGT2.Vehicle.FuelCapacity.Label",
                    { capacity: v });
            }
        } else {
            this.document.system.vehicle.fuelCapacity = 0;
        }

        const spaces = parseInt(this.document.system.vehicle.spaces);
        if (spaces >= 2000) {
            this.document.system.vehicle.size = 6;
            context.sizeLabel = "massive";
        } else if (spaces >= 1000) {
            this.document.system.vehicle.size = 5;
            context.sizeLabel = "huge";
        } else if (spaces >= 200) {
            this.document.system.vehicle.size = 4;
            context.sizeLabel = "huge";
        } else if (spaces >= 100) {
            this.document.system.vehicle.size = 3;
            context.sizeLabel = "heavy";
        } else if (spaces >= 20) {
            this.document.system.vehicle.size = 2;
            context.sizeLabel = "heavy";
        } else if (spaces >= 4) {
            this.document.system.vehicle.size = 1;
            context.sizeLabel = "light";
        } else {
            this.document.system.vehicle.size = 0;
            context.sizeLabel = "small";
        }

        let spaceRemaining = spaces;

        // Combat
        context.VEHICLE_SIZE_DM = this.getVehicleHitDM();

        context.VEHICLE_DAMAGE = 0;

        return context;
    }

    async _preparePartContext(partId, context) {
        context.tab = context.tabs[partId];

        if (!this.document.system.vehicle.primaryPower) {
            this.document.system.vehicle.primaryPower = "unpowered";
        }
        if (partId === "description") {
            context.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(
                this.document.system.description,
                { secrets: ((this.document.permission > 2)) }
            );
        }


        return context;
    }


    _onRender(context, options) {
        super._onRender(context, options);

        const traitSelect = this.element.querySelector('select[data-action="addFeature"]');
        if (traitSelect) {
            //traitSelect.removeEventListener("change", this.#addTrait.bind(this));
            traitSelect.addEventListener("change", (ev) => {
                // Manually trigger your private static method
                MgT2eVehicleSheet.#addFeature.call(this, ev, ev.currentTarget);
            });
        }
    }

    static async #onFormSubmit(event, form, formData) {
        console.log("onFormSubmit:");
        await this.document.update(formData.object);
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
        this.applyDamageToVehicle(damageOptions);


    }

    // Apply damage to a vehicle. This uses the damage rules from the Vehicle Update book.
    async applyDamageToVehicle(options) {
        if (!options) {
            return;
        }
        if (!options.traits) {
            options.traits = "";
        }
        if (options.traits.indexOf("stun") > -1) {
            console.log("Ignore stun damage");
            return;
        }
        let techLevelArmour = false;
        if (!options.scale || options.scale === "traveller") {
            // Traveller scale damage.
            if (options.effect > 5) {
                techLevelArmour = true;
            } else if (options.traits) {
                if (options.traits.indexOf("blast") > -1) {
                    techLevelArmour = true;
                } else if (options.traits.indexOf("destructive")) {
                    techLevelArmour = true;
                }
            }
        }
        new MgT2VehicleDamageApp(this.document, options).render(true);


    }

}
