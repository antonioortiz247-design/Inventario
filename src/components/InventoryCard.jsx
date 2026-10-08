export default function InventoryCard({
  item,
  onEdit,
  onDelete,
}) {
  const semaforo =
    Number(item?.cantidad) <= 10
      ? "bg-red-500"
      : Number(item?.cantidad) <= 30
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-200">
      {item?.foto ? (
        <img
          src={item.foto}
          alt={item.articulo bg-slate-100 flex items-center justify-center text-slate-400">
          Sin imagen
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[#143B46]">
            {item?.articulo}
          </h3>

          <span
            className={`w-4 h-4 rounded-full ${semaforo}`}
          />
        </div>

        <div className="space-y-2 text-sm">
          <p>
            <strong>Categoría:</strong>{" "}
            {item?.categoria || "-"}
          </p>

          <p>
            <strong>Cantidad:</strong>{" "}
            {item?.cantidad || 0}
          </p>

          <p>
            <strong>Ubicación:</strong>{" "}
            {item?.ubicacion || "-"}
          </p>
        </div>

        {item?.qr && (
          <div className="mt-4 flex justify-center">
            <img
              src={item.qr    )}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={() => onEdit?.(item)}
            className="flex-1 bg-[#0096AE] hover:bg-[#037081] text-white py-3 rounded-xl font-semibold transition"
          >
            Editar
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(item)}
            className="flex-1 bg-[#941B80] hover:bg-[#692D80] text-white py-3 rounded-xl font-semibold transition"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
