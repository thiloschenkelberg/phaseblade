import { Canvas } from "@react-three/fiber";
import { useNavigate } from "react-router";

import { STARTER_COMMANDERS, useRpgStore } from "../rpg/rpgStore";
import { OverworldScene } from "../world/OverworldScene";

export function WorldPage() {
  const navigate = useNavigate();
  const currentZone = useRpgStore((s) => s.currentZone);
  const gold = useRpgStore((s) => s.gold);
  const badges = useRpgStore((s) => s.badges);
  const starterCommanderId = useRpgStore((s) => s.starterCommanderId);
  const activeDialogue = useRpgStore((s) => s.activeDialogue);
  const advanceDialogue = useRpgStore((s) => s.advanceDialogue);
  const closeDialogue = useRpgStore((s) => s.closeDialogue);
  const chooseStarter = useRpgStore((s) => s.chooseStarter);

  const starter = STARTER_COMMANDERS.find((c) => c.id === starterCommanderId) ?? null;

  const handleChoice = (action: string) => {
    if (action.startsWith("starter:")) {
      chooseStarter(action.slice("starter:".length));
      return;
    }
    if (action.startsWith("route:")) {
      closeDialogue();
      navigate(action.slice("route:".length));
    }
  };

  const isLastLine =
    activeDialogue != null &&
    activeDialogue.lineIndex + 1 >= activeDialogue.lines.length;

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-slate-950 text-white select-none">
      <Canvas
        shadows
        camera={{ fov: 38, position: [0, 12, 14], near: 0.1, far: 100 }}
      >
        <OverworldScene />
      </Canvas>

      {/* Top-Left RPG Status HUD */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex flex-col gap-2">
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-white/15 bg-slate-950/85 px-4 py-2.5 shadow-xl backdrop-blur-md">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Location
            </div>
            <div className="text-sm font-semibold text-white">{currentZone}</div>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Gold
            </div>
            <div className="text-sm font-semibold tabular-nums text-amber-200">
              {gold} G
            </div>
          </div>
          <div className="h-7 w-px bg-white/10" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-sky-400">
              Badges
            </div>
            <div className="text-sm font-semibold tabular-nums text-sky-200">
              {badges.length} / 8
            </div>
          </div>
        </div>

        {starter && (
          <div className="pointer-events-auto inline-flex w-fit items-center gap-2 rounded-lg border border-amber-400/25 bg-slate-950/80 px-3 py-1.5 text-xs backdrop-blur-md">
            <span className="font-semibold text-amber-300">Commander:</span>
            <span className="text-slate-100">{starter.name}</span>
            <span className="text-slate-400">({starter.title})</span>
          </div>
        )}
      </div>

      {/* Top-Right Quick Navigation */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate("/deck-builder")}
          className="rounded-lg border border-white/15 bg-slate-950/85 px-3 py-2 text-xs font-semibold text-slate-200 backdrop-blur-md transition-colors hover:border-white/30 hover:bg-slate-900"
        >
          Deck Builder
        </button>
        <button
          type="button"
          onClick={() => navigate("/setup")}
          className="rounded-lg border border-indigo-400/35 bg-indigo-950/80 px-3 py-2 text-xs font-semibold text-indigo-200 backdrop-blur-md transition-colors hover:border-indigo-300/60 hover:bg-indigo-900/90"
        >
          Quick Duel
        </button>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-lg border border-white/15 bg-slate-950/85 px-3 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md transition-colors hover:border-white/30 hover:bg-slate-900"
        >
          Title Menu
        </button>
      </div>

      {/* Controls Hint */}
      {!activeDialogue && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/75 px-4 py-1.5 text-xs text-slate-300 backdrop-blur-md">
          WASD / Arrows: Move &nbsp;·&nbsp; E / Space / Click NPC: Interact
        </div>
      )}

      {/* RPG Dialogue & Starter Choice Overlay */}
      {activeDialogue && (
        <div className="absolute inset-x-0 bottom-5 z-30 mx-auto w-[min(760px,calc(100vw-2rem))] rounded-2xl border border-white/20 bg-slate-950/92 p-5 shadow-2xl backdrop-blur-lg">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-amber-300">
                {activeDialogue.speaker}
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                {activeDialogue.role}
              </span>
            </div>
            <button
              type="button"
              onClick={closeDialogue}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <p className="min-h-[3rem] text-sm leading-relaxed text-slate-100">
            {activeDialogue.lines[activeDialogue.lineIndex]}
          </p>

          {isLastLine && activeDialogue.choices && activeDialogue.choices.length > 0 ? (
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {activeDialogue.choices.map((choice) => {
                const starterOpt = choice.action.startsWith("starter:")
                  ? STARTER_COMMANDERS.find(
                      (c) => c.id === choice.action.slice("starter:".length),
                    )
                  : null;
                return (
                  <button
                    key={choice.action}
                    type="button"
                    onClick={() => handleChoice(choice.action)}
                    className="flex flex-col items-start rounded-xl border border-amber-400/30 bg-slate-900/90 p-3 text-left transition-all hover:border-amber-300 hover:bg-slate-800"
                  >
                    <span className="text-xs font-bold text-amber-200">
                      {starterOpt ? starterOpt.name : choice.label}
                    </span>
                    {starterOpt && (
                      <>
                        <span className="mt-0.5 text-[11px] font-medium text-sky-300">
                          {starterOpt.title}
                        </span>
                        <span className="mt-1.5 text-[11px] leading-snug text-slate-400">
                          {starterOpt.description}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={advanceDialogue}
                className="rounded-lg border border-amber-400/40 bg-amber-500/20 px-4 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/30"
              >
                {isLastLine ? "Done" : "Next ▶"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
