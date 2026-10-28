import { useState } from "react";
import { FaBars } from "react-icons/fa";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Inventario from "./pages/Inventario";
import BuscarImagen from "./pages/BuscarImagen";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import Movimientos from "./pages/Movimientos";
import Eventos from "./pages/Eventos";
import Simulador from "./pages/Simulador";
import RuletaActivaciones from "./pages/RuletaActivaciones";
import RegistrosRuleta from "./pages/RegistrosRuleta";
import CalaveritaSegura from "./pages/CalaveritaSegura";
import CalaveritaPreregistro from "./pages/CalaveritaPreregistro";
import useInventory from "./hooks/useInventory";
import { getInventory, saveInventory } from "./services/inventory.service";

function App() {
  const publicPreregistro = new URLSearchParams(window.location.search).get("pagina") === "calaverita-preregistro";
  const [currentPage, setCurrentPage] = useState(publicPreregistro ? "calaverita-preregistro" : "inicio");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const inventory = useInventory();
  const handleImport = async (data) => {
    const actuales = await getInventory();
    const nuevos = data.map((item) => ({ ...item, id: item.id || crypto.randomUUID(), cantidad: Number(item.cantidad || 0), stockMinimo: Number(item.stockMinimo ?? item.stock_minimo ?? 10), fechaRegistro: item.fechaRegistro || new Date().toISOString() }));
    const porId = new Map(actuales.map((item) => [String(item.id), item]));
    nuevos.forEach((item) => porId.set(String(item.id), item));
    await saveInventory(Array.from(porId.values()));
    inventory.setSearch("");
    await inventory.cargarInventario();
  };
  const renderPage = () => {
    switch (currentPage) {
      case "inventario": return <Inventario {...inventory} inventario={inventory.items} resultados={inventory.resultados} onAdd={inventory.agregarArticulo} onUpdate={inventory.actualizarArticulo} onDelete={inventory.eliminarArticulo} onImport={handleImport} />;
      case "movimientos": return <Movimientos inventario={inventory.items} onUpdated={inventory.cargarInventario} />;
      case "eventos": return <Eventos inventario={inventory.items} onUpdated={inventory.cargarInventario} />;
      case "simulador": return <Simulador inventario={inventory.items} />;
      case "ruleta": return <RuletaActivaciones />;
      case "registros-ruleta": return <RegistrosRuleta />;
      case "calaverita-segura": return <CalaveritaSegura />;
      case "calaverita-preregistro": return <CalaveritaPreregistro publicMode={publicPreregistro} />;
      case "buscar-imagen": return <BuscarImagen inventario={inventory.items} />;
      case "reportes": return <Reportes inventario={inventory.items} />;
      case "configuracion": return <Configuracion />;
      default: return <Home inventario={inventory.items} estadisticas={inventory.estadisticas} onImport={handleImport} onNavigate={setCurrentPage} />;
    }
  };
  return publicPreregistro ? (
    <div className="min-h-screen bg-slate-100">{renderPage()}</div>
  ) : (
    <div
      className="flex min-h-screen bg-slate-50"
      onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        if (touchStartX === null) return;
        const endX = event.changedTouches[0]?.clientX ?? touchStartX;
        const deltaX = endX - touchStartX;
        if (touchStartX <= 32 && deltaX > 70) setMobileSidebarOpen(true);
        if (mobileSidebarOpen && deltaX < -70) setMobileSidebarOpen(false);
        setTouchStartX(null);
      }}
    >
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Abrir menú"
            className="flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0096AE]"
          >
            <FaBars className="text-xl" />
          </button>
          <span className="ml-2 text-sm font-semibold text-slate-800">Quálitas Hub</span>
        </div>
        {inventory.error && (
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{inventory.error}</div>
          </div>
        )}
        {renderPage()}
      </div>
    </div>
  );
}
export default App;
