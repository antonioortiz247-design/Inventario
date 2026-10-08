import { useState } from "react";
import CameraCapture from "./CameraCapture";

const EMPTY_FORM = {
  articulo: "",
  categoria: "",
  cantidad: "",
  ubicacion: "",
  observaciones: "",
  foto: "",
  stockMinimo: 10,
};

export default function InventoryForm({ onSubmit, initialData = null }) {
  const [form, setForm] = useState(initialData || EMPTY_FORM);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCapture = (foto) => {
    setForm((prev) => ({
      ...prev,
      foto,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.articulo.trim()) return;

    onSubmit?.({
      ...form,
      cantidad: Number(form.cantidad || 0),
      stockMinimo: Number(form.stockMinimo || 10),
      fechaRegistro: new Date().toISOString(),
    });

    setForm(EMPTY_FORM);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <input
          name="articulo"
          value={form.articulo}
          onChange={handleChange}
          placeholder="Artículo"
          className="border rounded-xl p-3"
          required
        />

        <input
          name="categoria"
          value={form.categoria}
          onChange={handleChange}
          placeholder="Categoría"
          className="border rounded-xl p-3"
        />

        <input
          name="cantidad"
          type="number"
          min="0"
          value={form.cantidad}
          onChange={handleChange}
          placeholder="Cantidad"
          className="border rounded-xl p-3"
        />

        <input
          name="stockMinimo"
          type="number"
          min="0"
          value={form.stockMinimo}
          onChange={handleChange}
          placeholder="Stock mínimo"
          className="border rounded-xl p-3"
        />

        <input
          name="ubicacion"
          value={form.ubicacion}
          onChange={handleChange}
          placeholder="Ubicación"
          className="border rounded-xl p-3 md:col-span-2"
        />
      </div>

      <textarea
        name="observaciones"
        value={form.observaciones}
        onChange={handleChange}
        placeholder="Observaciones"
        rows={4}
        className="w-full border rounded-xl p-3"
      />

      <div className="space-y-4">
        <CameraCapture onCapture={handleCapture} />

        {form.foto && (
          <img
            src={form.foto}
            alt="Artículo"
            className="w-48 h-48 object-cover rounded-2xl border-4 border-[#0096AE]"
          />
        )}
      </div>

      <button
        type="submit"
        className="bg-[#941B80] hover:bg-[#692D80] text-white px-8 py-3 rounded-xl font-semibold transition"
      >
        Guardar artículo
      </button>
    </form>
  );
}
