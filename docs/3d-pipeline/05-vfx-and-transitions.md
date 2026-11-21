# 05 — Overworld VFX & Duel Transitions

Overworld VFX should feel atmospheric and tactile without competing with `phase-rs`'s existing match-board VFX (`CardVfxLayer`).

---

## 1. Atmospheric Overworld VFX

- **Window Sunbeams / God-Rays (Interiors):**
  - Place angled translucent plane/cone meshes extending from Lab/Gym windows toward the floor.
  - Use a custom additive-blended shader (`depthWrite: false`, `blending: THREE.AdditiveBlending`) combining a soft vertical fade, edge Fresnel falloff, and slow dust-band shimmer. Cost: < 0.1 ms/frame.
- **Ambient Particles:**
  - **Indoors:** `<Sparkles>` (`@react-three/drei`) or a small `Points` / instanced-quad emitter for sunlit dust motes drifting inside window beams.
  - **Outdoors:** Gentle drifting leaf/pollen sprites in towns and routes, plus subtle mana-colored motes near Gyms or planar rifts.
- **Animated Emissives:**
  - **Lab CRT Monitors & Machines:** Scrolling waveform / scanline UV offset in `useFrame` or a small fragment shader.
  - **Commander Starter Pedestals:** Rotating mana-ring decal + gentle vertical bob + color-matched point light (`W/U/B/R/G`) when the player approaches.
  - **Water (Ponds / Streams):** Normal-map dual-UV scroll + Fresnel sky reflection.

---

## 2. Encounter & Duel Transition Sequence

When the player triggers a duel (walking into an NPC's sightline, talking to Rival Lyra, or challenging a Gym Leader):

1. **`!` Alert Pop (0.0s – 0.45s):**
   - NPC plays `Surprise` animation; floating `!` badge pops above their head with a short chime.
2. **Dialogue & Stance (optional):**
   - Pre-duel challenge line plays; challenger triggers `DuelReady` clip.
3. **Camera Zoom & Transition Wipe (0.45s – 1.1s):**
   - R3F camera smoothly zooms/tilts toward the challenger while a full-screen radial/shatter shader wipe (or iris-out) transitions cleanly into `/game/:id`.
4. **Match Handoff (`GamePage.tsx`):**
   - `phase-rs`'s existing match renderer takes over (`components/board/`, `components/card/`, `components/animation/cardVfx/`, `components/animation/dice3d/`).
5. **Post-Match Return (`WaitingFor::GameOver`):**
   - On victory or defeat, `/game/:id` returns to `/world` with the match outcome so `rpgStore` can award Gold, Gym Badges, or booster packs—or trigger a post-duel cutscene.
