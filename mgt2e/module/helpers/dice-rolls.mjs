/**
 * Get the l10n'd label for a skill. If a label is set directly on the skill,
 * we use that. This is used for custom skills.
 *
 * @param skill     Skill to get label for.
 * @returns {string|*}
 */

export function isNonZero(value) {
    if (!value) {
        return false;
    }
    return value && !Number.isNaN(parseInt(value));
}

export function isNumber(value) {
    if (!value) {
        return false;
    }
    return !Number.isNaN(parseInt(value));
}

export function toFloat(number) {
    console.log("toFloat: " + number);
    number = "" + parseFloat(number).toFixed(3);
    console.log("toFloat: " + number);
    number = number.replaceAll(/0+$/g, "");
    console.log("toFloat: " + number);
    number = number.replaceAll(/\.$/g, "");
    console.log("toFloat: " + number);

    return number;
}

export function skillLabel(skill, skillId) {
    if (!skill) {
        return "";
    }
    if (skill.label && skill.label.length > 0) {
        return skill.label;
    } else {
        if (!skillId) skillId = skill.id;
        let label = game.i18n.localize("MGT2.Skills." + skillId);
        if (label.indexOf("MGT2.Skills.") === 0) {
            label = skillId;
        }
        return label;
    }
}

export function getSkillValue(actor, skill, speciality) {
    const data = actor.system;

    if (skill) {
        if (skill.indexOf(".") > -1) {
            speciality = skill.split(".")[1];
            skill = skill.split(".")[0];
        }
        let value = parseInt(data.skills["jackofalltrades"].value) - 3;
        if (data.skills[skill] && data.skills[skill].trained) {
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
    if (traits) {
        const regex = new RegExp(`(^|[, ])${trait}[^,]*($|[, ])`, 'gi');
        return traits.match(regex) != null;
    } else {
        return false;
    }
}

export function getTraitValue(traits, trait) {
    if (!traits || ! trait) {
        return 0;
    }
    traits = traits.toLowerCase();
    trait = trait.toLowerCase();

    if (traits.indexOf(trait) > -1) {
        traits = traits.substring(traits.indexOf(trait));
        traits = traits.replace(/[a-z]* *([0-9]*).*/, "$1");
        return parseInt(traits);
    }
    return 0;
}

//export async function rollAttack(actor, weapon, skillDM, dm, rollType, range, autoOption, isParry, shotsFired) {
export async function rollAttack(actor, weapon, attackOptions) {
    const   system = actor?actor.system:null;
    let     content = "Attack";

    console.log("rollAttack:");
    console.log(weapon);
    console.log(attackOptions);

    if (!attackOptions.dm) {
        attackOptions.dm = 0;
    }
    if (!attackOptions.skillDM) {
        attackOptions.skillDM = 0;
    }

    let baseRange = weapon.system.weapon.range;
    let rangeBand = null;
    let rangeDistance = baseRange;
    let rangeUnit = "m";
    if (attackOptions.rangeDM !== undefined && attackOptions.rangeDM !== null && !attackOptions.isParry) {
        switch (attackOptions.rangeDM) {
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
        if (weapon.system.weapon.scale === "vehicle") {
            rangeUnit = "km";
        }
    }

    // Normal, Boon or Bane dice roll.
    let dice = "2D6";
    if (attackOptions.rollType === "boon") {
        dice = "3D6k2";
    } else if (attackOptions.rollType === "bane") {
        dice = "3D6kl2";
    }

    if (attackOptions.skillDM !== 0) {
        dice += ` + ${attackOptions.skillDM}`;
    }
    if (system) {
        if (system.modifiers && system.modifiers.encumbrance.dm !== 0) {
            dice += ` - ${Math.abs(parseInt(system.modifiers.encumbrance.dm))}[Enc]`;
        }
        if (baseRange === 0) {
            if (system.modifiers && system.modifiers.melee.dm !== 0) {
                if (system.modifiers.melee.dm > 0) {
                    dice += ` + ${parseInt(system.modifiers.melee.dm)}[Melee]`;
                } else {
                    dice += ` - ${Math.abs(parseInt(system.modifiers.melee.dm))}[Melee]`;
                }
            }
        } else {
            if (system.modifiers && system.modifiers.guncombat.dm !== 0 && weapon.system.weapon.skill.indexOf("guncombat") === 0) {
                if (system.modifiers.guncombat.dm > 0) {
                    dice += ` + ${parseInt(system.modifiers.guncombat.dm)}[Guns]`;
                } else {
                    dice += ` - ${Math.abs(parseInt(system.modifiers.guncombat.dm))}[Guns]`;
                }
            }
        }
        if (system.modifiers && system.modifiers.physical.dm !== 0) {
            if (system.modifiers.physical.dm > 0) {
                dice += ` + ${parseInt(system.modifiers.physical.dm)}[Phy]`;
            } else {
                dice += ` - ${Math.abs(parseInt(system.modifiers.physical.dm))}[Phy]`;
            }
        }
    }
    if (actor && actor.flags?.mgt2?.reaction) {
        let react = Math.abs(parseInt(actor.flags.mgt2e.reaction));
        if (react !== 0) {
            dice += ` - ${react}[Dodge]`;
        }

    }

    if (weapon.system.weapon.attackBonus) {
        const attackBonus = parseInt(weapon.system.weapon.attackBonus);
        if (attackBonus !== 0) {
            dice += " + " + attackBonus;
        }
    }

    // Header information
    content = `<div class="attack-message">`;
    content += `<h2>${weapon.name} ${(baseRange > 0 && rangeBand)?(" @ " + rangeDistance+rangeUnit):""}</h2><div class="message-content">`;
    content += "<div>";
    if (actor) {
        content += `<img class="skillcheck-thumb" alt="${actor.name}" src="${actor.thumbnail}"/>`;
    }
    content += `<img class="skillcheck-thumb" alt="${weapon.name}" src="${weapon.img}"/>`;
    content += `<b>Skill DM:</b> ${attackOptions.skillDM}`;
    if (attackOptions.dm && parseInt(attackOptions.dm) < 0) {
        content += " " + attackOptions.dm;
    } else if (attackOptions.dm && parseInt(attackOptions.dm) > 0) {
        content += " +" + attackOptions.dm;
    }
    if (attackOptions.rollType && attackOptions.rollType === "boon") {
        content += "<span class='boon'> (boon)</span>";
    } else if (attackOptions.rollType && attackOptions.rollType === "bane") {
        content += "<span class='bane'> (bane)</span>";
    }
    content += "<br/>";

    // Work out damage.
    let dmg = weapon.system.weapon.damage;
    let type = weapon.system.weapon.damageType;
    if (!type) {
        type = "standard";
    }

    let traits = weapon.system.weapon.traits;

    if  (weapon.hasTrait("psiDmg")) {
        let psi = attackOptions.psiDM;
        let psiDmg = getTraitValue(traits, "psiDmg");
        let bonus = 0;
        if (attackOptions.psiDM) {
            bonus += psi * psiDmg;
        }
        if (attackOptions.psiPoints) {
            bonus += attackOptions.psiPoints * psiDmg;
        }
        if (bonus) {
            dmg += ` + ${bonus}[PSI]`;
        }
    }
    let bonusPsiAP = 0;
    if (weapon.hasTrait("psiAp")) {
        let psi = attackOptions.psiDM;
        let psiAp = getTraitValue(traits, "psiAp");
        console.log("PsiAp is " + psiAp);
        if (attackOptions.psiDM) {
            bonusPsiAP += psi * psiAp;
        }
        if (attackOptions.psiPoints) {
            bonusPsiAP += attackOptions.psiPoints * psiAp;
        }
        console.log("Bonus PSI AP: " + bonusPsiAP);
    }

    let destructive = weapon.hasTrait("destructive");
    let damageBonus = weapon.system.weapon.damageBonus;
    if (damageBonus && actor && actor.system.characteristics && actor.system.characteristics[damageBonus]) {
        damageBonus = actor.system.characteristics[damageBonus].dm;
        if (damageBonus > 0) {
            dmg += " +" + damageBonus;
        } else if (damageBonus < 0) {
            dmg += " " + damageBonus;
        }
    }

    if (!attackOptions.isParry) {
        content += `<b>Damage:</b> ${dmg.toUpperCase()} ${(type === "standard") ? "" : (" (" + type + ")")}<br/>`;
        if (baseRange > 0) {
            content += `<b>Range:</b> ${baseRange}${rangeUnit}<br/>`;
        } else {
            content += `<b>Melee</b><br/>`;
        }
    }
    if (traits && traits !== "") {
        content += `<b>Traits:</b> ${weapon.printWeaponTraits()}<br/>`
    } else {
        traits = "";
    }
    content += '</div>';
    // End of header.

    if (actor && actor.system.characteristics) {
        let str = parseInt(actor.system["STR"]);
        let bulky = 0;
        if (hasTrait(traits, "veryBulky")) {
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
            attackOptions.dm -= bulky;
        }
    }

    if (attackOptions.dm && parseInt(attackOptions.dm) !== 0) {
        if (attackOptions.dm > 0) {
            dice += ` + ${parseInt(attackOptions.dm)}`;
        } else {
            dice += ` - ${Math.abs(parseInt(attackOptions.dm))}`;
        }
    }
    if (attackOptions.rangeDM) {
        if (attackOptions.rangeDM > 0) {
            dice += ` + ${attackOptions.rangeDM}[Range]`;
        } else {
            dice += ` - ${Math.abs(attackOptions.rangeDM)}[Range]`;
        }
    }
    let attacks = 1;
    console.log("Shots Fired: " + attackOptions.shotsFired + " on " + attackOptions.autoOption);
    if (attackOptions.autoOption && attackOptions.autoOption === "burst") {
        let autoBonus = attackOptions.shotsFired?attackOptions.shotsFired:getTraitValue(traits, "auto");
        dmg = dmg + " + " + autoBonus;
    } else if (attackOptions.autoOption && attackOptions.autoOption === "full") {
        attacks = attackOptions.shotsFired?attackOptions.shotsFired:getTraitValue(traits, "auto");
    } else if (attackOptions.autoOption && attackOptions.autoOption === "noammo") {
        attacks = 0;
        content += "<p>No ammo</p>";
    }

    // Creatures sometimes take reduced (D6 -> D3) or minimum (D6 -> D1) damage.
    // We try to convert the damage dice, and
    let minDice = dmg.replaceAll(/D6/g, "D1").replaceAll(/d6/g, "D1");
    let redDice = dmg.replaceAll(/D6/g, "D3").replaceAll(/d6/g, "D3");

    const roll = await new Roll(dice, actor?actor.getRollData():null).evaluate();
    let damageRoll = null;
    for (let attack=1; attack <= attacks; attack++) {
        if (attacks > 1) {
            content += `<h3 class="fullauto">Full auto attack ${attack} of ${attacks}</h3>`;
        }

        damageRoll = await new Roll(dmg, actor?actor.getRollData():null).evaluate();
        let damageTotal = damageRoll.total;
        let reducedTotal = (await new Roll(redDice, actor?actor.getRollData():null).evaluate()).total;
        let minimumTotal = (await new Roll(minDice, actor?actor.getRollData():null).evaluate()).total;

        let effect = 0, attackTotal = 0;
        if (actor) {
            const attackRoll = await new Roll(dice, actor ? actor.getRollData() : null).evaluate();
            attackTotal = attackRoll.total;
            effect = attackTotal - 8;
        }

        let effectClass = "rollFailure";
        let effectText = "Miss";
        if (effect <= -5 && (hasTrait(weapon.system.weapon.traits, "dangerous")||hasTrait(weapon.system.traits, "veryDangerous"))) {
            effectText = game.i18n.localize("MGT2.Attack.Dangerous");
        } else if (effect <= -3 && (hasTrait(weapon.system.weapon.traits, "veryDangerous"))) {
            effectText = game.i18n.localize("MGT2.Attack.Dangerous");
        } else if (effect === 0) {
            effectClass = "rollMarginal";
            effectText = "Hit";
        } else if (effect > 0 && effect < 6) {
            effectClass = "rollSuccess";
            effectText = `Hit (+${effect})`;
        } else if (effect >= 6) {
            effectClass = "rollCritical";
            effectText = `Critical (+${effect})`;
        }

        if (destructive) {
            damageTotal *= 10;
        }

        let damageEffect = damageTotal;
        if (effect > 0) {
            damageEffect = damageTotal + effect * (destructive?10:1);
        }
        let ap = bonusPsiAP;
        if (hasTrait(traits, "ap")) {
            ap += getTraitValue(traits, "ap");
        }
        let tl = weapon.system.tl;

        if (attackOptions.isParry) {
            let parryBonus = parseInt(weapon.system.weapon.parryBonus);
            if (actor) {
                content += `<b>Parry DM:</b> ${skillDM + parryBonus}<br/><br/>`;
            } else {
                content += `<b>Parry DM:</b> ${parryBonus}<br/><br/>`;
            }
            if (actor) {
                if (actor.system.status) {
                    actor.system.status -= 1;
                }
                actor.update({ "system.status": actor.system.status });
            }
        } else {
            let dmgText = `Damage ${damageTotal}`;
            if (effect > 0) {
                dmgText += `&nbsp;+&nbsp;${effect * (destructive?10:1)}&nbsp;(${damageEffect})`;
            }
            if (ap > 0) {
                dmgText += ` /&nbsp;AP&nbsp;${ap}`;
            }
            let radiationDamage = 0;
            if (hasTrait(traits, "radiation")) {
                const radRoll = await new Roll("2D6 * 20", actor ? actor.getRollData() : null).evaluate();
                radiationDamage = radRoll.total;
                dmgText += ` /&nbsp;${radRoll.total} Rads`;
                if (destructive) {
                    dmgText += `&nbsp;(10m)`;
                }
            }
            let blastRadius = 0;
            if (hasTrait(traits, "blast")) {
                dmgText += ` /&nbsp;Blast&nbsp;${getTraitValue(traits, "blast")}m`;
                blastRadius = getTraitValue(traits, "blast");
            }

            let titleText = game.i18n.localize("MGT2.Attack.DragMe");
            let damageOptions = {
                "damage": damageTotal,
                "damageDice": dmg,
                "reducedDice": redDice,
                "minimumDice": minDice,
                "reducedDamage": reducedTotal,
                "minimumDamage": minimumTotal,
                "effect": effect,
                "multiplier": 1,
                "scale": weapon.system.weapon.scale,
                "traits": weapon.system.weapon.traits,
                "ap": ap,
                "tl": weapon.system.tl,
                "damageType": weapon.system.weapon.damageType,
                "radiation": radiationDamage,
                "ranged": (baseRange>0)
            };
            if (blastRadius) {
                damageOptions.blastRadius = blastRadius;
                titleText += " " + game.i18n.localize("MGT2.Attack.DragMeBlast");
            }
            let json = JSON.stringify(damageOptions);

            if (actor) {
                content += `<b>Attack Roll:</b> ${dice}<br/>`
                content += `<span class="skill-roll inline-roll inline-result"><i class="fas fa-dice"> </i> ${attackTotal}</span> <span class="${effectClass}">${effectText}</span><br/>`;
            } else {
                content += "<br/>";
            }
            content += `<div class="damage-message" data-damage="${damageEffect}" data-options='${json}'>`;
            content += `<button data-damage="${damageEffect}" data-options='${json}' 
                            title="${titleText}"
                            class="damage-button">${dmgText}</button>`;

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

function addTitle(text, options, property) {
    if (options && options.results) {
        let value = options.results[property];
        if (!isNaN(value) && parseInt(value) !== 0) {
            value = parseInt(value);
            if (value > 0) {
                value = "+" + value;
            }
            text += ` ${property} ${value}`;
        }
    }
    return text;
}

export async function rollSpaceAttack(starship, gunner, weaponItem, options) {
    let text = "";

    let score = gunner?gunner.getAttackSkill(weaponItem, options):0;

    let dice = `${options.results.dice} + ${score}`;
    let damageDice = weaponItem.system.weapon.damage;
    console.log("rollSpaceAttack:");

    if (options && !Number.isNaN(options.quantity) && parseInt(options.quantity) > 1) {
        let found = damageDice.match(/[0-9][0-9]*[dD]/);
        if (found) {
            let quantityBonus = parseInt(found[0]);
            damageDice += ` + ${quantityBonus * (options.quantity - 1)}`;
        }
    }

    const attackRoll = await new Roll(dice, gunner?gunner.getRollData():null).evaluate();
    let effect = Math.max(0, attackRoll.total - 8);
    const damageRoll = await new Roll(damageDice, null).evaluate();

    let title = `${options.results["cha"]} ${options.results["chadm"]} Skill ${options.results["base"]}`;
    title = addTitle(title, options, "weapon");
    title = addTitle(title, options, "dm");
    title = addTitle(title, options, "rangedm");

    let mount = weaponItem.system.weapon.mount;
    let multiplier = 1;
    if (CONFIG.MGT2.SPACE_MOUNTS[mount]) {
        multiplier = parseInt(CONFIG.MGT2.SPACE_MOUNTS[mount].multiplier);
    }
    console.log(`Space attack for ${mount} has multiplier ${multiplier}`);

    let totalMultipliedDamage = (damageRoll.total + effect) * multiplier;
    let dmgText = `Damage ${damageRoll.total * multiplier}`;
    if (effect > 0) {
        dmgText += ` (+${effect * multiplier})`;
    }

    let damageOptions = {
        "damage": damageRoll.total,
        "effect": effect,
        "multiplier": multiplier,
        "scale": weaponItem.system.weapon.scale,
        "traits": weaponItem.system.weapon.traits,
        "tl": weaponItem.system.tl,
        "damageType": weaponItem.system.damageType,
        "radiation": 0,
        "ranged": true
    };
    let json = JSON.stringify(damageOptions);

    text = `
        <div class="attack-message">
            <h2>${weaponItem.name}</h2>
            <div class="message-content">
                <div>
                    <img class="skillcheck-thumb" src="${starship.thumbnail}" title="${starship.name}"/>
                    <img class="skillcheck-thumb" src="${gunner.thumbnail}" title="${gunner.name}"/>
                    <b title="${title}">${options.results.label} ${score}</b><br/>
                    ${game.i18n.localize("MGT2.Item.SpaceRange." + options.range)}<br/>
                    ${weaponItem.system.weapon.damage}<br/>
                </div>
                
                <hr/>
                <div class="rollResult">
                    <b>Attack Roll: </b>
                    <span class="skill-roll inline-roll inline-result" title="${dice}">
                        <i class="fas fa-dice"> </i> ${attackRoll.total}
                    </span>
                    Effect ${(effect>0)?"+":""}${effect}
                </div>
                <hr/>
                <div class="damage-message" data-damage="${damageRoll.total + effect}" data-vers="2" data-options='${json}'>
                    <button data-damage="${(damageRoll.total + effect)}" data-vers="2" data-options='${json}' class="damage-button">
                        ${dmgText}
                    </button>
                </div>
            </div>
        </div>
    `;

    attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: starship }),
        content: text,
        rollMode: game.settings.get("core", "rollMode")
    });

}

function getDifficultyLabel(difficulty) {
    if (difficulty >= 0 && difficulty <= 16) {
        return game.i18n.localize("MGT2.TaskDifficulty." + difficulty);
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
        chain = "+1";
    } else if (effect <= 5) {
        effectType = "Average Success";
        effectClass = "rollSuccess";
        chain = "+2";
    } else {
        effectType = "Exceptional Success";
        effectClass = "rollSuccess";
        chain = "+3";
    }

    return `<span class='effectRoll ${effectClass}'>${effectType} [${effect>=0?"+":""}${effect}]</span><br/>Chain Bonus ${chain}`;
}

function getSkillBonus(data, skill, speciality) {
    let bonus = 0;

    if (skill && (typeof skill === 'string' || skill instanceof String)) {
        skill = data.skills[skill];
    }

    if (speciality && (typeof speciality === 'string' || skill instanceof String)) {
        speciality = skill.specialities[speciality];
    }

    if (skill.augdm != null) {
        bonus += parseInt(skill.augdm);
    }
    if (skill.bonus) {

    }

    return bonus;
}

export async function rollSkill(actor, skill, speciality, cha, dm, rollType, difficulty) {
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

    // Keep track of bonuses and penalties.
    let skillDM = 0, skillAug = 0, skillBonus = 0
    let specDM = 0, specAug = 0, specBonus = 0;
    let skillNotes = "";
    let specNotes = "";

    if (actor.type === "traveller" || actor.type === "npc") {
        isPerson = true;
    }
    if (skill && (typeof skill === 'string' || skill instanceof String)) {
        skill = data.skills[skill];
    }

    // Normal, Boon or Bane dice roll.
    let dice = "2D6";
    if (rollType === "boon" || (skill && skill.boon === "boon") || (speciality && speciality.boon === "boon")) {
        dice = "3D6k2";
    } else if (rollType === "bane" || (skill && skill.boon === "bane") || (speciality && speciality.boon === "bane")) {
        dice = "3D6kl2";
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
        if (data.characteristics[cha].augdm && parseInt(data.characteristics[cha].augdm) !== 0) {
            let chaAugDm = parseInt(data.characteristics[cha].augdm);
            dice += ` ${(chaAugDm>=0)?"+":""}${chaAugDm}[AugDM]`;
            skillNotes += " (" + chaAugDm + "Aug)";
        }
        if (cha === "STR" || cha === "DEX" || cha === "END") {
            if (data.modifiers.encumbrance.dm) {
                let encDm = parseInt(data.modifiers.encumbrance.dm);
                dice += ` ${(encDm>=0)?"+":""}${encDm}[Enc]`;
                skillNotes += ` (${encDm}Enc)`;
            }
            if (data.modifiers.physical.dm) {
                let phyDm = parseInt(data.modifiers.physical.dm);
                dice += ` ${(phyDm>=0)?"+":""}${phyDm}[Phy]`;
                skillNotes += ` (${phyDm}Phy)`;
            }
        }
        let reaction = actor.getFlag("mgt2e", "reaction");
        if (reaction) {
            reaction = parseInt(reaction);
            if (reaction < 0) {
                dice += ` ${reaction}[Dodge]`;
            }
        }
    }

    // There are several ways of adding bonuses to a roll.
    // .bonus - Generic bonus that is manually set on a skill
    // .augment - Bonus which applies to the skill level, only if the skill is trained
    // .augdm - Bonus that always applies to the skill roll.
    // .expert - Expert software, which sets or gives bonus to a skill.
    let notes = "";

    if (skill) {
        // AugmentDMs are applied to the roll, regardless of the actor's skill level.
        if (skill.augdm && parseInt(skill.augdm) !== 0) {
            skillDM += parseInt(skill.augdm);
            skillNotes += `DM&nbsp;(${parseInt(skill.augdm)}) `;
        }
        if (speciality && speciality.augdm && parseInt(speciality.augdm) !== 0) {
            specDM += parseInt(speciality.augdm);
            specNotes += `DM&nbsp;(${parseInt(speciality.augdm)}) `;
        }
        // The bonus is set manually, and always applied to the roll.
        if (skill.bonus && parseInt(skill.bonus) !== 0) {
            skillDM += parseInt(skill.bonus);
            skillNotes += `${skill.notes}&nbsp;(${parseInt(skill.bonus)}) `;
        }
        if (speciality && speciality.bonus && parseInt(speciality.bonus) !== 0) {
            specDM += parseInt(speciality.bonus);
            specNotes += `${speciality.notes}&nbsp;(${speciality.bonus}) `;
        }

        title += ((title === "")?"":" + ") + skillLabel(skill);
        skillCheck = true;
        let value = data.skills["jackofalltrades"].value - 3;
        if (skillText.length > 0) {
            skillText += " + ";
        }
        skillText += skillLabel(skill);
        if (skill.trained) {
            value = parseInt(skill.value);
            if (skill.expert && (cha === "INT" || cha === "EDU")) {
                value += 1;
                skillNotes += `Expert/${skill.expert}`;
            }
            if (skill.augment) {
                value += parseInt(skill.augment);
                //skillNotes += `Aug&nbsp;${skill.augment}`;
            }
            if (speciality) {
                value = speciality.value;
                title += " (" + skillLabel(speciality) + ")";
                skillText += " (" + skillLabel(speciality) + ")";
                specialityCheck = true;
                if (isNonZero(speciality.expert) && (cha === "INT" || cha === "EDU")) {
                    value += 1;
                    specNotes += `Expert/${speciality.expert}`;
                }
                if (isNonZero(speciality.augment)) {
                    value += parseInt(speciality.augment);
                    //specNotes += `Aug&nbsp;${speciality.augment}`
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
    if (skillDM !== 0) {
        dice += " + " + skillDM + "[AugDM]";
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

    let checkText;
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
    if (game.settings.get("mgt2e", "verboseSkillRolls")) {
        let difficultyLabel = getDifficultyLabel(difficulty);
        if (difficultyLabel !== "") {
            checkText = `<b>${difficultyLabel}</b> ${checkText}`;
        }
    }

    let roll = await new Roll(dice, actor.getRollData()).evaluate();
    if (roll) {
        text = `<div class='skill-message'><h2>${title}</h2><div class="message-content">`;
        let total = roll.total;
        if (game.settings.get("mgt2e", "useChatIcons")) {
            text += `<img class='skillcheck-thumb' src='${actor.thumbnail}' alt='${actor.name}'/>`;
            text += `<div class="skill-with-icon">`;
        } else {
            text += `<div class="skill-without-icon">`;
        }
        text += `<span class="skill-intro">${checkText}</span><br/>${skillText}`;
        text += `<div class="skill-augment-text">${skillNotes}</div>`;
        if (specNotes !== "") {
            text += `<div class="skill-augment-text">${specNotes}</div>`;
        }
        text += "</div><br/>";

        if (game.settings.get("mgt2e", "verboseSkillRolls")) {
            let effect = total - difficulty;
            text += `<span class="skill-roll inline-roll inline-result"><i class="fas fa-dice"> </i> ${total}</span> ` + getEffectLabel(effect);
        }

        if (skill && skill.specialities != null && speciality == null) {
            for (let sp in skill.specialities) {
                let spec = skill.specialities[sp];
                if (spec.value > 0) {
                    let stotal = parseInt(total) + parseInt(spec.value);
                    let slabel = `${skillLabel(spec)} (${spec.value})`;

                    specDM = 0;
                    specAug = 0;
                    specBonus = 0;
                    specNotes = "";
                    if (spec.augment && !isNaN(spec.augment) && parseInt(spec.augment) !== 0) {
                        stotal += parseInt(spec.augment);
                        slabel = `${skillLabel(spec)} (${spec.value + spec.augment})`;
                    }
                    if (spec.augdm && !isNaN(spec.augdm) && parseInt(spec.augdm) !== 0) {
                        stotal += parseInt(spec.augdm);
                        specNotes += `DM ${parseInt(spec.augdm)} `;
                    }
                    if (spec.bonus && !isNaN(spec.bonus) && parseInt(spec.bonus) !== 0) {
                        stotal += parseInt(spec.bonus);
                        specNotes += `${spec.notes} ${parseInt(spec.bonus)} `
                    }

                    if (isPerson && defaultCha && spec.default && spec.default !== skill.default) {
                        stotal -= parseInt(chaDm);
                        stotal += parseInt(data.characteristics[spec.default].dm);
                        slabel += ` (${spec.default})`;
                    }

                    if (game.settings.get("mgt2e", "verboseSkillRolls")) {
                        text += `<h3 class="subroll">${slabel}</h3>`;
                        if (specNotes !== "") {
                            text += `<div class="skill-augment-text">${specNotes}</div>`;
                        }
                        text += `<span class="skill-roll inline-roll inline-result"><i class="fas fa-dice"> </i> ${stotal}</span> ` + getEffectLabel(stotal - difficulty);
                    } else {
                        text += `<h3 class="subroll">${slabel} <span class="skill-roll inline-roll inline-result"><i class="fas fa-dice"> </i> ${stotal}</span></h3>`;
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