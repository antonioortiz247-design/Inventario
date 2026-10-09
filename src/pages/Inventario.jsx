import { useState } from "react";
import InventoryForm from "../components/InventoryForm";
import InventoryTable from "../components/InventoryTable";
import ExcelImport from "../components/ExcelImport";
import ExcelExport from "../components/ExcelExport";
import { getItemById } from "../services/inventory.service";

export default function Inventario({ inventario = [], resultados = [], search = "", setSearch, loading = false, onAdd, onUpdate, onDelete, onImport }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [pageError, setPageError] = useState("");
  const data = search.trim() ? resultados : inventario;

  const handleEdit = async (item) => {
    setPageError("");
    setLoadingPhoto(true);
    try {
      const fullItem = await getItemById(item.id);
      setEditing(fullItem || item);
    } catch (error) {
      setPageError(error.message || "No se pudo cargar la fotografía del artículo.");
    } finally {
      setLoadingPhoto(false);
    }
  };

  const handleSubmit = async (item) => {
    setSaving(true); setPageError("");
    try { if (editing) { await onUpdate?.(editing.id, item); setEditing(null); } else { await onAdd?.(item); } }
    catch (error) { setPageError(error.message || "No se pudo guardar el artículo."); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 md:p-6"><div className="flex flex-col gap-6">
      <section className="bg-white rounded-3xl shadow-lg p-5 md:p-6">
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div><h1 className="text-3xl font-bold text-[#941B80]">Inventario</h1><p className="text-gray-500 mt-1">{inventario.length} artículos registrados</p></div>
          <div className="flex flex-wrap gap-3"><ExcelImport onImport={onImport} /><ExcelExport data={inventario} fileName="Inventario_Qualitas" /></div>
        </div>
        <input value={search} onChange={(e) => setSearch?.(e.target.value)} placeholder="Buscar artículo, categoría, ubicación..." className="mt-5 w-full border rounded-xl p-3" />
      </section>
      {pageError && <div role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4">{pageError}</div>}
      <section className="bg-white rounded-3xl shadow-lg p-5 md:p-6">
        <h2 className="text-xl font-bold text-[#143B46] mb-4">{editing ? `Editar: ${editing.articulo}` : "Agregar artículo"}</h2>
        {loadingPhoto ? <p className="py-6 text-gray-500">Cargando datos y fotografía...</p> : <InventoryForm key={editing?.id || "new-item"} initialData={editing} onSubmit={handleSubmit} onCancel={() => setEditing(null)} saving={saving} /> }
      </section>
      <section className="bg-white rounded-3xl shadow-lg p-5 md:p-6"><h2 className="text-xl font-bold text-[#143B46] mb-4">Inventario actual</h2>
        {loading ? <p className="py-8 text-center text-gray-500">Cargando inventario desde la base de datos...</p> : <InventoryTable data={data} onEdit={handleEdit} onDelete={onDelete} /> }
      </section>
    </div></div>
  );
}
