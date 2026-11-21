import { useEffect, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useRpgStore, type ActiveDialogue } from "../rpg/rpgStore";

interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface NpcDef {
  id: string;
  name: string;
  role: string;
  pos: [number, number];
  shirtColor: string;
  hatColor: string;
  facing: number;
}

const MAP_BOUNDS = { minX: -11, maxX: 11, minZ: -10, maxZ: 10 };

const BUILDING_COLLIDERS: ColliderBox[] = [
  // Player's House (south-west)
  { minX: -8.6, maxX: -3.4, minZ: 1.4, maxZ: 5.6 },
  // Professor's Lab (north-center)
  { minX: -3.2, maxX: 3.2, minZ: -7.2, maxZ: -3.4 },
  // Card Shop (east)
  { minX: 4.4, maxX: 9.2, minZ: -1.6, maxZ: 2.6 },
];

const NPCS: NpcDef[] = [
  {
    id: "prof-aldric",
    name: "Prof. Aldric",
    role: "Planar Researcher",
    pos: [0, -2.2],
    shirtColor: "#f8fafc",
    hatColor: "#0f766e",
    facing: 0,
  },
  {
    id: "rival-lyra",
    name: "Lyra",
    role: "Rival Duelist",
    pos: [1.5, -8.3],
    shirtColor: "#7c3aed",
    hatColor: "#f59e0b",
    facing: 0,
  },
  {
    id: "shopkeeper-torin",
    name: "Torin",
    role: "Card Merchant",
    pos: [6.5, 3.4],
    shirtColor: "#dc2626",
    hatColor: "#1e293b",
    facing: Math.PI,
  },
];

function isBlocked(x: number, z: number): boolean {
  if (
    x < MAP_BOUNDS.minX ||
    x > MAP_BOUNDS.maxX ||
    z < MAP_BOUNDS.minZ ||
    z > MAP_BOUNDS.maxZ
  ) {
    return true;
  }
  const r = 0.45;
  for (const box of BUILDING_COLLIDERS) {
    if (
      x + r > box.minX &&
      x - r < box.maxX &&
      z + r > box.minZ &&
      z - r < box.maxZ
    ) {
      return true;
    }
  }
  for (const npc of NPCS) {
    const dx = x - npc.pos[0];
    const dz = z - npc.pos[1];
    if (dx * dx + dz * dz < 0.75 * 0.75) {
      return true;
    }
  }
  return false;
}

function buildDialogueForNpc(
  npcId: string,
  starterCommanderId: string | null,
): ActiveDialogue | null {
  if (npcId === "prof-aldric") {
    if (!starterCommanderId) {
      return {
        npcId,
        speaker: "Prof. Aldric",
        role: "Planar Researcher",
        lines: [
          "Welcome to Willowbrook Town! Every great planeswalker's journey begins with a trusted Commander.",
          "I've prepared three starter decks in the lab. Choose the Commander that matches your style!",
        ],
        lineIndex: 0,
        choices: [
          { label: "Krenko, Mob Boss (Red)", action: "starter:krenko" },
          { label: "Aesi, Tyrant of Gyre Strait (Blue/Green)", action: "starter:aesi" },
          { label: "Teysa Karlov (White/Black)", action: "starter:teysa" },
        ],
      };
    }
    return {
      npcId,
      speaker: "Prof. Aldric",
      role: "Planar Researcher",
      lines: [
        "Your Commander deck is attuned and ready for battle!",
        "Head north toward Route 1 to test your mettle against Lyra and challenge the Gym Leaders.",
      ],
      lineIndex: 0,
    };
  }

  if (npcId === "rival-lyra") {
    if (!starterCommanderId) {
      return {
        npcId,
        speaker: "Lyra",
        role: "Rival Duelist",
        lines: [
          "Hey! You can't head out onto Route 1 without a deck!",
          "Talk to Prof. Aldric outside the Lab first and pick your starter Commander.",
        ],
        lineIndex: 0,
      };
    }
    return {
      npcId,
      speaker: "Lyra",
      role: "Rival Duelist",
      lines: [
        "So you finally picked your Commander! Let's see what you've got.",
        "I'm heading up Route 1 toward the first Gym—meet me for a duel when you're ready, or try a Quick Duel from the top-right menu!",
      ],
      lineIndex: 0,
      choices: [{ label: "Open Quick Duel Setup", action: "route:/setup" }],
    };
  }

  if (npcId === "shopkeeper-torin") {
    return {
      npcId,
      speaker: "Torin",
      role: "Card Merchant",
      lines: [
        "Welcome to the Willowbrook Card Shop! We stock booster packs, sleeves, and singles from across the multiverse.",
        "Win duels against trainers and Gym Leaders to earn Gold, then check back to upgrade your deck!",
      ],
      lineIndex: 0,
    };
  }

  return null;
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 1.1, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.95, 1.8, 8]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.35, 0]} castShadow>
        <coneGeometry args={[0.7, 1.3, 8]} />
        <meshStandardMaterial color="#16a34a" roughness={0.75} />
      </mesh>
    </group>
  );
}

