import * as XLSX from "xlsx";

export default function ExcelExport({ data = [], fileName = "Inventario_Qualitas" }) {
  const exportarExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Inventario"
    );

    XLSX.writeFile(
      workbook,
      `${fileName}.xlsx`
    );
  };

  return (
    <button
      type="button"
      onClick={exportarExcel}
      className="bg-[#0096AE] hover:bg-[#037081] text-white px-6 py-3 rounded-xl font-semibold transition"
    >
      📊 Exportar Excel
    </button>
  );
}
