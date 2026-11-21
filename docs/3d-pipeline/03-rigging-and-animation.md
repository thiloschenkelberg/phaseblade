# 03 — Rigging & Shared Chibi Animation

To avoid rigging and animating every NPC separately, **all humanoid characters share one base chibi skeleton**.

---

## 1. Single Shared Chibi Skeleton

- **Base Armature:** Create one clean chibi humanoid rig in **Blender** (or auto-rig the base character via **AccuRIG**, **Meshy**, or **Mixamo**, then standardize bone names in Blender):
  - `Root` → `Hips` → `Spine` → `Chest` → `Neck` → `Head`
  - `Shoulder.L/R` → `UpperArm.L/R` → `LowerArm.L/R` → `Hand.L/R`
  - `UpperLeg.L/R` → `LowerLeg.L/R` → `Foot.L/R`
- **Character Variants:**
  - Every NPC (Prof. Aldric, Rival Lyra, Shopkeeper Torin, Gym Leaders, Evil Syndicate members) and the Player is skinned to this exact bone hierarchy.
  - Modular hair, hats, backpacks, or coats can either be weight-painted onto `Head`/`Chest` or attached to bone sockets in Three.js.

---

## 2. Core Animation Set

Author **6 in-place animation clips** (no root-motion translation—movement is driven by the R3F character controller):

| Clip | Loop | Duration | Purpose |
|---|---|---:|---|
| `Idle` | Loop | 2.0s | Subtle breathing + gentle weight shift |
| `Walk` | Loop | 0.6s | Crisp bouncy chibi stride |
| `Run` | Loop | 0.45s | Faster lean-forward sprint (Shift / dash) |
| `Talk` | Loop | 1.2s | Expressive hand gestures during dialogue |
| `Surprise` | Once | 0.6s | Hop/recoil paired with the `!` encounter icon |
| `DuelReady` | Once / Hold | 0.8s | Dramatic deck-draw / battle stance before `/game/:id` |

- Export at **30 FPS** with linear/stepped or baked keyframes cleanly sampled for glTF.
- Optionally store the shared animation clips in a single `chibi-anims.glb` and load only the skin/mesh per NPC.

---

## 3. React Three Fiber Runtime Integration

- **Important Three.js rule for SkinnedMeshes:** Never reuse a `useGLTF()` scene directly across multiple instances of the same NPC or character—calling `scene.clone()` breaks skeleton bindings. Always use **`SkeletonUtils.clone(scene)`** from `three/examples/jsm/utils/SkeletonUtils.js`.
- Drive smooth state transitions (`Idle` ↔ `Walk` ↔ `Talk`) with `useAnimations` from `@react-three/drei`:

```tsx
const action = actions[currentAnim];
action?.reset().fadeIn(0.15).play();
return () => {
  action?.fadeOut(0.15);
};
```

- Pair `Walk` playback speed with actual movement velocity (`action.timeScale = speed / baseWalkSpeed`) so feet never skate across cobblestones.
