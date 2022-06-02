
export function getSkillValue(actor, skill, speciality) {
    const data = actor.data.data;

    if (skill) {
        if (skill.indexOf(".") > -1) {
            speciality = skill.split(".")[1];
            skill = skill.split(".")[0];
        }
        let value = data.skills["jackofalltrades"].value - 3;
        if (data.skills[skill].trained) {
            value = skill.value;
            if (speciality) {
                value = data.skills[skill].specialities[speciality].value;
            }
        }
        return parseInt(value);
    }
    return -3;
}
export function hasTrait(traits, trait) {
    return traits.toLowerCase().indexOf(trait.toLowerCase()) > -1;
}

export function getTraitValue(traits, trait) {
    traits = traits.toLowerCase();
    trait = trait.toLowerCase();

    if (traits.indexOf(trait) > -1) {
        traits = traits.substring(traits.indexOf(trait));
        traits = traits.replace(/[a-z]* *([0-9]*).*/, "$1");
        return parseInt(traits);
    }
    return 0;
}

export function rollAttack(actor, weapon, skillDM, dm, rollType, range, autoOption) {
    const   data = actor.data.data;
    let     content = "Attack";
    let     melee = true;

    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `${weapon.name}`;

    let baseRange = weapon.data.weapon.range;
    let rangeBand = null;
    let rangeDistance = baseRange;
    if (range !== undefined && range !== null) {
        switch (range) {
            case +1:
                rangeBand = "Short";
                rangeDistance = parseInt(rangeDistance / 4);
                break;
            case 0:
                rangeBand = "Medium";
                break;
            case -2:
                rangeBand = "Long";
                rangeDistance = parseInt(rangeDistance * 2);
                break;
            case -4:
                rangeBand = "Extreme";
                rangeDistance = parseInt(rangeDistance * 4);
                break;
        }
    }

    // Normal, Boon or Bane dice roll.
    let dice = "2D6";
    if (rollType === "boon") {
        dice = "3D6k2";
    } else if (rollType === "bane") {
        dice = "3D6kl2";
    }
    dice += " + " + skillDM;

    // Header information
    content = `<h2>${weapon.name} ${(baseRange > 0 && rangeBand)?(" @ " + rangeDistance+"m"):""}</h2><div>`;
    content += `<img class="skillcheck-thumb" src="${actor.thumbnail}"/>`;
    content += `<img class="skillcheck-thumb" src="${weapon.img}"/>`;
    content += `<b>Skill DM:</b> ${skillDM}`;
    if (dm && parseInt(dm) < 0) {
        content += " " + dm;
    } else if (dm && parseInt(dm) > 0) {
        content += " +" + dm;
    }
    if (rollType && rollType === "boon") {
        content += "<span class='boon'> (boon)</span>";
    } else if (rollType && rollType === "bane") {
        content += "<span class='bane'> (bane)</span>";
    }
    content += "<br/>";

    // Work out damage.
    let dmg = weapon.data.weapon.damage;
    let destructive = dmg.indexOf("*") > -1;
    let damageBonus = weapon.data.weapon.damageBonus;
    if (damageBonus) {
        damageBonus = actor.data.data.characteristics[damageBonus].dm;
        if (damageBonus > 0) {
            dmg += " +" + damageBonus;
        } else if (damageBonus < 0) {
            dmg += " " + damageBonus;
        }
    }

    content += `<b>Damage:</b> ${dmg.toUpperCase()}<br/>`;
    if (baseRange > 0) {
        content += `<b>Range:</b> ${baseRange}m<br/>`;
    } else {
        content += `<b>Melee</b>`;
    }
    let traits = weapon.data.weapon.traits;
    if (traits && traits != "") {
        content += `<b>Traits:</b> ${traits}`
    } else {
        traits = "";
    }
    content += '</div>';
    // End of header.

    if (dm && parseInt(dm) != 0) {
        dice += " + " + parseInt(dm);
    }
    if (range) {
        dice += " + " + range;
    }
    let attacks = 1;
    if (autoOption && autoOption == "burst") {
        let autoBonus = getTraitValue(traits, "auto");
        dmg += " + " + autoBonus;
    } else if (autoOption && autoOption == "full") {
        attacks = getTraitValue(traits, "auto");
    }

    const roll = new Roll(dice, actor.getRollData()).evaluate({async: false});
    for (let attack=1; attack <= attacks; attack++) {
        if (attacks > 1) {
            content += `<h3 class="fullauto">Full auto attack ${attack} of ${attacks}</h3>`;
        }

        const damageRoll = new Roll(dmg, actor.getRollData()).evaluate({async: false});
        let damageTotal = damageRoll.total;
        const attackRoll = new Roll(dice, actor.getRollData()).evaluate({async: false});
        let attackTotal = attackRoll.total;
        let effect = attackTotal - 8;
        let critical = (effect >= 6);

        let effectClass = "rollFailure";
        let effectText = "Miss";
        if (effect == 0) {
            effectClass = "rollMarginal";
            effectText = "Hit";
        } else if (effect > 0 && effect < 6) {
            effectClass = "rollSuccess";
            effectText = `Hit (+${effect})`;
        } else if (effect >= 6) {
            effectClass = "rollCritical";
            effectText = `Critical (+${effect})`;
        }
        let damageEffect = damageTotal;
        if (!destructive && effect > 0) {
            damageEffect = damageTotal + effect;
        }
        let ap = 0;
        if (hasTrait(traits, "ap")) {
            ap = getTraitValue(traits, "ap");
        }

        content += `<div class="damage-message" data-damage="${damageEffect}" data-ap="${ap}">`;
        content += `<b>Attack Roll:</b> ${attackTotal} <span class="${effectClass}">${effectText}</span><br/>`;
        content += `<b>Damage Roll:</b> ${damageTotal}`;
        if (!destructive && effect > 0) {
            content += ` + ${effect} (${damageTotal + effect})`;
        }
        if (hasTrait(traits, "ap")) {
            content += ` AP ${getTraitValue(traits, "ap")}`;
        }
        if (hasTrait(traits, "radiation")) {
            const radRoll = new Roll("2D6 * 20", actor.getRollData()).evaluate({async: false});
            content += `<br/><b>Radiation:</b> ${radRoll.total} Rads ☢`;
            if (destructive) {
                content += ` (10m)`;
            }
        }
        if (hasTrait(traits, "blast")) {
            content += `<br/><b>Blast Radius:</b> ${getTraitValue(traits, "blast")}m`;
        }
        content += `</div>`;
    }

    if (!rangeBand && baseRange > 0) {
        let shortRange = parseInt(baseRange / 4);
        let longRange = parseInt(baseRange * 2);
        let extremeRange = parseInt(baseRange * 4);

        content += "<table><tr><th>Short (+1)</th><th>Medium</th><th>Long (-2)</th><th>Extreme (-4)</th></tr>";
        content += `<tr><td>${shortRange}m</td><td>${baseRange}m</td><td>${longRange}m</td><td>${extremeRange}m</td></tr>`;
        content += "</table>";
    }

    roll.toMessage({
        speaker: ChatMessage.getSpeaker({actor: actor}),
        content: content,
        rollMode: game.settings.get("core", "rollMode")
    });

}

