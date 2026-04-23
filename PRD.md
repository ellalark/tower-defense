# Product Requirements Document: Sci-Fi Alien Invasion Tower Defense

## 1. Overview

A casual, browser-based tower defense game set during a sci-fi alien invasion. Players progress through a series of themed maps, each functioning as a level. On each map, enemies attack in continuous waves; the player places and upgrades towers to defend their base. Beating a map unlocks the next, along with new towers that carry into future runs.

- **Genre:** Tower defense, wave survival
- **Audience:** Casual players
- **Platform:** Desktop / web browser
- **Business model:** Free. No ads, no IAP, no cosmetics.

## 2. Core Gameplay Loop

1. Player selects an unlocked map.
2. Map starts with an **initial prep phase** — player places opening tower(s) with the starting budget before wave 1 begins.
3. Waves spawn **continuously** (no breaks between waves). Wave composition is not shown in advance.
4. Player earns currency from kills, wave-completion bonuses, and economy towers. Currency is spent on new towers and linear upgrades **during** combat.
5. Every 10 waves, a **milestone boss** arrives. These are separate from the map's unique final boss.
6. On reaching and defeating the map's **final boss** at the target wave, the level is complete. The next map unlocks, and a new tower type is added to the player's permanent roster.
7. After the final boss, the player may continue into endless waves on that map to chase a higher score. The run ends when base HP hits 0.
8. Score is saved to the map's local personal-best list.

## 3. Progression & Unlocks

- **Map progression:** Maps function as discrete levels. Beating a map's final boss unlocks the next map.
- **Tower unlocks:** Beating a harder map permanently unlocks a new / better tower type in the player's account roster. Unlocked towers are available on any map in future runs, including previously completed (easier) maps.
- **No in-run carryover:** Every run starts fresh. Tower levels, in-run currency, and upgrades reset between runs. Only the unlocked tower *roster* persists.
- **No other meta-progression:** No persistent stat boosts, no skill trees, no account-wide currency, no cosmetics.

## 4. Maps

- **Count:** Approximately 5 maps for v1 (subject to scope review).
- **Level-completion condition:** Each map has a defined target wave. Surviving and defeating that wave's unique final boss completes the level.
- **Endless continuation:** After level completion, waves continue indefinitely for score.
- **Differentiation:** Maps vary across multiple axes:
  - **Path shape** (straight, curved, zigzag, etc.)
  - **Number of paths** (single, dual, multi-lane)
  - **Build space** (abundant vs. scarce tower slots)
  - **Environmental theme** (e.g., cute alien planet, gritty ruined city, sleek space station) — may include gameplay-relevant terrain that blocks certain placements
  - **Difficulty tier** — easy, medium, hard maps
- **Visual & audio identity per map:** Each map has its own distinct art and audio tone. For example, Map 1 might be cutesy/stylized while Map 2 is gritty/realistic military sci-fi. Art direction shifts per map rather than a single unified style.

## 5. Towers

### 5.1 Archetypes (all six must exist in v1)

| Archetype | Role |
|---|---|
| Single-target DPS | High damage to one target (sniper/railgun feel) |
| Splash / AoE | Area damage for groups (missile/plasma) |
| Slow / debuff | Movement reduction, disables (cryo/EMP) |
| Chain / multi-target | Hits multiple enemies per shot (tesla/lightning) |
| Support / buff | Boosts nearby towers |
| Economy | Generates passive currency during combat |

### 5.2 Upgrades

- **Linear upgrades** — each tower has 3–5 upgrade levels, purchased with in-run currency. Each level is a straight stat increase. No branching paths, no specializations.
- Upgrade state does not persist between runs.

### 5.3 Player interaction with towers

- **Tower-triggered active abilities:** Each tower has an active ability the player can manually trigger (cooldown-based). Examples: sniper focus shot, AoE tower burst fire, support tower emergency buff.
- **Manual targeting:** The player can click an enemy to prioritize it, directing all eligible towers to focus fire.

## 6. Enemies

### 6.1 Archetypes (all nine must exist in v1)

- Grunt (basic, weak, numerous)
- Tank (slow, high HP / armor)
- Fast / swarm (quick, low HP)
- Flying (ignores ground-only targeting)
- Shielded (resistant to certain damage types)
- Stealth / cloaked (reduced visibility to some towers)
- Splitter (breaks into smaller enemies on death)
- Healer / support (buffs or heals nearby enemies)
- Boss (milestone and final-level encounters)

### 6.2 Counter system

