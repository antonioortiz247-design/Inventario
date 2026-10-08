import { useState } from "react";
import InventoryForm from "../components/InventoryForm";
import InventoryTable from "../components/InventoryTable";
import ExcelImport from "../components/ExcelImport";
import ExcelExport from "../components/ExcelExport";

export default function Inventario() {
  const [inventario, setInventario] = useState([]);

  const agregarArticulo = (articulo) => {
    setInventario((prev) => [...prev, articulo]);
  };

  const eliminarArticulo = (index) => {
    setInventario((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const importarInventario = (data) => {
    setInventario(data);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6">
        
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <h1 className="text-3xl font-bold text-[#941B80]">
              Inventario
            </h1>

            <div className="flex flex-wrap gap-3">
              <ExcelImport onImport={importarInventario} />

              <ExcelExport
                data={inventario}
                fileName="Inventario_Qualitas"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <InventoryForm onSubmit={agregarArticulo} />
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <InventoryTable
            data={inventario}
            onDelete={eliminarArticulo}
          />
        </div>

      </div>
    </div>
  );
}
