# Phaseblade WASM Bridge Specification

This document specifies the contract between the browser frontend and `crates/engine-wasm` (`engine_wasm`), extracted from the upstream `phase-rs/phase` client adapter layer before pruning `client/`.

---

## 1. Architecture & Web Worker Lifecycle

1. **Single-Worker Ownership:** A dedicated Web Worker owns the single `engine_wasm` instance and its loaded `CardDatabase`. The main thread communicates via `postMessage` and never loads WASM directly. (A second instance costs ~40 MB WASM compile and ~540 MB of WASM linear memory once `card-data.json` is loaded.)
2. **16 MiB Shadow Stack:** `.cargo/config.toml` sets `rustflags = ["-C", "link-arg=-z", "-C", "link-arg=stack-size=16777216"]` for `wasm32-unknown-unknown`. `scripts/build-wasm.sh` verifies that `engine_wasm_bg.wasm` reserves at least 200 linear-memory pages (`>= 12.5 MiB`) so deeply nested `Effect <-> AbilityDefinition` and loop-replay frames cannot overflow the browser stack.

### Initialization Sequence

```ts
import init, {
  init_panic_hook,
  take_last_panic_message,
  load_card_database,
  load_combo_table,
  initialize_game,
} from "./wasm/engine_wasm";

// 1. Instantiate WASM
await init({ module_or_path: engineWasmUrl });
init_panic_hook(); // safe to call multiple times; auto-called on first use

// 2. Load card database (required before name-based deck resolution or deck queries)
const cardCount: number = load_card_database(cardDataJsonText);
if (cardCount <= 0) throw new Error("Failed to load card-data.json");

// 3. Optional: load combo table for bracket/combo estimation
// load_combo_table(comboTableJsonText);

// 4. Initialize game
const result = initialize_game(
  deckData,       // DeckList | null (null/undefined -> empty libraries)
  seed,           // number | null | undefined
  formatConfig,   // FormatConfig | null | undefined (defaults to Standard)
  matchConfig,    // MatchConfig | null | undefined (defaults to Bo1)
  playerCount,    // number | null | undefined (defaults to 2)
  firstPlayer,    // 0 = human first, 1 = opponent first, null/undefined = random
);
```

### Initialization Error Envelope

`initialize_game` and `initialize_multiplayer_host_game` return either `{ events, log_entries }` on success or an error envelope `{ error: true, reasons: string[], cedh_bracket_violation?: boolean, engine_occupied?: boolean }`:

```ts
export type InitFailureKind = "bracketViolation" | "engineOccupied" | "deckValidation";

export function classifyInitFailure(result: unknown) {
  if (!result || typeof result !== "object" || !("error" in result) || !result.error) {
    return null;
  }
  const env = result as {
    reasons?: string[];
    cedh_bracket_violation?: boolean;
    engine_occupied?: boolean;
  };
  const reasons = env.reasons ?? [];
  if (env.engine_occupied) {
    return { kind: "engineOccupied" as const, message: "Finish or leave your current game before starting a new one.", reasons };
  }
  const message = `Deck validation failed: ${reasons.join("; ")}`;
  if (env.cedh_bracket_violation) {
    return { kind: "bracketViolation" as const, message, reasons };
  }
  return { kind: "deckValidation" as const, message, reasons };
}
```

### Panic & State-Loss Handling

- If `submit_action` returns a `string` starting with `"NOT_INITIALIZED:"`, the thread-local `GAME_STATE` was lost (e.g., worker restart or prior WASM trap).
- Call `take_last_panic_message()`: if non-null, classify as `ENGINE_PANIC` (non-recoverable by retry); otherwise classify as `STATE_LOST` (recoverable via `restore_game_state(lastKnownGoodJson)` + `resume_restored_game_state()`).

---

## 2. Core Action / State Loop

### Reading State & Legal Actions

| Export | Signature | Returns | Notes |
|---|---|---|---|
| `get_game_state` | `()` | `ClientGameState` (`{ state: GameState, derived?: DerivedViews }`) | Flatten with `unwrapClientGameState` |
| `get_filtered_game_state` | `(viewer: number)` | `ClientGameState` | Redacts opponent hidden zones |
| `get_legal_actions_js` | `()` | `LegalActionsResult` | `{ actions, autoPassRecommended, spellCosts, legalActionsByObject, activationBlockReasons, ... }` |
| `get_legal_actions_for_viewer_js` | `(player_id: number)` | `LegalActionsResult` | Empty if viewer is not expected to act |
| `get_viewer_snapshot_js` | `(player_id: number)` | `ViewerSnapshot` | Single round-trip state + legal actions |
| `get_viewer_transition_snapshot_js` | `(player_id: number, events: GameEvent[])` | `ViewerTransitionSnapshot` | Snapshot + filtered events |
| `get_stack_pressure` | `()` | `"Normal" \| "Elevated" \| "Rapid" \| "Instant"` | Engine-owned animation pacing bucket |

