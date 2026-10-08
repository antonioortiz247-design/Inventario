import * as XLSX from "xlsx";

export default function ExcelImport({ onImport }) {
  const importarExcel = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target.result;

      const workbook = XLSX.read(data, {
        type: "binary",
      });

      const sheetName = workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: "",
        }
      );

      onImport?.(jsonData);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <label
      className="
        bg-[#941B80]
        hover:bg-[#692D80]
        text-white
        px-6
        py-3
        rounded-xl
        font-semibold
        cursor-pointer
        transition
        inline-flex
        items-center
        gap-2
      "
    >
      📥 Importar Excel

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={importarExcel}
        className="hidden"
      />
    </label>
  );
}
