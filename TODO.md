# TODO — Sci-Fi Tower Defense v1

Implementation checklist for the game described in `PRD.md` and `TECHSPEC.md`. Read both before starting.

## How to use this list

- Work top to bottom. Phases are mostly sequential; within a phase, tasks can sometimes be parallelized but the listed order is safest.
- Each task is sized to be finishable in a single session (~30–90 min) and leaves the repo in a green, committable state. Stop any time between tasks.
- Every task has an **Acceptance** bullet — do not mark it done until that check passes.
- Follow TDD where the spec says pure-logic modules. Tests go in `/tests/unit`, mirroring `/src`.
- Keep to the import rules in TECHSPEC §4.1 and §7: no Phaser under `/src/entities/logic`, `/src/systems`, `/src/state`, `/src/save`, `/src/content`, `/src/rng`.

---

## Phase 0 — Project bootstrap

- [x] **0.1 Initialize Node project.** `npm init -y`, set `"type": "module"`, set engines to Node 24. Commit `package.json` only.
  - Acceptance: `node --version` matches engines; `package.json` exists with ESM set.

- [x] **0.2 Install dev toolchain.** Install latest stable `vite`, `vitest`, `@biomejs/biome`, `phaser`. Add scripts: `dev`, `build`, `preview`, `test`, `test:watch`, `lint`, `format` (per TECHSPEC §8).
  - Acceptance: `npm run lint`, `npm run test` both execute (can return "no files" — they must not crash).

- [x] **0.3 Configure Vite and Biome.** Create `vite.config.js` (default config, sets `/assets` as additional publicDir-style source if needed) and `biome.json` with default rules plus the three project rules in TECHSPEC §8 (no Phaser in logic dirs, no `localStorage` outside `/src/save`, no `Math.random()` outside `/src/rng` whitelist). Use Biome `overrides` keyed by path globs.
  - Acceptance: `npm run lint` exits 0 on an empty tree; config files committed.

- [x] **0.4 Create folder skeleton.** Make every directory listed in TECHSPEC §3, each with an empty `.gitkeep`. Add `index.html` that mounts a `<div id="game">` and imports `/src/main.js`.
  - Acceptance: folder tree matches spec; `index.html` loads without 404s on `npm run dev`.

- [x] **0.5 Boot Phaser with an empty scene.** `src/main.js` creates a `Phaser.Game` with canvas parented to `#game` and a single placeholder scene that renders a solid color. No assets yet.
  - Acceptance: `npm run dev` shows a colored canvas in the browser, no console errors.

---

## Phase 1 — Pure infrastructure (no Phaser)

- [x] **1.1 Seeded RNG.** Implement `src/rng/seeded.js`: mulberry32 generator factory + helpers `intInRange`, `floatInRange`, `pickWeighted`, `shuffle`. Every helper takes a generator instance.
  - Acceptance: unit tests cover determinism (same seed → same sequence), bounds, weighted distribution correctness over N=10k.

- [x] **1.2 Constants module.** `src/config/constants.js` exports `TICK_MS = 1000/60`, `BASE_HP_DEFAULT`, `STARTING_BUDGET_DEFAULT`, `SPEED_MULTIPLIERS = [1,2,3]`, and a `SAVE_NAMESPACE` string.
  - Acceptance: imported by later modules; no tests needed.

- [x] **1.3 Event bus.** `src/state/events.js`: tiny pub/sub — `on(name, fn)`, `off(name, fn)`, `emit(name, payload)`. Synchronous, listeners run in subscription order.
  - Acceptance: unit tests for subscribe, unsubscribe, emit-order, and that throwing listeners don't break siblings.

- [x] **1.4 State store.** `src/state/store.js`: singleton with `getState`, `setState(partial)` (shallow merge), `subscribe(listener)`, `reset()`. Initial shape includes fields in TECHSPEC §4.2.
  - Acceptance: tests verify merge semantics, subscribe fires on change, reset restores initial shape.

