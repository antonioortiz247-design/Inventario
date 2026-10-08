import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QRScanner({ onScan }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan?.(decodedText);
        scanner.clear().catch(() => {});
      },
      () => {}
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="w-full">
      <div
        id="qr-reader"
        className="overflow-hidden rounded-2xl border-4 border-[#0096AE]"
      />
    </div>
  );
}
