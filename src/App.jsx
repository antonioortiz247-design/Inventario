import { useEffect, useState } from "react";
import { FaBars } from "react-icons/fa";
import Sidebar from "./components/Sidebar";
import AuthGate from "./components/AuthGate";
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
import DesafioSeguridadVial from "./pages/DesafioSeguridadVial";
import useInventory from "./hooks/useInventory";
import { getInventory, saveInventory } from "./services/inventory.service";

function App() {
  const requestedPage = new URLSearchParams(window.location.search).get("pagina");
  const publicPreregistro = requestedPage === "calaverita-preregistro";
  const publicDesafio = requestedPage === "desafio-seguridad-vial";
  const [currentPage, setCurrentPage] = useState(() => { if (publicPreregistro) return "calaverita-preregistro"; if (publicDesafio) return "desafio-seguridad-vial"; try { return window.sessionStorage.getItem("qualitas-hub-current-page") || "inicio"; } catch { return "inicio"; } });
  useEffect(() => { try { window.sessionStorage.setItem("qualitas-hub-current-page", currentPage); } catch (error) { console.warn("No se pudo conservar la página actual.", error); } }, [currentPage]);
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
      case "desafio-seguridad-vial": return <DesafioSeguridadVial publicMode={publicDesafio} />;
      case "buscar-imagen": return <BuscarImagen inventario={inventory.items} />;
      case "reportes": return <Reportes inventario={inventory.items} />;
      case "configuracion": return <Configuracion />;
      default: return <Home inventario={inventory.items} estadisticas={inventory.estadisticas} onImport={handleImport} onNavigate={setCurrentPage} />;
    }
  };
  return (publicPreregistro || publicDesafio) ? (
    <div className="min-h-screen bg-slate-100">{renderPage()}</div>
  ) : (
    <AuthGate>
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
      <div className="mobile-app-content min-w-0 flex-1">
        <header className="hidden h-16 items-center justify-between border-b border-slate-200 bg-white px-8 md:flex">
          <div className="flex items-center gap-3">
            <img src="/letragrama-qualitas-verde.png" alt="Quálitas" className="h-9 w-auto object-contain" />
            <h1 className="text-lg font-semibold tracking-tight text-slate-800">Hub</h1>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Gestión de recursos y activaciones</span>
        </header>
        <div className="mobile-topbar sticky top-0 z-30 flex h-14 items-center px-3 sm:px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Abrir menú"
            className="mobile-menu-trigger flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0096AE]"
          >
            <FaBars className="text-xl" />
          </button>
          <img src="/letragrama-qualitas-verde.png" alt="Quálitas" className="ml-3 h-8 w-auto max-w-[116px] object-contain" />
          <span className="ml-2 text-sm font-semibold text-slate-800">Hub</span>
        </div>
        {inventory.error && (
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{inventory.error}</div>
          </div>
        )}
        {renderPage()}
      </div>
    </div>
    </AuthGate>
  );
}
export default App;