- **Soft counters.** Every tower can damage every enemy. Some tower/enemy matchups are noticeably stronger (e.g., chain towers vs. swarms, snipers vs. tanks), but no enemy is immune to any tower type. This preserves casual accessibility while rewarding strategic diversity.

### 6.3 Boss structure

- **Milestone bosses** appear every 10 waves on every map. They are notable encounters but do not complete the level.
- **Final boss** is a unique, map-specific encounter at the map's target wave. Defeating it completes the level and triggers the tower unlock.

## 7. Wave System

- **Flow:** Continuous. No "start next wave" button, no forced pause between waves.
- **Composition:** Blind. The player does not see what enemies are in the next wave.
- **Length:** Variable. Wave duration is not fixed; some waves are short and punchy, others are longer.
- **Milestone cadence:** A milestone boss every 10 waves, independent of the final boss.
- **Prep phase:** Before wave 1 only, the player has an un-timed prep moment to place opening towers with the starting budget.

## 8. Economy

Single currency, earned from four sources:

1. **Kill rewards** — per-enemy bounty when destroyed.
2. **Wave completion bonus** — lump sum granted at the end of each wave.
3. **Starting budget** — fixed amount at the beginning of each run.
4. **Economy towers** — passive income during combat.

No interest/banking system. No collectible pickups.

## 9. Lose Condition

- **Base HP.** The player's base has a single health pool. Enemies that reach the end of their path deal damage to base HP (amounts vary by enemy type — grunts small, tanks/bosses large). The run ends when base HP hits 0.

## 10. Controls & QoL

- **Pause button.** Players can pause combat at any time.
- **Game speed controls.** 1x / 2x / 3x fast-forward toggle during combat.
- **Manual targeting.** Click an enemy to prioritize it.
- **Tower ability triggers.** Click a tower (or use UI button) to fire its active ability.
- **Input:** Mouse-primary. Keyboard support is not a v1 requirement.

## 11. Onboarding

- **Guided tutorial** on first play. A scripted first map (or a dedicated tutorial sequence) walks the player through:
  - Placing a tower
  - Upgrading a tower
  - Using a tower's active ability
  - Manual targeting
  - Pause and speed controls
  - The boss/milestone structure
- The tutorial runs once per local save; returning players start at the map select.

## 12. Scoring & Leaderboards

### 12.1 Score metric

- **Combined formula.** Score is a blend of wave reached, map difficulty multiplier, kill bonuses, and boss bonuses. Exact weights to be tuned; harder maps yield higher scores at equivalent waves.

### 12.2 Leaderboards

- **Per-map personal best lists.** Each map has its own list of the player's top scores, stored locally.
- **No global leaderboards** in v1 (local storage only; no account or server).

### 12.3 End-of-run summary

- A summary screen after each run showing wave reached, score, kills, and personal-best comparison for the map.

## 13. Save System

- **Local browser storage only** (localStorage or equivalent).
- Stored data:
  - Unlocked maps
  - Unlocked tower roster
  - Per-map personal best scores
  - Tutorial-completion flag
  - Settings (pause preferences, audio, etc.)
- **No account system.** No cloud sync. Clearing browser data loses progress; this is an accepted tradeoff for v1.

## 14. Art & Audio Direction

- Each map has its own visual and audio identity, shifting tone across the progression (examples: cutesy-stylized, gritty-military, sleek-futuristic, etc.).
- Common UI framing across maps so the player can move between maps without re-learning the interface.
- Specific map themes and art style bibles are out of scope for this PRD.

## 15. Out of Scope for v1

The following are intentionally excluded from the initial release:

- Meta-progression beyond tower unlocks (no persistent stats, currency, or skill trees)
- Cosmetics, skins, or customization
- Multiplayer, co-op, or PvP
- Account / login system
- Cloud save
- Global or friend leaderboards
- Monetization of any kind (ads, IAP, paid maps, paid towers)
- Accessibility features (colorblind modes, text scaling, reduced motion, keyboard navigation, separate audio sliders)
- Mobile or console support
- Narrative / campaign storytelling beyond ambient worldbuilding

## 16. Open Questions

Items not decided in this PRD and deferred to design / production:

- Exact number of maps for v1 (current placeholder: ~5).
- Target wave per map (how long is a "full" run of each map).
- Tower count per archetype (is there one tower per archetype at v1, or multiple?).
- Specific tower ability designs, cooldowns, and costs.
- Exact scoring formula weights.
- Final-boss designs per map.
- Balance tuning for soft counters.
- Visual/audio style bible per map.
