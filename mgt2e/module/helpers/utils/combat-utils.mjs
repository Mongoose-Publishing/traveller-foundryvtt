import {MGT2} from "../config.mjs";

// Returns all the valid tokens that could be the attacker.
export function getAttackerTokens(actor) {
    if (!actor || !canvas.scene) {
        return null;
    }
    const selectedMatch = canvas.tokens.controlled.filter(t => t.actor?.id === actor.id);
    if (selectedMatch.length > 0) return selectedMatch;

    // 2. Fall back to any token on the active scene matching this actor
    return canvas.tokens.placeables.filter(t => t.actor?.id === actor.id);
}

// Rotation 0 assumes vehicle is pointing upwards (positive Y)
function getTargetFacingHit(shooterX, shooterY, targetX, targetY, targetRotation) {
    const dx = shooterX - targetX;
    const dy = shooterY - targetY;
    let angleToShooter = Math.atan2(dx, dy) * (180 / Math.PI);
    if (angleToShooter < 0) {
        angleToShooter += 360;
    }
    let relativeAngle = (angleToShooter + targetRotation) % 360;
    if (relativeAngle < 0) {
        relativeAngle += 360;
    }
    if (relativeAngle >= 315 || relativeAngle < 45) {
        return "rear";
    } else if (relativeAngle >= 45 && relativeAngle < 135) {
        return "starboard";
    } else if (relativeAngle >= 135 && relativeAngle < 225) {
        return "front";
    } else {
        return "port";
    }
}

export function getTargetData(attackerToken) {
    if (!canvas.scene) {
        return null;
    }

    if (!attackerToken) {
        return [];
    }

    const user = game.users.current;
    const userTargets = user.targets;

    let targets = [];
    if (userTargets.size > 0) {
        // Player has specifically selected targets.
        targets = userTargets;
    } else {
        // No targets selected, so just list everything possible.
        targets = canvas.tokens.placeables;
    }

    const X = parseInt(attackerToken.center.x);
    const Y = parseInt(attackerToken.center.y);
    // Assume everything is in metres.
    let unitMultiplier = 1;
    if (canvas.grid.units === "km") {
        unitMultiplier = 1000;
    }

    // Get data on every token.
    const targetData = [];
    for (let token of targets) {
        if (token.document.id === attackerToken.document.id) {
            // Can't shoot yourself.
            continue;
        }
        if (["traveller", "npc", "robot", "vehicle", "spacecraft", "swarm"].includes(token.actor.type)) {
            let x = parseInt(token.center.x);
            let y = parseInt(token.center.y);
            const dx = Math.abs(X - x);
            const dy = Math.abs(Y - y);

            // True Euclidean distance.
            let d = Math.sqrt(dx * dx + dy * dy);
            let metres = (d / canvas.grid.size) * canvas.grid.distance * unitMultiplier;
            if (metres > 10) {
                metres = Math.round(metres);
            } else {
                metres = parseFloat(metres.toFixed(1));
            }
            const target = {
                token: token,
                name: token.name,
                distance: metres
            }
            if (token.actor.type === "vehicle") {
                // Work out facing?
                target.type = "vehicle";
                target.facing = getTargetFacingHit(X, Y, x, y, token.document.rotation);
                target.sizeDM = token.document.actor.system.size;
            } else if (token.actor.type === "spacecraft") {
                target.type = "spacecraft";
                target.sizeDM = 6;
            } else {
                if (token.document.actor.system.size) {
                    target.sizeDM = parseInt(token.document.actor.system.size) || 0;
                }
            }
            // Now let's read any bonuses.
            if (token.actor?.system?.modifiers) {
                const modifiers = token.actor.system.modifiers;
                if (modifiers.rangedToHit?.dm) {
                    target.rangeHitDM = parseInt(modifiers.rangedToHit.dm) || 0;
                }
                if (modifiers.meleeToHit?.dm) {
                    target.meleeHitDM = parseInt(modifiers.meleeToHit.dm) || 0;
                }
            }
            if (token.actor?.effects) {
                const dodges = token.actor.effects.filter(e => e.flags?.mgt2e?.effect === "dodge")
                let dodgeDM = 0;
                for (let r of dodges) {
                    dodgeDM -= parseInt(r.flags?.mgt2e?.value) || 0;
                }
                target.dodgeDM = dodgeDM;
            }

            targetData.push(target);

            // Sort according to distance.
            targetData.sort((a, b) => {
                if (a.distance !== b.distance) {
                    return a.distance - b.distance;
                } else {
                    return a.name.localeCompare(b.name);
                }
            });

        }
    }

    return targetData;
}
