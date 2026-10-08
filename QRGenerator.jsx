import { QRCodeSVG } from "qrcode.react";

export default function QRGenerator({
  value,
  size = 150,
}) {
  if (!value) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <QRCodeSVG
        value={String(value)}
        size={size}
        bgColor="#FFFFFF"
        fgColor="#143B46"
        level="M"
        includeMargin
      />

      <span className="text-xs text-gray-500 break-all text-center">
        {value}
      </span>
    </div>
  );
}
