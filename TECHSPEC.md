# Technical Specification: Sci-Fi Alien Invasion Tower Defense

Companion to `PRD.md`. This document covers how we build the game — stack, architecture, conventions, file layout. It does not restate product requirements; see the PRD for what we're building and why.

## 1. Scope

This spec governs the v1 implementation (single-player, browser-only, local storage, ~5 maps). It does not cover:

- Meta-progression beyond the PRD (explicitly out of scope per PRD §15).
- Final per-map art direction or audio design.
- Cloud save / accounts — flagged as future phase; the save layer is designed so the swap is additive (see §6.4).

## 2. Tech Stack

| Area | Choice | Notes |
|---|---|---|
| Language | JavaScript (ES2024+) | No TypeScript. |
| Runtime (local tooling) | Node 24 | Installed locally. |
| Game engine | Phaser 3 | WebGL renderer; native support for our needs (scenes, input, audio, loader, tweens). |
| Build / dev server | Vite | HMR, ESM-native, zero-config for this project shape. |
| Test runner | Vitest | Pairs natively with Vite; used for all unit tests. |
| Lint + format | Biome | Single tool for both; replaces ESLint + Prettier. |
| DOM UI helper | Vanilla JS + template literals | No framework. |
| RNG | Seeded mulberry32 (game logic) + `Math.random()` (cosmetics) | See §6.3. |
| Placeholder art | Kenney.nl CC0 sprite packs | Per-map bespoke art replaces these later. |
| Audio | Phaser `sound` manager | Web Audio under the hood. |
| Storage (v1) | `localStorage` behind an adapter | Remote adapter (DynamoDB) planned post-v1. |

Always install the latest stable version of each package unless a specific reason requires otherwise.

## 3. Project Structure

```
/
  PRD.md
  TECHSPEC.md
  package.json
  vite.config.js
  biome.json
  index.html
  /public                    # static assets (favicon, etc.)
  /assets                    # Kenney packs + our own placeholder sounds
    /sprites
    /audio
    /atlases
  /src
    main.js                  # Phaser Game bootstrap
    /scenes                  # Phaser scenes (thin; delegate to logic modules)
      BootScene.js
      PreloadScene.js
      MainMenuScene.js
      MapSelectScene.js
      GameScene.js
      HUDScene.js
      SummaryScene.js
    /entities
      /logic                 # pure JS classes — no Phaser imports
        Tower.js
        Enemy.js
        Projectile.js
        StatusEffect.js
      /sprites               # Phaser.Sprite adapters wrapping logic classes
        TowerSprite.js
        EnemySprite.js
        ProjectileSprite.js
    /systems                 # pure simulation modules
      waveSpawner.js
      economy.js
      scoring.js
      targeting.js
      damage.js
      pathing.js
      tickLoop.js             # fixed-step driver
    /state
      store.js                # singleton game-state store
      events.js               # lightweight pub/sub (non-Phaser)
    /save
      save.js                 # public API: load / save / clear / migrate
      localStorageAdapter.js
      schema.js               # versioned schema + migrations
    /ui                       # DOM UI helpers
      render.js               # tiny html`` tagged template + event delegation
      /components
        HUD.js
        PauseMenu.js
        MapSelectPanel.js
        SummaryPanel.js
        SettingsPanel.js
    /content                  # game-content data (pure JS modules)
      /towers                 # one file per tower archetype
      /enemies                # one file per enemy archetype
      /maps                   # one file per map (geometry, theme, boss ref)
      /waves                  # per-map scripted intros + boss definitions
    /rng
      seeded.js               # mulberry32 + helpers
    /config
      constants.js            # tick rate, base HP defaults, etc.
  /tests
    /unit                     # mirrors /src structure
```

Tests live in `/tests/unit`, mirroring `/src`. Vitest's default glob finds `*.test.js` — tests may also colocate with source if preferred on a per-file basis, but `/tests/unit` is the default home.

## 4. Architecture Overview

### 4.1 Logic / adapter split

Every entity type is split into two classes:

- **Logic class** (`src/entities/logic/Tower.js`, etc.) — a plain JS class with no Phaser imports. Owns stats, state machine, cooldowns, targeting decisions, damage math. Accepts time via a `tick(dt)` method, not real time.
- **Sprite adapter** (`src/entities/sprites/TowerSprite.js`) — extends `Phaser.GameObjects.Sprite`. Owns rendering, animation, Phaser input events. Holds a reference to a logic instance and calls into it.

The same pattern applies to simulation modules in `src/systems` — pure functions / classes, no Phaser imports, fully unit-testable.

**Rule:** anything under `src/entities/logic/`, `src/systems/`, `src/state/`, `src/save/`, `src/content/`, `src/rng/` MUST NOT import Phaser. Biome lint rule enforces this.

### 4.2 State store

A singleton store at `src/state/store.js`:

