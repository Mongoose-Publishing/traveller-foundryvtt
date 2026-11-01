// noinspection JSUnresolvedReference,DuplicatedCode

import {launchSwarmHandler, showSwarmHandler} from "./helpers/spacecraft/spacecraft-utils.mjs";
import {Tools} from "./helpers/chat/tools.mjs";
import {
    tradeBuyFreightHandler,
    tradeBuyGoodsHandler, tradeDisembarkPassengerHandler, tradeEmbarkPassengerHandler,
    tradeSellFreightHandler,
    tradeSellGoodsHandler
} from "./helpers/utils/trade-utils.mjs";
import {worldDropBrokerHandler} from "./helpers/utils/world-utils.mjs";

function initCoreStatusEffects() {
    CONFIG.statusEffects.push({
        id: "sleep",
        name: "EFFECT.StatusAsleep",
        img: "icons/svg/sleep.svg",
    });
    CONFIG.statusEffects.push({
        id: "restrain",
        name: "EFFECT.StatusRestrained",
        img: "icons/svg/net.svg",
    });
    CONFIG.statusEffects.push({
        id: "paralysis",
        name: "EFFECT.StatusParalysis",
        img: "icons/svg/paralysis.svg",
    });
    CONFIG.statusEffects.push({
        id: "blind",
        name: "EFFECT.StatusBlind",
        img: "icons/svg/blind.svg",
    });
    CONFIG.statusEffects.push({
        id: "deaf",
        name: "EFFECT.StatusDeaf",
        img: "icons/svg/deaf.svg",
    });
    CONFIG.statusEffects.push({
        id: "silence",
        name: "EFFECT.StatusSilenced",
        img: "icons/svg/silenced.svg",
    });
    CONFIG.statusEffects.push({
        id: "fear",
        name: "EFFECT.StatusFear",
        img: "icons/svg/terror.svg",
    });
    CONFIG.statusEffects.push({
        id: "burning",
        name: "EFFECT.StatusBurning",
        img: "icons/svg/fire.svg",
    });
    CONFIG.statusEffects.push({
        id: "frozen",
        name: "EFFECT.StatusFrozen",
        img: "icons/svg/frozen.svg",
    });
    CONFIG.statusEffects.push({
        id: "shock",
        name: "EFFECT.StatusShocked",
        img: "icons/svg/lightning.svg",
    });
    CONFIG.statusEffects.push({
        id: "corrode",
        name: "EFFECT.StatusCorrode",
        img: "icons/svg/acid.svg",
    });
    CONFIG.statusEffects.push({
        id: "bleeding",
        name: "EFFECT.StatusBleeding",
        img: "icons/svg/blood.svg",
    });
    CONFIG.statusEffects.push({
        id: "disease",
        name: "EFFECT.StatusDisease",
        img: "icons/svg/biohazard.svg",
    });
    CONFIG.statusEffects.push({
        id: "poison",
        name: "EFFECT.StatusPoison",
        img: "icons/svg/poison.svg",
    });
    CONFIG.statusEffects.push({
        id: "curse",
        name: "EFFECT.StatusCursed",
        img: "icons/svg/sun.svg",
    });
    CONFIG.statusEffects.push({
        id: "regen",
        name: "EFFECT.StatusRegen",
        img: "icons/svg/regen.svg",
    });
    CONFIG.statusEffects.push({
        id: "degen",
        name: "EFFECT.StatusDegen",
        img: "icons/svg/degen.svg",
    });
    CONFIG.statusEffects.push({
        id: "hover",
        name: "EFFECT.StatusHover",
        img: "icons/svg/wingfoot.svg",
    });
    CONFIG.statusEffects.push({
        id: "burrow",
        name: "EFFECT.StatusBurrow",
        img: "icons/svg/mole.svg",
    });
    CONFIG.statusEffects.push({
        id: "upgrade",
        name: "EFFECT.StatusUpgrade",
        img: "icons/svg/upgrade.svg",
    });
    CONFIG.statusEffects.push({
        id: "downgrade",
        name: "EFFECT.StatusDowngrade",
        img: "icons/svg/downgrade.svg",
    });
    CONFIG.statusEffects.push({
        id: "invisible",
        name: "EFFECT.StatusInvisible",
        img: "icons/svg/invisible.svg",
    });
    CONFIG.statusEffects.push({
        id: "bless",
        name: "EFFECT.StatusBlessed",
        img: "icons/svg/angel.svg",
    });
    CONFIG.statusEffects.push({
        id: "fireShield",
        name: "EFFECT.StatusFireShield",
        img: "icons/svg/fire-shield.svg",
    });
    CONFIG.statusEffects.push({
        id: "coldShield",
        name: "EFFECT.StatusIceShield",
        img: "icons/svg/ice-shield.svg",
    });
    CONFIG.statusEffects.push({
        id: "magicShield",
        name: "EFFECT.StatusMagicShield",
        img: "icons/svg/mage-shield.svg",
    });
    CONFIG.statusEffects.push({
        id: "holyShield",
        name: "EFFECT.StatusHolyShield",
        img: "icons/svg/holy-shield.svg",
    });

}

