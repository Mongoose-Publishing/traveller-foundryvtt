
export function getSkillValue(actor, skill, speciality) {
    const data = actor.system;

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

export function rollAttack(actor, weapon, skillDM, dm, rollType, range, autoOption, isParry) {
    const   data = actor?actor.system:null;
    let     content = "Attack";
    let     melee = true;

    let baseRange = weapon.system.weapon.range;
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
    if (data.modifiers.encumbrance.dm != 0) {
        dice += " + " + parseInt(data.modifiers.encumbrance.dm);
    }
    if (baseRange === 0) {
        if (data.modifiers.melee.dm != 0) {
            dice += " + " + parseInt(data.modifiers.melee.dm);
        }
    } else {
        if (data.modifiers.physical.dm != 0) {
            dice += " + " + parseInt(data.modifiers.physical.dm);
        }
        if (data.modifiers.guncombat.dm != 0 && weapon.system.weapon.skill.indexOf("guncombat") == 0) {
            dice += " + " + parseInt(data.modifiers.guncombat.dm);
        }
    }

    if (weapon.system.weapon.attackBonus) {
        const attackBonus = parseInt(weapon.system.weapon.attackBonus);
        if (attackBonus != 0) {
            dice += " + " + attackBonus;
        }
    }

    // Header information
    content = `<div class="attack-message">`;
    content += `<h2>${weapon.name} ${(baseRange > 0 && rangeBand)?(" @ " + rangeDistance+"m"):""}</h2><div class="message-content">`;
    content += "<div>";
    if (actor) {
        content += `<img class="skillcheck-thumb" src="${actor.thumbnail}"/>`;
    }
    content += `<img class="skillcheck-thumb" alt="${weapon.name}" src="${weapon.img}"/>`;
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
    let dmg = weapon.system.weapon.damage;
    let type = weapon.system.weapon.damageType;
    if (!type) {
        type == "standard";
    }
    let destructive = dmg.indexOf("*") > -1;
    let damageBonus = weapon.system.weapon.damageBonus;
    if (damageBonus && actor && actor.system.characteristics && actor.system.characteristics[damageBonus]) {
        damageBonus = actor.system.characteristics[damageBonus].dm;
        if (damageBonus > 0) {
            dmg += " +" + damageBonus;
        } else if (damageBonus < 0) {
            dmg += " " + damageBonus;
        }
    }

    content += `<b>Damage:</b> ${dmg.toUpperCase()} ${(type==="standard")?"":(" ("+type+")")}<br/>`;
    if (baseRange > 0) {
        content += `<b>Range:</b> ${baseRange}m<br/>`;
    } else {
        content += `<b>Melee</b>`;
    }
    let traits = weapon.system.weapon.traits;
    if (traits && traits !== "") {
        content += `<b>Traits:</b> ${traits}`
    } else {
        traits = "";
    }
    content += '</div>';
    // End of header.

    if (actor && actor.system.characteristics) {
        let str = parseInt(actor.system["STR"]);
        let bulky = 0;
        if (hasTrait(traits, "verybulky")) {
            if (str < 2) {
                bulky = (2 - str);
            }
        } else if (hasTrait(traits, "bulky")) {
            if (str < 1) {
                bulky =  (1 - str);
            }
        }
        if (bulky > 0) {
            content += `<b>Bulky Weapon:</b> -${bulky}`;
            dm -= bulky;
        }
    }

    if (dm && parseInt(dm) !== 0) {
        dice += " + " + parseInt(dm);
    }
    if (range) {
        dice += " + " + range;
    }
    let attacks = 1;
    if (autoOption && autoOption === "burst") {
        let autoBonus = getTraitValue(traits, "auto");
        dmg += " + " + parseInt(autoBonus * destructive?10:1);
    } else if (autoOption && autoOption === "full") {
        attacks = getTraitValue(traits, "auto");
    }

    const roll = new Roll(dice, actor?actor.getRollData():null).evaluate({async: false});
    let damageRoll = null;
    for (let attack=1; attack <= attacks; attack++) {
        if (attacks > 1) {
            content += `<h3 class="fullauto">Full auto attack ${attack} of ${attacks}</h3>`;
        }

        damageRoll = new Roll(dmg, actor?actor.getRollData():null).evaluate({async: false});
        let damageTotal = damageRoll.total;

        let effect = 0, attackTotal = 0;
        if (actor) {
            const attackRoll = new Roll(dice, actor ? actor.getRollData() : null).evaluate({async: false});
            attackTotal = attackRoll.total;
            effect = attackTotal - 8;
        }

        let effectClass = "rollFailure";
        let effectText = "Miss";
        if (effect === 0) {
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
        let tl = weapon.system.tl;
        let options = "";
        if (type !== "standard") {
            options = type;
        }

        if (isParry) {
            if (actor) {
                content += `<b>Parry Roll:</b> ${attackTotal} <span class="${effectClass}">${effectText}</span><br/>`;
            } else {
                content += "<br/>";
            }
        } else {
            content += `<div class="damage-message" data-damage="${damageEffect}" data-ap="${ap}" data-tl="${tl}" data-options="${options}" data-traits="${traits}">`;
            content += `<button data-damage="${damageEffect}" data-ap="${ap}" data-tl="${tl}" data-options="${options}" data-traits="${traits}" class="damage-button">Apply</button>`;
            if (actor) {
                content += `<b>Attack Roll:</b> ${attackTotal} <span class="${effectClass}">${effectText}</span><br/>`;
            } else {
                content += "<br/>";
            }
            content += `<b>Damage Roll:</b> ${damageTotal}`;
            if (!destructive && effect > 0) {
                content += ` + ${effect} (${damageTotal + effect})`;
            }
            if (hasTrait(traits, "ap")) {
                content += ` AP ${getTraitValue(traits, "ap")}`;
            }
            if (hasTrait(traits, "radiation")) {
                const radRoll = new Roll("2D6 * 20", actor ? actor.getRollData() : null).evaluate({async: false});
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
    }

    if (!rangeBand && baseRange > 0) {
        let shortRange = parseInt(baseRange / 4);
        let longRange = parseInt(baseRange * 2);
        let extremeRange = parseInt(baseRange * 4);

        content += "<table><tr><th>Short (+1)</th><th>Medium</th><th>Long (-2)</th><th>Extreme (-4)</th></tr>";
        content += `<tr><td>${shortRange}m</td><td>${baseRange}m</td><td>${longRange}m</td><td>${extremeRange}m</td></tr>`;
        content += "</table>";
    }

    if (weapon.system.notes && weapon.system.notes.length > 0) {
        content += `<span class="weapon-notes">${weapon.system.notes}</span>`;
    }
    content += "</div>";

    if (actor) {
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({actor: actor}),
            content: content,
            rollMode: game.settings.get("core", "rollMode")
        });
    } else {
        damageRoll.toMessage({
            speaker: ChatMessage.getSpeaker({actor: actor}),
            flavor: content,
            rollMode: game.settings.get("core", "rollMode")
        });
    }

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
    let effectType, effectClass;
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
    const data = actor.system;
    let   title = "";
    let   skillText = "";
    let   text = "";
    let   creatureCheck = false;
    let   isPerson = false;
    let   untrainedCheck = false;
    let   specialityCheck = false;
    let   skillCheck = false;
    let   defaultCha = true;
    let   chaDm = 0;
    let   skillAugDm = 0;
    let   bonusDM = 0;

    // Normal, Boon or Bane dice roll.
    let dice = "2D6";
    if (rollType === "boon") {
        dice = "3D6k2";
    } else if (rollType === "bane") {
        dice = "3D6kl2";
    }

    if (actor.type === "traveller" || actor.type === "npc") {
        isPerson = true;
    }
    if (skill && (typeof skill === 'string' || skill instanceof String)) {
        skill = data.skills[skill];
    }

    if (isPerson) {
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
        creatureCheck = true;
        cha = null;
    }
    if (cha) {
        chaDm = data.characteristics[cha].dm;
        dice += ` ${chaDm>=0?"+":""}${chaDm}[${cha}]`;
        title = cha;
        skillText += cha;
        if (chaDm < 0) {
            skillText += " (" + chaDm + ")";
        } else {
            skillText += " (+" + chaDm + ")";
        }
        // AugmentDM is a straight bonus to any roll using that characteristic.
        if (data.characteristics[cha].augdm && parseInt(data.characteristics[cha].augdm) != 0) {
            let chaAugDm = parseInt(data.characteristics[cha].augdm);
            dice += ` ${(chaAugDm>=0)?"+":""}${chaAugDm}[AugDM]`;
            skillText += " (" + chaAugDm + "Aug)";
        }
        if (cha === "STR" || cha === "DEX" || cha === "END") {
            if (data.modifiers.encumbrance.dm) {
                let encDm = parseInt(data.modifiers.encumbrance.dm);
                dice += ` ${(encDm>=0)?"+":""}${encDm}[Enc]`;
                skillText += ` (${encDm}Enc)`;
            }
            if (data.modifiers.physical.dm) {
                let phyDm = parseInt(data.modifiers.physical.dm);
                dice += ` ${(phyDm>=0)?"+":""}${phyDm}[Phy]`;
                skillText += ` (${phyDm}Phy)`;
            }
        }
    }
    console.log(skillText);

    let notes = "";
    if (skill) {
        // AugmentDMs are applied to the roll, regardless of the actor's skill level.
        if (skill.augdm && parseInt(skill.augdm) > 0) {
            skillAugDm += parseInt(skill.augdm);
        }
        if (speciality && speciality.augdm && parseInt(speciality.augdm) > 0) {
            skillAugDm += parseInt(speciality.augdm);
        }

        if (speciality && speciality.bonus) {
            dm = parseInt(dm) + parseInt(speciality.bonus);
            notes += `${speciality.notes} (${speciality.bonus}) `;
        } else if (skill.bonus) {
            dm = parseInt(dm) + parseInt(skill.bonus);
            notes += `${skill.notes} (${skill.bonus}) `;
        }

        title += ((title === "")?"":" + ") + skill.label;
        skillCheck = true;
        let value = data.skills["jackofalltrades"].value - 3;
        if (skillText.length > 0) {
            skillText += " + ";
        }
        skillText += skill.label;
        if (skill.trained) {
            value = parseInt(skill.value);
            if (skill.expert && (cha === "INT" || cha === "EDU")) {
                if (parseInt(skill.expert) > value) {
                    value = parseInt(skill.expert) - 1;
                } else {
                    value += 1;
                }
                notes += "Expert Software/" + skill.expert;
            }
            if (skill.augment) {
                value += parseInt(skill.augment);
            }
            if (speciality) {
                value = speciality.value;
                title += " (" + speciality.label + ")";
                skillText += " (" + speciality.label + ")";
                specialityCheck = true;
                if (speciality.expert) {
                    if (parseInt(speciality.expert) > value) {
                        value = parseInt(speciality.expert) - 1;
                    } else {
                        value += 1;
                    }
                }
                if (speciality.augment) {
                    value += parseInt(speciality.augment);
                }
            }
        } else if (skill.expert && parseInt(skill.expert) > 0 && (cha === "INT" || cha === "EDU")) {
            value = parseInt(skill.expert) - 1;
            notes = "Expert Software/" + value;
        } else if (speciality && speciality.expert && (cha === "INT" || cha === "EDU")) {
            value = parseInt(speciality.expert) - 1;
            notes = "Expert Software";
        } else {
            untrainedCheck = true;
        }
        if (value < 0) {
            dice += " " + value;
            skillText += " (" + value + ")";
        } else {
            dice += " + " + value;
            skillText += " (+" + value + ")";
        }
    }
    if (skillAugDm != 0) {
        dice += " + " + skillAugDm + "[Aug]";
        skillText += " + " + skillAugDm + " [Aug]";
    }
    if (dm > 0) {
        dice += " +" + dm;
        skillText += " +" + dm;
    } else if (dm < 0) {
        dice += " " + dm;
        skillText += " " + dm;
    }

    if (rollType === "boon") {
        skillText += " <span class='boon'>[Boon]</span>";
    } else if (rollType === "bane") {
        skillText += " <span class='bane'>[Bane]</span>";
    }

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
    if (difficulty === undefined) {
        difficulty = 8;
    }
    if (game.settings.get("mgt2", "verboseSkillRolls")) {
        let difficultyLabel = getDifficultyLabel(difficulty);
        if (difficultyLabel !== "") {
            checkText = difficultyLabel + " " + checkText;
        }
    }

    let roll = new Roll(dice, actor.getRollData()).evaluate({async: false});
    if (roll) {
        text = `<div class='skill-message'><h2>${title}</h2><div class="message-content">`;
        let total = roll.total;
        if (game.settings.get("mgt2", "useChatIcons")) {
            text += `<div class="skill-intro"><img class='skillcheck-thumb' src='${actor.thumbnail}'/>${checkText}<br/>${skillText}`;
        } else {
            text += `<div class="skill-intro">${checkText}<br/>${skillText}`;
        }
        text += `<div class="skill-augment-text">${notes}</div>`;
        text += "</div><br/>";

        if (game.settings.get("mgt2", "verboseSkillRolls")) {
            let effect = total - difficulty;
            text += `<span class="skill-roll inline-roll inline-result"><i class="fas fa-dice-d20"> </i> ${total}</span> ` + getEffectLabel(effect);
        }

        if (skill && skill.specialities != null && speciality == null) {
            for (let sp in skill.specialities) {
                let spec = skill.specialities[sp];
                if (spec.value > 0) {
                    let stotal = total + spec.value;
                    let slabel = `${spec.label} (${spec.value})`;

                    if (isPerson && defaultCha && spec.default && spec.default !== skill.default) {
                        stotal -= chaDm;
                        stotal += data.characteristics[spec.default].dm;
                        slabel += ` (${spec.default})`;
                    }

                    if (game.settings.get("mgt2", "verboseSkillRolls")) {
                        text += `<h3 class="subroll">${slabel}</h3>`;
                        text += `<span class="skill-roll inline-roll inline-result"><i class="fas fa-dice-d20"> </i> ${stotal}</span> ` + getEffectLabel(stotal - difficulty);
                    } else {
                        text += `<h3 class="subroll">${slabel} <span class="skill-roll inline-roll inline-result"><i class="fas fa-dice-d20"> </i> ${stotal}</span></h3>`;
                    }
                }
            }
        }
        text += "</div></div>";

        roll.toMessage({
            speaker: ChatMessage.getSpeaker({actor: actor}),
            flavor: text,
            rollMode: game.settings.get("core", "rollMode")
        });
    }
}