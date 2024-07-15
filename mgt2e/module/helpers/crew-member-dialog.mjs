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

        console.log("We are doing this for " + this.actorCrew.id);

        console.log(this.actorCrew);
        console.log(this.actorShip);
        console.log(this.shipCrewData);
        console.log(this.crewRoles);
        console.log("Finish Dump");

        this.options.title = `${this.actorCrew.name} of ${this.actorShip.name}`;

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
            "actorCrewId": "" + this.actorCrew.id
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
            console.log(actorId + ", " + roleId + ", " + actionId);
            this.actorSheet._runCrewAction(this.actorShip, actorId, roleId, actionId);
        });

        console.log("Activated listeners");
    }

    async onSaveClick(event, html) {
        event.preventDefault();
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
