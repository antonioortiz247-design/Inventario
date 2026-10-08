import { useRef } from "react";

export default function CameraCapture({ onCapture }) {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      onCapture?.(reader.result);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="bg-[#0096AE] text-white px-6 py-3 rounded-xl font-semibold"
      >
        📷 Tomar foto
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