```ts
export function unwrapClientGameState(raw: unknown): GameState {
  if (raw != null && typeof raw === "object" && "state" in raw) {
    const wrapped = raw as { state: GameState; derived?: GameState["derived"] };
    return { ...wrapped.state, derived: wrapped.derived ?? wrapped.state.derived };
  }
  return raw as GameState;
}
```

### Submitting Actions & Previews

| Export | Signature | Notes |
|---|---|---|
| `submit_action` | `(actor: number, action: GameAction)` | Returns `ActionOutcome<ActionResult>` or error string |
| `submit_interaction_js` | `(actor: number, submission: unknown)` | Opaque interaction submission |
| `preview_action_js` | `(actor: number, action: GameAction)` | Non-mutating dry-run returning public deltas |
| `preview_mana_payment_js` | `(actor: number, action: GameAction)` | Returns permanent IDs that would tap for mana |
| `legal_targets_for_castable_js` | `(object_id: number)` | Target slot preview for a castable spell |
| `legal_targets_for_castables_js` | `(object_ids: number[])` | Batch target preview (single layers flush) |

### Persistence, Undo & Lifecycle

| Export | Signature | Notes |
|---|---|---|
| `export_game_state_json` | `()` -> `string` | Serialize live `GameState` |
| `restore_game_state` | `(json_str: string)` -> `void` | Restore snapshot (single-player only) |
| `resume_restored_game_state` | `()` -> `RestoredGameStateResult` | Explicitly drives persisted stack automation after restore |
| `clear_game_state` | `()` -> `void` | Reset between sessions without dropping `CARD_DB` |
| `ping` | `()` -> `string` | Liveness check |

---

## 3. AI Proposal Flow & Difficulty Labels

The engine uses an authority-bound capability token (`AiActionProposal`) so untrusted or stale AI outputs cannot mutate state:

1. **Single-worker synchronous flow:**
   - `const proposal: AiActionProposal = get_ai_action_proposal(difficulty, playerId);`
   - `const outcome = submit_ai_action_proposal(proposal.token, proposal.actor, proposal.action);`
   - Fallback without rollout search: `get_ai_tactical_action_proposal(difficulty, playerId)`.
2. **Parallel worker-pool flow:**
   - Main worker exports subset via `build_ai_card_subset()` and state via `export_game_state_json()`.
   - AI score workers call `get_ai_scored_candidates(difficulty, playerId, rngSeedBigInt)`.
   - Main worker rebinds scores to an authoritative proposal via `get_ai_action_proposal_from_scores(scoresJson, difficulty, playerId, rngSeedBigInt)` and submits with `submit_ai_action_proposal(...)`.

### Accepted Difficulty Labels (`AiDifficulty::from_label` in `crates/phase-ai/src/config.rs`)

Case-insensitive; unknown strings fall back to `"Medium"`:
- `"VeryEasy"`
- `"Easy"`
- `"Medium"`
- `"Hard"`
- `"VeryHard"`
- `"CEDH"` (bypasses 4-player paranoid scaling via `PodScaling::PodCalibrated`)

---

## 4. Stateless Card, Deck & Format Queries

All queries below are read-only and never mutate `GameState`:

