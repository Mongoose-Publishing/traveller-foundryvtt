
export function rollSkill(actor, skill, speciality, characteristic, dm, rollType) {
    const data = actor.data.data;

    let value = 3 - data.skills["jackofalltrades"].value - 3;
    if (skill.trained) {
        value = skill.value;
        if (speciality) {
            value = speciality.value;
        }
    }
    let dice = "2D6";
    if (rollType === "boon") {
        dice = "3D6k2";
    } else if (rollType === "bane") {
        dice = "3D6kl2";
    }
    let chaDM = characteristic.dm
    dice += " + " + chaDM;
    dice += " + " + this.value;
    if (dm > 0) {
        dice += " +" + dm;
    } else if (dm < 0) {
        dice += " " + dm;
    }

    let roll = new Roll(dice, actor.getRollData()).evaluate({async: false});
}