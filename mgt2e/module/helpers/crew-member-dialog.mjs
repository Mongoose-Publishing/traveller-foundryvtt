import {rollSkill} from "../helpers/dice-rolls.mjs";

// Adding a new skill to an actor.
export class MgT2CrewMemberDialog extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "systems/mgt2e/templates/crew-member-dialog.html";
        options.width = "600px";
        options.height = "auto";
        options.title = "Crew Member";

        return options;
    }

    constructor(actorCrew, actorShip, actorSheet) {
        super();
        console.log("MgT2CrewMemberDialog:");

        this.actorCrew = actorCrew;
        this.actorShip = actorShip;
        this.actorSheet = actorSheet;

        // Crew data for the entire ship
        this.shipCrewData = actorShip.system.crewed;
        // Roles that this crew member has
        this.crewRoles = this.shipCrewData.crew[this.actorCrew.id];
        this.options.title = `${this.actorCrew.name} of ${this.actorShip.name}`;

        this.selectRoleTypes = {
            "": "",
            "pilot": game.i18n.localize("MGT2.Role.BuiltIn.Name.Pilot"),
            "gunner": game.i18n.localize("MGT2.Role.BuiltIn.Name.Gunner"),
            "engineer": game.i18n.localize("MGT2.Role.BuiltIn.Name.Engineer"),
            "sensors": game.i18n.localize("MGT2.Role.BuiltIn.Name.Sensors"),
            "navigator": game.i18n.localize("MGT2.Role.BuiltIn.Name.Navigator"),
            "broker": game.i18n.localize("MGT2.Role.BuiltIn.Name.Broker")
        };

        // Setup roles.
        this.shipRoles = [];
        for (let i of this.actorShip.items) {
            if (i.type === "role") {
                let r = {
                    "id": i.id,
                    "name": i.name,
                    "assigned": false,
                    "actions": i.system.role.actions
                };
                if (this.crewRoles[r.id]) {
                    r.assigned = true;
                }
                this.shipRoles.push(r);
            }
        }

    }

    getData() {
        return {
            "actorCrew": this.actorCrew,
            "actorShip": this.actorShip,
            "shipCrewData": this.shipCrewData,
            "shipRoles": this.shipRoles,
            "crewRoles": this.crewRoles,
            "actorCrewId": "" + this.actorCrew.id,
            "selectRoleTypes": this.selectRoleTypes
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
        const save = html.find("button[class='save']");
        save.on("click", event => this.onSaveClick(event, html));


        html.find('.role-action-button').click(ev => {
            const div = $(ev.currentTarget);
            const actorId = div.data("crewId");
            const roleId = div.data("roleId");
            const actionId = div.data("actionId");
            this.actorSheet._runCrewAction(this.actorShip, actorId, roleId, actionId);
        });

        html.find('.addRoleSelect').click(ev => {
            const val = $(ev.currentTarget).val();
            if (val && val.length !== 0) {
                this.close();
                this.refresh(val, html);
            }
        });

        console.log("Activated listeners");
    }

    async refresh(role, html) {
        await this.actorSheet._createCrewRole(role);
        await this.onSaveClick(null, html);
        await this.actorShip.update({ "system.crewed": this.actorShip.system.crewed });
        new MgT2CrewMemberDialog(this.actorCrew, game.actors.get(this.actorShip._id), this.actorSheet).render(true);
    }

    async onSaveClick(event, html) {
        if (event) event.preventDefault();
        console.log("onSaveClick:");

        let assignments = html.find(".assign-role");
        for (let a of assignments) {
            let roleId = $(a).parents(".item").data("itemId");
            let assigned = a.checked;
            console.log("Save for " + roleId);

            if (this.crewRoles[roleId] && !assigned) {
                // Remove role
                console.log("Removing role");
                await this.actorShip.update({ [`system.crewed.crew.${this.actorCrew.id}.-=${roleId}`]: null });
            } else if (!this.crewRoles[roleId] && assigned) {
                // Add role
                await this.actorShip.update({ [`system.crewed.crew.${this.actorCrew.id}.${roleId}`]: { assigned: true} });
            }
        }

        this.close();
    }

    async _updateObject(event, formData) {
        console.log("_updateObject:");
    }
}

//window.MgT2SkillDialog = MgT2SkillDialog;
