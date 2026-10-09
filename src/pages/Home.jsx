import Dashboard from "../components/Dashboard";
import ExcelImport from "../components/ExcelImport";
import ExcelExport from "../components/ExcelExport";

export default function Home({ inventario = [], estadisticas, onImport, onNavigate }) {
  const alertas = inventario
    .filter((item) => Number(item.cantidad || 0) <= Number(item.stockMinimo ?? item.stock_minimo ?? 10))
    .sort((a, b) => {
      const aQty = Number(a.cantidad || 0);
      const bQty = Number(b.cantidad || 0);
      if ((aQty <= 0) !== (bQty <= 0)) return aQty <= 0 ? -1 : 1;
      const aRatio = aQty / Math.max(1, Number(a.stockMinimo ?? a.stock_minimo ?? 10));
      const bRatio = bQty / Math.max(1, Number(b.stockMinimo ?? b.stock_minimo ?? 10));
      return aRatio - bRatio;
    });

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <Dashboard
        totalArticulos={estadisticas?.totalArticulos ?? inventario.length}
        piezasTotales={estadisticas?.piezasTotales ?? 0}
        stockBajo={estadisticas?.stockBajo ?? 0}
        stockCritico={estadisticas?.stockCritico ?? 0}
      />
      <section className="rounded-3xl bg-white p-5 shadow-lg md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0096AE]">Prevención de faltantes</p>
            <h2 className="mt-1 text-2xl font-bold text-[#941B80]">Alertas de existencias</h2>
            <p className="mt-1 text-sm text-slate-500">Se consideran en alerta los artículos cuya cantidad es igual o inferior a su stock mínimo.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${alertas.length ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
            {alertas.length} por revisar
          </span>
        </div>
        {alertas.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            Todas las existencias están por encima del mínimo configurado.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead><tr className="bg-[#143B46] text-white"><th className="p-3">Artículo</th><th className="p-3">Ubicación</th><th className="p-3">Existencia</th><th className="p-3">Stock mínimo</th><th className="p-3">Estado</th></tr></thead>
              <tbody>{alertas.map((item) => {
                const cantidad = Number(item.cantidad || 0);
                const minimo = Number(item.stockMinimo ?? item.stock_minimo ?? 10);
                const agotado = cantidad <= 0;
                return <tr key={item.id} className="border-t border-slate-100 odd:bg-white even:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-800">{item.articulo || "Artículo sin nombre"}<div className="text-xs font-normal text-slate-500">{item.categoria || "Sin categoría"}</div></td>
                  <td className="p-3 text-slate-600">{item.ubicacion || "Sin ubicación"}</td>
                  <td className="p-3 font-bold tabular-nums">{cantidad}</td>
                  <td className="p-3 tabular-nums">{minimo}</td>
                  <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${agotado ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{agotado ? "Agotado" : "Stock bajo"}</span></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
        <button type="button" onClick={() => onNavigate?.("inventario")} className="mt-4 rounded-xl bg-[#941B80] px-4 py-2.5 font-semibold text-white hover:bg-[#762067]">Revisar inventario</button>
      </section>
      <section className="rounded-3xl bg-white p-5 shadow-lg md:p-6">
        <h2 className="mb-4 text-xl font-bold text-[#941B80]">Herramientas</h2>
        <div className="flex flex-wrap gap-4"><ExcelImport onImport={onImport} /><ExcelExport data={inventario} fileName="Inventario_Qualitas" /></div>
      </section>
      <section className="rounded-3xl bg-white p-8 text-center shadow-lg md:p-12">
        <h3 className="text-2xl font-bold text-[#0096AE]">Bienvenido a Inventario Quálitas</h3>
        <p className="mt-2 text-gray-600">El inventario y sus indicadores están conectados y se conservan en este navegador.</p>
      </section>
    </main>
  );
}
