import { useState } from "react";
import Header from "./components/Header";
import Home from "./pages/Home";
import Inventario from "./pages/Inventario";
import Escaner from "./pages/Escaner";
import Reportes from "./pages/Reportes";
import Configuracion from "./pages/Configuracion";
import useInventory from "./hooks/useInventory";

function App() {
  const [currentPage, setCurrentPage] = useState("inicio");
  const inventory = useInventory();

  const handleImport = (data) => {
    const normalized = data.map((item) => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      cantidad: Number(item.cantidad || 0),
      stockMinimo: Number(item.stockMinimo || 10),
    }));
    inventory.setSearch("");
    localStorage.setItem("inventario-qualitas", JSON.stringify(normalized));
    inventory.cargarInventario();
  };

  const renderPage = () => {
    switch (currentPage) {
      case "inventario":
        return <Inventario {...inventory} onAdd={inventory.agregarArticulo} onDelete={inventory.eliminarArticulo} onImport={handleImport} />;
      case "escaner":
        return <Escaner />;
      case "reportes":
        return <Reportes inventario={inventory.items} />;
      case "configuracion":
        return <Configuracion />;
      default:
        return <Home inventario={inventory.items} estadisticas={inventory.estadisticas} onImport={handleImport} />;
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
