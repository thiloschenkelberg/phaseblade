# 04 — Lighting, Shaders, Foliage & Post-Processing

This layer is what turns simple 3D geometry into the rich, tactile look of the reference screenshots.

---

## 1. Interior Lighting (Professor's Lab, Gyms, Shops)

- **Bake Indirect GI + AO in Blender (Cycles):**
  - Unwrap a second non-overlapping UV channel (**UV2**) for every static room shell and stationary furniture piece.
  - Bake Cycles **Diffuse Indirect + Ambient Occlusion** (excluding direct sun so dynamic character shadows still work) into a `1024×1024` or `2048×2048` lightmap texture.
  - Assign it to `material.lightMap` (`lightMapIntensity: 1.0–1.3`) in Three.js. This gives soft bounce light in corners and under bookshelves at almost zero GPU cost.
- **Direct Sun & Window Streaks:**
  - Place a single shadow-casting `directionalLight` outside the room's windows (`shadow-mapSize={[2048, 2048]}`, tight frustum around the active room, `shadow-bias={-0.0004}`).
  - Add `<Environment preset="apartment" />` (or a custom compact `.hdr` in `client/public/env/`) at low intensity (`environmentIntensity={0.35}`) for crisp specular reflections.
- **Glossy Lab Floor (`MeshPhysicalMaterial`):**
  - Use tiled ceramic normal + roughness maps (`roughness: 0.25–0.35`) with `clearcoat: 0.35` and `clearcoatRoughness: 0.15` so window sunlight streaks realistically across the floor tiles.
- **Emissive Monitors & Pedestals:**
  - Set `emissive` color + `emissiveIntensity={1.8}` (with `toneMapped={false}` on bright screens/crystals) so selective `Bloom` creates a natural glow without washing out the room.

---

## 2. Exterior Lighting & Foliage (Towns, Routes)

- **Sun & Sky:**
  - Warm `directionalLight` (`#fff7ed`, intensity `1.8–2.2`) + `hemisphereLight` (`#bae6fd` sky, `#14532d` ground bounce) + `<Environment>` IBL.
- **Instanced Grass & Flowers (`THREE.InstancedMesh`):**
  - Scatter 3,000–10,000 grass blades and flower tufts per town/route chunk using `THREE.InstancedMesh` (1 draw call per mesh type).
  - Add a lightweight vertex wind-sway displacement via `onBeforeCompile` or Three.js **TSL** node materials (`three@0.184`), pinning the blade base (`uv.y == 0`) and swaying the tip with world-space sine waves.
- **Lush Tree Canopies:**
  - Build tree crowns from overlapping leaf-cluster cards or sculpted metaball-style foliage blobs with alpha-tested leaf textures and **transferred spherical normals** (normals pointing outward from the canopy center) so lighting wraps softly instead of looking like flat crossed planes.

---

## 3. Post-Processing Stack (`@react-three/postprocessing` + `n8ao`)

Add `<EffectComposer multisampling={4}>` inside `WorldPage.tsx`:

1. **`N8AO`:** High-speed screen-space ambient occlusion (`aoRadius={0.6}`, `intensity={1.5}`) — grounds every foot, truck tire, flower pot, and wall corner.
2. **`Bloom`:** `luminanceThreshold={1.0}`, `mipmapBlur`, `intensity={0.45}` — catches only HDR emissives (`> 1.0`) like CRT monitors, healing pods, and Commander pedestals.
3. **`DepthOfField`:** Subtle tilt-shift miniature blur (`focusRange={0.12}`, `bokehScale={2.2}`) tuned to keep the player and nearby NPCs razor-sharp while softening the far top/bottom edges.
4. **`ToneMapping` (`ToneMappingMode.ACES_FILMIC`)** + subtle **`Vignette`** (`darkness={0.35}`).

### Quality Presets (Expose in Settings)
- **High:** `N8AO` + `Bloom` + `DepthOfField` + `2048` shadows + full grass density.
- **Medium:** `N8AO` (half-res) + `Bloom` + `1024` shadows + 50% grass density.
- **Low:** No post-processing (native `ACESFilmicToneMapping` on `<Canvas>`), `512` shadows, 25% grass density.
