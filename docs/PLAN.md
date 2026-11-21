# Phaseblade Architecture & Roadmap

Phaseblade combines a classic Pokémon-style RPG adventure with real *Magic: The Gathering* duels powered by `phase-rs`. Start in your hometown, choose your starter Commander and deck from the Professor, explore towns, routes, and gyms in a modern tilted top-down 3D overworld, battle roaming duelists, rivals, an evil syndicate, and Gym Leaders to earn badges, gold, booster packs, and new cards—with full support for Commander, Standard, and other classic formats, plus multiplayer.

- **Upstream Attribution:** Forked from `phase-rs/phase` at commit `382e9c5652046c3f680cbc890f19a12851272adf` (2026-11-21, *"fix(parser): treat self-name hand reveals as a self-reveal cost (#11185)"*).

---

## Visual & Gameplay Direction

- **3D Top-Down Overworld (`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`):** Tilted top-down 3D environments inspired by modern Pokémon remasters (stylized low-poly/chibi 3D towns, routes, labs, card shops, and gyms, crisp lighting, tilt-shift depth, smooth camera follow, animated NPCs, and exclamation-mark duel triggers).
- **Reused MTG Match Experience (`client/src/pages/GamePage.tsx`):** Preserves `phase-rs`'s polished match board, cards, VFX overlays, 3D dice/coins, single-player AI, and multiplayer adapters—with light HUD/theme adjustments so transitioning from the 3D overworld into an MTG duel feels cohesive.
- **Single-Player Story + Multiplayer:** Full single-player RPG campaign around `/game/:id`, while keeping `phase-rs`'s multiplayer/PvP lobbies (`phase-server`, `lobby-broker`, P2P adapters) available.

---

## Core Architecture (How Overworld + MTG Engine Connect)

### 1. Rust/WASM Rules Engine & AI (`crates/`)
- **`engine` (`phase-engine`), `engine-wasm`, `phase-ai`, `phase-parser`, `phase-ast`:** Untouched authoritative MTG rules engine, Oracle parser, and `AiDifficulty` rungs (`VeryEasy`, `Easy`, `Medium`, `Hard`, `VeryHard`, `CEDH`). See [WASM-BRIDGE.md](WASM-BRIDGE.md).
- **`phase-server`, `server-core`, `lobby-broker`, `lobby-worker/`:** Retained for multiplayer PvP/co-op modes.

### 2. Overworld 3D RPG Layer (new `client/src/world/` & `client/src/rpg/`)
- **3D Scene (`@react-three/fiber`):** Tile/chunk-based 3D maps (Hometown, Professor's Lab, Routes, Card Shops, Gyms, Evil Syndicate Hideout), tilted-perspective camera, player controller (WASD/Arrows + click-to-move), NPC sightlines & interaction triggers, and zone lighting.
- **RPG State & Progression (`rpgStore` + IndexedDB/`localStorage`):** Player position/map, story flags & quest state, starter Commander choice, earned Gym Badges, gold/currency, card collection & unlocked decks, defeated trainers, rival & evil-faction story arcs.
- **Dialogue & Event System:** RPG dialogue boxes, NPC portraits, starter-selection sequence, Gym Leader pre/post-duel cutscenes, Card Shop, and 3D booster-pack opening moments.

### 3. Seamless Overworld ↔ Match Bridge (`client/src/App.tsx` + `GamePage.tsx`)
- The overworld route (`/play` or `/world`) triggers an encounter transition (battle wipe / camera zoom) and launches `/game/:id` with the encounter's `DeckList`, `FormatConfig` (Commander, Standard, etc.), starting life, and `AiDifficulty`.
- On `WaitingFor::GameOver { winner }`, returns cleanly to the overworld with victory/defeat handling (awarding badges, boosters/cards, gold, advancing story flags, or returning to the hometown sanctuary hub on defeat).

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

### Milestone 1 — Baseline & Custom Phaseblade Shell
- Verify the local `client/` dev server, `engine-wasm`, and `card-data.json` flow.
- Install `@react-three/fiber`, `@react-three/drei`, and `@react-three/postprocessing` in `client/`.
- Reskin `AppShell` & `MenuPage` with Phaseblade's RPG-first navigation (**Continue Adventure**, **New Adventure**, **Quick Duel**, **Deck Builder**, **Multiplayer**).

### Milestone 2 — 3D Top-Down Overworld & Hometown Vertical Slice
- Build the tile/zone 3D renderer, tilted camera, player movement & collision, and NPC interaction + dialogue box.
- Implement Hometown + Professor's Lab starter-Commander selection + Route 1 with 1–2 roaming duelists.

### Milestone 3 — Overworld ↔ MTG Duel Loop & Progression
- Wire the battle transition from an NPC encounter into `/game/:id` (supporting Commander and 60-card formats).
- Handle `GameOver` return to the overworld, RPG save state, rewards (gold, cards, booster packs), Card Shop, and Deck Builder integration synced with the player's collection.

### Milestone 4 — Gyms, Badges, Evil Syndicate & Multiplayer
- Implement the first Gym (trainers/puzzle + Gym Leader boss match + Badge unlock) and rival / evil-syndicate story arc.
- Light HUD reskin of `GamePage` to unify it with Phaseblade's aesthetic.
- Wire optional multiplayer duel hubs / PvP challenges using the retained multiplayer adapters and `phase-server`.
