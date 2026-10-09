import { useMemo, useState } from "react";
import { listarReservasActivas } from "../services/events.service";

const pct = (value) => Math.max(0, Number(value) || 0);
const fmt = (value) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(value);

export default function Simulador({ inventario = [] }) {
  const [asistentes, setAsistentes] = useState("100");
  const [colchon, setColchon] = useState("10");
  const [evento, setEvento] = useState("Activación / promoción");
  const [rows, setRows] = useState([{ key: 1, articuloId: "", porPersona: "1", fijo: "0" }]);
  const [reservas, setReservas] = useState({});
  const [reservasLoaded, setReservasLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextKey, setNextKey] = useState(2);

  const loadReservations = async () => {
    setLoading(true); setError("");
    try { setReservas(await listarReservasActivas()); setReservasLoaded(true); }
    catch (e) { setError(e.message || "No se pudieron consultar las reservas activas."); }
    finally { setLoading(false); }
  };

  const estimaciones = useMemo(() => rows.map((row) => {
    const item = inventario.find((entry) => String(entry.id) === String(row.articuloId));
    const personas = Math.max(0, Number(asistentes) || 0);
    const ratio = Math.max(0, Number(row.porPersona) || 0);
    const fijo = Math.max(0, Number(row.fijo) || 0);
    const base = Math.ceil(personas * ratio + fijo);
    const total = Math.ceil(base * (1 + pct(colchon) / 100));
    const stock = Number(item?.cantidad || 0);
    const reservado = Number(reservas[row.articuloId] || 0);
    const disponible = Math.max(0, stock - reservado);
    return { ...row, item, base, total, stock, reservado, disponible, faltante: Math.max(0, total - (reservasLoaded ? disponible : stock)) };
  }), [rows, inventario, asistentes, colchon, reservas, reservasLoaded]);

  const totalPiezas = estimaciones.reduce((sum, row) => sum + (row.item ? row.total : 0), 0);
  const faltantes = estimaciones.filter((row) => row.item && row.faltante > 0);
  const updateRow = (key, patch) => setRows((current) => current.map((row) => row.key === key ? { ...row, ...patch } : row));
  const addRow = () => { setRows((current) => [...current, { key: nextKey, articuloId: "", porPersona: "1", fijo: "0" }]); setNextKey((key) => key + 1); };

  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <section className="rounded-3xl bg-white p-5 shadow-lg md:p-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-[#0096AE]">Planeación de activaciones</p>
      <h1 className="mt-1 text-3xl font-bold text-[#941B80]">Simulador de consumo</h1>
      <p className="mt-2 max-w-3xl text-slate-600">Calcula cantidades estimadas según asistentes, consumo por persona y un margen adicional. Es una simulación: no modifica inventario ni crea reservas.</p>
      {error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">{error}</div>}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">Nombre / tipo de evento<input value={evento} onChange={(e) => setEvento(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3" placeholder="Ej. Verificentro" /></label>
        <label className="text-sm font-medium text-slate-700">Asistentes esperados<input type="number" min="0" step="1" value={asistentes} onChange={(e) => setAsistentes(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
        <label className="text-sm font-medium text-slate-700">Margen de seguridad (%)<input type="number" min="0" max="500" step="1" value={colchon} onChange={(e) => setColchon(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /><span className="mt-1 block text-xs text-slate-500">Ej. 10% para cubrir variaciones o desperdicio.</span></label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={addRow} className="rounded-xl bg-[#941B80] px-4 py-3 font-semibold text-white">Agregar material</button>
        <button type="button" onClick={loadReservations} disabled={loading} className="rounded-xl border border-[#0096AE] px-4 py-3 font-semibold text-[#00788B] disabled:opacity-60">{loading ? "Consultando…" : reservasLoaded ? "Actualizar disponibilidad" : "Consultar reservas activas"}</button>
        <span className="text-xs text-slate-500">Consulta de reservas opcional pero recomendada antes de planear compras o confirmar.</span>
      </div>
    </section>

    <section className="rounded-3xl bg-white p-5 shadow-lg md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold text-[#143B46]">Materiales estimados</h2><p className="text-sm text-slate-500">Define cuántas unidades se esperan por asistente y las piezas fijas adicionales.</p></div><div className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-xs text-slate-500">Piezas estimadas</p><p className="text-2xl font-bold text-[#941B80]">{fmt(totalPiezas)}</p></div></div>
      <div className="mt-4 space-y-3">
        {estimaciones.map((row) => <div key={row.key} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[minmax(180px,1.5fr)_120px_120px_minmax(130px,1fr)]">
          <label className="text-sm font-medium text-slate-700">Artículo<select value={row.articuloId} onChange={(e) => updateRow(row.key, { articuloId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"><option value="">Seleccionar artículo…</option>{inventario.map((item) => <option key={item.id} value={item.id}>{item.articulo} · stock {item.cantidad}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Por persona<input type="number" min="0" step="0.01" value={row.porPersona} onChange={(e) => updateRow(row.key, { porPersona: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
          <label className="text-sm font-medium text-slate-700">Piezas fijas<input type="number" min="0" step="1" value={row.fijo} onChange={(e) => updateRow(row.key, { fijo: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-xs text-slate-500">Estimado con margen</p><p className="text-xl font-bold text-slate-900">{fmt(row.total)} pzas.</p><p className="text-xs text-slate-500">Base: {fmt(row.base)}</p></div><button type="button" onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))} aria-label="Quitar material" className="rounded-lg px-3 py-2 text-sm text-rose-700 hover:bg-rose-50">Quitar</button></div>
          {row.item && <div className="md:col-span-4 grid gap-2 text-sm sm:grid-cols-3"><div className="rounded-lg bg-slate-50 p-3">Stock físico: <strong>{fmt(row.stock)}</strong></div><div className="rounded-lg bg-slate-50 p-3">Reservado en eventos: <strong>{reservasLoaded ? fmt(row.reservado) : "Sin consultar"}</strong><p className="text-xs text-slate-500">Disponible estimado: {reservasLoaded ? fmt(row.disponible) : "stock físico (sin reservas)"}</p></div><div className={"rounded-lg p-3 " + (row.faltante > 0 ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800")}>{row.faltante > 0 ? <>Faltan estimadas: <strong>{fmt(row.faltante)} pzas.</strong></> : <>Cobertura estimada: <strong>Suficiente</strong></>}</div></div>}
        </div>)}
      </div>
      {estimaciones.some((row) => row.item) && <div className="mt-5 rounded-2xl border border-slate-200 p-4"><h3 className="font-bold text-slate-800">Resumen de planeación</h3><p className="mt-1 text-sm text-slate-600">Evento: <strong>{evento || "Sin nombre"}</strong> · Asistentes: <strong>{fmt(Math.max(0, Number(asistentes) || 0))}</strong> · Margen: <strong>{pct(colchon)}%</strong></p>{faltantes.length > 0 ? <p className="mt-2 text-sm font-medium text-rose-700">Hay {faltantes.length} material(es) con posible faltante. Considera reducir cantidades, reutilizar materiales o gestionar reposición.</p> : <p className="mt-2 text-sm font-medium text-emerald-700">Los materiales seleccionados cubren la estimación con los datos de disponibilidad mostrados.</p>}<button type="button" onClick={() => navigator.clipboard?.writeText(["Simulación: " + evento, "Asistentes: " + asistentes, "Margen: " + colchon + "%", "", "Material | Base | Estimado | Stock | Reservado | Faltante", ...estimaciones.filter((row) => row.item).map((row) => [row.item.articulo,row.base,row.total,row.stock,reservasLoaded ? row.reservado : "no consultado",reservasLoaded ? row.faltante : "consultar reservas"].join(" | "))].join("\n"))} className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Copiar resumen</button></div>}
      <p className="mt-4 text-xs text-slate-500">Fórmula: techo((asistentes × consumo por persona) + piezas fijas), aplicado el margen de seguridad. Las tasas son estimaciones que debes ajustar con los resultados reales de tus activaciones.</p>
    </section>
  </main>;
}
