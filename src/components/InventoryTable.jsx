export default function InventoryTable({ data = [], onEdit, onDelete }) {
  const getSemaforo = (cantidad, minimo = 10) => {
    if (cantidad <= minimo) return "🔴";
    if (cantidad <= minimo * 2) return "🟡";
    return "🟢";
  };

  if (data.length === 0) {
    return <div className="text-center py-12 text-gray-500">No hay artículos registrados.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr className="bg-[#143B46] text-white">
          <th className="p-4 text-left">Estado</th><th className="p-4 text-left">Artículo</th><th className="p-4 text-left">Categoría</th>
          <th className="p-4 text-left">Cantidad</th><th className="p-4 text-left">Ubicación</th><th className="p-4 text-left">Acciones</th>
        </tr></thead>
        <tbody>{data.map((item) => (
          <tr key={item.id} className="border-b hover:bg-slate-50">
            <td className="p-4 text-xl">{getSemaforo(Number(item.cantidad || 0), Number(item.stockMinimo || 10))}</td>
            <td className="p-4 font-medium">{item.articulo}</td><td className="p-4">{item.categoria || "-"}</td>
            <td className="p-4 font-bold">{item.cantidad}</td><td className="p-4">{item.ubicacion || "-"}</td>
            <td className="p-4"><div className="flex gap-2">
              {onEdit && <button type="button" onClick={() => onEdit(item)} className="bg-[#0096AE] hover:bg-[#037081] text-white px-4 py-2 rounded-lg transition">Editar</button>}
              <button type="button" onClick={() => onDelete?.(item.id)} className="bg-[#941B80] hover:bg-[#692D80] text-white px-4 py-2 rounded-lg transition">Eliminar</button>
            </div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
