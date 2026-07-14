"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { animate, useInView } from "framer-motion";
import { formatNumber } from "@/lib/utils";

const GOLD = new THREE.Color(0xc9a84c);
const GOLD_DARK = new THREE.Color(0x8a6a20);

type CoinProps = {
  index: number;
  total: number;
  visible: boolean;
};

function Coin({ index, total, visible }: CoinProps) {
  const mesh = useRef<THREE.Mesh>(null!);
  const [flipped, setFlipped] = useState(false);
  const [spawned, setSpawned] = useState(false);
  const startY = useRef(-2);

  useEffect(() => {
    if (!visible) return;
    const delay = index * 120;
    const t = setTimeout(() => {
      setSpawned(true);
      setTimeout(() => setFlipped(true), delay + 400);
    }, delay);
    return () => clearTimeout(t);
  }, [visible, index]);

  const targetY = -1 + index * 0.14;

  useFrame(({ clock }) => {
    if (!mesh.current || !spawned) return;
    const t = clock.getElapsedTime();
    // Float up to position
    const cur = mesh.current.position.y;
    mesh.current.position.y += (targetY - cur) * 0.08;
    // Spin
    mesh.current.rotation.y += 0.04;
    // Pulse glow on milestone
    if (index === total - 1 && flipped) {
      const mat = mesh.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.4 + Math.sin(t * 4) * 0.2;
    }
  });

  if (!spawned) return null;

  return (
    <mesh ref={mesh} position={[0, startY.current, 0]}>
      <cylinderGeometry args={[0.4, 0.4, 0.08, 32]} />
      <meshStandardMaterial
        color={GOLD}
        metalness={0.9}
        roughness={0.1}
        emissive={GOLD}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function BurstParticles({ trigger }: { trigger: boolean }) {
  const mesh = useRef<THREE.Points>(null!);
  const COUNT = 40;
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const vels = useMemo(() => {
    const v = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const angle = (i / COUNT) * Math.PI * 2;
      v[i * 3] = Math.cos(angle) * (0.04 + Math.random() * 0.04);
      v[i * 3 + 1] = Math.random() * 0.06 + 0.02;
      v[i * 3 + 2] = Math.sin(angle) * (0.04 + Math.random() * 0.04);
    }
    return v;
  }, []);
  const life = useRef(0);
  const active = useRef(false);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useEffect(() => {
    if (trigger) {
      // Reset positions
      positions.fill(0);
      life.current = 1;
      active.current = true;
      geo.attributes.position.needsUpdate = true;
    }
  }, [trigger, positions, geo]);

  useFrame(() => {
    if (!active.current) return;
    life.current -= 0.025;
    if (life.current <= 0) { active.current = false; return; }
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] += vels[i * 3];
      positions[i * 3 + 1] += vels[i * 3 + 1];
      positions[i * 3 + 2] += vels[i * 3 + 2];
    }
    geo.attributes.position.needsUpdate = true;
    if (mesh.current) {
      (mesh.current.material as THREE.PointsMaterial).opacity = life.current * 0.9;
    }
  });

  return (
    <points ref={mesh} geometry={geo}>
      <pointsMaterial color={GOLD} size={0.08} sizeAttenuation transparent opacity={0} depthWrite={false} />
    </points>
  );
}

function CoinStack({ coinCount, visible }: { coinCount: number; visible: boolean }) {
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setBurst(true), coinCount * 120 + 600);
      return () => clearTimeout(t);
    }
  }, [visible, coinCount]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 3]} intensity={1.5} color={GOLD} />
      <pointLight position={[-2, 2, 2]} intensity={0.6} color={new THREE.Color(0xffffff)} />
      {Array.from({ length: coinCount }, (_, i) => (
        <Coin key={i} index={i} total={coinCount} visible={visible} />
      ))}
      <BurstParticles trigger={burst} />
    </>
  );
}

type Stats3DProps = {
  value: number;
  suffix?: string;
  label: string;
  coinCount?: number;
};

export function Stats3D({ value, suffix = "", label, coinCount = 5 }: Stats3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v))
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <div ref={ref} className="flex flex-col items-center text-center">
      {/* Coin stack canvas */}
      <div className="h-28 w-full max-w-[120px]">
        <Canvas
          camera={{ position: [0, 2, 4], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
          style={{ background: "transparent" }}
        >
          <CoinStack coinCount={coinCount} visible={inView} />
        </Canvas>
      </div>
      <span className="block font-heading text-3xl font-bold text-heading md:text-4xl">
        {formatNumber(display)}{suffix}
      </span>
      <span className="mt-1 block text-sm font-medium text-muted">{label}</span>
    </div>
  );
}
