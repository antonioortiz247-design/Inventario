import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, ContactShadows, Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/antonioortiz247-design/QualitasTultitlan-@main/public/models/qualitas-prius.glb";

function VehicleModel() {
  const { scene } = useGLTF(MODEL_URL);
  return <Bounds fit clip observe margin={1.2}><Center><primitive object={scene} /></Center></Bounds>;
}

function ModelLoader() {
  const { progress } = useProgress();
  return <Html center><div className="rounded-xl bg-white/95 px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg">Cargando vehículo 3D… {Math.round(progress)}%</div></Html>;
}

function ModelFallback() {
  return <Html center><div className="max-w-xs rounded-xl bg-white p-4 text-center text-sm text-red-700 shadow-lg">No fue posible cargar el modelo 3D. Revisa tu conexión e inténtalo de nuevo.</div></Html>;
}

export default function VehicleInspection3D() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[#e8f2f4]">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
        <div><p className="text-xs font-black uppercase tracking-widest text-[#0096AE]">Modelo interactivo</p><p className="text-sm font-bold text-slate-700">Toyota Prius · Quálitas</p></div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">3D · GLB</span>
      </div>
      <div className="h-[300px] w-full sm:h-[390px]" aria-label="Modelo tridimensional del vehículo. Arrastra para girarlo.">
        <Canvas camera={{ position: [4.5, 2.5, 5.2], fov: 36 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} onCreated={({ gl }) => { gl.setClearColor("#edf2f4", 0); gl.outputColorSpace = THREE.SRGBColorSpace; }}>
          <ambientLight intensity={1.5} />
          <hemisphereLight args={["#ffffff", "#687681", 1.3]} />
          <directionalLight position={[5, 8, 6]} intensity={2.8} />
          <directionalLight position={[-5, 4, -4]} intensity={1.8} color="#0096AE" />
          <Suspense fallback={<ModelLoader />}><VehicleModel /><ContactShadows position={[0, -0.12, 0]} opacity={0.28} scale={8} blur={2.5} far={5} /></Suspense>
          <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={9} minPolarAngle={0.35} maxPolarAngle={Math.PI / 2.02} autoRotate autoRotateSpeed={0.4} enableDamping dampingFactor={0.07} />
        </Canvas>
      </div>
      <div className="border-t border-slate-200 bg-white/80 px-4 py-3 text-center text-xs text-slate-500">Arrastra el vehículo para girarlo y observar sus diferentes ángulos.</div>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
