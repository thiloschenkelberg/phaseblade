# Phaseblade — Overworld & Match Bridge Spec

This document defines the module layout and data contracts connecting the new 3D RPG overworld (`client/src/world/`, `client/src/rpg/`) to `phase-rs`'s existing match engine (`client/src/pages/GamePage.tsx` and `engine-wasm`).

---

## 1. Directory Structure (`client/src/`)

```text
client/src/
├── world/                  # React Three Fiber 3D overworld & showcase scenes
│   ├── OverworldCanvas.tsx # R3F <Canvas>, lighting, tilt-shift postprocessing, camera rig
│   ├── PlayerController.tsx# Grid/continuous movement, collision checks, interaction raycast
│   ├── MapChunk.tsx        # Stylized low-poly ground tiles, buildings, water, trees, props
│   ├── NpcEntity.tsx       # Chibi/stylized NPCs, sightline cones, "!" alert indicator
│   ├── ManaRiftEntity.tsx  # Animated roaming encounter orbs
│   └── BoosterPack3D.tsx   # 3D pack tear-open shader, card fan, and rare bloom scene
├── rpg/                    # Campaign state, maps, encounters, and progression rules
│   ├── rpgStore.ts         # Persistent RPG state (Zustand/Context + IndexedDB/localStorage)
│   ├── maps/               # Map definitions (tiles, collision bitmasks, warps, NPC spawns)
│   │   ├── hometown.ts
│   │   ├── professorsLab.ts
│   │   └── route01.ts
│   ├── encounters.ts       # Trainer decks, AI difficulty presets, modifiers, loot tables
│   ├── deckCapacity.ts     # Rarity point calculator & badge/level validation
│   └── dialogue.ts         # Branching dialogue trees, shop inventories, starter selection
├── pages/
│   ├── MenuPage.tsx        # Reskinned RPG-first main menu
│   ├── WorldPage.tsx       # Hosts <OverworldCanvas/> + RPG HUD, Dialogue, Shop, Pack Opener
│   └── GamePage.tsx        # Preserved phase-rs match screen with RPG return hook
└── wasm/                   # Compiled engine-wasm bindings (see WASM-BRIDGE.md)
```

---

## 2. Core TypeScript Interfaces (`client/src/rpg/types.ts`)

```typescript
export type AiDifficulty =
  | 'VeryEasy'
  | 'Easy'
  | 'Medium'
  | 'Hard'
  | 'VeryHard'
  | 'CEDH';

export type EncounterKind =
  | 'duelist'
  | 'mana_rift'
  | 'gym_leader'
  | 'syndicate'
  | 'shrine_puzzle';

export interface EncounterConfig {
  id: string;
  kind: EncounterKind;
  opponentName: string;
  opponentTitle?: string;
  avatarId: string;
  format: 'Apprentice40' | 'Standard60' | 'Commander100';
  startingLife: number;
  aiDifficulty: AiDifficulty;
  opponentDeck: {
    commander?: string;
    mainboard: Record<string, number>; // Card Name -> Count
  };
  /** Optional starting emblems or preset board state for Gyms, Syndicate, or Shrines */
  boardModifiers?: string[];
  rewards: {
    gold: number;
    manaShards: number;
    planeswalkerXp: number;
    commanderBondXp: number;
    boosterPacks?: string[]; // Set codes, e.g. ['FDN', 'BLB']
    guaranteedCards?: string[];
    badgeId?: string;
    storyFlagOnWin?: string;
  };
}

export interface RpgSaveState {
  version: number;
  playerName: string;
  starterCommander: string | null;
  currentMapId: string;
  position: { x: number; z: number; facing: 'N' | 'S' | 'E' | 'W' };
  planeswalkerLevel: number;
  planeswalkerXp: number;
  commanderBondLevel: number;
  commanderBondXp: number;
  gold: number;
  manaShards: number;
  badges: string[];
  storyFlags: Record<string, boolean>;
  defeatedEncounterIds: string[];
  /** Card Name -> owned quantity (synchronized with Deck Builder collection filter) */
  collection: Record<string, number>;
  activeDeckId: string | null;
  unopenedPacks: string[];
}
```

---

## 3. Overworld ↔ Match Lifecycle (`/world` ↔ `/game/:id`)

1. **Triggering an Encounter (`WorldPage.tsx`):**
   - Player interacts with an NPC, steps into a trainer's sightline, or touches a Mana Rift.
   - `WorldPage` locks movement, plays the pre-duel dialogue + camera zoom transition, stores `activeEncounter: EncounterConfig` in `rpgStore`, and navigates to `/game/rpg-encounter`.
2. **Initializing `GamePage.tsx`:**
   - `GamePage` checks for `activeEncounter`.
   - Validates the player's active deck against `deckCapacity.ts` (or falls back to the player's current starter deck).
   - Initializes `engine-wasm` with the player's deck, `activeEncounter.opponentDeck`, `startingLife`, `format`, and `aiDifficulty`.
   - Applies any `Commander Bond` starting emblems or `boardModifiers`.
3. **Resolving `WaitingFor::GameOver { winner }`:**
   - When the WASM engine emits `GameOver`, `GamePage` displays a Phaseblade Victory/Defeat banner with a **"Return to World"** button (instead of the generic rematch screen).
   - **On Player Win:** Applies `rewards` to `RpgSaveState`, records `encounter.id` in `defeatedEncounterIds` (unless repeatable like `mana_rift`), queues any earned `unopenedPacks` to trigger `BoosterPack3D.tsx` upon arrival, persists save state, and navigates back to `/world`.
   - **On Player Loss:** Deducts a small gold penalty (or zero early game), warps `position` back to the Hometown Sanctuary, persists save state, and navigates back to `/world`.

---

## 4. Technical Guardrails for Implementation

- **React / R3F Version Compatibility:** Check `client/package.json` before installing Three.js packages—pair `@react-three/fiber@^8` with `react@18`, or `@react-three/fiber@^9` with `react@19`.
- **Single Canvas Lifecycle:** Keep `<OverworldCanvas />` mounted only on `/world` and unmount it cleanly before navigating to `/game/:id` so WebGL contexts are released and `GamePage` runs at full framerate.
- **Asset Self-Containment:** Build 3D overworld environments using procedural primitives, vertex colors, and lightweight generated textures/materials first so the repo stays fast to clone and free of heavy external 3D asset dependencies.