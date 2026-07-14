"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GOLD = new THREE.Color(0xc9a84c);
const NAVY_PARTICLE = new THREE.Color(0x1a3a5c);

const ICON_SHAPES = {
  briefcase: [
    [-0.3, 0], [0.3, 0], [0.3, -0.4], [-0.3, -0.4], [-0.3, 0],
    [-0.15, 0], [-0.15, 0.15], [0.15, 0.15], [0.15, 0]
  ],
  passport: [
    [-0.2, 0.3], [0.2, 0.3], [0.2, -0.3], [-0.2, -0.3], [-0.2, 0.3]
  ],
  building: [
    [-0.25, -0.4], [-0.25, 0.4], [0.25, 0.4], [0.25, -0.4],
    [0, 0.4], [0, 0.8]
  ]
};

function SandParticles({ count = 600 }: { count?: number }) {
  const goldMesh = useRef<THREE.Points>(null!);
  const navyMesh = useRef<THREE.Points>(null!);
  const mouse = useRef({ x: 0, y: 0 });
  const iconTimer = useRef(0);
  const iconPhase = useRef<number | null>(null);
  const iconTarget = useRef<Float32Array>(new Float32Array(count * 3));
  const basePos = useRef<Float32Array>(new Float32Array(count * 3));

  const goldCount = Math.floor(count * 0.65);
  const navyCount = count - goldCount;

  const [goldPos, navyPos, goldVel, navyVel, phases] = useMemo(() => {
    const gp = new Float32Array(goldCount * 3);
    const np = new Float32Array(navyCount * 3);
    const gv = new Float32Array(goldCount * 3);
    const nv = new Float32Array(navyCount * 3);
    const ph = new Float32Array(count);

    const populate = (arr: Float32Array, vel: Float32Array, c: number) => {
      for (let i = 0; i < c; i++) {
        arr[i * 3] = (Math.random() - 0.5) * 14;
        arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2;
        vel[i * 3] = (Math.random() - 0.5) * 0.003;
        vel[i * 3 + 1] = -(Math.random() * 0.008 + 0.002);
        vel[i * 3 + 2] = 0;
      }
    };

    populate(gp, gv, goldCount);
    populate(np, nv, navyCount);
    for (let i = 0; i < count; i++) ph[i] = Math.random() * Math.PI * 2;

    return [gp, np, gv, nv, ph];
  }, [count, goldCount, navyCount]);

  const goldGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(goldPos, 3));
    return g;
  }, [goldPos]);

  const navyGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(navyPos, 3));
    return g;
  }, [navyPos]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 14;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 8;
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    iconTimer.current += 1;

    // Every ~8 seconds briefly form an icon
    if (iconTimer.current > 480 && iconPhase.current === null) {
      iconTimer.current = 0;
      iconPhase.current = 0;
    }

    const updateCloud = (
      arr: Float32Array,
      vel: Float32Array,
      c: number,
      geo: THREE.BufferGeometry
    ) => {
      for (let i = 0; i < c; i++) {
        const px = arr[i * 3];
        const py = arr[i * 3 + 1];
        // Mouse repulsion
        const dx = px - mouse.current.x;
        const dy = py - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const repel = dist < 3 ? (3 - dist) * 0.003 : 0;
        // Hourglass funnel — constrict x near y=0
        const pinch = Math.max(0, 1 - Math.abs(py) * 0.4) * 0.004;
        arr[i * 3] += vel[i * 3] + (dx / dist) * repel - px * pinch;
        arr[i * 3 + 1] += vel[i * 3 + 1] + (dy / dist) * repel;
        arr[i * 3 + 2] += vel[i * 3 + 2];
        // Wrap top to bottom (hourglass loop)
        if (arr[i * 3 + 1] < -4.5) {
          arr[i * 3 + 1] = 4.5;
          arr[i * 3] = (Math.random() - 0.5) * 6;
          vel[i * 3 + 1] = -(Math.random() * 0.006 + 0.002);
        }
        if (Math.abs(arr[i * 3]) > 7) arr[i * 3] *= 0.95;
      }
      geo.attributes.position.needsUpdate = true;
    };

    updateCloud(goldPos, goldVel, goldCount, goldGeo);
    updateCloud(navyPos, navyVel, navyCount, navyGeo);
  });

  return (
    <>
      <points ref={goldMesh} geometry={goldGeo}>
        <pointsMaterial color={GOLD} size={0.055} sizeAttenuation transparent opacity={0.75} depthWrite={false} />
      </points>
      <points ref={navyMesh} geometry={navyGeo}>
        <pointsMaterial color={NAVY_PARTICLE} size={0.04} sizeAttenuation transparent opacity={0.5} depthWrite={false} />
      </points>
      <ambientLight intensity={0.2} />
    </>
  );
}

export function ParticleField({ className = "" }: { className?: string }) {
  return (
    <div className={`${className} pointer-events-none`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <SandParticles count={600} />
      </Canvas>
    </div>
  );
}
