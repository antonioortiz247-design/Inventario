import { FaBoxes, FaChartBar, FaCog, FaHome, FaCamera, FaExchangeAlt } from "react-icons/fa";

export default function Header({ currentPage = "inicio", onNavigate }) {
  const menu = [
    ["inicio", "Inicio", <FaHome />],
    ["inventario", "Inventario", <FaBoxes />],
    ["movimientos", "Entradas y salidas", <FaExchangeAlt />],
    ["buscar-imagen", "Buscar por imagen", <FaCamera />],
    ["reportes", "Reportes", <FaChartBar />],
    ["configuracion", "Configuración", <FaCog />],
  ];
  return <header className="bg-gradient-to-r from-[#941B80] via-[#692D80] to-[#0096AE] shadow-lg"><div className="max-w-7xl mx-auto px-4 md:px-6 py-4"><div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div><h1 className="text-3xl font-bold text-white">Inventario Quálitas</h1><p className="text-white/80">Gestión de promocionales y materiales</p></div><nav className="flex flex-wrap gap-2">{menu.map(([id,label,icon]) => <button key={id} type="button" onClick={() => onNavigate?.(id)} aria-current={currentPage === id ? "page" : undefined} className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl transition ${currentPage === id ? "bg-white text-[#941B80]" : "bg-white/15 hover:bg-white/25 text-white"}`}>{icon}{label}</button>)}</nav></div></div></header>;
}