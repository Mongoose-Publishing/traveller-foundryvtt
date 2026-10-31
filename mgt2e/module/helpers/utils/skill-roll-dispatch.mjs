export function dispatchSkillCheck({
    actor,
    skillFqn,
    speciality,
    dialogCharacteristic,
    quickCharacteristic,
    quickRolls,
    shiftKey,
    openDialog,
    rollSkill
}) {
    const quickRoll = shiftKey ? !quickRolls : quickRolls;
    if (!quickRoll) {
        return openDialog(actor, skillFqn, {cha: dialogCharacteristic});
    }
    return rollSkill(actor, skillFqn, {
        speciality,
        cha: quickCharacteristic,
        rollType: "normal",
        difficulty: 8
    });
}
