# Phaseblade — RPG Game Design Document

Because *Magic: The Gathering* cards have fixed printed rules and stats (unlike creatures that mutate stats on level-up), Phaseblade translates classic monster-tamer RPG progression into **Planeswalker progression, deckbuilding constraints, Commander Bond perks, and diegetic overworld encounters** while keeping the underlying MTG rules 100% authentic.

---

## 1. Planeswalker Progression (Replacing "Monster Leveling")

### Planeswalker Level & Deck Capacity
- Players earn **Planeswalker XP** from winning duels, solving Mana Shrines, and completing quests.
- Even if a player pulls a Mythic Rare early, their deck is governed by **Deck Capacity Points** and **Format Tier**, preventing early game-breaking decks and creating meaningful progression:
  - **Rarity Costs:** Common = `0 pts`, Uncommon = `1 pt`, Rare = `3 pts`, Mythic Rare = `5 pts`.
  - **Starting Tier (0 Badges):** 40-card *Apprentice Decks*, `12` Deck Capacity Points.
  - **Badge 1 Tier:** Unlocks 60-card *Standard/Constructed Decks*, `24` Deck Capacity Points.
  - **Badge 2 Tier:** Unlocks 100-card *Commander Decks*, `45` Deck Capacity Points.
  - **Late-Game / Post-Game:** High capacity caps (`80+` pts) and unrestricted sandbox mode.

### Starter Commander & Commander Bond
- In the Professor's Lab, the player chooses one of **three signature starter Commanders** (e.g., *Aggro/Combat*, *Spellslinger/Tempo*, or *Midrange/Value*), receiving a tailored 40-card starter deck built around that Commander's color identity.
- Winning duels with your chosen Commander increases **Commander Bond (Lv. 1–10)**, unlocking passive **Planeswalker Boons** (implemented as starting emblems or state modifiers) without altering printed card text:
  - **Bond Lv. 2:** *Opening Insight* — Scry 1 at the beginning of your first upkeep.
  - **Bond Lv. 4:** *Signature Tutor* — Once per match, pay `{3}` at sorcery speed to search your library for your Commander if it's tucked/shuffled.
  - **Bond Lv. 6:** *Planar Discount* — The first Commander tax you pay each game costs `{1}` less.
  - **Bond Lv. 10:** *Ascended Foil* — Unlocks holographic showcase treatment and custom 3D entry VFX for your Commander.

### Card Transmutation & Foil Crafting
- Duplicate cards and wild skirmish drops can be dismantled into **Mana Shards**.
- At a town **Aether Forge**, players spend Mana Shards to craft missing staples or transmute basic cards into thematic upgrades (e.g., *Cancel* → *Counterspell*, *Shock* → *Lightning Bolt*) and apply cosmetic foil shaders.

---

## 2. Overworld Encounters (Replacing "Tall Grass")

### Mana Rifts & Roaming Elementals (Repeatable Wild Skirmishes)
- Off the beaten path in forests, coastlines, and ruins, visible **Mana Rifts** and wandering **Aether Constructs** roam the map.
- Touching one triggers a fast **Skirmish Duel** (`10` starting life, AI piloting a focused mono-color creature/spell deck).
- **Rewards:** Mana Shards, Commander Bond XP, and **Draft-Pick Loot** (choose 1 of 3 random cards from the elemental's decklist to add to your collection).

### Roaming Duelists & Sightline Trainers
- Classic sightline NPCs along routes with distinct archetypes:
  - *Youngsters / Scouts:* Mono-red goblins or mono-green beasts (`VeryEasy` / `Easy` AI).
  - *Academy Scholars:* Mono-blue tempo/mill or Azorius flyers (`Medium` AI).
  - *Noble Collectors:* Artifact/ramp decks that drop high Gold payouts (`Medium` / `Hard` AI).

### Ambush Mimics & Cursed Tomes
- Suspicious chests in side areas trigger surprise encounters against Horror/Artifact decks that start with a thematic permanent already on the battlefield (e.g., *Howling Mine* or *Sol Ring*).

---

## 3. Open-World Exploration & Side Activities

- **Card Capsules ("Poké Ball" Orbs):** Glowing capsules hidden behind trees, across bridges, and in town alleys containing curated build-around singles (e.g., a hidden *Lightning Bolt* behind the Route 1 waterfall).
- **Mana Shrines (1-Turn Lethal Puzzles):** Ancient obelisks aligned with W/U/B/R/G that launch a pre-configured board state where the player must find the exact 1-turn lethal sequence. Rewards rare dual lands or color-themed staples.
- **Traveling Card Traders:** Wandering NPCs offering specific barter trades (*"Trade any 3 Blue Rares for my Rhystic Study"*).
- **Tavern Draft / Sealed Arenas:** Pay Gold in major hubs to open 6 simulated 3D booster packs, build a 40-card deck, and play a 3-round mini-tournament for promo cards.
- **Evil Syndicate Outposts (*The Null Cabal*):** Story villains who lock down regions and fight with **Planar Anomaly Modifiers** (e.g., *"All creatures have Haste"* or *"Players cannot gain life"*), encouraging players to adapt their deck in the Deck Builder before challenging the Admin.

---

## 4. Gym Progression Blueprint

| Gym | Theme & Archetype | Rule / Arena Twist | Badge Unlock |
| :--- | :--- | :--- | :--- |
| **Gym 1 (Verdant Grove)** | Green Ramp & Stompy | Teaches combat math, trample, and creature removal. | **Canopy Badge** — Unlocks 60-card decks & `24` Deck Capacity. |
| **Gym 2 (Tidewater Academy)** | Blue/White Spellslinger & Control | Teaches stack timing, baiting counterspells, and instant-speed play. | **Tide Badge** — Unlocks 100-card **Commander Mode** & `45` Deck Capacity. |
| **Gym 3 (Ashen Catacombs)** | Black/Red Sacrifice & Graveyard | Teaches graveyard interaction, edict effects, and life-as-a-resource. | **Cinder Badge** — Unlocks Aether Forge advanced transmutations. |