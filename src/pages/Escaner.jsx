import QRScanner from "../components/QRScanner";

export default function Escaner() {
  const handleScan = (codigo) => {
    console.log("QR detectado:", codigo);

    // Aquí posteriormente buscaremos el artículo
    // en el inventario mediante su ID o QR.
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-[#941B80] mb-2">
          Escáner QR
        </h1>

        <p className="text-gray-600 mb-6">
          Escanea el código QR de un promocional para consultar su información.
        </p>

        <QRScanner onScan={handleScan} />
      </div>
    </div>
  );
}
