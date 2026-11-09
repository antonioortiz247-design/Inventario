import React, { useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "https://raw.githubusercontent.com/antonioortiz247-design/QualitasTultitlan-/main/public/models/qualitas-prius.glb";

function BrandedCar({ engineRef }) {
  const { scene } = useGLTF(MODEL_URL);
  const car = useMemo(() => {
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 1.4 / Math.max(size.x, size.y, size.z);
    clone.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    clone.scale.setScalar(scale);
    clone.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      const painted = materials.map((original) => {
        const material = original.clone();
        if (material instanceof THREE.MeshStandardMaterial) {
          const c = material.color;
          const max = Math.max(c.r, c.g, c.b);
          const min = Math.min(c.r, c.g, c.b);
          const neutral = max - min < 0.18 && max > 0.28;
          const name = (material.name + " " + node.name).toLowerCase();
          if (neutral && !/(glass|window|lamp|light|chrome|metal|tire|tyre|wheel|rubber|grille)/.test(name)) {
            material.color.set("#941B80");
            material.metalness = 0.28;
            material.roughness = 0.34;
            material.envMapIntensity = 1.15;
          }
        }
        return material;
      });
      node.material = Array.isArray(node.material) ? painted : painted[0];
    });
    return clone;
  }, [scene]);

  useFrame((state, delta) => {
    const g = engineRef?.current;
    const targetX = g ? (g.lane - 1) * 0.52 : 0;
    const jumpProgress = g?.jump > 0 ? Math.sin((1 - g.jump / 22) * Math.PI) : 0;
    const targetY = jumpProgress * 0.85;
    car.position.x = THREE.MathUtils.damp(car.position.x, targetX, 12, delta);
    car.position.y = THREE.MathUtils.damp(car.position.y, targetY, 12, delta);
    car.rotation.y = THREE.MathUtils.damp(car.rotation.y, Math.PI, 10, delta);
    car.rotation.z = THREE.MathUtils.damp(car.rotation.z, g ? (g.lane - 1) * -0.035 : 0, 8, delta);
  });

  return <primitive object={car} />;
}

export default function QualicocheGame3D({ engineRef }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2]" aria-label="Modelo 3D del Qualicoche">
      <Canvas style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "transparent" }} camera={{ position: [0, 2.8, 6.2], fov: 34 }} dpr={[1, 1.35]}
        gl={{ alpha: true, premultipliedAlpha: true, antialias: true, powerPreference: "low-power" }}
        onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.setClearAlpha(0); gl.outputColorSpace = THREE.SRGBColorSpace; gl.domElement.style.background = "transparent"; gl.domElement.style.display = "block"; }}>
        <ambientLight intensity={1.15} />
        <hemisphereLight args={["#ffffff", "#344054", 1.1]} />
        <directionalLight position={[4, 7, 5]} intensity={2.6} />
        <directionalLight position={[-4, 3, -3]} intensity={1.8} color="#6FE3E8" />
        <pointLight position={[0, 2, 3]} intensity={3.5} color="#941B80" />
        <React.Suspense fallback={null}>
          <BrandedCar engineRef={engineRef} />
          <ContactShadows position={[0, 0.015, 0]} opacity={0.36} scale={4.5} blur={2.4} far={3} />
        </React.Suspense>
      </Canvas>
    </div>
  );
}