function getDifficultyLabel(difficulty) {
    switch (difficulty) {
        case 1: case 2: case 3:
            return "Simple";
        case 4: case 5:
            return "Easy";
        case 6: case 7:
            return "Routine";
        case 8: case 9:
            return "Average";
        case 10: case 11:
            return "Difficult";
        case 12: case 13:
            return "Very Difficult";
        case 14: case 15:
            return "Formidable";
        case 16:
            return "Impossible";
    }
    return "";
}

function getEffectLabel(effect) {
    let effectType = "", effectClass = "";
    let chain = "+0";
    if (effect <= -6) {
        effectType = "Exceptional Failure";
        effectClass = "rollFailure";
        chain = "-3";
    } else if (effect <= -2) {
        effectType = "Average Failure";
        effectClass = "rollFailure";
        chain = "-2";
    } else if (effect <= -1) {
        effectType = "Marginal Failure";
        effectClass = "rollMarginal";
        chain = "-1";
    } else if (effect <= 0) {
        effectType = "Marginal Success";
        effectClass = "rollSuccess";
    } else if (effect <= 5) {
        effectType = "Average Success";
        effectClass = "rollSuccess";
        chain = "+1";
    } else {
        effectType = "Exceptional Success";
        effectClass = "rollSuccess";
        chain = "+2";
    }

    return `<span class='effectRoll ${effectClass}'>${effectType} [${effect>=0?"+":""}${effect}]</span><br/>Chain Bonus ${chain}`;
}

