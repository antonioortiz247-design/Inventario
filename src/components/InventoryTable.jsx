import { useEffect, useRef, useState } from "react";
import { getItemById, updateItem } from "../services/inventory.service";

function InventoryThumbnail({ item }) {
  const hostRef = useRef(null);
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let started = false;
    const host = hostRef.current;
    if (!host) return undefined;

    const load = async () => {
      if (started) return;
      started = true;
      try {
        const fullItem = await getItemById(item.id);
        if (active && fullItem?.foto) setSrc(fullItem.foto);
        else if (active) setFailed(true);
      } catch {
        if (active) setFailed(true);
      }
    };

    if (typeof IntersectionObserver === "undefined") {
      load();
      return () => { active = false; };
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        load();
      }
    }, { rootMargin: "120px" });
    observer.observe(host);
    return () => { active = false; observer.disconnect(); };
  }, [item.id]);

  return (
    <div ref={hostRef} className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      {src ? (
        <img src={src} alt={`Fotografía de ${item.articulo || "artículo"}`} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="text-xl" aria-label={failed ? "Sin fotografía" : "Cargando fotografía"}>{failed ? "—" : "…"}</span>
      )}
    </div>
  );
}

const statusFor = (item) => {
  const quantity = Number(item.cantidad || 0);
  const minimum = Number(item.stockMinimo ?? item.stock_minimo ?? 10);
  if (quantity <= 0) return { label: "Agotado", classes: "bg-rose-100 text-rose-800" };
  if (quantity <= minimum) return { label: "Stock bajo", classes: "bg-amber-100 text-amber-800" };
  if (quantity <= minimum * 2) return { label: "En observación", classes: "bg-sky-100 text-sky-800" };
  return { label: "Disponible", classes: "bg-emerald-100 text-emerald-800" };
};

export default function InventoryTable({ data = [], onEdit, onDelete }) {
  const [deletingId, setDeletingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [tableError, setTableError] = useState("");
  const [tableMessage, setTableMessage] = useState("");

  const getQuantity = (item) => quantities[item.id] ?? String(Number(item.cantidad || 0));

  const handleQuantityChange = (id, value) => {
    setQuantities((current) => ({ ...current, [id]: value }));
    setTableMessage("");
    setTableError("");
  };

  const handleUpdateQuantity = async (item) => {
    const rawValue = getQuantity(item).trim();
    const quantity = Number(rawValue);
    if (rawValue === "" || !Number.isSafeInteger(quantity) || quantity < 0) {
      setTableError("La existencia debe ser un número entero igual o mayor que cero.");
      setTableMessage("");
      return;
    }
    if (quantity === Number(item.cantidad || 0)) {
      setTableMessage("La existencia no ha cambiado.");
      setTableError("");
      return;
    }
    const confirmed = window.confirm(`¿Cambiar la existencia de “${item.articulo}” de ${Number(item.cantidad || 0)} a ${quantity}? Este ajuste modifica directamente el inventario.`);
    if (!confirmed) return;

    setSavingId(item.id);
    setTableError("");
    setTableMessage("");
    try {
      await updateItem(item.id, { cantidad: quantity });
      setTableMessage(`Existencia de “${item.articulo}” actualizada. Recargando inventario…`);
      window.location.reload();
    } catch (error) {
      setTableError(error.message || "No se pudo actualizar la existencia.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`¿Eliminar “${item.articulo}”? Esta acción no se puede deshacer.`);
    if (!confirmed) return;
    setDeletingId(item.id);
    setTableError("");
    setTableMessage("");
    try {
      await onDelete?.(item.id);
    } catch (error) {
      setTableError(error.message || "No se pudo eliminar el artículo.");
    } finally {
      setDeletingId(null);
    }
  };

  if (data.length === 0) {
    return <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center"><p className="font-semibold text-slate-700">No encontramos artículos</p><p className="mt-1 text-sm text-slate-500">Prueba con otra búsqueda o cambia los filtros.</p></div>;
  }

  return <div>
    {tableError && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{tableError}</div>}
    {tableMessage && <div role="status" className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{tableMessage}</div>}
    <div className="mb-3 flex items-center justify-between text-sm text-slate-500"><span>{data.length} resultado{data.length === 1 ? "" : "s"}</span><span className="hidden sm:inline">Puedes ajustar existencias directamente en la tabla</span></div>
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead><tr className="bg-[#143B46] text-white"><th className="px-4 py-3 font-semibold">Foto</th><th className="px-4 py-3 font-semibold">Artículo</th><th className="px-4 py-3 font-semibold">Categoría</th><th className="px-4 py-3 font-semibold">Existencias</th><th className="px-4 py-3 font-semibold">Ubicación</th><th className="px-4 py-3 font-semibold">Estado</th><th className="px-4 py-3 font-semibold">Acciones</th></tr></thead>
        <tbody>{data.map((item) => {
          const status = statusFor({ ...item, cantidad: getQuantity(item) });
          const saving = savingId === item.id;
          return <tr key={item.id} className="border-t border-slate-100 odd:bg-white even:bg-slate-50/70 hover:bg-teal-50/60">
            <td className="px-4 py-4"><InventoryThumbnail item={item} /></td><td className="px-4 py-4"><div className="font-semibold text-slate-800">{item.articulo || "Artículo sin nombre"}</div>{item.observaciones && <div className="mt-1 max-w-[240px] truncate text-xs text-slate-500">{item.observaciones}</div>}</td>
            <td className="px-4 py-4 text-slate-600">{item.categoria || "—"}</td>
            <td className="px-4 py-4"><div className="flex items-center gap-2"><input aria-label={`Existencias de ${item.articulo}`} type="number" min="0" step="1" inputMode="numeric" value={getQuantity(item)} onChange={(event) => handleQuantityChange(item.id, event.target.value)} className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-lg font-bold tabular-nums text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200" /><span className="whitespace-nowrap text-xs text-slate-500">mín. {Number(item.stockMinimo ?? item.stock_minimo ?? 10)}</span></div></td>
            <td className="px-4 py-4 text-slate-600">{item.ubicacion || "Sin ubicación"}</td>
            <td className="px-4 py-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span></td>
            <td className="px-4 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onEdit?.(item)} className="rounded-lg border border-[#0096AE] px-3 py-2 font-semibold text-[#00788B] hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500">Editar</button><button type="button" disabled={saving || getQuantity(item).trim() === "" || Number(getQuantity(item)) === Number(item.cantidad || 0)} onClick={() => handleUpdateQuantity(item)} className="rounded-lg bg-[#0096AE] px-3 py-2 font-semibold text-white hover:bg-[#007F93] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Actualizando…" : "Actualizar"}</button><button type="button" disabled={deletingId === item.id || saving} onClick={() => handleDelete(item)} className="rounded-lg border border-rose-200 px-3 py-2 font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">{deletingId === item.id ? "Eliminando…" : "Eliminar"}</button></div></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  </div>;
}
