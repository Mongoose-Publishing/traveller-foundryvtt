import {MgT2ItemSheet} from "../item-sheet.mjs";
import {randomiseAssociate} from "../../helpers/utils/character-utils.mjs";
import {MgT2Item} from "../../documents/item.mjs";
import {MGT2} from "../../helpers/config.mjs";
import {skillLabel} from "../../helpers/dice-rolls.mjs";

export class MgT2SoftwareItemSheet extends MgT2ItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["mgt2", "sheet", "item", "software" ],
            width: 720,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
        });
    }

    async getData() {
        let context = await super.getData();

        context.enrichedDescription = await TextEditor.enrichHTML(this.object.system.description );

        if (context.item.parent && !context.item.system.status) {
            context.item.system.status = MgT2Item.RUNNING;
            context.item.update({"system.status": context.item.system.status });
        } else if (!context.item.parent && context.item.system.status) {
            context.item.system.status = null;
            context.item.update({"system.status": context.item.system.status });
        }
        context.SOFTWARE_INTERFACE = {
            "none": game.i18n.localize("MGT2.Effects.Software.InterfaceType.none"),
            "interface": game.i18n.localize("MGT2.Effects.Software.InterfaceType.interface"),
            "agent": game.i18n.localize("MGT2.Effects.Software.InterfaceType.agent"),
            "intelligent": game.i18n.localize("MGT2.Effects.Software.InterfaceType.intelligent"),
            "intellect": game.i18n.localize("MGT2.Effects.Software.InterfaceType.intellect"),
        }

        context.SOFTWARE_CLASS = {
            "personal": game.i18n.localize("MGT2.Effects.Software.Class.personal"),
            "spacecraft": game.i18n.localize("MGT2.Effects.Software.Class.spacecraft")
        }
        context.SOFTWARE_TYPE = {
            "generic": game.i18n.localize("MGT2.Effects.Software.Type.generic"),
            "expert": game.i18n.localize("MGT2.Effects.Software.Type.expert"),
            "augment": game.i18n.localize("MGT2.Effects.Software.Type.augment"),
            "task": game.i18n.localize("MGT2.Effects.Software.Type.task")
        }

        context.AGENT_SKILLS = { "": "-"};
        let skills = MGT2.SKILLS;
        for (let id in skills) {
            let label = skillLabel(skills[id], id);
            if (skills[id].specialities) {
                for (let sid in skills[id].specialities) {
                    context.AGENT_SKILLS[`${id}.${sid}`] =
                        `${label} (${skillLabel(skills[id].specialities[sid], sid)})`;
                }
            } else {
                context.AGENT_SKILLS[id] = label;
            }
        }
        context.AGENT_LEVELS = {
            "0": "0", "1": "1", "2": "2", "3": "3", "4": "4"
        }
        // Expert level is skill level + 1.
        context.EXPERT_LEVELS = {
            "1": "Expert/1", "2": "Expert/2", "3": "Expert/3"
        }
        // Task level is skill DM.
        context.TASK_LEVELS = {
            "0": "DM+0", "1": "DM+1", "2": "DM+2", "3": "DM+3", "4": "DM+4"
        }


        context.SOFTWARE_EFFECT = { "": "-" };
        context.SOFTWARE_EFFECT["evade"] = "Evade";
        context.SOFTWARE_EFFECT["init"] = "Initiative";
        context.SOFTWARE_EFFECT["fireControl"] = "Fire Control";
        context.SOFTWARE_EFFECT["tactics"] = "Tactics";

        context.INSTALL_OPTIONS = {};
        let foundHardware = false;
        if (context.item.parent && ["npc", "traveller", "spacecraft"].includes(context.item.parent.type)) {
            // Look for any hardware that this can be connected to.
            context.INSTALL_OPTIONS[""] = "-";
            for (let i of context.item.parent.items) {
                if (i.system.computer) {
                    context.INSTALL_OPTIONS[i._id] = i.name;
                    if (i._id === context.item.system.installedOn) {
                        foundHardware = true;
                    }
                }
            }
        }
        if (!foundHardware) {
            context.item.system.installedOn = null;
            context.item.update({ "system.installedOn": null });
        }

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".randomiseRelationship").click(ev => this._randomiseRelationship(this.item));

        html.find(".installedOn").click(ev => {
            let selected = $(ev.currentTarget).val();
            let previousId = this.item.system.installedOn;
            let previousItem = this.item.parent.items.get(previousId);
            if (previousItem?.system?.computer?.software) {
                if (!Array.isArray(previousItem.system.computer.software)) {
                    previousItem.system.computer.software = [];
                }
                let list = previousItem.system.computer.software;
                previousItem.system.computer.software = list.filter(i => i !== this.item._id);
                previousItem.update({"system.computer": previousItem.system.computer});
            }
            let installItem = this.item.parent.items.get(selected);
            if (installItem && installItem.system.computer) {
                let computer = installItem.system.computer;
                if (!Array.isArray(computer.software)) {
                    computer.software = [];
                }
                if (!computer.software.includes(this.item._id)) {
                    computer.software.push(this.item._id);
                }
                installItem.update({"system.computer": computer});
            }
        });
    }

}
