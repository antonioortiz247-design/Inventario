import { QRCodeSVG } from "qrcode.react";

export const generateQRValue = (item) => {
  return JSON.stringify({
    id: item.id,
    articulo: item.articulo,
    categoria: item.categoria,
    fecha: new Date().toISOString(),
  });
};

export const createQRData = (item) => {
  return {
    value: generateQRValue(item),
    size: 150,
    level: "M",
    includeMargin: true,
  };
};

export const parseQRValue = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return {
      rawValue: value,
    };
  }
};

export const findItemByQR = (
  qrValue,
  inventory = []
) => {
  const data = parseQRValue(qrValue);

  if (!data.id) return null;

  return (
    inventory.find(
      (item) => item.id === data.id
    ) || null
  );
};

export const buildQRPayload = (item) => {
  return {
    id: item.id,
    articulo: item.articulo,
    categoria: item.categoria,
    cantidad: item.cantidad,
    ubicacion: item.ubicacion,
  };
};

export {
  QRCodeSVG,
};