- [x] **1.5 Save schema + migrations.** `src/save/schema.js`: defines v1 shape (per TECHSPEC §6.4), exports `CURRENT_VERSION = 1` and `migrations = []`. Include a `migrate(oldState)` that walks versions in order.
  - Acceptance: tests run a v1 state through migrate unchanged; a fake v0 → v1 migration proves the chain mechanism.

- [x] **1.6 localStorage adapter.** `src/save/localStorageAdapter.js`: `read()`, `write(obj)`, `clear()`. Namespaced key from constants. Handles JSON parse errors by returning null.
  - Acceptance: tests use a stub `localStorage` to verify read/write/clear and malformed-JSON safety.

- [x] **1.7 Save public API.** `src/save/save.js`: `load()`, `save(partial)`, `clear()`, `getVersion()`. `load()` returns migrated state or a fresh default if none exists. `save()` shallow-merges over the current stored blob.
  - Acceptance: tests for fresh load, round-trip, migration-on-load, and that `save({settings: {volume: 0.5}})` preserves other keys.

- [x] **1.8 Fixed-step tick loop.** `src/systems/tickLoop.js`: exports `createLoop({onTick})` returning `{ advance(deltaMs, speedMultiplier), reset() }`. Accumulates delta, flushes whole ticks, supports 1×/2×/3× via an integer max-ticks-per-frame cap.
  - Acceptance: tests verify: N ms of delta → floor(N/TICK_MS) ticks; leftover carries; 2× speed runs twice as many ticks per frame; reset zeros the accumulator.

---

## Phase 2 — Entity logic (no Phaser)

- [x] **2.1 Pathing module.** `src/systems/pathing.js`: `buildPath(waypoints)` returns a polyline with cached segment lengths; `pointAtDistance(path, d)` returns `{x, y, segmentIndex}` clamped to total length.
  - Acceptance: tests for straight, L-shape, and multi-segment paths; out-of-range distances clamp correctly.

- [x] **2.2 Enemy logic class.** `src/entities/logic/Enemy.js`: fields for hp, speed (units/tick), path, distanceTravelled, armor, flags (flying, stealth, shielded). `tick(dt, world)` advances position. `applyDamage(amount, type)` respects soft-counter modifiers.
  - Acceptance: tests for movement under a 60Hz tick, reaching the end (triggers `world.onBaseHit`), damage application, and death (triggers `world.onEnemyKilled`).

- [x] **2.3 Status effects.** `src/entities/logic/StatusEffect.js` + helpers in `src/systems/damage.js` for slow, stun, burn (DoT). Effects stack per the rules: same-type refreshes duration; cross-type coexists.
  - Acceptance: tests on an Enemy instance: slow reduces effective speed; stun halts movement; burn ticks damage each tick until expiry.

- [x] **2.4 Projectile logic.** `src/entities/logic/Projectile.js`: straight-line + homing modes. `tick(dt, world)` advances; on collision calls `target.applyDamage` and marks for removal. Splash variant damages all enemies within radius.
  - Acceptance: tests for hit-at-target, splash radius inclusion/exclusion, homing updating heading, and expired lifetimes.

- [x] **2.5 Targeting system.** `src/systems/targeting.js`: pure functions — `selectTarget(tower, enemies, mode)` with modes `first`, `last`, `strongest`, `closest`, `manual`. "Manual" honors a world-level manual-target id if set and in range.
  - Acceptance: tests for each mode with a scripted enemy list + tower range.

- [x] **2.6 Tower logic class.** `src/entities/logic/Tower.js`: fields for stats, level, cooldown (ticks), ability cooldown, range, targeting mode. `tick(dt, world)` picks a target and fires when off-cooldown. `upgrade()` applies next-level stats and deducts cost. `canActivate()` / `activate(rng, world)` for active ability.
  - Acceptance: tests for firing cadence, upgrade stat application + cost check, ability gating by cooldown.

- [x] **2.7 Damage resolution module.** `src/systems/damage.js`: `resolveDamage({amount, type, enemy})` applies archetype modifiers (sniper vs tank strong, chain vs swarm strong, etc.) and returns final damage dealt. Soft counters only — never zero unless amount was zero.
  - Acceptance: tests assert modifiers for each named matchup and that no combination reduces damage to zero for positive inputs.

