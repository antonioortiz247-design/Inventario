import { useEffect, useState } from "react";
import CameraCapture from "./CameraCapture";

const EMPTY_FORM = {
  articulo: "", categoria: "", cantidad: "", ubicacion: "",
  observaciones: "", foto: "", stockMinimo: 10,
};

export default function InventoryForm({ onSubmit, initialData = null, onCancel, saving = false }) {
  const [form, setForm] = useState(initialData || EMPTY_FORM);

  useEffect(() => {
    setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCapture = (foto) => setForm((prev) => ({ ...prev, foto }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.articulo.trim() || saving) return;
    await onSubmit?.({
      ...form,
      cantidad: Number(form.cantidad || 0),
      stockMinimo: Number(form.stockMinimo ?? 10),
    });
    if (!initialData) setForm(EMPTY_FORM);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <input name="articulo" value={form.articulo || ""} onChange={handleChange} placeholder="Artículo" className="border rounded-xl p-3" required />
        <input name="categoria" value={form.categoria || ""} onChange={handleChange} placeholder="Categoría" className="border rounded-xl p-3" />
        <input name="cantidad" type="number" min="0" value={form.cantidad ?? ""} onChange={handleChange} placeholder="Cantidad" className="border rounded-xl p-3" />
        <input name="stockMinimo" type="number" min="0" value={form.stockMinimo ?? 10} onChange={handleChange} placeholder="Stock mínimo" className="border rounded-xl p-3" />
        <input name="ubicacion" value={form.ubicacion || ""} onChange={handleChange} placeholder="Ubicación" className="border rounded-xl p-3 md:col-span-2" />
      </div>
      <textarea name="observaciones" value={form.observaciones || ""} onChange={handleChange} placeholder="Observaciones" rows={3} className="w-full border rounded-xl p-3" />
      <div className="space-y-3">
        <p className="font-semibold text-gray-700">{form.foto ? "Fotografía del artículo" : "Este artículo aún no tiene fotografía"}</p>
        {form.foto && <img src={form.foto} alt={`Fotografía de ${form.articulo || "artículo"}`} className="w-48 h-48 object-cover rounded-2xl border-4 border-[#0096AE]" />}
        <CameraCapture onCapture={handleCapture} />
        {form.foto && <button type="button" onClick={() => setForm((prev) => ({ ...prev, foto: "" }))} className="ml-2 text-sm text-red-700 underline">Quitar fotografía</button>}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="bg-[#941B80] hover:bg-[#692D80] disabled:opacity-60 text-white px-8 py-3 rounded-xl font-semibold transition">
          {saving ? "Guardando..." : initialData ? "Guardar cambios" : "Agregar artículo"}
        </button>
        {initialData && <button type="button" onClick={onCancel} className="border border-gray-300 px-6 py-3 rounded-xl font-semibold">Cancelar</button>}
      </div>
    </form>
  );
}