- Plain JS module exporting `getState()`, `setState(partial)`, `subscribe(listener)`, `reset()`.
- Holds: current wave number, currency, base HP, live entity lists (refs only), run seed, pause/speed state, tutorial flags, UI mode.
- Persistent data (unlocked maps/towers, personal bests, settings) flows through `src/save/save.js`, not the live store.
- Scenes and DOM UI both subscribe. Phaser events are still used for Phaser-internal reactions; the store is for cross-cutting state.

### 4.3 Fixed timestep

All simulation runs on a fixed tick (default **60 Hz** — `TICK_MS = 1000/60`). `tickLoop.js` drives it:

- Phaser's `update(time, delta)` accumulates `delta` into a running bucket.
- While `bucket >= TICK_MS`, call `simulation.tick()` and subtract `TICK_MS`.
- Render interpolation: sprite adapters lerp between previous and current logic positions using the fractional remainder.
- **Speed controls** (1x/2x/3x) run the loop up to 1/2/3 sim-ticks per frame.
- **Pause** halts the accumulator entirely.

Consequences:
- Wave spawn timing, projectile flight, cooldowns, status-effect durations are all integer tick counts — trivially testable.
- Tests import `tickLoop.js` and call `tick()` directly without running Phaser.

### 4.4 Deterministic RNG for game logic

`src/rng/seeded.js` exports a mulberry32-based generator and helpers (`pickWeighted`, `intInRange`, etc.). Every logic module that needs randomness takes a generator by dependency injection — no module calls a global RNG internally.

- Wave generation, enemy-variant rolls, loot (none in v1 but reserved), anything that affects outcomes: uses the seeded RNG.
- Particle jitter, screen-shake magnitude, UI animation variation: uses `Math.random()`.

The current run's seed is stored in the state store and persisted to save data on run end, so a personal-best entry can carry a seed for later repro.

## 5. Scenes

Scene flow:

```
BootScene → PreloadScene → MainMenuScene → MapSelectScene → GameScene
                                                              ↓ (parallel HUDScene)
                                                              ↓
                                                         SummaryScene
```

- **BootScene** — set up graphics context, register any plugins, then launch PreloadScene.
- **PreloadScene** — load core assets (UI, fonts, shared enemy sprites, shared SFX). Shows a load bar. Moves to MainMenuScene.
- **MainMenuScene** — entry, settings, quit. Mostly DOM.
- **MapSelectScene** — mostly DOM. Shows unlocked maps + personal bests.
- **GameScene** — owns the simulation (tick loop, entities, spawner). Loads per-map assets on start.
- **HUDScene** — runs in parallel with GameScene; thin layer for in-world anchored UI (range indicators, damage numbers, placement ghost). Persistent chrome (currency, wave counter, base HP) lives in DOM, not HUDScene.
- **SummaryScene** — end-of-run stats, personal-best comparison, return to map select.

**Tutorial** is not a scene. It's an overlay driven by save-flag state inside MainMenuScene / GameScene — first-play detection triggers guided prompts over normal scenes (see PRD §11).

## 6. Subsystems

### 6.1 Entities

- **Logic classes** extend nothing — plain classes. Shared behavior (e.g. `applyDamage`, `applyStatus`) lives in small mixins or composition helpers, not inheritance chains.
- **Sprite adapters** extend `Phaser.GameObjects.Sprite` (or `Container` where needed). Hold a logic ref; `preUpdate` or the HUD scene's update drives them.
- Active abilities (PRD §5.3): defined on the logic class (`canActivate()`, `activate(rng, world)`); sprite adapter wires the click/button to it.

### 6.2 Content data

All game-content data lives under `src/content/` as JS modules:

```js
// src/content/towers/sniper.js
export const sniper = {
  id: 'sniper',
  name: 'Railgun',
  archetype: 'singleTargetDps',
  cost: 150,
  levels: [ /* per-upgrade-level stats */ ],
  ability: { cooldownTicks: 600, execute: (rng, world, self) => { /* ... */ } },
  art: { atlas: 'towers', frame: 'sniper_lv1' },
};
```

- **Towers**: one file per archetype; index re-exports them.
- **Enemies**: one file per archetype.
- **Maps**: one file per map — path waypoints, buildable tiles (grid-aligned), theme key, target wave, final-boss reference.
- **Waves**: per-map wave script — scripted intro waves + scripted milestone bosses + scripted final boss + reference to the procedural generator for the middle and endless sections.

### 6.3 Wave system

Hybrid (PRD §7):

- **Scripted**: intro waves (exact count TBD during tuning), every milestone boss (wave 10, 20, 30...), the final boss. Each is a literal `WaveDefinition` in `src/content/waves/<map>.js`.
- **Procedural**: all non-scripted waves, including endless past the final boss. `waveSpawner.generate(waveNumber, mapDifficulty, rng)` returns a `WaveDefinition` using tuned curves for enemy-type mix, count, spacing, and HP/damage scaling.
- Both flows emit the same `WaveDefinition` shape, so the spawner doesn't branch on source. Test coverage: assert exact compositions for scripted waves; assert invariants (never exceeds curve-budget, always includes enemy-type variety past N) for procedural.