---

## Phase 3 — Content data (first map worth of content)

- [x] **3.1 Enemy content — 9 archetypes.** One file per archetype under `src/content/enemies/` (grunt, tank, fast, flying, shielded, stealth, splitter, healer, boss). Stats are placeholders; balancing happens later.
  - Acceptance: index re-exports all 9; a test instantiates an `Enemy` from each definition and ticks one frame without error.

- [x] **3.2 Tower content — 6 archetypes.** One file per archetype under `src/content/towers/` (singleTargetDps, splash, slow, chain, support, economy). Each defines 3–5 upgrade levels and a placeholder ability.
  - Acceptance: index re-exports all 6; a test instantiates a `Tower` for each, upgrades it through all levels, and triggers its ability once.

- [x] **3.3 Map 1 data.** `src/content/maps/map1.js`: waypoints for a single-path level, buildable-tile mask, theme key `"cute-alien-planet"`, target wave (e.g. 30), final-boss reference.
  - Acceptance: test loads the map, runs `buildPath` on its waypoints, confirms total length > 0 and buildable mask has > 0 valid cells.

- [x] **3.4 Wave definition shape + Map 1 scripted waves.** Define `WaveDefinition = { entries: [{enemyId, count, spacingTicks, delayTicks}], meta }` in `src/content/waves/_shape.js`. Author scripted intro waves (1–3), every milestone boss wave (10, 20), and final boss (30) for Map 1.
  - Acceptance: tests validate each scripted wave matches the shape and enemy ids resolve against the content index.

---

## Phase 4 — Wave system

- [ ] **4.1 Procedural wave generator.** `src/systems/waveSpawner.js`: `generate(waveNumber, mapDifficulty, rng)` returns a `WaveDefinition` using curves for enemy-type mix, count, spacing, HP/damage scaling. Invariants: count ≤ curve budget; enemy-type variety ≥ 2 after some wave N.
  - Acceptance: property tests over 1..200 waves assert invariants; determinism test confirms same seed/inputs → identical output.

- [ ] **4.2 Wave runner.** `src/systems/waveRunner.js`: given a sequence of `WaveDefinition`s (scripted map overlay + procedural fill), emits spawn events at the right ticks via the event bus. Handles continuous flow (PRD §7) — no gap between waves.
  - Acceptance: tests with a mock bus assert spawn ordering and timing for a scripted + procedural sequence; no idle ticks between waves.

- [ ] **4.3 Map-to-waves wiring.** Helper `resolveWaveForNumber(mapId, waveNumber, rng)` returns scripted `WaveDefinition` if one exists, else falls back to procedural. Map 1 uses this.
  - Acceptance: tests assert waves 1, 10, 20, 30 on Map 1 hit the scripted path; others use procedural.

---

## Phase 5 — Economy, scoring, run lifecycle

- [ ] **5.1 Economy module.** `src/systems/economy.js`: `earn(source, amount)`, `spend(amount)` (returns boolean), `applyWaveBonus(waveNumber)`, `tickPassive(towers)`. Reads/writes currency via the store.
  - Acceptance: tests verify: can't overspend; wave bonus scales; economy towers contribute per-tick income.

- [ ] **5.2 Scoring module.** `src/systems/scoring.js`: `computeScore({waveReached, mapDifficulty, kills, bossKills})` using weights from a `SCORING_WEIGHTS` constant (exact weights placeholder — PRD §12.1 open question).
  - Acceptance: tests for monotonicity (more waves → higher), difficulty multiplier effect, and boss-bonus application.

- [ ] **5.3 Personal bests.** Helpers in `src/save/save.js`: `recordPersonalBest(mapId, entry)` keeps top N per map, sorted desc. Entry includes seed (TECHSPEC §4.4).
  - Acceptance: tests for top-N trimming, ordering, per-map isolation.

