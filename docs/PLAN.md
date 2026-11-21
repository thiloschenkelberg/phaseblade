# Phaseblade Architecture & Roadmap

Phaseblade is a story-driven *Magic: The Gathering* experience built on top of the `phase-rs/phase` rules engine, AI, multiplayer infrastructure, and polished match UI. Rather than rebuilding the MTG match simulator from scratch, Phaseblade **reuses `phase-rs`'s match experience** (board, cards, VFX, animations, single-player AI, and multiplayer adapters) and wraps it in a **custom outer UI shell** with a **single-player & multiplayer/co-op story campaign**.

- **Upstream Attribution:** Forked from `phase-rs/phase` at commit `382e9c5652046c3f680cbc890f19a12851272adf` (2026-11-21, *"fix(parser): treat self-name hand reveals as a self-reveal cost (#11185)"*).

---

## Core Strategy: Reuse Match Engine & Match UI, Build Around It

- **Keep & Reuse:**
  - **Rules Engine & AI (`crates/engine`, `crates/engine-wasm`, `crates/phase-ai`, `crates/phase-parser`, `crates/phase-ast`):** Complete MTG Comprehensive Rules state machine, Oracle parser, and `AiDifficulty` rungs (`VeryEasy`, `Easy`, `Medium`, `Hard`, `VeryHard`, `CEDH`).
  - **Multiplayer & Server Crates (`crates/phase-server`, `crates/server-core`, `crates/lobby-broker`, `lobby-worker/`):** Retained so both solo and multiplayer/co-op modes work out of the box.
  - **Match Experience (`client/src/pages/GamePage.tsx`, `components/board/`, `components/card/`, `components/animation/cardVfx/`, `components/animation/dice3d/`, `adapter/`):** Preserved for gameplay, with only light styling/chrome adjustments to match Phaseblade's outer UI.
- **Customize & Build:**
  - **Outer UI Shell (`client/src/components/chrome/AppShell.tsx`, `client/src/pages/MenuPage.tsx`, theme tokens/styles):** Reskinned and restructured around Phaseblade's story-first navigation while keeping Quick Play, Deck Builder, and Multiplayer accessible.
  - **Story & Campaign Layer:** Data-driven chapters, encounters, dialogue/cutscenes, character portraits, progression/save state, and collection/reward loops that launch configured matches into `/game/:id` and process victory/defeat outcomes.

---

## Architectural Integration Points (`client/`)

- **Routing (`client/src/App.tsx`):**
  - `<Route element={<AppShell />}>` wraps all out-of-match pages (`/`, `/setup`, `/multiplayer`, `/my-decks`, `/deck-builder`, etc.).
  - `/game/:id` runs full-screen outside `AppShell`.
  - New story routes (e.g., `/story`, `/story/:chapterId`) live inside the custom `AppShell`, launch configured encounters into `/game/:id`, and handle post-match victory/defeat callbacks.
- **WASM Bridge (`docs/WASM-BRIDGE.md`):**
  - Reference for `engine_wasm` exports: `initialize_game`, `AiDifficulty` labels, `FormatConfig`, `DeckList`, `WaitingFor::GameOver { winner }`, and stateless card/deck queries.
- **Encounter Customization Hooks:**
  - Pre-built encounter decks (`DeckList`), custom starting life / `FormatConfig` rules, per-seat `AiDifficulty` scaling, and post-match outcome handling via `WaitingFor::GameOver`.

---

## Key Commands

```bash
# Build WASM module (outputs to client/src/wasm)
./scripts/build-wasm.sh
./scripts/build-wasm.sh release   # Size-optimized + wasm-opt

# Fetch MTGJSON & generate client/public/card-data.json
./scripts/gen-card-data.sh

# Start the React/Vite client dev server
cd client && pnpm install && pnpm run dev

# Run the multiplayer server
cargo serve

# Card coverage & engine tooling
cargo engine-inventory   # Regenerate data/engine-inventory.json
cargo coverage           # Coverage report against data/
cargo parser-gaps        # Surface near-miss Oracle parser gaps
```

---

## Phased Roadmap

### Milestone 1 — Baseline & Custom UI Shell
- Verify the local build/dev flow (`client/` dev server, `engine-wasm`, and `card-data.json`).
- Establish Phaseblade branding, theme tokens, and refactored `AppShell` + `MenuPage` navigation while keeping `/game/:id` and `/multiplayer` working cleanly.

### Milestone 2 — Story & Campaign Framework
- Design the data-driven story schema (chapters, encounter nodes, dialogue/cutscenes, character portraits, and save/progression state in IndexedDB/`localStorage`).
- Build the encounter launcher into `/game/:id` with victory/defeat return handling.

### Milestone 3 — Progression, Rewards & Deckbuilding Loop
- Add campaign card pool / collection progression, reward/booster openings, deck upgrades between encounters, and tuned AI encounter personalities.

### Milestone 4 — Match UI Polish & Multiplayer Modes
- Light styling pass on `GamePage` HUD/chrome to unify it visually with the Phaseblade shell.
- Wire multiplayer / co-op / PvP story or skirmish modes using the retained `client/src/adapter/` P2P/WebSocket adapters and `phase-server`.