| Export | Needs `CARD_DB` | Purpose |
|---|---|---|
| `search_cards_js(query)` | Yes | Card search (format legality, set, types, mana value, colors) -> `{ results, total }` |
| `get_card_face_data(name)` | Yes | Serialized `CardFace` (keywords, abilities, triggers, types, oracle text) |
| `get_card_parse_details(name)` | Yes | Hierarchical `ParsedItem` AST + per-item `supported: bool` |
| `get_card_rulings(name)` | Yes | Official WotC rulings `{ date, text }[]` |
| `canonicalCardNames(names)` | Yes | Index-aligned canonical printed names |
| `classify_deck_js(names)` | Yes | `{ archetype, confidence: "Pure" \| "Hybrid", secondary? }` |
| `evaluate_deck_compatibility_js(req)` | Yes | Format legality & BO3 readiness |
| `evaluateDeckFormatGate(req)` | Yes | Enforcing `{ compatible: boolean, reasons: string[] }` |
| `maxDeckCopies(name, formatConfig)` | Yes | `{"type": "Unlimited"}` or `{"type": "UpTo", "data": N}` |
| `is_card_commander_eligible(name)` | Yes | CR 903.3 commander eligibility |
| `isCardCommanderEligibleForFormat(name, format)` | Yes | Format-specific command-zone eligibility |
| `commanderPartnerCandidates(first, candidates, draftSetCodes)` | Yes | CR 702.124 partner pairing filter |
| `companionCandidates(request)` | Yes | Legal companion candidates |
| `isCardCompanion(name)` | Yes | CR 702.139a Companion check |
| `getFormatRegistry()` | No | Authoritative `FormatMetadata[]` (pickers & `default_config`) |
| `sideboardPolicyForFormat(formatConfig)` | No | `{"type": "Forbidden" \| "Unlimited"}` or `{"type": "Limited", "data": N}` |
| `bestOfThreeCeilingForFormat(format)` | No | Max match structure for format |
| `deckSupplyForFormat(format)` | No | Who supplies the deck |
| `list_token_presets_js()` | No | Predefined token catalog from `known-tokens.toml` |

---

## 5. Core TypeScript Types (from `client/src/adapter/types.ts`)

