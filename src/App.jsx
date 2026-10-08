import { useState } from "react";
import Header from "./components/Header";
import Home from "./pages/Home";
import Inventario from "./pages/Inventario";
import BuscarImagen from "./pages/BuscarImagen";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import useInventory from "./hooks/useInventory";
import { getInventory, saveInventory } from "./services/inventory.service";

function App() {
  const [currentPage, setCurrentPage] = useState("inicio");
  const inventory = useInventory();

  const handleImport = (data) => {
    const actuales = getInventory();

    const nuevos = data.map((item) => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      cantidad: Number(item.cantidad || 0),
      stockMinimo: Number(item.stockMinimo || 10),
      fechaRegistro: item.fechaRegistro || new Date().toISOString(),
    }));

    const porId = new Map(actuales.map((item) => [String(item.id), item]));
    nuevos.forEach((item) => porId.set(String(item.id), item));

    saveInventory(Array.from(porId.values()));
    inventory.setSearch("");
    inventory.cargarInventario();
  };

  const renderPage = () => {
    switch (currentPage) {
      case "inventario":
        return (
          <Inventario
            {...inventory}
            onAdd={inventory.agregarArticulo}
            onDelete={inventory.eliminarArticulo}
            onImport={handleImport}
          />
        );
      case "buscar-imagen":
        return <BuscarImagen inventario={inventory.items} />;
      case "reportes":
        return <Reportes inventario={inventory.items} />;
      case "configuracion":
        return <Configuracion />;
      default:
        return (
          <Home
            inventario={inventory.items}
            estadisticas={inventory.estadisticas}
            onImport={handleImport}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

export default App;
