import {MGT2} from "../config.mjs";
import {skillLabel} from "../dice-rolls.mjs";

export async function addPackageToActor(targetActor, actorPackage) {
    // Has it been added before? Don't add same package more than once.
    if (targetActor.system.packages && targetActor.system.packages.find( p => p.uuid === actorPackage.uuid)) {
        ui.notifications.warn(game.i18n.format("MGT2.Info.Drop.DropPackageDupe",
            { package: actorPackage.name, actor: targetActor.name }));
        return;
    }

    // Now confirm we want to add it.
    const yes = await foundry.applications.api.DialogV2.confirm({
        window: { title: game.i18n.format("MGT2.Dialog.AddPackageConfirm.Title") },
        content: `<p>${game.i18n.format("MGT2.Dialog.AddPackageConfirm.Text", {
            package: actorPackage.name,
            actor: targetActor.name
        })}</p>`
    });
    if (!yes) {
        return;
    }



    if (!targetActor.system.packages) {
        targetActor.system.packages = [];
    }
    targetActor.system.packages.push({
        uuid: actorPackage.uuid,
        name: actorPackage.name,
        img: actorPackage.img
    });
    await targetActor.update({ "system.packages": targetActor.system.packages});

    ui.notifications.info(game.i18n.format("MGT2.Info.Drop.DropPackage",
        { package: actorPackage.name, actor: targetActor.name }));

    let html=`<div class="chat-package">`;
    html += `<h3>${actorPackage.name}</h3>`;
    html += `<p><b>${targetActor.name}</b></p>`;

    if (actorPackage.system.description && actorPackage.system.description.length > 0) {
        html += `<div class="popup-text">${actorPackage.system.description}</div>`;
    }

    if (actorPackage.system.sophont.profession && actorPackage.system.sophont.profession.length > 0) {
        html += `<p><b>Profession:</b> ${actorPackage.system.sophont.profession}</p>`;
    }
    if (!isNaN(actorPackage.system.speed.base) && parseInt(actorPackage.system.speed.base) > 0) {
        if (actorPackage.system.speed.base !== targetActor.system.speed.base && actorPackage.system.speed.base !== null) {
            html += `<p><b>Speed:</b> ${actorPackage.system.speed.base}</p>`;
        }
        targetActor.system.speed.base = actorPackage.system.speed.base;
        targetActor.system.speed.value = actorPackage.system.speed.base;
        await targetActor.update({"system.speed": targetActor.system.speed });
    }
    if (actorPackage.system.size && !Number.isNaN(actorPackage.system.size)) {
        if (actorPackage.system.size !== targetActor.system.size) {
            html += `<p><b>Size:</b> ${actorPackage.system.size}</p>`;
        }
        targetActor.system.size = parseInt(actorPackage.system.size);
        await targetActor.update({"system.size": targetActor.system.size });
    }

    html += `<div class="stats grid grid-3col">`;
    for (let c in actorPackage.system.characteristics) {
        if (actorPackage.system.settings.useCustomDice) {
            // Rather than this being a bonus, it is a new dice roll.
            if (!actorPackage.system.characteristics[c].show) {
                targetActor.system.characteristics[c].show = false;
                continue;
            }
            targetActor.system.characteristics[c].show = true;
            let dice = actorPackage.system.characteristics[c].dice;
            if (!dice || dice === "") {
                dice = "2D6";
            }
            let uppRoll = await new Roll(dice, null).evaluate();
            targetActor.system.characteristics[c].value = uppRoll.total;
            targetActor.system.characteristics[c].roll = dice;
            html += `<div class="stat resource"><span class="stat-hdr">${c}</span><span class="stat-val">${dice}<br/>${uppRoll.total}</span></div>`;
        } else {
            if (!actorPackage.system.characteristics[c].show) {
                continue;
            }
            let bonus = parseInt(actorPackage.system.characteristics[c].value);
            if (!isNaN(bonus) && bonus !== 0) {
                targetActor.system.characteristics[c].value += bonus;
                if (targetActor.system.characteristics[c].value < 1) {
                    targetActor.system.characteristics[c].value = 1;
                }
                html += `<div class="stat resource"><span class="stat-hdr">${c}</span><span class="stat-val">${(bonus>0)?"+":""}${bonus}</span></div>`;
            }
        }
    }
    html += `</div>`;
    await targetActor.update({ "system.characteristics": targetActor.system.characteristics});

    let skillText = "";
    for (let s in actorPackage.system.skills) {
        let skill = actorPackage.system.skills[s];
        let target = targetActor.system.skills[s];
        let text = null;
        if (skill.deleted) {
            // Remove skill from target character
            if (target) {
                await targetActor.update({[`system.skills.-=${s}`]: null});
                text = `-<b><i>${skillLabel(skill)}</i></b>`;
            }
        } else if (skill && !target) {
            target = targetActor.system.skills[s] = JSON.parse(
                JSON.stringify(skill)
            )
            text = `+<b>${skillLabel(skill)}</b>`;
        } else if (skill.trained) {
            target.trained = true;
            target.value = Math.min(4, parseInt(target.value) + parseInt(skill.value));
            if (skill.specialities) {
                // Look for optional skills.
                let optionalSkills = [];
                let selectedOptional = null;
                for (let sp in skill.specialities) {
                    if (skill.specialities[sp].optional) {
                        optionalSkills.push({
                            label: skillLabel(skill.specialities[sp]),
                            action: sp,
                            value: sp
                        })
                    }
                }
                if (optionalSkills.length > 5) {
                    let content = `<p>${game.i18n.format("MGT2.Dialog.SelectSkill.Text", { name: skillLabel(skill)})}</p>`;

                    const fields = foundry.applications.fields;
                    const selectInput = fields.createSelectInput({
                        options: optionalSkills,
                        name: "skill"
                    });
                    content += selectInput.outerHTML;

                    const data = await foundry.applications.api.DialogV2.input({
                        window: { title: game.i18n.format("MGT2.Dialog.SelectSkill.Title", { name: actorPackage.name})},
                        content: content
                    });
                    console.log(data);
                    selectedOptional = data.skill;
                } else if (optionalSkills.length > 1) {
                    selectedOptional = await foundry.applications.api.DialogV2.wait({
                        window: { title: game.i18n.format("MGT2.Dialog.SelectSkill.Title", { name: actorPackage.name})},
                        content: `<p>${game.i18n.format("MGT2.Dialog.SelectSkill.Text", { name: skillLabel(skill)})}</p>`,
                        buttons: optionalSkills
                    });
                }
                for (let sp in skill.specialities) {
                    if (selectedOptional && selectedOptional !== sp) {
                        continue;
                    }
                    let spec = skill.specialities[sp];
                    if (spec.deleted) {
                        if (target.specialities[sp]) {
                            if (Object.getOwnPropertyNames(skill.specialities).length === 1) {
                                // If the final speciality is removed, then we need to remove the whole
                                // structure, so that the parent skill is treated as a normal skill.
                                delete target.specialities;
                                await targetActor.update({[`system.skills.${s}.-=specialities`]: null});
                            } else {
                                delete target.specialities[sp];
                                await targetActor.update({[`system.skills.${s}.specialities.-=${sp}`]: null});
                            }
                        }
                        text = `-<b><i>${skillLabel(skill)} (${skillLabel(spec)})</i></b>`;
                    } else if (target.specialities[sp]) {
                        if (spec.trained) {
                            target.specialities[sp].trained = true;
                        }
                        target.specialities[sp].value = Math.min(4,
                            parseInt(target.specialities[sp].value) + parseInt(spec.value));
                        if (spec.boon) {
                            target.specialities[sp].boon = spec.boon;
                        }
                        if (spec.bonus !== 0) {
                            target.specialities[sp].bonus = spec.bonus;
                        }
                    } else {
                        if (!target.specialities) {
                            targetActor.system.skills[s].specialities = {};
                        }
                        targetActor.system.skills[s].specialities[sp] = spec;
                        await targetActor.update({ "system.skills": targetActor.system.skills});
                    }
                    if (spec.trained || spec.value > 0) {
                        text = `${skillLabel(skill)} (${skillLabel(spec)}) ${spec.value}`;
                        if (spec.bonus && spec.bonus !== 0) {
                            text += ` [${spec.bonus}]`;
                        }
                        if (spec.boon) {
                            text += ` [${spec.boon}]`;
                        }
                    }
                }
            }
            if (!text) {
                text = `${skillLabel(skill)} ${skill.value}`;
            }
        }
        if (skill.bonus !== 0 && target) {
            target.bonus = skill.bonus;
        }
        if (skill.notes && skill.notes !== "" && target) {
            target.notes = skill.notes;
        }
        if (skill.boon && target) {
            target.boon = skill.boon;
        }
        if (text) {
            skillText += `<li>${text}</li>`;
        }
    }
    if (skillText.length > 0) {
        html += `<h4>Skills</h4>`;
        html += `<ol class="skill-list">${skillText}</ol>`;
    }
    await targetActor.update({ "system.skills": targetActor.system.skills});

    let benefitsText = "";
    if (actorPackage.system.cash && parseInt(actorPackage.system.cash) > 0) {
        if (targetActor.system.finance) {
            targetActor.system.finance.cash =
                parseInt(targetActor.system.finance.cash) + parseInt(actorPackage.system.cash);
            await targetActor.update({"system.finance": targetActor.system.finance});
        }
        benefitsText += `<p>Cash: Cr${actorPackage.system.cash}</p>`;
    }
    if (targetActor.system.sophont) {
        let isMale = false, isFemale = false;

        if (targetActor.system.sophont.gender) {
            let gender = targetActor.system.sophont.gender.toLowerCase();
            if (gender.startsWith("m")) {
                isMale = true;
            } else if (gender.startsWith("f")) {
                isFemale = true;
            }
        }
        let str = parseInt(targetActor.system.characteristics["STR"].value) - 7;
        let dex = parseInt(targetActor.system.characteristics["DEX"].value) - 7;
        let end = parseInt(targetActor.system.characteristics["END"].value) - 7;

        if (actorPackage.system.sophont.species) {
            targetActor.system.sophont.species = actorPackage.system.sophont.species;
        }
        if (actorPackage.system.sophont.profession) {
            targetActor.system.sophont.profession = actorPackage.system.sophont.profession;
        }
        if (actorPackage.system.sophont.weight) {
            let weight = parseInt(actorPackage.system.sophont.weight);
            if (weight > 0) {
                weight += isMale?7:0;
                weight -= isFemale?7:0;
                weight += str + parseInt(end/2) - parseInt(dex / 2);
                weight += Math.floor(Math.random() * 6) - Math.floor(Math.random() * 6);
                targetActor.system.sophont.weight = weight;
                html += `<p>Weight: ${weight}kg</p>`;
            }
        }
        if (actorPackage.system.sophont.height) {
            let height = parseInt(actorPackage.system.sophont.height);
            if (height > 0) {
                height += isMale?7:0;
                height -= isFemale?7:0;
                height += parseInt(str/2);
                height += Math.floor(Math.random()*6) - Math.floor(Math.random()*6);
                targetActor.system.sophont.height = height;
                html += `<p>Height: ${height}cm</p>`;
            }
        }
        await targetActor.update({"system.sophont": targetActor.system.sophont});
    }

    // Look for optional items
    let optionalItems = [];
    let selectedOptional = null;
    for (let item of actorPackage.items) {
        if (item.system.packageOptional) {
            optionalItems.push({
                label: item.name,
                action: item.uuid
            });
        }
    }
    if (optionalItems.length > 1) {
        selectedOptional = await foundry.applications.api.DialogV2.wait({
            window: { title: game.i18n.format("MGT2.Dialog.SelectItem.Title", { name: actorPackage.name})},
            content: `<p>${game.i18n.localize("MGT2.Dialog.SelectItem.Text")}</p>`,
            buttons: optionalItems
        });
    }

    // Now copy any items across
    let term = null;
    for (let item of actorPackage.items) {
        if (item.system.packageOptional) {
            if (item.uuid !== selectedOptional) {
                continue;
            }
        }
        const itemData = {
            name: item.name,
            img: item.img,
            type: item.type,
            system: foundry.utils.deepClone(item.system)
        };
        if (targetActor.type === "npc" && (itemData.type === "term" || itemData.type === "associate")) {
            // NPCs don't have career terms or associates.
            // However, we may need to increment their age.
            if (itemData.type === "term" && targetActor.system.settings.autoAge) {
                let years = itemData.system.term.termLength;
                if (itemData.system.term.randomTerm) {
                    let dice = "3D6";
                    if (itemData.system.term.randomLength) {
                        dice = itemData.system.term.randomLength;
                    }
                    let r = await new Roll(dice, null).evaluate();
                    years = r.total;
                }
                years = parseInt(targetActor.system.sophont.age) + years;
                html += `<p>Age: ${years}</p>`;
                await targetActor.update({"system.sophont.age": years });
            }
            continue;
        }
        if (itemData.type === "term" && itemData.system.term.hideFromPackage) {
            continue;
        }
        if (itemData.type === "term" && itemData.system.term.randomTerm) {
            let dice = "3D6";
            if (itemData.system.term.randomLength) {
                dice = itemData.system.term.randomLength;
            }
            let r = await new Roll(dice, null).evaluate();
            itemData.system.term.termLength = r.total;
            itemData.system.term.randomTerm = false;
        }
        ui.notifications.info(game.i18n.format("MGT2.Info.Drop.DropPackageItem",
            { item: item.name, actor: targetActor.name }));
        if (item.type === "associate" && item.system.quantity && parseInt(item.system.quantity) > 1) {
            const num = parseInt(item.system.quantity);
            delete itemData.system.quantity;
            for (let i=0; i < Math.min(9, parseInt(num)); i++) {
                await Item.create(itemData, {parent: targetActor});
            }
        } else {
            delete itemData.system.quantity;
            await Item.create(itemData, {parent: targetActor});
        }

        if (itemData.type !== "term") {
            if (itemData.type === "associate") {
                let rel = game.i18n.localize("MGT2.History.Relation." + item.system.associate.relationship);
                benefitsText += `<p>${rel}: ${item.name}</p>`;
            } else {
                benefitsText += `<p>${item.name}</p>`;
            }
        } else {
            term = itemData;
        }
    }
    if (benefitsText.length > 0) {
        html += `<h4>Benefits</h4>`;
        html += benefitsText;
    }

    if (term) {
        if (!targetActor.system.settings.autoAge && term.system.term.termLength > 0) {
            targetActor.update({"system.settings.autoAge": true});
        }
        html += `<h4>Careers</h4>`;
        if (term.system.term.termLength > 0) {
            html += `<p>${term.name} - ${term.system.term.termLength} years</p>`;
        } else {
            html += `<p>${term.name}</p>`;
        }
    }

    html += `</div>`;

    let who = null;
    if (game.users.current.isGM) {
        if (game.settings.get("mgt2e", "gmSheetNotification") === "private") {
            who = [game.user.id];
        }
    } else {
        if (game.settings.get("mgt2e", "playerSheetNotification") === "private") {
            who = [game.user.id];
        } else if (game.settings.get("mgt2e", "playerSheetNotification") === "gm") {
            who = [game.user.id, game.users.activeGM ];
        }
    }
    let chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker(),
        whisper: who,
        content: html
    }
    ChatMessage.create(chatData, {});

}
