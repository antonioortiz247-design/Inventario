import InventoryForm from "../components/InventoryForm";
import InventoryTable from "../components/InventoryTable";
import ExcelImport from "../components/ExcelImport";
import ExcelExport from "../components/ExcelExport";

export default function Inventario({ inventario = [], resultados = [], search = "", setSearch, onAdd, onDelete, onImport }) {
  const data = search.trim() ? resultados : inventario;
  return (
    <div className="p-6">
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#941B80]">Inventario</h1>
              <p className="text-gray-500 mt-1">{inventario.length} artículos registrados</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ExcelImport onImport={onImport} />
              <ExcelExport data={inventario} fileName="Inventario_Qualitas" />
            </div>
          </div>
          <input value={search} onChange={(e) => setSearch?.(e.target.value)}
            placeholder="Buscar artículo, categoría, ubicación..." className="mt-5 w-full border rounded-xl p-3" />
        </div>
        <div className="bg-white rounded-3xl shadow-lg p-6"><InventoryForm onSubmit={onAdd} /></div>
        <div className="bg-white rounded-3xl shadow-lg p-6"><InventoryTable data={data} onDelete={onDelete} /></div>
      </div>
    </div>
  );
}
