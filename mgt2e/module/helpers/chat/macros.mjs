/**
 * Built in macros
 */
import {rollAttack, skillLabel} from "../dice-rolls.mjs";


export const MgT2eMacros = {};

// Add a skill to a character sheet.
// If the level is specified, skill is set to this level if higher.
// If a level is not specified, then the skill is incremened by 1.
MgT2eMacros.skillGain = function(args) {
    let skillId = args.skill;
    let specId = null;
    let level = args.level;
    let context = args.context;

    console.log("MgT2eMacros.skillGain: " + skillId);

    if (skillId.indexOf(".") > -1) {
        skillId = args.skill.split(".")[0];
        specId = args.skill.split(".")[1];
    }

    for (let t of canvas.tokens.controlled) {
        let actor = t.actor;
        if (actor) {
            let skill = actor.system.skills[skillId];
            let text = "";
            let skillName = actor.getSkillLabel(args.skill, false);

            if (!skill.trained) {
                skill.trained = true;
                text += `<b>${skillName}</b> is now trained.<br/>`;
            }
            if (level !== undefined && level == 0) {
                // Level set to zero, nothing else to do.
            } else {
                if (skill.specialities) {
                    // Player has to select which speciality to raise.
                    // Put the choice into the chat.
                    text += `Select a speciality to train:<br/>`;
                    for (let s in skill.specialities) {
                        let spec = skillId + "." + s;
                        let specName = actor.getSkillLabel(spec, false);
                        text += `<span class="skillGain-spec" data-actorId="${actor._id}" data-skill="${spec}" data-level="${level}">${specName}</span><br/>`;
                    }
                } else if (level === undefined && skill.value < 4) {
                    skill.value += 1;
                    text += `Incrementing <b>${skillName}</b> to ${skill.value}.`;
                } else if (level > skill.value) {
                    skill.value = level;
                    text += `Setting <b>${skillName}</b> to ${level}.`;
                } else {
                    text += `<b>${skillName}</b> is unchanged.`;
                }
            }
            actor.update({"system.skills": actor.system.skills});


            let html = `<div class="chat-package"><h3>${actor.name}</h3>`;
            if (context) {
                html += `<p>${context}</p>`;
            }
            html += `<p>${text}</p>`;

            html += `</div>`;


            let chatData = {
                speaker: ChatMessage.getSpeaker({actor: actor}),
                content: html
            };
            ChatMessage.create(chatData, {});
        }
    }
};

MgT2eMacros.specialityGain = function(actorId, skill, level) {
    console.log("specialityGain: " + skill);
    let actor = game.actors.get(actorId);
    if (actor) {
        let skills = actor.system.skills;
        let skillId = skill.split(".")[0];
        let specId = skill.split(".")[1];
        console.log(skillId);
        console.log(specId);
        if (skills[skillId] && skills[skillId].specialities[specId]) {
            console.log("Update");
            let spec = skills[skillId] && skills[skillId].specialities[specId];
            if (level === "undefined") {
                if (spec.value < 4) {
                    console.log("Increment");
                    spec.value += 1;
                }
                console.log(spec.value);
            } else {
                console.log("Set to " + level);
                if (spec.value < level) {
                    spec.value = level;
                }
            }
            console.log(spec);
            actor.update({"system.skills": actor.system.skills });
        }
    }

};

MgT2eMacros.skillCheck = function(args, ask) {
    let skillFqn = args.skill;
    let target = args.target?args.target:8;

    console.log("skillCheck");

    if (ask) {
        let title = "";
        let cha = args.cha?args.cha:null;
        let skillFqn = args.skill;

        let skillId = skillFqn;
        let specId = null;
        if (skillId.indexOf(".")) {
            skillId = skillFqn.split(".")[0];
            specId = skillFqn.split(".")[1];
        }
        let skill = CONFIG.MGT2.SKILLS[skillId];

        if (!skill) {
            ui.notifications.error(`Skill [${skillId}] is unrecognised.`);
        }

        if (!cha) {
            cha = skill.default;
        }
        if (CONFIG.MGT2.CHARACTERISTICS[cha]) {
            title = `${cha} + `;
        }
        title += skillLabel(skill, skillId);

        let html = `<div class='skill-message'><h2>${title}</h2><div class="message-content">`;
        if (args.text) {
            html += `<div class="skill-description">${args.text}</div>`;
        }
        if (args.target) {
            html += `<div><b>Target:</b> ${args.target}+</div>`;
        }
        let jsonData = {
            "skill": skillFqn,
            "specId": specId,
            "cha": cha,
            "dm": 0,
            "rollType": "standard",
            "difficulty": args.target,
            "description": args.text,
            "success": args.success,
            "failure": args.failure
        }
        let json = JSON.stringify(jsonData);

        console.log(json);
        html += `<div class="skillcheck-message" data-skillcheck="${skillFqn}" data-options='${json}'>`;
        html += `<button data-skillcheck="${skillFqn}" data-options='${json}'
                    title="${title}"
                    class="skillcheck-button">Roll ${title}</button>`;

        html += `</div>`;

        let chatData = {
            content: html
        };
        ChatMessage.create(chatData, {});

    } else {
        game.mgt2e.rollSkillMacro(skillFqn, {
            "difficulty": target,
            "text": args.text,
            "success": args.success,
            "failure": args.failure
        });
    }
};

MgT2eMacros.damage = function(args) {
    let dice = args.dice;
    let text = args.text;

    rollAttack(null, null, {
        "damage": dice,
        "title": args.title?args.title:null,
        "description": text
    });
};