- [ ] **5.4 Run lifecycle controller.** `src/systems/runLifecycle.js`: orchestrates run start (set seed, reset store, grant starting budget, prep phase flag) and run end (compute score, persist PB, unlock next map + tower if final boss defeated).
  - Acceptance: tests simulate a winning run and a losing run; verify unlocks happen only on final-boss win.

---

## Phase 6 — Phaser scenes and sprite adapters

- [ ] **6.1 PreloadScene with placeholder assets.** Fetch a Kenney CC0 pack, commit needed sprites under `/assets/sprites`. PreloadScene loads UI atlas, shared enemy sprites, shared SFX, shows a progress bar, moves to MainMenuScene.
  - Acceptance: loading bar renders; no 404s; MainMenuScene is reached.

- [ ] **6.2 MainMenuScene.** Minimal DOM overlay with Play, Settings, Quit (Quit may be a no-op in browser). Play goes to MapSelectScene.
  - Acceptance: buttons route correctly; keyboard not required.

- [ ] **6.3 MapSelectScene (Map 1 only).** DOM panel lists Map 1 as unlocked and any locked placeholders as disabled. Selecting Map 1 launches GameScene with the map id.
  - Acceptance: unlocked map selectable; locked entries disabled; GameScene receives the id via scene data.

- [ ] **6.4 GameScene shell + tick integration.** GameScene loads Map 1 assets, wires `tickLoop` into `update(time, delta)`, respects pause/speed from the store. No entities yet — just a ticking empty world.
  - Acceptance: pause halts the tick counter; speed toggle changes ticks-per-frame; logs confirm tick cadence.

- [ ] **6.5 EnemySprite adapter + spawning.** `src/entities/sprites/EnemySprite.js` wraps an `Enemy` logic instance. GameScene listens for spawn events from the wave runner and creates sprites. Sprite `preUpdate` lerps position using the tick loop's fractional remainder.
  - Acceptance: enemies visibly walk along Map 1's path in the browser; pause freezes them.

- [ ] **6.6 TowerSprite adapter + placement.** `TowerSprite.js`. HUDScene renders a placement ghost that snaps to the buildable-tile grid; clicking places a tower and deducts cost via economy. Shows range circle on hover.
  - Acceptance: placing in-browser costs currency; invalid tiles reject placement.

- [ ] **6.7 ProjectileSprite adapter + firing.** `ProjectileSprite.js`. Tower auto-fires at enemies in range; projectiles travel and deal damage; enemies die and award kill bounty.
  - Acceptance: a placed tower clears enemies in-browser; currency grows from kills.

- [ ] **6.8 HUDScene chrome — DOM overlay.** `src/ui/render.js` tagged-template renderer + event delegation. `src/ui/components/HUD.js` shows currency, current wave, base HP. Subscribes to the store.
  - Acceptance: values update live during play.

- [ ] **6.9 Pause menu + speed controls.** DOM pause menu (resume, restart, quit-to-map-select). Speed-toggle button cycles 1×/2×/3×. Both update the store.
  - Acceptance: in-browser: pause freezes, resume continues; 2×/3× visibly faster.

- [ ] **6.10 SummaryScene.** End-of-run DOM panel: wave reached, score, kills, PB comparison, return to map select. Triggered when base HP hits 0 or player opts out of endless after final boss.
  - Acceptance: summary appears at loss; PB list updated.

---

## Phase 7 — Gameplay completeness

- [ ] **7.1 Tower upgrades in-UI.** Clicking a placed tower opens a DOM side panel showing current level, next-level stats, upgrade cost. Upgrade button applies and deducts.
  - Acceptance: upgrade stat deltas reflect in the tower's fire rate/damage observably.

- [ ] **7.2 Active abilities UX.** Tower side panel includes an Activate button with cooldown ring. Clicking triggers `tower.activate(rng, world)`; visible effect (e.g. burst fire, buff pulse) via HUDScene.
  - Acceptance: each of the 6 archetypes' abilities can be fired once per cooldown.

- [ ] **7.3 Manual targeting.** Clicking an enemy sets `world.manualTargetId`; eligible towers in targeting mode `manual` (or with a `focusOverride` flag) switch to it. Click empty space to clear.
  - Acceptance: visible focus indicator on the enemy; towers prioritize it.