```ts
export type ObjectId = number;
export type CardId = number;
export type PlayerId = number;

export type Phase =
  | "Untap"
  | "Upkeep"
  | "Draw"
  | "PreCombatMain"
  | "BeginCombat"
  | "DeclareAttackers"
  | "DeclareBlockers"
  | "CombatDamage"
  | "EndCombat"
  | "PostCombatMain"
  | "End"
  | "Cleanup";

export type Zone =
  | "Library"
  | "Hand"
  | "Battlefield"
  | "Graveyard"
  | "Stack"
  | "Exile"
  | "Command";

export type MatchType = "Bo1" | "Bo3";
export type MatchPhase = "InGame" | "BetweenGames" | "Completed";

export interface MatchConfig {
  match_type: MatchType;
  loop_detection?: "Off" | "On";
}

export interface PlayerDeckList {
  main_deck: string[];
  sideboard: string[];
  commander: string[];
  planar_deck: string[];
  scheme_deck: string[];
  contraption_deck: string[];
  sticker_sheets: string[];
  signature_spell: string[];
  bracket_tier: string | null;
  combo_declaration?: unknown;
  printings?: Array<{
    section: string;
    name: string;
    count: number;
    printing: { set_code: string; collector_number: string };
  }>;
}

export interface DeckList {
  player: PlayerDeckList;
  opponent: PlayerDeckList;
  ai_decks: PlayerDeckList[];
  ai_difficulties: string[];
}

export interface FormatConfig {
  format: string;
  starting_life: number;
  min_players: number;
  max_players: number;
  deck_size: unknown;
  singleton: boolean;
  command_zone: boolean;
  commander_damage_threshold: number | null;
  poison_counter_threshold: number | null;
  range_of_influence: unknown | null;
  team_based: boolean;
  sideboard_policy: { type: "Forbidden" } | { type: "Limited"; data: number } | { type: "Unlimited" };
  uses_commander: boolean;
  supplies_fixed_deck?: boolean;
  default_deck_copy_limit: { type: "Unlimited" } | { type: "UpTo"; data: number };
  allow_debug_actions: boolean;
  custom_rules?: unknown | null;
}

export type TargetRef = { Object: ObjectId } | { Player: PlayerId };

export interface GameObject {
  id: ObjectId;
  card_id: CardId;
  owner: PlayerId;
  controller: PlayerId;
  zone: Zone;
  display_visible_to_viewer?: boolean;
  tapped: boolean;
  face_down: boolean;
  flipped: boolean;
  transformed: boolean;
  damage_marked: number;
  dealt_deathtouch_damage: boolean;
  attached_to: { type: "Object"; data: ObjectId } | { type: "Player"; data: PlayerId } | null;
  attachments: ObjectId[];
  paired_with?: ObjectId | null;
  counters: Record<string, number>;
  name: string;
  power: number | null;
  toughness: number | null;
  loyalty: number | null;
  card_types: unknown;
  mana_cost: unknown;
  keywords: unknown[];
  abilities: unknown[];
  color: string[];
  has_summoning_sickness?: boolean;
  is_token?: boolean;
  is_commander?: boolean;
  printed_ref?: { oracle_id: string; face_name: string } | null;
  [key: string]: unknown;
}

export interface Player {
  id: PlayerId;
  life: number;
  has_no_life_total?: boolean;
  poison_counters: number;
  mana_pool: unknown;
  library: ObjectId[];
  hand: ObjectId[];
  graveyard: ObjectId[];
  has_drawn_this_turn: boolean;
  lands_played_this_turn: number;
  turns_taken: number;
  is_eliminated?: boolean;
  energy?: number;
  [key: string]: unknown;
}

export interface StackEntry {
  id: ObjectId;
  source_id: ObjectId;
  controller: PlayerId;
  kind:
    | { type: "Spell"; data: { card_id: CardId; ability?: unknown; actual_mana_spent?: number } }
    | { type: "ActivatedAbility"; data: { source_id: ObjectId; ability: unknown } }
    | { type: "TriggeredAbility"; data: { source_id: ObjectId; ability: unknown; description?: string; source_name?: string } }
    | { type: "KeywordAction"; data: { action: unknown } }
    | { type: "CombatDamage"; data: { sub_step: "FirstStrike" | "Regular"; assignments: unknown[] } };
}

export type WaitingFor =
  | { type: "Priority"; data: { player: PlayerId } }
  | { type: "MulliganDecision"; data: { pending: unknown[]; free_first_mulligan: boolean; declared?: unknown[] } }
  | { type: "OpeningHandBottomCards"; data: { pending: Array<{ player: PlayerId; count: number }>; reason: unknown } }
  | { type: "ManaPayment"; data: { player: PlayerId; convoke_mode?: unknown } }
  | { type: "TargetSelection"; data: { player: PlayerId; pending_cast: unknown; target_slots: unknown[]; selection: unknown } }
  | { type: "DeclareAttackers"; data: { player: PlayerId; valid_attacker_ids: ObjectId[]; valid_attack_targets?: unknown[] } }
  | { type: "DeclareBlockers"; data: { player: PlayerId; valid_blocker_ids: ObjectId[]; valid_block_targets: Record<string, ObjectId[]> } }
  | { type: "GameOver"; data: { winner: PlayerId | null } }
  | { type: string; data?: unknown };

export type GameAction =
  | { type: "PassPriority" }
  | { type: "PlayLand"; data: { object_id: ObjectId; card_id: CardId } }
  | { type: "CastSpell"; data: { object_id: ObjectId; card_id: CardId; targets: ObjectId[]; payment_mode?: unknown } }
  | { type: "ActivateAbility"; data: { source_id: ObjectId; ability_index: number; payment_mode?: unknown } }
  | { type: "DeclareAttackers"; data: { attacks: [ObjectId, unknown][]; bands?: ObjectId[][] } }
  | { type: "DeclareBlockers"; data: { assignments: [ObjectId, ObjectId][] } }
  | { type: "MulliganDecision"; data: { choice: unknown } }
  | { type: "SelectTargets"; data: { targets: TargetRef[] } }
  | { type: "ChooseTarget"; data: { target: TargetRef | null } }
  | { type: "SelectCards"; data: { cards: ObjectId[] } }
  | { type: "TapLandForMana"; data: { selection: unknown } }
  | { type: "ActivateManaSource"; data: { selection: unknown } }
  | { type: "Concede"; data: { player_id: PlayerId } }
  | { type: string; data?: unknown };

export type GameEvent = { type: string; data?: unknown };

export interface ActionResult {
  events: GameEvent[];
  waiting_for: WaitingFor;
  log_entries?: unknown[];
}

export type ActionOutcome<T> =
  | { status: "applied"; result: T; takeback?: unknown }
  | { status: "rejected"; rejection: { message: string; disposition?: string; [key: string]: unknown } };

export interface LegalActionsResult {
  actions: GameAction[];
  autoPassRecommended: boolean;
  spellCosts?: Record<string, unknown>;
  legalActionsByObject?: Record<string, GameAction[]>;
  activationBlockReasons?: Record<string, unknown[]>;
  manaPaymentShortcutActions?: GameAction[];
  endContinuousEffectOffers?: GameAction[];
  stuckDiagnostic?: { waitingForKind: string; stuckPlayers: number[] };
  viewerInteraction?: unknown;
}

export interface AiActionProposal {
  token: string;
  semanticOwner: PlayerId;
  actor: PlayerId;
  action: GameAction;
}

export interface GameState {
  turn_number: number;
  active_player: PlayerId;
  phase: Phase;
  players: Player[];
  priority_player: PlayerId;
  objects: Record<string, GameObject>;
  battlefield: ObjectId[];
  stack: StackEntry[];
  exile: ObjectId[];
  command_zone?: ObjectId[];
  combat: unknown | null;
  waiting_for: WaitingFor;
  has_pending_cast: boolean;
  derived?: unknown;
  [key: string]: unknown;
}
```
