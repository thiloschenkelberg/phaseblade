import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { persistedGameStateView, type PersistedGameState } from "../adapter/types";
import { useAudioContext } from "../audio/useAudioContext";
import { PreviewBadge } from "../components/chrome/PreviewBadge";
import { LoadGameStateModal } from "../components/menu/LoadGameStateModal";
import { HomeDashboard } from "../components/menu/home/HomeDashboard";
import { isDesktopTauri } from "../services/platform";
import { buildLegalAiDeckCatalog } from "../services/aiDeckCatalog";
import { saveActiveGame, saveGame, useGameStore } from "../stores/gameStore";
import { useCardDataStore } from "../stores/cardDataStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import { STARTER_COMMANDERS, useRpgStore } from "../rpg/rpgStore";

/**
 * Home route. The persistent app shell owns the scene + chrome; this page runs
 * the menu-time warmups (card DB + AI-catalog prewarm, menu audio) and renders
 * the Cards dashboard plus a thin footer (load-state, alpha note, sign-off).
 */
export function MenuPage() {
  const { t } = useTranslation("menu");
  const navigate = useNavigate();
  const [loadModalOpen, setLoadModalOpen] = useState(false);
  const cardStatus = useCardDataStore((s) => s.status);
  const lastFormat = usePreferencesStore((s) => s.lastFormat);
  const lastMatchType = usePreferencesStore((s) => s.lastMatchType);
  const hasSave = useRpgStore((s) => s.hasSave);
  const currentZone = useRpgStore((s) => s.currentZone);
  const badges = useRpgStore((s) => s.badges);
  const gold = useRpgStore((s) => s.gold);
  const starterCommanderId = useRpgStore((s) => s.starterCommanderId);
  const startNewAdventure = useRpgStore((s) => s.startNewAdventure);
  const starter = STARTER_COMMANDERS.find((c) => c.id === starterCommanderId) ?? null;
  const deckPrewarmStarted = useRef(false);
  useAudioContext("menu");

  // Warm the shared engine worker's card DB immediately so compat checks and
  // game start are instant by the time a deck-requiring action is clicked.
  useEffect(() => {
    void useCardDataStore.getState().warm();
  }, []);

  // Once warm, pre-run summary compatibility for the saved-deck + AI catalog on
  // the last-used format so the setup page's checks become cache hits.
  useEffect(() => {
    if (cardStatus !== "ready" || !lastFormat || deckPrewarmStarted.current) return;
    deckPrewarmStarted.current = true;
    void buildLegalAiDeckCatalog({
      selectedFormat: lastFormat,
      selectedMatchType: lastMatchType,
    }).catch(() => {/* prewarm is best-effort */});
  }, [cardStatus, lastFormat, lastMatchType]);

  // Load an externally-provided state (pasted JSON / exported .zip): persist
  // under a fresh gameId, record AI active-game meta, navigate into the game.
  const handleLoadState = useCallback(
    async (state: PersistedGameState) => {
      const gameId = crypto.randomUUID();
      await saveGame(gameId, state);
      saveActiveGame({ id: gameId, mode: "ai", difficulty: "Medium" });
      useGameStore.setState({ gameId });
      const playerCount = persistedGameStateView(state).players.length;
      const playersParam = playerCount > 2 ? `&players=${playerCount}` : "";
      navigate(`/game/${gameId}?mode=ai&difficulty=Medium${playersParam}`);
    },
    [navigate],
  );

  return (
    <div className="menu-scene relative flex min-h-screen flex-col overflow-hidden">
      <PreviewBadge />

      <div className="mx-auto mt-6 w-full max-w-[1180px] px-7">
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/25 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.85))] p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
                3D Overworld RPG · MTG Duels
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
                Phaseblade Adventure
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Start in Willowbrook Town, choose your starter Commander from the Professor, challenge Gym Leaders for badges, and duel across Magic formats.
              </p>
              {hasSave && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="rounded-md border border-emerald-400/30 bg-emerald-950/60 px-2 py-0.5 text-emerald-200">
                    {currentZone}
                  </span>
                  <span className="rounded-md border border-sky-400/30 bg-sky-950/60 px-2 py-0.5 text-sky-200">
                    {badges.length} / 8 Badges
                  </span>
                  <span className="rounded-md border border-amber-400/30 bg-amber-950/60 px-2 py-0.5 text-amber-200">
                    {gold} G
                  </span>
                  {starter && (
                    <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-slate-200">
                      {starter.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              {hasSave ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/world")}
                    className="rounded-xl border border-amber-300/50 bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg transition-colors hover:bg-amber-400"
                  >
                    Continue Adventure
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      startNewAdventure();
                      navigate("/world");
                    }}
                    className="rounded-xl border border-white/15 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:border-white/30 hover:bg-slate-800"
                  >
                    New Adventure
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    startNewAdventure();
                    navigate("/world");
                  }}
                  className="rounded-xl border border-amber-300/50 bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg transition-colors hover:bg-amber-400"
                >
                  Start Adventure
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <HomeDashboard />

      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center gap-4 px-7 pb-12">
        <button
          onClick={() => setLoadModalOpen(true)}
          className="flex items-center gap-2 rounded-[8px] border border-hairline-strong bg-slate-950/72 px-4 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-hairline-hover hover:bg-slate-900 hover:text-white"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-current">
            <path d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1ZM5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Z" />
          </svg>
          {t("home.load.title")}
        </button>

        <div className="max-w-md rounded-[10px] border border-ember/20 bg-amber-950/20 px-4 py-2.5 text-center text-sm text-ember-text/70">
          <span className="font-semibold text-ember-soft/90">{t("home.alpha.label")}</span>
          {t("home.alpha.message")}
        </div>

        {isDesktopTauri() && (
          <button
            onClick={() => {
              import("@tauri-apps/plugin-process").then((m) => m.exit(0));
            }}
            className="rounded-[8px] border border-hairline-strong bg-slate-950/72 px-5 py-1.5 text-xs font-medium text-fg-meta transition-colors hover:border-red-500/30 hover:bg-slate-900 hover:text-red-400"
          >
            {t("home.exit")}
          </button>
        )}

        <p className="max-w-2xl text-balance text-center text-[0.68rem] leading-5 text-slate-500/70">
          {t("shell.disclaimer")}
        </p>

        <p className="text-[11px] tracking-wide text-slate-600">made with ❤️ by matt evans :: 2026</p>
      </div>

      <LoadGameStateModal
        open={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        onLoaded={handleLoadState}
      />
    </div>
  );
}
