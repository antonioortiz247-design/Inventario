import Header from "../components/Header";
import Dashboard from "../components/Dashboard";
import ExcelImport from "../components/ExcelImport";
import ExcelExport from "../components/ExcelExport";

export default function Home() {
  const handleImport = (data) => {
    console.log("Datos importados:", data);
  };

  const inventario = [];

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="max-w-7xl mx-auto p-6">
        <Dashboard
          totalArticulos={0}
          piezasTotales={0}
          stockBajo={0}
          stockCritico={0}
        />

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-[#941B80] mb-4">
            Herramientas
          </h2>

          <div className="flex flex-wrap gap-4">
            <ExcelImport onImport={handleImport} />

            <ExcelExport
              data={inventario}
              fileName="Inventario_Qualitas"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
          <h3 className="text-2xl font-bold text-[#0096AE]">
            Bienvenido a Inventario Quálitas
          </h3>

          <p className="text-gray-600 mt-2">
            La configuración inicial se completó correctamente.
          </p>
        </div>
      </main>
    </div>
  );
}
