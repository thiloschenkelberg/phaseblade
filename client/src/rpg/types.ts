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