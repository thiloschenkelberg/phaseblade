# 02 — 3D Assets, PBR Materials & GLB Optimization

Phaseblade uses a **hybrid asset pipeline**: AI Image-to-3D for chunky characters and hero props, and modular Blender kits with scanned PBR textures for architecture and terrain.

---

## 1. Hybrid Asset Creation

### A. Chibi Characters & Hero Props (AI Image-to-3D)
Modern Image-to-3D tools excel at chunky diorama props and stylized chibi silhouettes with clean UVs and 2K PBR maps:
- **Recommended tools:** **Tripo3D**, **Meshy**, **Rodin (Hyper3D)**, or **Hunyuan3D**.
- **Best candidates:**
  - Chibi characters (Player, Prof. Aldric, Rival Lyra, Shopkeeper Torin, Gym Leaders, Evil Syndicate grunts/bosses).
  - Interior/exterior hero props (lab computers, healing/deck-tuning machines, Commander starter pedestals, delivery truck, bookshelves, town signs, gym trophies).
- **Cleanup pass in Blender:**
  - Center pivot at `(0, 0, 0)` on the floor plane (`Y = 0` is ground contact).
  - Normalize scale (`1 unit = 1 meter`; chibi character height `~1.4m`).
  - Decimate/retopologize to target triangle budget and check backface normals.

### B. Modular Architecture & Terrain (Blender + Scanned PBR)
Build reusable modular pieces in **Blender** so towns, labs, shops, and gyms snap together cleanly:
- **Interiors:** Cutaway outer walls (`2.8m`–`3.2m` tall, dark outer trim), beveled floor slabs, window frames that let directional light enter, interior doorframes.
- **Exteriors:** House bases, pitched terracotta roofs with ridge caps & chimneys, cobblestone road straight/corner/T-junction tiles, wooden fences, Route gate archways.
- **Scanned PBR Sources:** **AmbientCG** (CC0), **Poly Haven** (CC0), **Fab / Quixel**.
  - *Interior Lab:* Glossy beveled ceramic floor tiles, warm oak wood grain (bookshelves/desks), matte painted plaster walls.
  - *Exterior Town:* Weathered terracotta roof tiles, worn cobblestone with normal/AO depth, mossy stone walls.

---

## 2. PBR Material & Channel Packing

- Pack **Ambient Occlusion (R)**, **Roughness (G)**, and **Metallic (B)** into a single **ORM** texture when authoring custom materials in Blender (`glTF 2.0` standard `occlusionRoughnessMetallicTexture`), cutting texture reads per material.
- Keep **albedo** sRGB and **normal / roughness / metallic / AO** linear.
- For tileable terrain/floor materials, set `wrapS = wrapT = THREE.RepeatWrapping` and match world-space texel density (`~512 px/m` for floors, `~256 px/m` for large terrain).

---

## 3. Browser Optimization (`gltf-transform`)

Every `.glb` placed in `client/public/models/` must be compressed with `@gltf-transform/cli` so total asset payloads stay fast over the web:

```bash
#!/usr/bin/env bash
# scripts/optimize-glb.sh <input.glb> <output.glb>
set -euo pipefail

IN="$1"
OUT="$2"

npx @gltf-transform/cli optimize "$IN" "$OUT" \
  --compress meshopt \
  --texture-compress webp \
  --texture-size 1024
```

- Use **`meshopt`** (fast decode on the main thread, great for both static and skinned meshes) or **`draco`** for large static architecture.
- Use **`webp`** for rapid iteration or **`ktx2`** (Basis Universal UASTC/ETC1S) for production GPU-compressed VRAM savings (requires `KTX2Loader` + basis transcoder in `client/public/basis/`).
- Strip unused vertex attributes, tangents (unless normal maps require them), and duplicate materials during `optimize`.

---

## 4. Target Asset Budgets

| Asset Class | Max Triangles | Max Texture Size | Notes |
|---|---:|---:|---|
| Chibi Character | 2,000 – 5,000 | 1024×1024 | Single material/atlas preferred |
| Hero Prop | 800 – 2,500 | 1024×1024 | Combine static sub-parts |
| Standard Prop | 300 – 1,000 | 512×512 | Reuse shared wood/metal materials |
| Modular Building / Room | 500 – 2,500 | 1024×1024 – 2048×2048 | UV2 reserved for baked lightmaps |
| Foliage Card / Grass Blade | 12 – 40 | 512×512 | Rendered via `InstancedMesh` |
