"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const particleCount = 420;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xc9a84c, size: 0.045, transparent: true, opacity: 0.75, sizeAttenuation: true });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const skylineGroup = new THREE.Group();
    const skylineMaterial = new THREE.MeshBasicMaterial({ color: 0xc9a84c, transparent: true, opacity: 0.06 });
    const buildingWidths = [0.7, 1.1, 0.6, 1.4, 0.8, 1.0, 0.65];
    let cursorX = -6.5;
    buildingWidths.forEach((width, index) => {
      const height = 2.2 + ((index * 37) % 5) * 0.9;
      const geo = new THREE.BoxGeometry(width, height, 0.4);
      const mesh = new THREE.Mesh(geo, skylineMaterial);
      mesh.position.set(cursorX + width / 2, -4 + height / 2, -6);
      skylineGroup.add(mesh);
      cursorX += width + 0.25;
    });
    scene.add(skylineGroup);

    let frameId = 0;
    let visible = !document.hidden;

    const animate = () => {
      if (!prefersReducedMotion && visible) {
        particles.rotation.y += 0.0006;
        particles.rotation.x += 0.0001;
        const positionsAttr = geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          const y = positionsAttr.getY(i) + 0.004;
          positionsAttr.setY(i, y > 7 ? -7 : y);
        }
        positionsAttr.needsUpdate = true;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleVisibility = () => {
      visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      geometry.dispose();
      material.dispose();
      skylineMaterial.dispose();
      buildingWidths.forEach((_, index) => skylineGroup.children[index] && (skylineGroup.children[index] as THREE.Mesh).geometry.dispose());
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
