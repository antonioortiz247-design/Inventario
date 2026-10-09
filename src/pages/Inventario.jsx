import { useMemo, useState } from "react";
import InventoryForm from "../components/InventoryForm";
import InventoryTable from "../components/InventoryTable";
import ExcelImport from "../components/ExcelImport";
import ExcelExport from "../components/ExcelExport";
import { getItemById } from "../services/inventory.service";

export default function Inventario({ inventario = [], resultados = [], search = "", setSearch, loading = false, onAdd, onUpdate, onDelete, onImport }) {
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [pageError, setPageError] = useState("");
  const [category, setCategory] = useState("todas");
  const [stockFilter, setStockFilter] = useState("todos");

  const categories = useMemo(() => [...new Set(inventario.map((item) => item.categoria?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")), [inventario]);
  const data = useMemo(() => {
    const base = search.trim() ? resultados : inventario;
    return base.filter((item) => {
      const categoryMatch = category === "todas" || item.categoria === category;
      const quantity = Number(item.cantidad || 0);
      const minimum = Number(item.stockMinimo ?? item.stock_minimo ?? 10);
      const stockMatch = stockFilter === "todos" || (stockFilter === "agotado" && quantity <= 0) || (stockFilter === "bajo" && quantity > 0 && quantity <= minimum) || (stockFilter === "disponible" && quantity > minimum);
      return categoryMatch && stockMatch;
    });
  }, [inventario, resultados, search, category, stockFilter]);

  const openNew = () => { setEditing(null); setPageError(""); setFormOpen(true); };
  const handleEdit = async (item) => {
    setPageError(""); setLoadingPhoto(true); setFormOpen(true);
    try {
      const fullItem = await getItemById(item.id);
      setEditing(fullItem || item);
    } catch (error) {
      setPageError(error.message || "No se pudo cargar la fotografía del artículo.");
      setFormOpen(false);
    } finally { setLoadingPhoto(false); }
  };

  const handleSubmit = async (item) => {
    setSaving(true); setPageError("");
    try {
      if (editing) await onUpdate?.(editing.id, item);
      else await onAdd?.(item);
      setFormOpen(false); setEditing(null);
    } catch (error) { setPageError(error.message || "No se pudo guardar el artículo."); }
    finally { setSaving(false); }
  };

  const closeForm = () => { if (!saving) { setFormOpen(false); setEditing(null); } };

  return <main className="mx-auto max-w-[1440px] space-y-5 p-4 md:p-6">
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-[#0096AE]">Control de materiales</p><h1 className="mt-1 text-3xl font-bold text-[#941B80]">Inventario</h1><p className="mt-1 text-slate-500">{inventario.length} artículos registrados · consulta y administra existencias</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={openNew} className="rounded-xl bg-[#941B80] px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-[#762067] focus:outline-none focus:ring-2 focus:ring-fuchsia-400">＋ Agregar artículo</button><ExcelImport onImport={onImport} /><ExcelExport data={inventario} fileName="Inventario_Qualitas" /></div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Artículos registrados</p><p className="mt-1 text-2xl font-bold text-slate-900">{inventario.length}</p></div>
        <div className="rounded-2xl bg-teal-50 p-4"><p className="text-sm text-teal-800">Piezas disponibles</p><p className="mt-1 text-2xl font-bold text-teal-900">{inventario.reduce((sum, item) => sum + Number(item.cantidad || 0), 0).toLocaleString("es-MX")}</p></div>
        <div className="rounded-2xl bg-amber-50 p-4"><p className="text-sm text-amber-800">Requieren atención</p><p className="mt-1 text-2xl font-bold text-amber-900">{inventario.filter((item) => Number(item.cantidad || 0) <= Number(item.stockMinimo ?? item.stock_minimo ?? 10)).length}</p></div>
      </div>
    </section>

    {pageError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{pageError}</div>}

    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block flex-1"><span className="sr-only">Buscar inventario</span><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span><input value={search} onChange={(e) => setSearch?.(e.target.value)} placeholder="Buscar por artículo, categoría, ubicación u observaciones…" className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-[#0096AE] focus:ring-2 focus:ring-teal-100" /></label>
        <label className="text-sm text-slate-600">Categoría<select value={category} onChange={(e) => setCategory(e.target.value)} className="ml-2 rounded-xl border border-slate-300 bg-white p-3"><option value="todas">Todas</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="text-sm text-slate-600">Existencias<select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="ml-2 rounded-xl border border-slate-300 bg-white p-3"><option value="todos">Todos</option><option value="agotado">Agotados</option><option value="bajo">Stock bajo</option><option value="disponible">Sobre mínimo</option></select></label>
      </div>
      {(search || category !== "todas" || stockFilter !== "todos") && <button type="button" onClick={() => { setSearch?.(""); setCategory("todas"); setStockFilter("todos"); }} className="mt-3 text-sm font-semibold text-[#00788B] underline">Limpiar filtros</button>}
    </section>

    {formOpen && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 pt-6 backdrop-blur-sm md:p-8"><section role="dialog" aria-modal="true" aria-labelledby="inventory-form-title" className="my-auto w-full max-w-3xl rounded-3xl bg-white p-5 shadow-2xl md:p-7"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#0096AE]">{editing ? "Actualizar registro" : "Nuevo registro"}</p><h2 id="inventory-form-title" className="mt-1 text-2xl font-bold text-[#941B80]">{editing ? `Editar: ${editing.articulo}` : "Agregar artículo"}</h2><p className="mt-1 text-sm text-slate-500">Completa los datos y guarda para sincronizar con Supabase.</p></div><button type="button" onClick={closeForm} aria-label="Cerrar formulario" className="rounded-full p-2 text-2xl leading-none text-slate-500 hover:bg-slate-100">×</button></div>{loadingPhoto ? <div className="py-12 text-center text-slate-500">Cargando datos y fotografía…</div> : <InventoryForm key={editing?.id || "new-item"} initialData={editing} onSubmit={handleSubmit} onCancel={closeForm} saving={saving} />}</section></div>}

    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold text-[#143B46]">Existencias actuales</h2><p className="mt-1 text-sm text-slate-500">Consulta cantidades, ubicación y estado de cada artículo.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{data.length} de {inventario.length}</span></div>{loading ? <div className="py-12 text-center text-slate-500">Cargando inventario…</div> : <InventoryTable data={data} onEdit={handleEdit} onDelete={onDelete} />}</section>
  </main>;
}
