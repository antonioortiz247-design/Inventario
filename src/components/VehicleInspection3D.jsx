import React, { Component, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, ContactShadows, Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "https://raw.githubusercontent.com/antonioortiz247-design/QualitasTultitlan-/main/public/models/qualitas-prius.glb";

class VehicleErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error("No se pudo mostrar el modelo 3D:", error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function VehicleModel() {
  const { scene } = useGLTF(MODEL_URL);
  return <Bounds fit clip observe margin={1.35}><Center><primitive object={scene} /></Center></Bounds>;
}

function ModelLoader() {
  const { progress } = useProgress();
  return <Html center><div className="whitespace-nowrap rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg">Cargando vehículo 3D… {Math.round(progress)}%</div></Html>;
}

function ModelError() {
  return <Html center><div className="max-w-[250px] rounded-xl bg-white p-4 text-center text-sm text-slate-700 shadow-lg"><div className="mb-2 text-3xl">🚘</div><strong>No se pudo cargar el modelo 3D</strong><p className="mt-1 text-xs text-slate-500">Puedes continuar con los puntos de inspección.</p></div></Html>;
}

function StaticFallback() {
  return <div className="flex h-[300px] flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-50 to-slate-200 px-5 text-center sm:h-[390px]"><div className="text-6xl" role="img" aria-label="Automóvil">🚘</div><p className="font-bold text-slate-700">Vista 3D no disponible en este dispositivo</p><p className="max-w-sm text-xs text-slate-500">La inspección puede completarse con los cuatro puntos de revisión que aparecen debajo.</p><button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600">Reintentar carga</button></div>;
}

export default function VehicleInspection3D({ children }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[#e8f2f4]">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4">
        <div><p className="text-xs font-black uppercase tracking-widest text-[#0096AE]">Modelo interactivo</p><p className="text-sm font-bold text-slate-700">Vehículo Quálitas · Toyota Prius</p></div>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">Modelo 3D</span>
      </div>
      <VehicleErrorBoundary fallback={<StaticFallback />}>
        <div className="flex flex-col sm:min-h-[390px] sm:flex-row"><div className="h-[300px] min-w-0 flex-1 sm:h-[390px]" aria-label="Modelo tridimensional del vehículo. Arrastra para girarlo.">
          <Canvas camera={{ position: [4.5, 2.5, 5.2], fov: 36 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} onCreated={({ gl }) => { gl.setClearColor("#edf2f4", 0); gl.outputColorSpace = THREE.SRGBColorSpace; }}>
            <ambientLight intensity={1.5} />
            <hemisphereLight args={["#ffffff", "#687681", 1.3]} />
            <directionalLight position={[5, 8, 6]} intensity={2.8} />
            <directionalLight position={[-5, 4, -4]} intensity={1.8} color="#0096AE" />
            <Suspense fallback={<ModelLoader />}><VehicleModel /><ContactShadows position={[0, -0.12, 0]} opacity={0.28} scale={8} blur={2.5} far={5} /></Suspense>
            <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={9} minPolarAngle={0.35} maxPolarAngle={Math.PI / 2.02} autoRotate autoRotateSpeed={0.4} enableDamping dampingFactor={0.07} />
          </Canvas>
        </div>{children&&<div className="shrink-0 sm:w-[330px]">{children}</div>}</div>
      </VehicleErrorBoundary>
      <div className="border-t border-slate-200 bg-white/80 px-4 py-3 text-center text-xs text-slate-500">Arrastra el vehículo para girarlo y observar sus diferentes ángulos.</div>
    </div>
  );
}
