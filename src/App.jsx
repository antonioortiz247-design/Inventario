import { useState } from "react";
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="min-w-0 flex-1">
        {inventory.error && (
          <div className="mx-auto max-w-7xl px-6 pt-4">
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{inventory.error}</div>
          </div>
        )}
        {renderPage()}
      </div>
    </div>
  );
}
export default App;
