import Dashboard from "../components/Dashboard";
import ExcelExport from "../components/ExcelExport";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaSearch, FaSyncAlt, FaDownload } from "react-icons/fa";
import { supabase, supabaseConfigured } from "../lib/supabase";

export default function Reportes({ inventario = [] }) {
  const [vistaRuleta, setVistaRuleta] = useState(false);
  const [prospectos, setProspectos] = useState([]);
  const [premios, setPremios] = useState([]);
  const [cargandoRuleta, setCargandoRuleta] = useState(false);
  const [errorRuleta, setErrorRuleta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const cargarRegistrosRuleta = useCallback(async () => {
    if (!supabaseConfigured) { setErrorRuleta("Supabase no está configurado."); return; }
    setCargandoRuleta(true); setErrorRuleta("");
    const [leadsResult, prizesResult] = await Promise.all([
      supabase.from("ruleta_activaciones_prospectos").select("id,nombre,telefono,correo,municipio,evento,acepta_contacto,created_at").order("created_at", { ascending: false }).limit(2000),
      supabase.from("ruleta_activaciones_historial").select("id,premio,created_at,prospecto_id").order("created_at", { ascending: false }).limit(2000),
    ]);
    if (leadsResult.error || prizesResult.error) {
      setErrorRuleta([leadsResult.error, prizesResult.error].filter(Boolean).map((e) => `${e.message}${e.code ? ` (código ${e.code})` : ""}`).join(" | "));
      setCargandoRuleta(false); return;
    }
    setProspectos(leadsResult.data || []); setPremios(prizesResult.data || []); setCargandoRuleta(false);
  }, []);

  useEffect(() => { if (vistaRuleta) cargarRegistrosRuleta(); }, [vistaRuleta, cargarRegistrosRuleta]);

  const filasRuleta = useMemo(() => prospectos.map((p) => {
    const premio = premios.find((item) => item.prospecto_id === p.id);
    return { ...p, premio: premio?.premio || "Sin premio registrado" };
  }).filter((p) => {
    const termino = busqueda.trim().toLocaleLowerCase("es-MX");
    const fecha = p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : "";
    return (!termino || [p.nombre,p.telefono,p.correo,p.municipio,p.evento,p.premio].some(v => String(v || "").toLocaleLowerCase("es-MX").includes(termino)))
      && (!fechaDesde || fecha >= fechaDesde) && (!fechaHasta || fecha <= fechaHasta);
  }), [prospectos, premios, busqueda, fechaDesde, fechaHasta]);

  const exportarRuleta = () => {
    const columnas = ["Nombre","Telefono","Correo","Municipio","Evento","Premio","Fecha de registro","Acepta contacto"];
    const escapar = (valor) => '"' + String(valor ?? "").replace(/"/g, '""') + '"';
    const filas = filasRuleta.map(p => [p.nombre,p.telefono,p.correo,p.municipio,p.evento,p.premio,p.created_at ? new Date(p.created_at).toLocaleString("es-MX") : "",p.acepta_contacto ? "Sí" : "No"]);
    const csv = "\uFEFF" + [columnas, ...filas].map(row => row.map(escapar).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "Registros_Ruleta_Qualitas.csv"; a.click(); URL.revokeObjectURL(url);
  };
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

      <section className="bg-white rounded-3xl shadow-lg p-6 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-[#143B46]">Registros de ruleta</h2><p className="mt-1 text-sm text-slate-500">Consulta de prospectos y premios registrados en las activaciones.</p></div>
          <button type="button" onClick={() => setVistaRuleta(v => !v)} className="rounded-xl bg-[#941B80] px-4 py-2.5 font-bold text-white hover:bg-[#762067]">{vistaRuleta ? "Ocultar registros" : "Consultar registros"}</button>
        </div>
        {vistaRuleta && <div className="mt-5">
          <div className="flex flex-wrap gap-3">
            <label className="relative min-w-[220px] flex-1"><span className="sr-only">Buscar prospectos</span><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar nombre, teléfono, municipio o premio" className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 outline-none focus:border-[#941B80]" /></label>
            <label className="text-sm text-slate-600">Desde <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="ml-2 rounded-lg border border-slate-300 p-2" /></label>
            <label className="text-sm text-slate-600">Hasta <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="ml-2 rounded-lg border border-slate-300 p-2" /></label>
            <button type="button" onClick={cargarRegistrosRuleta} disabled={cargandoRuleta} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 font-semibold disabled:opacity-50"><FaSyncAlt /> {cargandoRuleta ? "Actualizando…" : "Actualizar"}</button>
            <button type="button" onClick={exportarRuleta} disabled={!filasRuleta.length} className="inline-flex items-center gap-2 rounded-xl bg-[#0096AE] px-3 py-2 font-semibold text-white disabled:opacity-50"><FaDownload /> Exportar CSV</button>
          </div>
          {errorRuleta && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{errorRuleta}</p>}
          {!errorRuleta && <p className="mt-3 text-sm text-slate-500">Mostrando {filasRuleta.length} de {prospectos.length} prospectos cargados.</p>}
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[1050px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr>{["Fecha","Nombre","Teléfono","Correo","Municipio","Evento","Premio","Contacto comercial"].map(col => <th key={col} className="whitespace-nowrap px-3 py-3 font-semibold">{col}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">{filasRuleta.map(p => <tr key={p.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-3 py-3">{p.created_at ? new Date(p.created_at).toLocaleString("es-MX") : "—"}</td><td className="px-3 py-3 font-semibold">{p.nombre}</td><td className="px-3 py-3">{p.telefono}</td><td className="px-3 py-3">{p.correo || "—"}</td><td className="px-3 py-3">{p.municipio || "—"}</td><td className="px-3 py-3">{p.evento || "—"}</td><td className="px-3 py-3 font-semibold text-[#941B80]">{p.premio}</td><td className="px-3 py-3">{p.acepta_contacto ? "Sí" : "No"}</td></tr>)}
            {!cargandoRuleta && !errorRuleta && !filasRuleta.length && <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">No hay registros que coincidan con la búsqueda.</td></tr>}</tbody>
          </table></div>
        </div>}
      </section>

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
