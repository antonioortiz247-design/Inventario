import { FaBoxes, FaQrcode, FaChartBar, FaCog } from "react-icons/fa";

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-[#941B80] via-[#692D80] to-[#0096AE] shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          <div>
            <h1 className="text-3xl font-bold text-white">
              Inventario Quálitas
            </h1>

            <p className="text-white/80">
              Gestión de promocionales y materiales
            </p>
          </div>

          <nav className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl transition">
              <FaBoxes />
              Inventario
            </button>

            <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl transition">
              <FaQrcode />
              Escáner
            </button>

            <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl transition">
              <FaChartBar />
              Reportes
            </button>

            <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl transition">
              <FaCog />
              Configuración
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
