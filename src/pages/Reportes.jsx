import Dashboard from "../components/Dashboard";
import ExcelExport from "../components/ExcelExport";

export default function Reportes({ inventario = [] }) {
  const totalArticulos = inventario.length;

  const piezasTotales = inventario.reduce(
    (total, item) => total + Number(item.cantidad || 0),
    0
  );

  const stockBajo = inventario.filter(
    (item) =>
      Number(item.cantidad || 0) <=
      Number(item.stockMinimo || 10)
  ).length;

  const stockCritico = inventario.filter(
    (item) =>
      Number(item.cantidad || 0) <= 5
  ).length;

  const reporte = inventario.map((item) => ({
    Articulo: item.articulo,
    Categoria: item.categoria,
    Cantidad: item.cantidad,
    StockMinimo: item.stockMinimo,
    Ubicacion: item.ubicacion,
  }));

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-[#941B80] mb-6">
        Reportes
      </h1>

      <Dashboard
        totalArticulos={totalArticulos}
        piezasTotales={piezasTotales}
        stockBajo={stockBajo}
        stockCritico={stockCritico}
      />

      <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">
        <h2 className="text-xl font-bold text-[#143B46] mb-4">
          Exportación de Reportes
        </h2>

        <div className="flex flex-wrap gap-4">
          <ExcelExport
            data={reporte}
            fileName="Reporte_Inventario_Qualitas"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6 mt-6">
        <h2 className="text-xl font-bold text-[#143B46] mb-4">
          Resumen General
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-2xl p-4">
            <p className="text-gray-500">
              Total de artículos
            </p>

            <p className="text-3xl font-bold text-[#0096AE]">
              {totalArticulos}
            </p>
          </div>

          <div className="border rounded-2xl p-4">
            <p className="text-gray-500">
              Piezas totales
            </p>

            <p className="text-3xl font-bold text-[#941B80]">
              {piezasTotales}
            </p>
          </div>

          <div className="border rounded-2xl p-4">
            <p className="text-gray-500">
              Stock bajo
            </p>

            <p className="text-3xl font-bold text-yellow-500">
              {stockBajo}
            </p>
          </div>

          <div className="border rounded-2xl p-4">
            <p className="text-gray-500">
              Stock crítico
            </p>

            <p className="text-3xl font-bold text-red-500">
              {stockCritico}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
