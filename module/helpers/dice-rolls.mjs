
export function rollSkill(actor, skill, speciality, cha, dm, rollType) {
    const data = actor.data.data;
    let text = "";

    // Normal, Boon or Bane dice roll.
    let dice = "2D6";
    if (rollType === "boon") {
        dice = "3D6k2";
    } else if (rollType === "bane") {
        dice = "3D6kl2";
    }

    if (cha && data.characteristics && data.characteristics[cha]) {
        dice += " + " + data.characteristics[cha].dm;
        text += cha;
    }

    if (skill) {
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
            }
        } else {
            text += " (untrained)";
        }
        dice += " + " + value;
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

    let roll = new Roll(dice, actor.getRollData()).evaluate({async: false});
    if (roll) {
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({actor: actor}),
            flavor: "<span class='skillroll'>" + text + "</span>",
            rollMode: game.settings.get("core", "rollMode")
        });
    }
}