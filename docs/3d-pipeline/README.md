# Phaseblade 3D Asset, Animation & VFX Pipeline

This folder documents the production pipeline for Phaseblade's 3D overworld visuals: **photorealistic miniature PBR environments paired with chunky vinyl/chibi characters** (inspired by modern top-down Pokémon remasters and *Link's Awakening* dioramas), targeting 60 FPS in the browser on `three@0.184` + React Three Fiber (`@react-three/fiber` v9, `@react-three/drei` v10, `@react-three/postprocessing`, `n8ao`).

---

## Pipeline Guides

1. [01 — Style Bible & 2D Concept Workflow](01-style-and-concepts.md) — Chibi proportions, material contrast rules, 2D→3D turnaround sheets, and zone lighting/palettes.
2. [02 — 3D Assets, PBR Materials & GLB Optimization](02-assets-and-optimization.md) — Hybrid AI Image-to-3D + modular Blender kits, scanned PBR recipes, `gltf-transform` compression, and performance budgets.
3. [03 — Rigging & Shared Chibi Animation](03-rigging-and-animation.md) — Single shared armature, 6 core in-place animation clips, and R3F runtime cloning (`SkeletonUtils.clone`).
4. [04 — Lighting, Shaders, Foliage & Post-Processing](04-lighting-shaders-foliage.md) — Cycles UV2 lightmaps, glossy `MeshPhysicalMaterial` tiles, instanced wind-sway foliage, and `N8AO` + `Bloom` + `DepthOfField` + `ACES_FILMIC`.
5. [05 — Overworld VFX & Duel Transitions](05-vfx-and-transitions.md) — Window sunbeams, ambient dust/pollen particles, animated emissives, and the `!` → zoom → wipe transition into `GamePage`.

---

## Repository Directory Layout

```text
assets-src/                 # Uncompressed .blend files, AI raw exports, PBR sources (gitignored / LFS)
  characters/
  environments/
  props/
scripts/optimize-glb.sh     # gltf-transform meshopt + ktx2/webp -> client/public/models/
client/public/
  models/                   # Optimized .glb files loaded via useGLTF()
  textures/                 # Tileable PBR sets (cobblestone, lab-tile, terracotta, grass)
  env/                      # Compact .hdr/.exr environment maps for IBL
```

---

## Summary Performance Budgets

| Asset Class | Triangle Budget | Texture Resolution | Compression |
|---|---:|---:|---|
| Chibi Character (Player / NPC) | 2,000 – 5,000 | 512×512 – 1024×1024 | Meshopt + WebP/KTX2 |
| Hero Prop (Lab Machine, Truck, Pedestal) | 800 – 2,500 | 512×512 – 1024×1024 | Meshopt + WebP/KTX2 |
| Standard Prop (Bookshelf, Desk, Sign) | 300 – 1,000 | 512×512 | Meshopt + WebP/KTX2 |
| Modular Architecture Piece | 200 – 1,500 | Shared 1024×1024 / 2048×2048 | Meshopt + KTX2 |
| Instanced Grass / Flower Tuft | 12 – 40 | 256×256 – 512×512 (or vertex-colored) | `InstancedMesh` |

---

## First Visual Vertical Slice Checklist

To prove the full target look inside `/world` before scaling content production:
1. Add `@react-three/postprocessing`, `n8ao`, `<Environment>`, and `ACESFilmicToneMapping` to `client/src/pages/WorldPage.tsx`.
2. Upgrade `client/src/world/OverworldScene.tsx` with 3 real PBR texture sets (cobblestone, terracotta roof, grass), instanced wind-sway grass blades, and 1 baked Professor's Lab interior room with glossy tiles and a window sunbeam.
3. Replace the placeholder box character with 1 rigged chibi `.glb` sharing the base skeleton across Player, Prof. Aldric, and Lyra.