export function rollSkill(actor, skill, speciality, cha, dm, rollType, difficulty) {
    console.log("rollSkill:");
    console.log(actor);
    const data = actor.data.data;
    let   title = "";
    let   text = "";
    let   creatureCheck = false;
    let   isPerson = false;
    let   untrainedCheck = false;
    let   specialityCheck = false;
    let   skillCheck = false;
    let   defaultCha = true;
    let   chaDm = 0;

    // Normal, Boon or Bane dice roll.
    let dice = "2D6";
    if (rollType === "boon") {
        dice = "3D6k2";
    } else if (rollType === "bane") {
        dice = "3D6kl2";
    }

    console.log(actor.type);
    if (actor.type == "traveller" || actor.type == "npc") {
        console.log("Is a person");
        isPerson = true;
    }
    if (skill && (typeof skill === 'string' || skill instanceof String)) {
        skill = data.skills[skill];
    }

    if (isPerson) {
        console.log("Going into isPerson");
        if (cha) {
            defaultCha = false;
            chaDm = data.characteristics[cha].dm;
        } else if (skill) {
            cha = skill.default;
            if (speciality && speciality.default) {
                cha = speciality.default;
            }
        } else {
            cha = null;
        }
    } else {
        console.log("This is not a person");
        creatureCheck = true;
        cha = null;
    }
    console.log("Using default cha " + defaultCha);
    if (cha) {
        chaDm = data.characteristics[cha].dm;
        dice += " + " + chaDm;
        title = cha;
        text += cha;
        if (chaDm < 0) {
            text += " (" + chaDm + ")";
        } else {
            text += " (+" + chaDm + ")";
        }
    }

    if (skill) {
        title += ((title == "")?"":" + ") + skill.label;
        skillCheck = true;
        let value = data.skills["jackofalltrades"].value - 3;
        if (text.length > 0) {
            text += " + ";
        }
        text += skill.label;
        if (skill.trained) {
            value = skill.value;
            if (speciality) {
                value = speciality.value;
                title += " (" + speciality.label + ")";
                text += " (" + speciality.label + ")";
                specialityCheck = true;
            }
        } else {
            untrainedCheck = true;
        }
        dice += " + " + value;
        if (value < 0) {
            text += " (" + value + ")";
        } else {
            text += " (+" + value + ")";
        }
    }
    if (dm > 0) {
        dice += " +" + dm;
        text += " +" + dm;
    } else if (dm < 0) {
        dice += " " + dm;
        text += " " + dm;
    }

    if (rollType === "boon") {
        text += " <span class='boon'>[Boon]</span>";
    } else if (rollType === "bane") {
        text += " <span class='bane'>[Bane]</span>";
    }
    console.log("Thumbnail:" + actor.thumbnail);

    let checkText = "Making a skill check";

    if (creatureCheck) {
        checkText = "Creature skill check";
    } else if (specialityCheck) {
        checkText = "Specialisation check";
    } else if (skillCheck) {
        checkText = "Skill check";
    } else {
        checkText = "Characteristic check";
    }
    if (untrainedCheck) {
        checkText += " (untrained)";
    }
    if (difficulty == undefined) {
        difficulty = 8;
    }
    let difficultyLabel = getDifficultyLabel(difficulty);
    if (difficultyLabel != "") {
        checkText = difficultyLabel + " " + checkText;
    }

    let roll = new Roll(dice, actor.getRollData()).evaluate({async: false});
    if (roll) {
        let total = roll.total;
        text = `<h2>${title}</h2></h2><div><img class='skillcheck-thumb' src='${actor.thumbnail}'/>${checkText}<br/>${text}</div><br/>`;

        let effect = total - difficulty;
        text += `<span class="skill-roll">${total}</span> ` + getEffectLabel(effect);

        if (skill.specialities != null && speciality == null) {
            for (let sp in skill.specialities) {
                let spec = skill.specialities[sp];
                if (spec.value > 0) {
                    let stotal = total + spec.value;
                    let slabel = `${spec.label} (${spec.value})`;

                    if (isPerson && defaultCha && spec.default && spec.default != skill.default) {
                        stotal -= chaDm;
                        stotal += data.characteristics[spec.default].dm;
                        slabel += ` (${spec.default})`;
                    }

                    text += `<h2 class="subroll">${slabel}</h2>`;
                    text += `<span class="skill-roll">${stotal}</span> ` + getEffectLabel(stotal - difficulty);
                }
            }
        }

        roll.toMessage({
            speaker: ChatMessage.getSpeaker({actor: actor}),
            flavor: text,
            rollMode: game.settings.get("core", "rollMode")
        });
    }
}