import Dashboard from "../components/Dashboard";
import ExcelImport from "../components/ExcelImport";
import ExcelExport from "../components/ExcelExport";

export default function Home({ inventario = [], estadisticas, onImport }) {
  return (
    <main className="max-w-7xl mx-auto p-6">
      <Dashboard
        totalArticulos={estadisticas?.totalArticulos ?? inventario.length}
        piezasTotales={estadisticas?.piezasTotales ?? 0}
        stockBajo={estadisticas?.stockBajo ?? 0}
        stockCritico={estadisticas?.stockCritico ?? 0}
      />
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-[#941B80] mb-4">Herramientas</h2>
        <div className="flex flex-wrap gap-4">
          <ExcelImport onImport={onImport} />
          <ExcelExport data={inventario} fileName="Inventario_Qualitas" />
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
        <h3 className="text-2xl font-bold text-[#0096AE]">Bienvenido a Inventario Quálitas</h3>
        <p className="text-gray-600 mt-2">El inventario y sus indicadores están conectados y se conservan en este navegador.</p>
      </div>
    </main>
  );
}