### 6.4 Save system

- Public API: `load()`, `save(partial)`, `clear()`, `getVersion()`, `migrate(oldState)`.
- `localStorageAdapter` is the only v1 implementation — reads/writes JSON under a single namespaced key.
- `schema.js` defines the current save shape and ordered migrations (`v1 → v2`, etc.). `load()` runs migrations transparently.
- Nothing in game code calls `localStorage` directly — all access goes through `save.js`.
- **Future remote adapter:** swap-in replacement that satisfies the same adapter interface. Auth model and transport (Cognito direct vs. API layer) decided at that point.

Persisted keys (v1):
- `unlockedMaps: string[]`
- `unlockedTowers: string[]`
- `personalBests: { [mapId]: ScoreEntry[] }`
- `tutorialCompleted: boolean`
- `settings: { volume, speedDefault, ... }`

### 6.5 UI

- **Phaser in-world UI** (HUDScene): placement ghost, range circles, targeting reticle, floating damage numbers, tower selection outline.
- **DOM UI** (absolute-positioned `<div>` overlays on top of the canvas): currency / wave / base-HP counters, pause menu, map select, settings, end-of-run summary, tutorial prompts.
- DOM rendering uses vanilla JS template literals via `src/ui/render.js`. No virtual DOM; components are functions returning strings, rendered into a container with event delegation for interactivity.
- Canvas and DOM share pointer input via a thin router: DOM consumes first (when a menu is open); otherwise events pass through to Phaser.

### 6.6 Asset loading

- **PreloadScene** loads core assets only: UI atlases/fonts, shared enemy sprites (grunt/tank/fast/etc.), shared SFX.
- **GameScene** on start loads that map's theme-specific assets (tiles, background, map-specific enemy variants, music). Brief loading indicator between MapSelect and Game.
- All assets under `/assets/` (source of truth) — Vite's static handling serves them; Phaser's loader uses public URLs.

## 7. Testing

- **TDD discipline:** write a failing Vitest test, implement the minimum to pass, refactor.
- Unit tests cover: logic classes (Tower, Enemy, etc.), systems (waveSpawner, economy, scoring, damage, pathing, tickLoop), RNG helpers, save/migrate, store.
- **Not tested:** Phaser internals — scenes, sprite adapters, DOM rendering. These are thin adapters; bugs in them surface through manual playtest.
- Test helpers: `makeDeterministicWorld(seed)` returns a minimal world with seeded RNG + empty state; used as the harness for most tests.
- Biome's test-aware config disallows imports of `phaser` anywhere under `/src/entities/logic`, `/src/systems`, `/src/state`, `/src/save`, `/src/content`, `/src/rng`.

## 8. Tooling

- **Scripts** (in `package.json`):
  - `dev` — Vite dev server
  - `build` — production build (`dist/`)
  - `preview` — serve the built bundle
  - `test` — Vitest
  - `test:watch` — Vitest watch mode
  - `lint` — Biome check
  - `format` — Biome write
- **Biome config**: default rules + project-specific rules:
  - No Phaser imports in the pure-logic directories listed in §4.1.
  - No direct `localStorage` access outside `/src/save`.
  - No direct `Math.random()` outside `/src/rng/` exceptions list (cosmetic modules whitelisted).

## 9. Browser Support

- **Evergreen Chromium, Firefox, and Safari** — current + 1 previous major. No IE11, no legacy Edge.
- Vite's default target (`baseline-widely-available`) is fine.
- No polyfills beyond what Vite/esbuild include by default.

## 10. Deployment

Deferred for now. Target environment: AWS S3 + CloudFront (fits the planned DynamoDB save-backend move). No CI/CD wired up at this stage. URL shape (root domain vs. subpath) decided at deploy time; if subpath, set Vite's `base` accordingly.

## 11. Open Questions

Deferred to implementation / tuning; track here until resolved:

- Exact scripted-intro wave count per map (how many waves before the procedural generator takes over).
- Procedural wave generator parameters (enemy-type probability curves, count scaling, HP/damage scaling).
- Exact scoring formula weights (PRD §12.1).
- Tower placement grid — cell size per map; how "buildable tile" mask is authored (hand-edited JSON per map for now; Tiled later if maps get decoration-heavy).
- Pointer input routing details when a DOM modal is open over a live game (pause on modal vs. passthrough to HUD-only interactions).
- Tutorial prompt authoring format (inline in the first map's data vs. a separate tutorial script).
- Whether to seed the run RNG from a user-visible string (for future "daily challenge" or shared seeds) or an opaque number.

## 12. Deviations from PRD to Flag

- **Cloud save and accounts (PRD §13, §15):** explicitly out of scope for v1 per the PRD, but the save module is built with a pluggable storage adapter to make a future reversal a clean addition rather than a rewrite. This is a design affordance, not a scope change.