function CharacterMesh({
  shirtColor,
  hatColor,
  bobOffset = 0,
}: {
  shirtColor: string;
  hatColor: string;
  bobOffset?: number;
}) {
  return (
    <group position={[0, bobOffset, 0]}>
      {/* Torso */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.56, 0.65, 0.36]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <sphereGeometry args={[0.28, 14, 14]} />
        <meshStandardMaterial color="#fde68a" roughness={0.6} />
      </mesh>
      {/* Hat / Cap */}
      <mesh position={[0, 1.32, 0]} castShadow>
        <cylinderGeometry args={[0.29, 0.31, 0.18, 14]} />
        <meshStandardMaterial color={hatColor} roughness={0.5} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 1.27, 0.22]} castShadow>
        <boxGeometry args={[0.38, 0.06, 0.2]} />
        <meshStandardMaterial color={hatColor} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function OverworldScene() {
  const playerPos = useRpgStore((s) => s.playerPos);
  const setPlayerPos = useRpgStore((s) => s.setPlayerPos);
  const starterCommanderId = useRpgStore((s) => s.starterCommanderId);
  const activeDialogue = useRpgStore((s) => s.activeDialogue);
  const openDialogue = useRpgStore((s) => s.openDialogue);

  const playerRef = useRef<THREE.Group>(null);
  const posRef = useRef<[number, number]>([playerPos[0], playerPos[1]]);
  const facingRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const walkTimeRef = useRef(0);
  const lastSyncRef = useRef(0);
  const [nearbyNpcId, setNearbyNpcId] = useState<string | null>(null);

  const interactWith = (npcId: string) => {
    const dlg = buildDialogueForNpc(npcId, useRpgStore.getState().starterCommanderId);
    if (dlg) openDialogue(dlg);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      keysRef.current[code] = true;

      if (code === "KeyE" || code === "Space" || code === "Enter") {
        const state = useRpgStore.getState();
        if (state.activeDialogue) {
          if (code === "Space" || code === "Enter") {
            e.preventDefault();
            state.advanceDialogue();
          }
          return;
        }
        const [px, pz] = posRef.current;
        let closest: NpcDef | null = null;
        let bestDist = 2.4 * 2.4;
        for (const npc of NPCS) {
          const dx = px - npc.pos[0];
          const dz = pz - npc.pos[1];
          const d2 = dx * dx + dz * dz;
          if (d2 < bestDist) {
            bestDist = d2;
            closest = npc;
          }
        }
        if (closest) {
          e.preventDefault();
          const dlg = buildDialogueForNpc(closest.id, state.starterCommanderId);
          if (dlg) state.openDialogue(dlg);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    let [px, pz] = posRef.current;
    let moving = false;

    if (!activeDialogue) {
      let mx = 0;
      let mz = 0;
      const k = keysRef.current;
      if (k.KeyW || k.ArrowUp) mz -= 1;
      if (k.KeyS || k.ArrowDown) mz += 1;
      if (k.KeyA || k.ArrowLeft) mx -= 1;
      if (k.KeyD || k.ArrowRight) mx += 1;

      if (mx !== 0 || mz !== 0) {
        moving = true;
        const len = Math.hypot(mx, mz);
        const speed = 5.2 * dt;
        const nx = px + (mx / len) * speed;
        const nz = pz + (mz / len) * speed;

        if (!isBlocked(nx, pz)) px = nx;
        if (!isBlocked(px, nz)) pz = nz;

        posRef.current = [px, pz];
        facingRef.current = Math.atan2(mx, mz);
        walkTimeRef.current += dt * 12;

        lastSyncRef.current += dt;
        if (lastSyncRef.current > 0.4) {
          lastSyncRef.current = 0;
          setPlayerPos(Number(px.toFixed(2)), Number(pz.toFixed(2)));
        }
      }
    }

    if (playerRef.current) {
      playerRef.current.position.set(px, moving ? Math.abs(Math.sin(walkTimeRef.current)) * 0.1 : 0, pz);
      playerRef.current.rotation.y = facingRef.current;
    }

    // Tilted Pokémon-remaster top-down camera follow
    const targetCamPos = new THREE.Vector3(px, 11.5, pz + 9.5);
    state.camera.position.lerp(targetCamPos, 1 - Math.exp(-8 * dt));
    state.camera.lookAt(px, 0.5, pz);

    // Proximity check for NPC interaction indicator
    let closestId: string | null = null;
    let bestD2 = 2.4 * 2.4;
    for (const npc of NPCS) {
      const dx = px - npc.pos[0];
      const dz = pz - npc.pos[1];
      const d2 = dx * dx + dz * dz;
      if (d2 < bestD2) {
        bestD2 = d2;
        closestId = npc.id;
      }
    }
    if (closestId !== nearbyNpcId) {
      setNearbyNpcId(closestId);
    }
  });

  const treePositions = useMemo<[number, number, number][]>(
    () => [
      [-11.5, 0, -9],
      [-11.5, 0, -5],
      [-11.5, 0, -1],
      [-11.5, 0, 3],
      [-11.5, 0, 7],
      [11.5, 0, -9],
      [11.5, 0, -5],
      [11.5, 0, -1],
      [11.5, 0, 3],
      [11.5, 0, 7],
      [-8, 0, -10.5],
      [-4.5, 0, -10.5],
      [4.5, 0, -10.5],
      [8, 0, -10.5],
    ],
    [],
  );

  return (
    <>
      <color attach="background" args={["#0b132b"]} />
      <fog attach="fog" args={["#0b132b", 26, 48]} />

      <hemisphereLight args={["#bae6fd", "#14532d", 0.75]} />
      <directionalLight
        position={[12, 18, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
      />

      {/* Lush Grass Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#22c55e" roughness={0.95} />
      </mesh>

      {/* Cobblestone Crossroads */}
      <mesh position={[0, 0.01, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.6, 18]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.015, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 2.2]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

      {/* Player's House (South-West) */}
      <group position={[-6, 0, 3.5]}>
        <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.4, 2.6, 3.4]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[3.4, 1.5, 4]} />
          <meshStandardMaterial color="#e11d48" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.85, 1.72]}>
          <boxGeometry args={[0.9, 1.7, 0.08]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <Html position={[0, 4.1, 0]} center distanceFactor={16}>
          <span className="whitespace-nowrap rounded bg-slate-950/80 px-2 py-0.5 text-[11px] font-semibold text-amber-200 border border-amber-400/30">
            Your House
          </span>
        </Html>
      </group>

      {/* Professor's Lab (North-Center) */}
      <group position={[0, 0, -5.3]}>
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.8, 3.0, 3.2]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
        </mesh>
        <mesh position={[0, 3.2, 0]} castShadow>
          <boxGeometry args={[6.2, 0.55, 3.6]} />
          <meshStandardMaterial color="#0f766e" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.0, 1.62]}>
          <boxGeometry args={[1.3, 2.0, 0.08]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.35} />
        </mesh>
        <Html position={[0, 4.1, 0]} center distanceFactor={16}>
          <span className="whitespace-nowrap rounded bg-slate-950/85 px-2.5 py-0.5 text-[11px] font-semibold text-teal-200 border border-teal-400/40">
            Prof. Aldric&apos;s Lab
          </span>
        </Html>
      </group>

      {/* Card Shop (East) */}
      <group position={[6.8, 0, 0.5]}>
        <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.0, 2.7, 3.4]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.65} />
        </mesh>
        <mesh position={[0, 2.9, 0]} castShadow>
          <boxGeometry args={[4.4, 0.5, 3.8]} />
          <meshStandardMaterial color="#2563eb" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.85, 1.9]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[3.4, 0.12, 0.9]} />
          <meshStandardMaterial color="#ef4444" roughness={0.6} />
        </mesh>
        <Html position={[0, 3.8, 0]} center distanceFactor={16}>
          <span className="whitespace-nowrap rounded bg-slate-950/80 px-2 py-0.5 text-[11px] font-semibold text-sky-200 border border-sky-400/30">
            Card Shop
          </span>
        </Html>
      </group>

      {/* Route 1 North Gate */}
      <group position={[0, 0, -9.8]}>
        <mesh position={[-1.6, 1.4, 0]} castShadow>
          <boxGeometry args={[0.45, 2.8, 0.45]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[1.6, 1.4, 0]} castShadow>
          <boxGeometry args={[0.45, 2.8, 0.45]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, 2.7, 0]} castShadow>
          <boxGeometry args={[3.8, 0.45, 0.6]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <Html position={[0, 3.5, 0]} center distanceFactor={16}>
          <span className="whitespace-nowrap rounded bg-slate-950/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 border border-emerald-400/30">
            ↑ Route 1
          </span>
        </Html>
      </group>

      {/* Border Trees */}
      {treePositions.map((pos, idx) => (
        <Tree key={idx} position={pos} />
      ))}

      {/* NPCs */}
      {NPCS.map((npc) => {
        const isNear = nearbyNpcId === npc.id;
        const needsStarterPrompt = npc.id === "prof-aldric" && !starterCommanderId;
        return (
          <group
            key={npc.id}
            position={[npc.pos[0], 0, npc.pos[1]]}
            rotation={[0, npc.facing, 0]}
            onClick={(e) => {
              e.stopPropagation();
              interactWith(npc.id);
            }}
          >
            <CharacterMesh shirtColor={npc.shirtColor} hatColor={npc.hatColor} />
            <Html position={[0, 1.9, 0]} center distanceFactor={14}>
              <div className="flex flex-col items-center gap-0.5 pointer-events-none">
                {needsStarterPrompt && (
                  <span className="animate-bounce rounded-full bg-amber-400 px-1.5 py-0.2 text-[11px] font-black text-slate-950 shadow">
                    !
                  </span>
                )}
                <span
                  className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    isNear
                      ? "bg-amber-500 text-slate-950 shadow-lg"
                      : "bg-slate-950/75 text-slate-200 border border-white/15"
                  }`}
                >
                  {isNear ? `[E] ${npc.name}` : npc.name}
                </span>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Player Character */}
      <group ref={playerRef} position={[playerPos[0], 0, playerPos[1]]}>
        <CharacterMesh shirtColor="#2563eb" hatColor="#ef4444" />
      </group>
    </>
  );
}