- [ ] **7.4 Milestone bosses.** Wave 10/20 scripted bosses render at larger scale and apply a meaningful challenge (higher HP, small AoE on base-hit). Uses existing Enemy logic with boss flag.
  - Acceptance: playing to wave 10 in-browser triggers the milestone boss.

- [ ] **7.5 Final boss + map completion.** Wave 30 on Map 1 spawns the scripted final boss. On its death, `runLifecycle` marks the map complete, unlocks Map 2 stub and a new tower, prompts the player to continue endless or exit.
  - Acceptance: PB recorded; save file shows new unlocks.

- [ ] **7.6 Endless mode.** After final boss, wave runner keeps feeding procedural waves forever. Difficulty keeps scaling via the curve.
  - Acceptance: in-browser: waves past 30 keep coming; run only ends when base HP hits 0.

---

## Phase 8 — Onboarding and settings

- [ ] **8.1 Tutorial overlay.** DOM-driven overlay keyed off `save.tutorialCompleted`. Scripted prompt sequence: place tower → upgrade → use ability → manual-target → pause/speed → milestone boss explanation. Completing sets the flag.
  - Acceptance: fresh save shows tutorial; reloading after completion skips it; `clear()` brings it back.

- [ ] **8.2 Settings panel.** DOM modal with volume and default speed. Writes through `save()`.
  - Acceptance: settings persist across reloads; volume affects Phaser sound manager.

---

## Phase 9 — Content breadth (Maps 2–5)

One task per map. Each map reuses the existing systems; work is data + art swap.

- [ ] **9.1 Map 2 content.** New path shape, new tile mask, new theme key, scripted intro/milestone/final-boss waves, difficulty tier "medium". Unlocks a new tower type.
  - Acceptance: playable start-to-finish in-browser.

- [ ] **9.2 Map 3 content.** Dual-path geometry; tier "medium-hard".
  - Acceptance: both paths spawn enemies correctly; playable to completion.

- [ ] **9.3 Map 4 content.** Constrained build space (fewer tiles); tier "hard".
  - Acceptance: placement UI honors the tighter mask; playable to completion.

- [ ] **9.4 Map 5 content.** Multi-lane; tier "hardest". Unlocks the last tower type on completion.
  - Acceptance: final tower is now in the roster on all maps.

- [ ] **9.5 Per-map audio + theme assets.** Load bespoke music and at least one theme-distinct sprite swap per map in GameScene's per-map load step.
  - Acceptance: audibly/visibly different feel across the five maps.

---

## Phase 10 — Polish and release prep

- [ ] **10.1 Balance pass.** Tune starting budget, kill bounties, wave bonuses, enemy HP scaling, tower costs/DPS so Map 1 completion rate feels fair, Map 5 feels earned. Document final numbers in code comments only where non-obvious.
  - Acceptance: self-playtest: Map 1 beatable first try with reasonable play; Map 5 requires strategy.

- [ ] **10.2 Lint and test sweep.** `npm run lint` clean, `npm run test` green, remove dead code, remove `console.log`s from production paths.
  - Acceptance: both scripts exit 0.

- [ ] **10.3 Production build smoke test.** `npm run build && npm run preview`; click through a full run on Map 1 and Map 5 in the built bundle.
  - Acceptance: no console errors; PB persists across reloads.

- [ ] **10.4 Browser matrix check.** Load the preview build in current Chromium, Firefox, and Safari. Play at least wave 1–10 in each.
  - Acceptance: all three render and play without errors.

---

## Deferred / tracked elsewhere

These are called out in TECHSPEC §11 and PRD §16 and should be revisited during or after balance (not gated on implementation):

- Exact scripted-intro wave count per map.
- Procedural generator curve parameters.
- Scoring formula weights.
- Tower grid cell size per map and authoring format for buildable masks.
- Pointer routing policy for modals over live game.
- Tutorial prompt authoring format (inline vs. separate script).
- Whether run seeds are user-visible strings.
- Deployment (S3 + CloudFront) and the future DynamoDB save adapter.