export function initStatusEffects() {
    if (game.settings.get("mgt2e", "coreEffects")) {
        initCoreStatusEffects();
    }
    // Standard effects
    CONFIG.statusEffects.push({
        id: "dead",
        name: "EFFECT.StatusDead",
        img: "icons/svg/skull.svg",
    });
    CONFIG.statusEffects.push({
        id: "unconscious",
        name: "EFFECT.StatusUnconscious",
        img: "icons/svg/unconscious.svg",
    });
    CONFIG.statusEffects.push({
        id: "stun",
        name: "EFFECT.StatusStunned",
        img: "icons/svg/daze.svg",
    });
    CONFIG.statusEffects.push({
        id: "prone",
        name: "EFFECT.StatusProne",
        img: "icons/svg/falling.svg",
    });
    CONFIG.statusEffects.push({
        id: "fly",
        name: "EFFECT.StatusFlying",
        img: "icons/svg/wing.svg",
    });
    CONFIG.statusEffects.push({
        id: "target",
        name: "EFFECT.StatusTarget",
        img: "icons/svg/target.svg",
    });
    CONFIG.statusEffects.push({
        id: "eye",
        name: "EFFECT.StatusMarked",
        img: "icons/svg/eye.svg",
    });

    // Traveller Effects
    CONFIG.statusEffects.push({
        id: "destroyed",
        name: "EFFECT.Destroyed",
        img: "systems/mgt2e/icons/effects/destroyed.svg"
    });
    CONFIG.statusEffects.push({
        id: "injured",
        name: "EFFECT.Injured",
        img: "systems/mgt2e/icons/effects/injured.svg"
    });
    CONFIG.statusEffects.push({
        id: "needsFirstAid",
        name: "EFFECT.FirstAid",
        img: "systems/mgt2e/icons/effects/firstaid.svg"
    });
    CONFIG.statusEffects.push({
        id: "needsSurgery",
        name: "EFFECT.Surgery",
        img: "systems/mgt2e/icons/effects/surgery.svg"
    });
    CONFIG.statusEffects.push({
        id: "encumbered",
        name: "EFFECT.Encumbered",
        img: "systems/mgt2e/icons/effects/encumbered.svg"
    });
    CONFIG.statusEffects.push({
        id: "vaccSuit",
        name: "EFFECT.VaccSuit",
        img: "systems/mgt2e/icons/effects/vaccsuit.svg"
    });
    CONFIG.statusEffects.push({
        id: "surprised",
        name: "EFFECT.Surprised",
        img: "systems/mgt2e/icons/effects/surprised.svg"
    });
    CONFIG.statusEffects.push({
        id: "aware",
        name: "EFFECT.Aware",
        img: "systems/mgt2e/icons/effects/aware.svg"
    });
    CONFIG.statusEffects.push({
        id: "reaction",
        name: "EFFECT.Reaction",
        img: "systems/mgt2e/icons/effects/reaction.svg"
    });
    CONFIG.statusEffects.push({
        id: "fatigued",
        name: "EFFECT.Fatigued",
        img: "systems/mgt2e/icons/effects/fatigued.svg"
    });
    CONFIG.statusEffects.push({
        id: "physical",
        name: "EFFECT.Physical",
        img: "systems/mgt2e/icons/effects/physical.svg"
    });
    CONFIG.statusEffects.push({
        id: "melee",
        name: "EFFECT.Melee",
        img: "systems/mgt2e/icons/effects/melee.svg"
    });
    CONFIG.statusEffects.push({
        id: "gunCombat",
        name: "EFFECT.GunCombat",
        img: "systems/mgt2e/icons/effects/guncombat.svg"
    });
    CONFIG.statusEffects.push({
        id: "armour",
        name: "EFFECT.Armour",
        img: "systems/mgt2e/icons/effects/armour.svg"
    });
    CONFIG.statusEffects.push({
        id: "inCover",
        name: "EFFECT.InCover",
        img: "systems/mgt2e/icons/effects/inCover.svg"
    });
    CONFIG.statusEffects.push({
        id: "hiding",
        name: "EFFECT.Hiding",
        img: "systems/mgt2e/icons/effects/hiding.svg"
    });
    CONFIG.statusEffects.push({
        id: "stunned",
        name: "EFFECT.Stunned",
        img: "icons/svg/daze.svg"
    });
    CONFIG.statusEffects.push({
        id: "tactics",
        name: "EFFECT.Tactics",
        img: "systems/mgt2e/icons/effects/tactics.svg"
    });
    CONFIG.statusEffects.push({
        id: "initiative",
        name: "EFFECT.Initiative",
        img: "systems/mgt2e/icons/effects/initiative.svg"
    });
    CONFIG.statusEffects.push({
        id: "dodge",
        name: "EFFECT.Dodge",
        img: "systems/mgt2e/icons/effects/dodge.svg"
    });
    CONFIG.statusEffects.push({
        id: "critical",
        name: "EFFECT.Critical",
        img: "systems/mgt2e/icons/effects/destroyed.svg"
    });
}

