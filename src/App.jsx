import { useState } from "react";
import Header from "./components/Header";
import Home from "./pages/Home";
import Inventario from "./pages/Inventario";
import BuscarImagen from "./pages/BuscarImagen";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import Movimientos from "./pages/Movimientos";
import useInventory from "./hooks/useInventory";
import { getInventory, saveInventory } from "./services/inventory.service";

function App() {
  const [currentPage, setCurrentPage] = useState("inicio");
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
      case "buscar-imagen": return <BuscarImagen inventario={inventory.items} />;
      case "reportes": return <Reportes inventario={inventory.items} />;
      case "configuracion": return <Configuracion />;
      default: return <Home inventario={inventory.items} estadisticas={inventory.estadisticas} onImport={handleImport} onNavigate={setCurrentPage} />;
    }
  };
  return <div className="min-h-screen bg-slate-100"><Header currentPage={currentPage} onNavigate={setCurrentPage} />{inventory.error && <div className="mx-auto max-w-7xl px-6 pt-4"><div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4">{inventory.error}</div></div>}{renderPage()}</div>;
}
export default App;