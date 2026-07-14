"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text3D, Center, Float } from "@react-three/drei";
import * as THREE from "three";

// Gold/Navy palette
const GOLD = new THREE.Color(0xc9a84c);
const NAVY = new THREE.Color(0x0a1628);
const GOLD_LIGHT = new THREE.Color(0xf0d080);

function ProParticles({ count = 800 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null!);
  const mouse = useRef({ x: 0, y: 0 });

  const [positions, vel, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const phi = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 8;
      pos[i * 3] = Math.cos(theta) * r * (Math.random() > 0.5 ? 1 : -1);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = Math.sin(theta) * r * 0.5 - 3;
      vel[i * 3] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.003;
      vel[i * 3 + 2] = 0;
      phi[i] = Math.random() * Math.PI * 2;
    }
    return [pos, vel, phi];
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const px = pos[i * 3];
      const py = pos[i * 3 + 1];
      const wave = Math.sin(t * 0.5 + phases[i]) * 0.005;
      const mx = mouse.current.x * 2;
      const my = mouse.current.y * 2;
      const dx = px - mx;
      const dy = py - my;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const repel = dist < 2 ? (2 - dist) * 0.002 : 0;
      pos[i * 3] += vel[i * 3] + wave + (dx / dist) * repel;
      pos[i * 3 + 1] += vel[i * 3 + 1] + wave + (dy / dist) * repel;
      pos[i * 3 + 2] += vel[i * 3 + 2];
      // Wrap around
      if (pos[i * 3] > 10) pos[i * 3] = -10;
      if (pos[i * 3] < -10) pos[i * 3] = 10;
      if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = -6;
      if (pos[i * 3 + 1] < -6) pos[i * 3 + 1] = 6;
    }
    geometry.attributes.position.needsUpdate = true;
    if (mesh.current) {
      mesh.current.rotation.y = Math.sin(t * 0.08) * 0.15;
    }
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        color={GOLD}
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
}

function ConcentricRings() {
  const group = useRef<THREE.Group>(null!);

  const rings = useMemo(() =>
    [4, 6, 8, 10, 12].map((r, i) => ({
      r,
      segments: 64,
      opacity: 0.12 - i * 0.018,
      phase: (i / 5) * Math.PI * 2
    })), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.z = t * 0.03;
    }
  });

  return (
    <group ref={group} position={[0, 0, -5]}>
      {rings.map(({ r, segments, opacity, phase }, i) => {
        const geo = new THREE.RingGeometry(r - 0.04, r, segments);
        return (
          <mesh key={i} geometry={geo} rotation-x={-Math.PI / 2.5} position={[0, -1, 0]}>
            <meshBasicMaterial
              color={i % 2 === 0 ? GOLD : NAVY}
              transparent
              opacity={opacity}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function GoldenRays() {
  const group = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.z = clock.getElapsedTime() * 0.12;
    }
  });

  return (
    <group ref={group} position={[0, 0, -4]}>
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const len = 3 + (i % 3) * 1.5;
        const geo = new THREE.PlaneGeometry(0.04, len);
        return (
          <mesh
            key={i}
            geometry={geo}
            position={[Math.cos(angle) * len * 0.5, Math.sin(angle) * len * 0.5, 0]}
            rotation-z={angle + Math.PI / 2}
          >
            <meshBasicMaterial color={GOLD_LIGHT} transparent opacity={0.07} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

function MouseSparkles() {
  const mesh = useRef<THREE.Points>(null!);
  const mouse = useRef({ x: 0, y: 0 });
  const { camera } = useThree();

  const COUNT = 60;
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const lifetimes = useMemo(() => {
    const arr = new Float32Array(COUNT);
    arr.fill(-1);
    return arr;
  }, []);
  const vels = useMemo(() => new Float32Array(COUNT * 3), []);
  const cursor = useRef(0);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.current.x = nx * 7;
      mouse.current.y = ny * 4;
      // Spawn sparkles
      for (let k = 0; k < 4; k++) {
        const idx = cursor.current % COUNT;
        positions[idx * 3] = mouse.current.x + (Math.random() - 0.5) * 0.4;
        positions[idx * 3 + 1] = mouse.current.y + (Math.random() - 0.5) * 0.4;
        positions[idx * 3 + 2] = 0;
        vels[idx * 3] = (Math.random() - 0.5) * 0.04;
        vels[idx * 3 + 1] = (Math.random() - 0.5) * 0.04 + 0.02;
        vels[idx * 3 + 2] = 0;
        lifetimes[idx] = 1;
        cursor.current += 1;
      }
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [positions, vels, lifetimes]);

  useFrame(() => {
    let anyAlive = false;
    for (let i = 0; i < COUNT; i++) {
      if (lifetimes[i] < 0) continue;
      lifetimes[i] -= 0.03;
      positions[i * 3] += vels[i * 3];
      positions[i * 3 + 1] += vels[i * 3 + 1];
      if (lifetimes[i] < 0) lifetimes[i] = -1;
      anyAlive = true;
    }
    if (anyAlive) geo.attributes.position.needsUpdate = true;
    if (mesh.current) {
      (mesh.current.material as THREE.PointsMaterial).opacity =
        lifetimes.some((l) => l > 0) ? 0.9 : 0;
    }
  });

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial color={GOLD_LIGHT} size={0.1} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
    </points>
  );
}

function SceneSetup() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color={GOLD} />
      <pointLight position={[-6, 4, 2]} intensity={0.8} color={GOLD} distance={20} />
      <pointLight position={[6, -4, 2]} intensity={0.4} color={NAVY} distance={15} />
    </>
  );
}

export function HeroScene() {
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) setWebgl(false);
  }, []);

  if (!webgl) return null;

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <SceneSetup />
        <ConcentricRings />
        <GoldenRays />
        <ProParticles count={800} />
        <MouseSparkles />
      </Canvas>
    </div>
  );
}