// Define configuration settings.
export function initConfigSettings() {
    game.settings.register("mgt2e", "systemSchemaVersion", {
        config: false,
        scope: "world",
        type: Number,
        default: 0
    });

    game.settings.register("mgt2e", "lastVersionReported", {
        config: false,
        scope: "world",
        type: String,
        default: "0.0.0"
    });

    game.settings.register('mgt2e', 'verboseSkillRolls', {
        name: game.i18n.localize("MGT2.Settings.Verbose.Name"),
        hint: game.i18n.localize("MGT2.Settings.Verbose.Hint"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        onChange: value => {
            console.log(`Setting verboseSkillRolls to ${value}`)
        }
    });
    game.settings.register('mgt2e', 'useChatIcons', {
        name: game.i18n.localize("MGT2.Settings.ChatIcons.Name"),
        hint: game.i18n.localize("MGT2.Settings.ChatIcons.Hint"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        onChange: value => {
            console.log(`Setting iconsInChat to ${value}`)
        }
    });
    game.settings.register('mgt2e', 'useEncumbrance', {
        name: game.i18n.localize("MGT2.Settings.UseEncumbrance.Name"),
        hint: game.i18n.localize("MGT2.Settings.UseEncumbrance.Hint"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    game.settings.register('mgt2e', 'quickRolls', {
        name: game.i18n.localize("MGT2.Settings.QuickRolls.Name"),
        hint: game.i18n.localize("MGT2.Settings.QuickRolls.Hint"),
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        onChange: value => {
            console.log(`Setting quickRolls to ${value}`)
        }
    });
    game.settings.register('mgt2e', 'npcChaDamage', {
        name: game.i18n.localize("MGT2.Settings.NPCChaDamage.Name"),
        hint: game.i18n.localize("MGT2.Settings.NPCChaDamage.Hint"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    game.settings.register('mgt2e', 'skillColumns', {
        name: game.i18n.localize("MGT2.Settings.SkillColumns.Name"),
        hint: game.i18n.localize("MGT2.Settings.SkillColumns.Hint"),
        scope: 'client',
        config: true,
        type: String,
        choices: {
            "2": game.i18n.localize("MGT2.Settings.SkillColumns.Values.Two"),
            "3": game.i18n.localize("MGT2.Settings.SkillColumns.Values.Three")
        },
        default: "3"
    });
    game.settings.register('mgt2e', 'skillFormat', {
        name: game.i18n.localize("MGT2.Settings.SkillFormat.Name"),
        hint: game.i18n.localize("MGT2.Settings.SkillFormat.Hint"),
        scope: 'client',
        config: true,
        type: String,
        choices: {
            "rows": game.i18n.localize("MGT2.Settings.SkillFormat.Values.Rows"),
            "columns": game.i18n.localize("MGT2.Settings.SkillFormat.Values.Columns")
        },
        default: "columns"
    });

    game.settings.register('mgt2e', 'currentYear', {
        name: game.i18n.localize("MGT2.Settings.CurrentYear.Name"),
        hint: game.i18n.localize("MGT2.Settings.CurrentYear.Hint"),
        scope: 'world',
        config: true,
        type: Number,
        default: 1105
    });
    game.settings.register('mgt2e', 'currentDay', {
        name: game.i18n.localize("MGT2.Settings.CurrentDay.Name"),
        hint: game.i18n.localize("MGT2.Settings.CurrentDay.Hint"),
        scope: 'world',
        config: true,
        type: Number,
        default: 1
    });
    game.settings.register('mgt2e', 'autoResizeSpacecraft', {
        name: game.i18n.localize("MGT2.Settings.AutoResizeSpacecraft.Name"),
        hint: game.i18n.localize("MGT2.Settings.AutoResizeSpacecraft.Hint"),
        scope: 'world',
        config: false,
        type: Boolean,
        default: true
    });
    game.settings.register('mgt2e', 'playerSheetNotification', {
        name: game.i18n.localize("MGT2.Settings.PlayerSheetNotification.Name"),
        hint: game.i18n.localize("MGT2.Settings.PlayerSheetNotification.Hint"),
        scope: 'world',
        config: true,
        choices: {
            "private": game.i18n.localize("MGT2.Settings.SheetNotification.Values.Private"),
            "public": game.i18n.localize("MGT2.Settings.SheetNotification.Values.Public"),
            "gm": game.i18n.localize("MGT2.Settings.SheetNotification.Values.GM")
        },
        default: "gm"
    });
    game.settings.register('mgt2e', 'gmSheetNotification', {
        name: game.i18n.localize("MGT2.Settings.GMSheetNotification.Name"),
        hint: game.i18n.localize("MGT2.Settings.GMSheetNotification.Hint"),
        scope: 'world',
        config: true,
        choices: {
            "private": game.i18n.localize("MGT2.Settings.SheetNotification.Values.Private"),
            "public": game.i18n.localize("MGT2.Settings.SheetNotification.Values.Public")
        },
        default: "private"
    });
    game.settings.register('mgt2e', 'visionDefaultTraveller', {
        name: game.i18n.localize("MGT2.Settings.PlayerVision.Traveller.Name"),
        hint: game.i18n.localize("MGT2.Settings.PlayerVision.Traveller.Hint"),
        scope: 'world',
        config: false,
        type: Boolean,
        default: false
    });
    game.settings.register('mgt2e', 'visionDefaultNPC', {
        name: game.i18n.localize("MGT2.Settings.PlayerVision.NPC.Name"),
        hint: game.i18n.localize("MGT2.Settings.PlayerVision.NPC.Hint"),
        scope: 'world',
        config: false,
        type: Boolean,
        default: false
    });
    game.settings.register('mgt2e', 'visionDefaultCreature', {
        name: game.i18n.localize("MGT2.Settings.PlayerVision.Creature.Name"),
        hint: game.i18n.localize("MGT2.Settings.PlayerVision.Creature.Hint"),
        scope: 'world',
        config: false,
        type: Boolean,
        default: false
    });
    game.settings.register('mgt2e', 'visionDefaultSpacecraft', {
        name: game.i18n.localize("MGT2.Settings.PlayerVision.Spacecraft.Name"),
        hint: game.i18n.localize("MGT2.Settings.PlayerVision.Spacecraft.Hint"),
        scope: 'world',
        config: false,
        type: Boolean,
        default: false
    });
    game.settings.register('mgt2e', 'autoPlayerCharacter', {
        name: game.i18n.localize("MGT2.Settings.AutoPlayerCharacter.Name"),
        hint: game.i18n.localize("MGT2.Settings.AutoPlayerCharacter.Hint"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    game.settings.register('mgt2e', 'defaultTraveller', {
        name: game.i18n.localize("MGT2.Settings.DefaultTraveller.Name"),
        hint: game.i18n.localize("MGT2.Settings.DefaultTraveller.Hint"),
        scope: 'world',
        config: true,
        type: String,
        default: "DEFAULT TRAVELLER"
    });
    game.settings.register('mgt2e', 'blastEffectDivergence', {
        name: game.i18n.localize("MGT2.Settings.BlastEffectDivergence.Name"),
        hint: game.i18n.localize("MGT2.Settings.BlastEffectDivergence.Hint"),
        scope: 'world',
        config: true,
        "choices": {
            "0": "None",
            "1": "Low",
            "2": "Medium",
            "3": "High"
        },
        default: "0"
    });
    game.settings.register('mgt2e', "splitAttackDamage", {
        name: game.i18n.localize("MGT2.Settings.SplitAttackDamage.Name"),
        hint: game.i18n.localize("MGT2.Settings.SplitAttackDamage.Hint"),
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });
    game.settings.register('mgt2e', "hexInWorldMenus", {
        name: game.i18n.localize("MGT2.Settings.HexInWorldMenus.Name"),
        hint: game.i18n.localize("MGT2.Settings.HexInWorldMenus.Hint"),
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });
    game.settings.register('mgt2e', "damageManager", {
        name: game.i18n.localize("MGT2.Settings.DamageManager.Name"),
        hint: game.i18n.localize("MGT2.Settings.DamageManager.Hint"),
        scope: "world",
        config: true,
        type: String,
        default: ""
    });
    game.settings.register('mgt2e', "coreEffects", {
        name: game.i18n.localize("MGT2.Settings.CoreEffects.Name"),
        hint: game.i18n.localize("MGT2.Settings.CoreEffects.Hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });
}

export async function initSocketEvents() {
    game.socket.on("system.mgt2e", (data) => {
        if (game.user.uuid === data.userId) {
            if (data.type === "showSwarm") {
                showSwarmHandler(data);
            } else if (data.type === "applyDamageToActor" || data.type === "applyDamageToPerson") {
                Tools.applyDamageHandler(data);
            }
        } else if (game.user === game.users.activeGM) {
            if (data.type === "tradeBuyGoods") {
                tradeBuyGoodsHandler(data);
            } else if (data.type === "tradeSellGoods") {
                tradeSellGoodsHandler(data);
            } else if (data.type === "tradeBuyFreight") {
                tradeBuyFreightHandler(data);
            } else if (data.type === "tradeSellFreight") {
                tradeSellFreightHandler(data);
            } else if (data.type === "tradeEmbarkPassenger") {
                tradeEmbarkPassengerHandler(data);
            } else if (data.type === "tradeDisembarkPassenger") {
                tradeDisembarkPassengerHandler(data);
            } else if (data.type === "worldDropBroker") {
                worldDropBrokerHandler(data);
            } else if (data.type === "launchSwarm") {
                launchSwarmHandler(data);
            }
        }
    });
}
