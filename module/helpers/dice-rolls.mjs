
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

export function rollAttack(actor, weapon, skillDM, dm, rollType, range) {
    const   data = actor.data.data;
    let     content = "Attack";
    let     melee = true;

    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `${weapon.name}`;

    let rangeBand = null;
    let rangeDistance = weapon.data.weapon.range;
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
    content = `<h2>${weapon.name} ${rangeBand?(" @ " + rangeDistance+"m"):""}</h2><div>`;
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
    content += `<b>Damage:</b> ${weapon.data.weapon.damage.toUpperCase()}<br/>`;
    content += `<b>Range:</b> ${weapon.data.weapon.range}m<br/>`;
    if (weapon.data.weapon.traits && weapon.data.weapon.traits != "") {
        content += `<b>Traits:</b> ${weapon.data.weapon.traits}`
    }
    content += '</div>';
    // End of header.

    let dmg = weapon.data.weapon.damage;

    if (dm && parseInt(dm) != 0) {
        dice += " + " + parseInt(dm);
    }
    if (range) {
        dice += " + " + range;
    }
    const damageRoll = new Roll(dmg, actor.getRollData()).evaluate({ async: false });
    let damageTotal = damageRoll.total;
    const attackRoll = new Roll(dice, actor.getRollData()).evaluate({ async: false });
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

    content += `<b>Attack Roll:</b> ${attackTotal} <span class="${effectClass}">${effectText}</span><br/>`;
    content += `<b>Damage Roll:</b> ${damageTotal}`;

    if (!rangeBand) {
        range = weapon.data.weapon.range;
        let shortRange = parseInt(range / 4);
        let longRange = parseInt(range * 2);
        let extremeRange = parseInt(range * 4);

        content += "<table><tr><th>Short (+1)</th><th>Medium</th><th>Long (-2)</th><th>Extreme (-4)</th></tr>";
        content += `<tr><td>${shortRange}m</td><td>${range}m</td><td>${longRange}m</td><td>${extremeRange}m</td></tr>`;
        content += "</table>";
    }

    attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({actor: actor}),
        content: content,
        rollMode: game.settings.get("core", "rollMode")
    });

}

export function rollSkill(actor, skill, speciality, cha, dm, rollType, difficulty) {
    const data = actor.data.data;
    let   text = "";
    let   creatureCheck = false;
    let   untrainedCheck = false;
    let   specialityCheck = false;
    let   skillCheck = false;

    // Normal, Boon or Bane dice roll.
    let dice = "2D6";
    if (rollType === "boon") {
        dice = "3D6k2";
    } else if (rollType === "bane") {
        dice = "3D6kl2";
    }

    if (cha && data.characteristics && data.characteristics[cha]) {
        let dm = data.characteristics[cha].dm;
        dice += " + " + dm;
        text += cha;
        if (dm < 0) {
            text += " (" + dm + ")";
        } else {
            text += " (+" + dm + ")";
        }
    } else {
        creatureCheck = true;
    }

    if (skill) {
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
    let difficultyLabel = "";
    switch (difficulty) {
        case 0: case 1: case 2: case 3:
            difficultyLabel = "Simple";
            break;
        case 4: case 5:
            difficultyLabel = "Easy";
            break;
        case 6: case 7:
            difficultyLabel = "Routine";
            break;
        case 8: case 9:
            difficultyLabel = "Average";
            break;
        case 10: case 11:
            difficultyLabel = "Difficult";
            break;
        case 12: case 13:
            difficultyLabel = "Very Difficult";
            break;
        case 14: case 15:
            difficultyLabel = "Formidable";
            break;
        case 16:
            difficultyLabel = "Impossible";
            break;
    }
    if (difficultyLabel != "") {
        checkText = difficultyLabel + " " + checkText;
    }

    let roll = new Roll(dice, actor.getRollData()).evaluate({async: false});
    if (roll) {
        let total = roll.total;
        console.log("Rolled " + total);

        text = "<span class='skillroll'>" + text + "</span>";
        text = "<div><img class='skillcheck-thumb' src='" + actor.thumbnail + "'/>" +
        checkText + "<br/>" + text + "</div>";
        text += "<br/>"

        let effect = total - difficulty;
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

        text += `<span class='effectRoll ${effectClass}'>${effectType} [${effect}]</span><br/>`;
        text += `Chain Bonus ${chain}`

        roll.toMessage({
            speaker: ChatMessage.getSpeaker({actor: actor}),
            flavor: text,
            rollMode: game.settings.get("core", "rollMode")
        });
    }
}