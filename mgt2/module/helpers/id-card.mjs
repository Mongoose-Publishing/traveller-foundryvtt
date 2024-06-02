
export class NpcIdCard extends Application {

    static get defaultOptions() {
        const options = super.defaultOptions;

        mergeObject(options, {
            editable: false,
            resizable: false,
            template: "systems/mgt2/templates/actor/actor-id-card.html",
            popOut: true,
            shareable: true,
            width: 600,
            height: 420
        });
        return options;
    }

    constructor(actor) {
        super();
        this.actor = actor;
        this.data = actor.system;
    }

    getData() {
        let users = null;
        let current = game.users.current;

        if (current.isGM) {
            users = [];
            for (let u of game.users) {
                if (u.id !== current.id && u.active) {
                    console.log(u);
                    users.push(u);
                }
            }
        }

        return {
            "actor": this. actor,
            "data": this.data,
            "users": users
        }
    }

    activateListeners(html) {
        html.find('.id-share').click(ev => {
            this._shareId();
        })
    }

    _shareId() {
        console.log("Share!");
        game.socket.emit("system.mgt2", {
            type: "showIdCard",
            actor: this.actor
        });
    }


}