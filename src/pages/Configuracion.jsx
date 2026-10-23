export default function Configuracion() {
  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-[#941B80] mb-6">
          Configuración
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-2">
              Nombre del inventario
            </label>
            <input
              type="text"
              placeholder="Inventario Quálitas"
              className="w-full border rounded-xl p-3"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">
              Stock mínimo por defecto
            </label>
            <input
              type="number"
              placeholder="10"
              className="w-full border rounded-xl p-3"
            />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="notificaciones" />
            <label htmlFor="notificaciones">
              Activar alertas de stock bajo
            </label>
          </div>

          <button className="bg-[#0096AE] text-white px-6 py-3 rounded-xl font-semibold">
            Guardar configuración
          </button>
        </div>
      </div>
    </div>
  );
}
