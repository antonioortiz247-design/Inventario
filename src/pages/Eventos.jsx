import { useCallback, useEffect, useState } from "react";
import { agregarMaterialEvento, actualizarEvento, cancelarEvento, confirmarEvento, crearEvento, eliminarEvento, entregarMaterialEvento, finalizarEvento, listarEventos, listarMaterialesEvento } from "../services/events.service";

const today = () => new Date().toLocaleDateString("en-CA");
const statusLabel = { borrador: "Borrador", confirmado: "Confirmado", en_curso: "En curso", finalizado: "Finalizado", cancelado: "Cancelado" };
const statusClass = { borrador: "bg-slate-100 text-slate-700", confirmado: "bg-sky-100 text-sky-800", en_curso: "bg-amber-100 text-amber-800", finalizado: "bg-emerald-100 text-emerald-800", cancelado: "bg-rose-100 text-rose-800" };
const blank = { nombre: "", fecha_evento: today(), ubicacion: "", responsable: "", notas: "" };

export default function Eventos({ inventario = [], onUpdated }) {
  const [eventos, setEventos] = useState([]);
  const [selected, setSelected] = useState("");
  const [materiales, setMateriales] = useState([]);
  const [form, setForm] = useState(blank);\n  const [editingId, setEditingId] = useState("");
  const [materialForm, setMaterialForm] = useState({ articuloId: "", cantidad: "1" });
  const [dispatchQty, setDispatchQty] = useState({});
  const [dispatchInfo, setDispatchInfo] = useState({ responsable: "", observaciones: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadEvents = useCallback(async (preferredId = selected) => {
    setLoading(true);
    try {
      const data = await listarEventos();
      setEventos(data);
      const nextId = data.some((event) => event.id === preferredId) ? preferredId : (data[0]?.id || "");
      setSelected(nextId);
      if (nextId) setMateriales(await listarMaterialesEvento(nextId));
      else setMateriales([]);
    } catch (e) { setError(e.message || "No se pudieron cargar los eventos."); }
    finally { setLoading(false); }
  }, [selected]);

  useEffect(() => { loadEvents(""); }, []);

  const refreshSelected = async (id = selected) => {
    await loadEvents(id);
    await onUpdated?.();
  };

  const submitCreate = async (event) => {
    event.preventDefault(); setError(""); setSuccess("");
    if (!form.nombre.trim()) { setError("Escribe el nombre del evento."); return; }
    setSaving(true);
    try {
      const created = await crearEvento(form);
      setForm(blank); setSuccess("Evento creado. Agrega los materiales y confirma cuando esté listo.");
      await loadEvents(created.id);
    } catch (e) { setError(e.message || "No se pudo crear el evento."); }
    finally { setSaving(false); }
  };

  const addMaterial = async (event) => {
    event.preventDefault(); setError(""); setSuccess("");
    if (!selected || !materialForm.articuloId) { setError("Selecciona un artículo."); return; }
    setSaving(true);
    try {
      await agregarMaterialEvento(selected, materialForm.articuloId, materialForm.cantidad);
      setMaterialForm((prev) => ({ ...prev, cantidad: "1" }));
      setSuccess("Material agregado al evento. Aún no se ha descontado del inventario.");
      await loadEvents(selected);
    } catch (e) { setError(e.message || "No se pudo agregar el material."); }
    finally { setSaving(false); }
  };

  const action = async (fn, successText) => {
    setError(""); setSuccess(""); setSaving(true);
    try { await fn(); setSuccess(successText); await refreshSelected(); }
    catch (e) { setError(e.message || "No se pudo completar la operación."); }
    finally { setSaving(false); }
  };

  const selectedEvent = eventos.find((event) => event.id === selected);
  const reserved = materiales.reduce((sum, item) => sum + Number(item.cantidad_reservada || 0), 0);
  const delivered = materiales.reduce((sum, item) => sum + Number(item.cantidad_entregada || 0), 0);
  const remaining = materiales.reduce((sum, item) => sum + Number(item.cantidad_reservada || 0) - Number(item.cantidad_entregada || 0), 0);

  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <section className="rounded-3xl bg-white p-5 shadow-lg md:p-6">
      <p className="text-sm font-semibold uppercase tracking-wider text-[#0096AE]">Planeación y control</p>
      <h1 className="mt-1 text-3xl font-bold text-[#941B80]">Modo evento</h1>
      <p className="mt-2 max-w-3xl text-slate-600">Planea los materiales y reserva existencias al confirmar. El inventario físico solo disminuye cuando registras una entrega real.</p>
      {error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">{error}</div>}
      {success && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">{success}</div>}
      <form onSubmit={submitCreate} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 lg:grid-cols-3">
        <h2 className="text-lg font-bold text-slate-800 md:col-span-2 lg:col-span-3">{editingId ? "Editar evento" : "Crear evento"}</h2>
        <label className="text-sm font-medium text-slate-700">Nombre del evento<input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Activación en verificentro" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3" /></label>
        <label className="text-sm font-medium text-slate-700">Fecha<input type="date" required value={form.fecha_evento} onChange={(e) => setForm({ ...form, fecha_evento: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3" /></label>
        <label className="text-sm font-medium text-slate-700">Ubicación<input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} placeholder="Sede o municipio" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3" /></label>
        <label className="text-sm font-medium text-slate-700">Responsable<input value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} placeholder="Nombre responsable" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3" /></label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">Notas<textarea rows="2" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Objetivo, equipo, detalles…" className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3" /></label>
        <div className="flex items-end"><button disabled={saving} className="w-full rounded-xl bg-[#941B80] px-4 py-3 font-semibold text-white disabled:opacity-60">{saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear borrador"}</button></div>
      </form>
    </section>

    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-3xl bg-white p-5 shadow-lg md:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-[#143B46]">Eventos</h2><button type="button" onClick={() => loadEvents(selected)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Actualizar</button></div>
        {loading ? <p className="py-8 text-center text-slate-500">Cargando eventos…</p> : eventos.length === 0 ? <p className="py-8 text-center text-slate-500">Todavía no hay eventos. Crea un borrador para comenzar.</p> : <div className="mt-4 space-y-2">{eventos.map((event) => <button key={event.id} type="button" onClick={async () => { setSelected(event.id); setError(""); try { setMateriales(await listarMaterialesEvento(event.id)); } catch (e) { setError(e.message); } }} className={`w-full rounded-2xl border p-4 text-left transition ${selected === event.id ? "border-[#941B80] bg-fuchsia-50 ring-1 ring-[#941B80]" : "border-slate-200 hover:bg-slate-50"}`}><div className="flex items-start justify-between gap-3"><span className="font-semibold text-slate-800">{event.nombre}</span><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[event.estado] || statusClass.borrador}`}>{statusLabel[event.estado] || event.estado}</span></div><p className="mt-1 text-sm text-slate-500">{event.fecha_evento}{event.ubicacion ? " · " + event.ubicacion : ""}</p></button>)}</div>}
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-lg md:p-6">
        {!selectedEvent ? <div className="py-12 text-center text-slate-500">Selecciona o crea un evento para administrar sus materiales.</div> : <>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-[#0096AE]">{selectedEvent.fecha_evento} · {selectedEvent.ubicacion || "Ubicación por definir"}</p><h2 className="mt-1 text-2xl font-bold text-[#941B80]">{selectedEvent.nombre}</h2><p className="mt-1 text-sm text-slate-500">Responsable: {selectedEvent.responsable || "Sin asignar"}</p>{selectedEvent.notas && <p className="mt-2 text-sm text-slate-600">{selectedEvent.notas}</p>}</div><span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClass[selectedEvent.estado] || statusClass.borrador}`}>{statusLabel[selectedEvent.estado] || selectedEvent.estado}</span></div>
          <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Reservado</p><p className="text-xl font-bold">{reserved}</p></div><div className="rounded-xl bg-teal-50 p-3"><p className="text-xs text-teal-700">Entregado</p><p className="text-xl font-bold text-teal-900">{delivered}</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-xs text-amber-700">Pendiente</p><p className="text-xl font-bold text-amber-900">{remaining}</p></div></div>
          {selectedEvent.estado === "borrador" && <form onSubmit={addMaterial} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[1fr_110px_auto]"><label className="text-sm font-medium text-slate-700">Material<select required value={materialForm.articuloId} onChange={(e) => setMaterialForm({ ...materialForm, articuloId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"><option value="">Seleccionar…</option>{inventario.map((item) => <option key={item.id} value={item.id}>{item.articulo} · físico: {item.cantidad}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Cantidad<input type="number" min="1" step="1" required value={materialForm.cantidad} onChange={(e) => setMaterialForm({ ...materialForm, cantidad: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 p-3" /></label><div className="flex items-end"><button disabled={saving} className="w-full rounded-xl border border-[#0096AE] px-4 py-3 font-semibold text-[#00788B] disabled:opacity-60">Agregar</button></div></form>}
          <div className="mt-5 space-y-3">{materiales.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Agrega los materiales que necesitarás.</p> : materiales.map((mat) => { const pending = Number(mat.cantidad_reservada) - Number(mat.cantidad_entregada); return <div key={mat.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-slate-800">{mat.articulo}</p><p className="text-xs text-slate-500">{mat.categoria || "Sin categoría"} · físico actual: {mat.existencia}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm">Reservado: {mat.cantidad_reservada}</span></div><div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600"><span>Entregado: <strong>{mat.cantidad_entregada}</strong></span><span>Pendiente: <strong>{pending}</strong></span></div>{["confirmado","en_curso"].includes(selectedEvent.estado) && pending > 0 && <form onSubmit={(e) => { e.preventDefault(); const qty = Number(dispatchQty[mat.id] || pending); if (!Number.isInteger(qty) || qty < 1) { setError("La cantidad a entregar debe ser un entero mayor que cero."); return; } action(() => entregarMaterialEvento(mat.id, qty, dispatchInfo.responsable || selectedEvent.responsable, dispatchInfo.observaciones), "Entrega registrada y existencias físicas descontadas."); }} className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr_auto]"><label className="text-xs text-slate-500">Entregar<input type="number" min="1" max={pending} step="1" value={dispatchQty[mat.id] ?? String(pending)} onChange={(e) => setDispatchQty({ ...dispatchQty, [mat.id]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" /></label><div className="grid gap-2 sm:grid-cols-2"><label className="text-xs text-slate-500">Responsable entrega<input value={dispatchInfo.responsable} onChange={(e) => setDispatchInfo({ ...dispatchInfo, responsable: e.target.value })} placeholder={selectedEvent.responsable || "Nombre"} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" /></label><label className="text-xs text-slate-500">Observaciones<input value={dispatchInfo.observaciones} onChange={(e) => setDispatchInfo({ ...dispatchInfo, observaciones: e.target.value })} placeholder="Opcional" className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" /></label></div><div className="flex items-end"><button disabled={saving} className="w-full rounded-lg bg-[#0096AE] px-3 py-2 font-semibold text-white disabled:opacity-60">Registrar entrega</button></div></form>}</div>; })}</div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            {!["finalizado","cancelado"].includes(selectedEvent.estado) && <button type="button" disabled={saving} onClick={() => { setForm({ nombre: selectedEvent.nombre || "", fecha_evento: selectedEvent.fecha_evento || today(), ubicacion: selectedEvent.ubicacion || "", responsable: selectedEvent.responsable || "", notas: selectedEvent.notas || "" }); setEditingId(selectedEvent.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-xl border border-[#0096AE] px-4 py-3 font-semibold text-[#00788B]">Editar datos</button>}
            {!["finalizado","cancelado"].includes(selectedEvent.estado) && <button type="button" disabled={saving} onClick={() => { if (window.confirm("¿Eliminar definitivamente este evento? Las cantidades entregadas se reintegrarán al inventario mediante movimientos de entrada y las reservas pendientes se liberarán.")) action(() => eliminarEvento(selected), "Evento eliminado. Las cantidades entregadas fueron reintegradas al inventario y las reservas liberadas."); }} className="rounded-xl border border-rose-300 px-4 py-3 font-semibold text-rose-700">Eliminar evento</button>}
            {["confirmado","en_curso"].includes(selectedEvent.estado) && <button type="button" disabled={saving} onClick={() => { if (window.confirm("¿Marcar el evento como terminado? No se devolverán al inventario los materiales ya entregados. Las cantidades pendientes dejarán de estar reservadas.")) action(() => finalizarEvento(selected), "Evento marcado como terminado. No se reintegró material al inventario."); }} className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white">Marcar como terminado</button>}{selectedEvent.estado === "borrador" && <button type="button" disabled={saving || materiales.length === 0} onClick={() => action(() => confirmarEvento(selected), "Evento confirmado: los materiales quedaron reservados, sin descontar el stock físico.")} className="rounded-xl bg-[#941B80] px-4 py-3 font-semibold text-white disabled:opacity-50">Confirmar y reservar</button>}{["borrador","confirmado"].includes(selectedEvent.estado) && <button type="button" disabled={saving} onClick={() => { if (window.confirm("¿Cancelar este evento y liberar sus reservas?")) action(() => cancelarEvento(selected), "Evento cancelado; sus reservas quedaron liberadas."); }} className="rounded-xl border border-rose-200 px-4 py-3 font-semibold text-rose-700 disabled:opacity-50">Cancelar evento</button>}{selectedEvent.estado === "finalizado" && <p className="self-center text-sm font-medium text-emerald-700">Todas las cantidades reservadas fueron entregadas.</p>}</div>
          <p className="mt-3 text-xs text-slate-500">La reserva se valida en Supabase al confirmar, considerando otros eventos activos. El inventario solo se descuenta al registrar cada entrega.</p>
        </>}
      </div>
    </section>
  </main>;
}
