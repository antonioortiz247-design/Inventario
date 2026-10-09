import { useCallback, useEffect, useState } from "react";
import { listarMovimientos, registrarMovimiento } from "../services/movements.service";

const blank = { articuloId: "", tipo: "entrada", cantidad: "1", motivo: "", responsable: "", observaciones: "" };
const fmtDate = (value) => new Date(value).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });

export default function Movimientos({ inventario = [], onUpdated }) {
  const [form, setForm] = useState(blank);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("todos");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(await listarMovimientos()); }
    catch (e) { setError(e.message || "No se pudo cargar el historial."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault(); setError(""); setSuccess("");
    if (!form.articuloId) { setError("Selecciona un artículo."); return; }
    if (!Number.isInteger(Number(form.cantidad)) || Number(form.cantidad) <= 0) { setError("La cantidad debe ser un número entero mayor que cero."); return; }
    if (!form.motivo.trim()) { setError("Indica el motivo del movimiento."); return; }
    setSaving(true);
    try {
      await registrarMovimiento(form);
      setSuccess("Movimiento registrado y existencias actualizadas.");
      setForm((current) => ({ ...blank, articuloId: current.articuloId, tipo: current.tipo, responsable: current.responsable }));
      await Promise.all([load(), onUpdated?.()]);
    } catch (e) { setError(e.message || "No se pudo registrar el movimiento."); }
    finally { setSaving(false); }
  };

  const visible = filter === "todos" ? rows : rows.filter((row) => row.tipo === filter);
  return <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
    <section className="bg-white rounded-3xl shadow-lg p-5 md:p-6">
      <div className="flex flex-wrap justify-between items-start gap-3"><div><h1 className="text-3xl font-bold text-[#941B80]">Entradas y salidas</h1><p className="text-gray-600 mt-1">Registra cada movimiento y conserva su trazabilidad.</p></div><span className="rounded-full bg-teal-50 text-teal-800 px-3 py-1 text-sm">{inventario.length} artículos disponibles</span></div>
      {error && <div role="alert" className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-red-700">{error}</div>}
      {success && <div role="status" className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800">{success}</div>}
      <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Artículo<select required value={form.articuloId} onChange={(e) => setForm({ ...form, articuloId: e.target.value })} className="mt-1 block w-full rounded-xl border border-slate-300 p-3 bg-white"><option value="">Seleccionar artículo…</option>{inventario.map((item) => <option key={item.id} value={item.id}>{item.articulo} — disponibles: {item.cantidad}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Tipo de movimiento<select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="mt-1 block w-full rounded-xl border border-slate-300 p-3 bg-white"><option value="entrada">Entrada · aumenta existencias</option><option value="salida">Salida · reduce existencias</option><option value="ajuste">Ajuste · fija la existencia final</option></select></label>
        <label className="text-sm font-medium text-slate-700">{form.tipo === "ajuste" ? "Existencia final" : "Cantidad"}<input type="number" min="1" step="1" required value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label>
        <label className="text-sm font-medium text-slate-700">Motivo<input required value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ej. Recepción de compra, entrega para evento" className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label>
        <label className="text-sm font-medium text-slate-700">Responsable<input value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} placeholder="Nombre de quien registra" className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label>
        <label className="text-sm font-medium text-slate-700">Observaciones<input value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} placeholder="Opcional" className="mt-1 block w-full rounded-xl border border-slate-300 p-3" /></label>
        <div className="md:col-span-2"><button disabled={saving} className="rounded-xl bg-[#941B80] px-6 py-3 font-semibold text-white hover:bg-[#692D80] disabled:opacity-60">{saving ? "Registrando…" : "Registrar movimiento"}</button><p className="text-xs text-slate-500 mt-2">Las salidas mayores a la existencia disponible se rechazan. El registro y la actualización se procesan en una transacción.</p></div>
      </form>
    </section>
    <section className="bg-white rounded-3xl shadow-lg p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-[#143B46]">Historial de movimientos</h2><p className="text-sm text-slate-500">Últimos 100 movimientos</p></div><select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-slate-300 p-2"><option value="todos">Todos los tipos</option><option value="entrada">Entradas</option><option value="salida">Salidas</option><option value="ajuste">Ajustes</option></select></div>
      {loading ? <p className="py-8 text-center text-slate-500">Cargando historial…</p> : visible.length === 0 ? <p className="py-8 text-center text-slate-500">Todavía no hay movimientos registrados.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-[#143B46] text-white text-left"><th className="p-3">Fecha</th><th className="p-3">Artículo</th><th className="p-3">Tipo</th><th className="p-3">Cantidad</th><th className="p-3">Saldo</th><th className="p-3">Motivo / responsable</th></tr></thead><tbody>{visible.map((row) => <tr key={row.id} className="border-b hover:bg-slate-50"><td className="p-3 whitespace-nowrap">{fmtDate(row.creado_en)}</td><td className="p-3 font-medium">{row.articulo}</td><td className="p-3"><span className={`rounded-full px-2 py-1 ${row.tipo === "entrada" ? "bg-emerald-100 text-emerald-800" : row.tipo === "salida" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>{row.tipo}</span></td><td className="p-3">{row.tipo === "salida" ? "−" : row.tipo === "entrada" ? "+" : "="}{row.cantidad}</td><td className="p-3">{row.existencia_anterior} → {row.existencia_posterior}</td><td className="p-3"><div>{row.motivo}</div><div className="text-slate-500">{row.responsable || "Responsable no indicado"}</div></td></tr>)}</tbody></table></div>}
      <button type="button" onClick={load} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm">Actualizar historial</button>
    </section>
  </main>;
}
