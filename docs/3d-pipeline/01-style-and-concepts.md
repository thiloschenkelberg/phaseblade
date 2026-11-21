# 01 — Style Bible & 2D Concept Workflow

The target aesthetic pairs **photorealistic miniature PBR environments** with **chunky, readable vinyl/chibi characters**. Keeping those two layers visually distinct is what makes the world feel like a handcrafted tabletop diorama.

---

## 1. The 4 Visual Pillars

1. **Material Contrast:** Architecture, terrain, and props use realistic PBR surfaces (albedo + normal + roughness + AO), while characters use smooth, low-frequency matte/satin shading with bold color blocks so they pop against detailed cobblestones and tiles.
2. **Lighting & Contact Shadows:** Crisp directional sunlight paired with soft ambient occlusion under every table, bookshelf, wheel, and character foot, plus warm window light streaking across glossy interior floors.
3. **Dense Micro-Detail in Exteriors:** Layered terracotta roof tiles, worn cobblestones with mortar depth, dense leafy tree canopies, and thousands of instanced grass blades and flower tufts.
4. **Miniature Camera Optics:** Steep 3/4 tilted perspective (`~38°` FOV), subtle tilt-shift depth of field at the top and bottom edges of the frame, selective bloom on emissive screens/crystals, and ACES Filmic tone mapping.

---

## 2. Chibi Character Proportions & Silhouette Rules

Because the camera sits at a steep 3/4 angle (`[px, 11.5, pz + 9.5]` looking at `[px, 0.5, pz]`), tiny realistic human proportions become unreadable. Lock every character to:

- **Head-to-body ratio:** `~2.2` to `2.5` heads tall (large expressive head, compact torso, stubby limbs).
- **Silhouette hooks:** Give every key character one unmistakable top-down silhouette feature visible from behind and above (e.g., Prof. Aldric's white lab coat + swept hair, Lyra's spiky hair + scarf/cape, Player's cap/visor, Evil Syndicate's dark visor/hood).
- **Color separation:** Avoid dark-on-dark outfits against dark floors or bright-green outfits on grass. Keep character saturation slightly cleaner than the surrounding environment.

---

## 3. 2D → 3D Concept Workflow

Never go straight from a text prompt to 3D for hero assets—generate a clean 2D reference first so proportions and palette stay consistent across the entire game:

1. **Characters:**
   - Use **Flux / Midjourney / GPT Image** to generate a clean **orthographic T-pose or A-pose turnaround sheet** (front, side, back) on a neutral studio background.
   - Enforce no cast shadows on the turnaround sheet so the Image-to-3D model doesn't bake shadows into the albedo texture.
2. **Hero Props (Lab Machines, Commander Pedestals, Delivery Truck, Gym Statues):**
   - Generate an isolated **3/4 isometric/studio render** on a plain background with even lighting.
3. **Zone Moodboards:**
   - Before building a new area, create a 1-frame lighting/palette reference:
     - *Willowbrook Town:* Warm morning sun, terracotta roofs, mossy cobblestone, saturated spring grass.
     - *Professor's Lab:* Cool-warm contrast—ivory beveled ceramic tiles, oak bookshelves, warm sunlit window streaks, cyan/amber CRT & machine glow.
     - *Gyms:* High-contrast thematic lighting matching the Gym Leader's mana colors (e.g., Azorius marble & gold, Rakdos forge & embers, Golgari mossy ruins).
     - *Evil Syndicate Hideout:* Steel grating, cool slate walls, harsh overhead spotlights, crimson/violet warning LEDs.
