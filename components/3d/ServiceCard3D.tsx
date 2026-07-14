"use client";

import { useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const goldMat = {
  color: new THREE.Color(0xc9a84c),
  metalness: 0.85,
  roughness: 0.15,
  emissive: new THREE.Color(0xc9a84c),
  emissiveIntensity: 0.3
};

const navyMat = { color: new THREE.Color(0x0a1628), metalness: 0.6, roughness: 0.3 };

function BuildingIcon() {
  return (
    <>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.6, 1.0, 0.4]} />
        <meshStandardMaterial {...goldMat} />
      </mesh>
      <mesh position={[-0.4, -0.1, 0]}>
        <boxGeometry args={[0.4, 0.7, 0.35]} />
        <meshStandardMaterial {...navyMat} />
      </mesh>
      <mesh position={[0.4, -0.2, 0]}>
        <boxGeometry args={[0.3, 0.5, 0.35]} />
        <meshStandardMaterial {...navyMat} />
      </mesh>
    </>
  );
}

function PassportIcon() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.7, 0.08]} />
      <meshStandardMaterial {...goldMat} />
    </mesh>
  );
}

function CertificateIcon() {
  return (
    <>
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 0.08, 6]} />
        <meshStandardMaterial {...goldMat} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <torusGeometry args={[0.28, 0.04, 8, 24]} />
        <meshStandardMaterial color={new THREE.Color(0xf0d080)} metalness={0.9} roughness={0.1} />
      </mesh>
    </>
  );
}

function ShieldIcon() {
  return (
    <mesh>
      <coneGeometry args={[0.5, 0.9, 5]} />
      <meshStandardMaterial {...goldMat} />
    </mesh>
  );
}

function DocumentIcon() {
  return (
    <>
      <mesh>
        <boxGeometry args={[0.55, 0.72, 0.05]} />
        <meshStandardMaterial {...goldMat} />
      </mesh>
      {[0.15, 0, -0.15].map((y, i) => (
        <mesh key={i} position={[0, y, 0.04]}>
          <boxGeometry args={[0.35, 0.06, 0.01]} />
          <meshStandardMaterial {...navyMat} />
        </mesh>
      ))}
    </>
  );
}

function GearIcon() {
  return (
    <mesh>
      <torusGeometry args={[0.4, 0.12, 6, 8]} />
      <meshStandardMaterial {...goldMat} />
    </mesh>
  );
}

function CoinIcon() {
  return (
    <mesh>
      <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
      <meshStandardMaterial {...goldMat} />
    </mesh>
  );
}

const ICONS: Record<string, () => ReactNode> = {
  building: BuildingIcon,
  passport: PassportIcon,
  certificate: CertificateIcon,
  shield: ShieldIcon,
  document: DocumentIcon,
  gear: GearIcon,
  coin: CoinIcon
};

function ServiceIcon({ type }: { type: string }) {
  const group = useRef<THREE.Group>(null!);
  const glow = useRef<THREE.PointLight>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = t * 0.6;
      group.current.rotation.x = Math.sin(t * 0.4) * 0.15;
    }
    if (glow.current) {
      glow.current.intensity = 1.5 + Math.sin(t * 2) * 0.4;
    }
  });

  const IconComponent = ICONS[type] ?? ICONS.document;

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <pointLight ref={glow} position={[0, 0, 1]} intensity={1.5} color={new THREE.Color(0xc9a84c)} distance={4} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 3, 2]} intensity={1.2} color={new THREE.Color(0xc9a84c)} />
      <group ref={group}>
        <IconComponent />
      </group>
    </Float>
  );
}

type ServiceCard3DProps = {
  children: ReactNode;
  iconType?: string;
};

export function ServiceCard3D({ children, iconType = "document" }: ServiceCard3DProps) {
  const [hovered, setHovered] = useState(false);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-60, 60], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-60, 60], [-8, 8]), { stiffness: 200, damping: 20 });

  return (
    <motion.div
      className="glass-panel group relative h-full cursor-default overflow-hidden rounded-lg p-7 shadow-soft transition-shadow duration-300 hover:shadow-gold"
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.03 }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left - r.width / 2);
        my.set(e.clientY - r.top - r.height / 2);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); setHovered(false); }}
      onMouseEnter={() => setHovered(true)}
    >
      {/* 3D icon canvas floating above card */}
      <div className="mb-4 h-24 w-full overflow-hidden rounded-md" style={{ transform: "translateZ(20px)" }}>
        <Canvas
          camera={{ position: [0, 0, 3], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
          style={{ background: "transparent", width: "100%", height: "100%" }}
        >
          <ServiceIcon type={iconType} />
        </Canvas>
      </div>

      {/* Gold glow ring on hover */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-lg"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: "radial-gradient(ellipse at center, rgba(201,168,76,0.12) 0%, transparent 70%)",
          boxShadow: "inset 0 0 40px rgba(201,168,76,0.1)"
        }}
      />

      <div style={{ transform: "translateZ(10px)" }}>{children}</div>
    </motion.div>
  );
}
