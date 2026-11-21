# Phaseblade — Architecture & Roadmap

**Phaseblade** combines a classic Pokémon-style 3D top-down RPG adventure with real *Magic: The Gathering* duels powered by `phase-rs`. Start in your hometown, choose your starter Commander and deck from the Professor, explore towns, routes, ruins, and gyms in a modern tilted top-down 3D overworld, battle roaming duelists, rivals, an evil syndicate, and Gym Leaders to earn badges, gold, booster packs, and new cards—with full support for Commander, Standard, and other classic formats, plus multiplayer.

- **Upstream Attribution:** Forked from `phase-rs/phase` at commit `382e9c5652046c3f680cbc890f19a12851272adf` (2026-11-21, *"fix(parser): treat self-name hand reveals as a self-reveal cost (#11185)"*).
- **IP & Fan Content Notice:** Unofficial fan project built under Wizards of the Coast's Fan Content Policy. No copyrighted card artwork or rules text is bundled in source control; card metadata and imagery are fetched dynamically at build/runtime via MTGJSON and Scryfall.

---

## Visual & Gameplay Direction

- **3D Top-Down Overworld (`@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`):** Tilted top-down 3D environments inspired by modern Pokémon remasters (stylized low-poly/chibi 3D towns, routes, labs, card shops, shrines, and gyms, crisp directional lighting, tilt-shift depth of field, smooth camera follow, animated NPCs, and exclamation-mark duel triggers).
- **3D Showcase Moments:** Interactive 3D booster pack openings (tear-open foil shader, physics card fanning, rare/mythic bloom bursts) and 3D holographic card inspection in the Deck Builder and shops.
- **Preserved MTG Match Engine (`client/src/pages/GamePage.tsx`):** Reuses `phase-rs`'s authoritative match board, stack/priority controls, VFX overlays, 3D dice/coins, single-player AI, and multiplayer adapters—with light HUD/theme adjustments so transitioning from the 3D overworld into an MTG duel feels seamless.
- **Single-Player Campaign + Multiplayer:** Full single-player RPG campaign wrapped around `/game/:id`, while keeping `phase-rs`'s multiplayer/PvP lobbies (`phase-server`, `lobby-broker`, P2P WebRTC adapters) intact.

---

## Core Architecture

### 1. Rust/WASM Rules Engine & AI (`crates/`)
- **`engine` (`phase-engine`), `engine-wasm`, `phase-ai`, `phase-parser`, `phase-ast`, `state-codec`, `seat-reducer`:** Authoritative MTG rules engine, Oracle parser, and `AiDifficulty` rungs (`VeryEasy`, `Easy`, `Medium`, `Hard`, `VeryHard`, `CEDH`). See [`WASM-BRIDGE.md`](WASM-BRIDGE.md).
- **`phase-server`, `server-core`, `lobby-broker`, `lobby-worker/`:** Retained for multiplayer PvP/co-op modes.

### 2. Overworld 3D RPG Layer (`client/src/world/` & `client/src/rpg/`)
- **3D World Renderer (`@react-three/fiber`):** Chunk/tile-based 3D maps (Hometown, Professor's Lab, Routes, Card Shops, Mana Shrines, Gyms, Evil Syndicate Hideout), tilted-perspective camera rig, player controller (WASD/Arrows + click/tap-to-move), NPC sightlines & interaction triggers, and zone lighting/postprocessing.
- **RPG State & Progression (`rpgStore` + `IndexedDB`/`localStorage`):** Player coordinates/map ID, story flags & quest states, starter Commander choice, Planeswalker Level & Deck Capacity cap, Commander Bond XP/perks, earned Gym Badges, gold & Mana Shards, card collection/binder, and defeated trainers.
- **Dialogue & Event System:** RPG dialogue boxes, NPC portraits, starter-selection sequence, Gym Leader pre/post-duel cutscenes, Card Shop / Trader UI, and 3D booster-pack opening modal.

### 3. Seamless Overworld ↔ Match Bridge (`client/src/App.tsx` + `GamePage.tsx`)
- The overworld route (`/world`) triggers an encounter transition (camera zoom / battle wipe) and launches `/game/:id` configured with the encounter's `DeckList`, `FormatConfig` (40-card Apprentice, 60-card Standard, or 100-card Commander), starting life, optional boss/shrine modifiers, and `AiDifficulty`.
- On `WaitingFor::GameOver { winner }`, routes cleanly back to `/world` with victory/defeat resolution (awarding badges, boosters/cards, gold, Mana Shards, Commander Bond XP, advancing story flags, or respawning at the hometown Sanctuary on defeat).

---

## Key Commands

```bash
# Build WASM module (outputs to client/src/wasm)
./scripts/build-wasm.sh
./scripts/build-wasm.sh release   # Size-optimized + wasm-opt

# Fetch MTGJSON & generate client/public/card-data.json
./scripts/gen-card-data.sh

# Start the React/Vite client dev server (localhost:5173)
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
- Verify the local `client/` dev server, `engine-wasm`, and `card-data.json` pipeline.
- Install `@react-three/fiber`, `@react-three/drei`, and `@react-three/postprocessing` in `client/` (matching the installed React major version).
- Reskin `AppShell` & `MenuPage` with Phaseblade's RPG-first navigation (**Continue Adventure**, **New Adventure**, **Quick Duel**, **Deck Builder**, **Multiplayer**).

### Milestone 2 — 3D Top-Down Overworld & Hometown Vertical Slice
- Build the tile/zone 3D renderer, tilted camera, player movement & collision, and NPC interaction + dialogue system.
- Implement Hometown + Professor's Lab starter-Commander selection + Route 1 with 1–2 roaming duelists and a Mana Rift encounter.

### Milestone 3 — Overworld ↔ MTG Duel Loop & Progression
- Wire the encounter transition into `/game/:id` (supporting 40-card, 60-card, and Commander formats).
- Handle `GameOver` return to `/world`, persistent RPG save state, rewards (gold, Mana Shards, single cards, 3D booster packs), Card Shop, and Deck Builder synced with the player's collection and Deck Capacity rules.

### Milestone 4 — Gyms, Badges, Evil Syndicate & Multiplayer
- Implement Gym 1 (trainers + Mana Shrine puzzle + Gym Leader boss match + Badge unlock) and the rival / Evil Syndicate story arc.
- Light HUD reskin of `GamePage` to unify it with Phaseblade's aesthetic.
- Wire optional multiplayer duel hubs / PvP challenges using the retained multiplayer adapters and `phase-server`.