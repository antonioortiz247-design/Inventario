import * as XLSX from "xlsx";

export const exportToExcel = (
  data,
  fileName = "Inventario_Qualitas"
) => {
  try {
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

    return {
      success: true,
      message: "Archivo exportado correctamente.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Error al exportar archivo.",
    };
  }
};

export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No se seleccionó archivo."));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(
          event.target.result,
          {
            type: "binary",
          }
        );

        const sheetName =
          workbook.SheetNames[0];

        const worksheet =
          workbook.Sheets[sheetName];

        const data =
          XLSX.utils.sheet_to_json(
            worksheet,
            {
              defval: "",
            }
          );

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(
        new Error(
          "No fue posible leer el archivo."
        )
      );
    };

    reader.readAsBinaryString(file);
  });
};

export const generateInventoryTemplate = () => {
  const template = [
    {
      articulo: "",
      categoria: "",
      cantidad: 0,
      stockMinimo: 10,
      ubicacion: "",
      observaciones: "",
    },
  ];

  exportToExcel(
    template,
    "Plantilla_Inventario_Qualitas"
  );
};
