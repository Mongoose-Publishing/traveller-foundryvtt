
export class NpcIdCard extends Application {

    static get defaultOptions() {
        const options = super.defaultOptions;

        mergeObject(options, {
            editable: false,
            resizable: true,
            template: "systems/mgt2/templates/actor/actor-id-card.html",
            popOut: true,
            shareable: true,
            width: 700,
            height: 400
        });
        return options;
    }

    constructor(actor) {
        super();
        this.actor = actor;
        this.data = actor.system;
    }

    getData() {
        return {
            "actor": this. actor,
            "data": this.data
        }
    }


}