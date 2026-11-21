import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface StarterOption {
  id: string;
  name: string;
  title: string;
  colors: string[];
  archetype: string;
  description: string;
}

export interface DialogueChoice {
  label: string;
  action: string;
}

export interface ActiveDialogue {
  npcId: string;
  speaker: string;
  role: string;
  lines: string[];
  lineIndex: number;
  choices?: DialogueChoice[];
}

export const STARTER_COMMANDERS: StarterOption[] = [
  {
    id: "krenko",
    name: "Krenko, Mob Boss",
    title: "Red · Goblin Aggro",
    colors: ["R"],
    archetype: "Swarm & Burn",
    description: "Overwhelm opponents early by doubling your Goblin army every turn.",
  },
  {
    id: "aesi",
    name: "Aesi, Tyrant of Gyre Strait",
    title: "Blue/Green · Landfall Ramp",
    colors: ["U", "G"],
    archetype: "Ramp & Card Draw",
    description: "Accelerate lands onto the battlefield to draw cards and summon sea monsters.",
  },
  {
    id: "teysa",
    name: "Teysa Karlov",
    title: "White/Black · Aristocrats",
    colors: ["W", "B"],
    archetype: "Tokens & Sacrifice",
    description: "Double your death triggers and drain the table with relentless spirit tokens.",
  },
];

export interface RpgState {
  hasSave: boolean;
  currentZone: string;
  playerPos: [number, number];
  starterCommanderId: string | null;
  badges: string[];
  gold: number;
  defeatedTrainers: string[];
  storyFlags: Record<string, boolean>;
  activeDialogue: ActiveDialogue | null;

  startNewAdventure: () => void;
  setPlayerPos: (x: number, z: number) => void;
  openDialogue: (dialogue: ActiveDialogue) => void;
  advanceDialogue: () => void;
  closeDialogue: () => void;
  chooseStarter: (starterId: string) => void;
  resetSave: () => void;
}

const INITIAL_RPG_DATA = {
  hasSave: false,
  currentZone: "Willowbrook Town",
  playerPos: [0, 4] as [number, number],
  starterCommanderId: null as string | null,
  badges: [] as string[],
  gold: 250,
  defeatedTrainers: [] as string[],
  storyFlags: {} as Record<string, boolean>,
  activeDialogue: null as ActiveDialogue | null,
};

export const useRpgStore = create<RpgState>()(
  persist(
    (set, get) => ({
      ...INITIAL_RPG_DATA,

      startNewAdventure: () =>
        set({
          ...INITIAL_RPG_DATA,
          hasSave: true,
        }),

      setPlayerPos: (x, z) =>
        set({
          hasSave: true,
          playerPos: [x, z],
        }),

      openDialogue: (dialogue) =>
        set({
          activeDialogue: dialogue,
        }),

      advanceDialogue: () => {
        const current = get().activeDialogue;
        if (!current) return;
        if (current.lineIndex + 1 < current.lines.length) {
          set({
            activeDialogue: {
              ...current,
              lineIndex: current.lineIndex + 1,
            },
          });
        } else if (!current.choices || current.choices.length === 0) {
          set({ activeDialogue: null });
        }
      },

      closeDialogue: () => set({ activeDialogue: null }),

      chooseStarter: (starterId) =>
        set((state) => ({
          hasSave: true,
          starterCommanderId: starterId,
          storyFlags: { ...state.storyFlags, gotStarter: true },
          activeDialogue: null,
        })),

      resetSave: () => set({ ...INITIAL_RPG_DATA }),
    }),
    {
      name: "phaseblade-rpg-save-v1",
      partialize: (state) => ({
        hasSave: state.hasSave,
        currentZone: state.currentZone,
        playerPos: state.playerPos,
        starterCommanderId: state.starterCommanderId,
        badges: state.badges,
        gold: state.gold,
        defeatedTrainers: state.defeatedTrainers,
        storyFlags: state.storyFlags,
      }),
    },
  ),
);
