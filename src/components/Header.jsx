import { FaBoxes, FaChartBar, FaCog, FaHome, FaCamera, FaExchangeAlt, FaCalendarAlt, FaCalculator, FaBullseye, FaClipboardList, FaSkull, FaTicketAlt } from "react-icons/fa";

export default function Header({ currentPage = "inicio", onNavigate }) {
  const menu = [
    ["inicio", "Inicio", <FaHome />],
    ["inventario", "Inventario", <FaBoxes />],
    ["movimientos", "Entradas y salidas", <FaExchangeAlt />],
    ["eventos", "Modo evento", <FaCalendarAlt />],
    ["ruleta", "Ruleta de activaciones", <FaBullseye />],
    ["registros-ruleta", "Registros de ruleta", <FaClipboardList />],
    ["calaverita-segura", "Calaverita Segura 2026", <FaSkull />],
    ["calaverita-preregistro", "Prerregistro Calaverita", <FaTicketAlt />],
    ["simulador", "Simulador", <FaCalculator />],
    ["buscar-imagen", "Buscar por imagen", <FaCamera />],
    ["reportes", "Reportes", <FaChartBar />],
    ["configuracion", "Configuración", <FaCog />],
  ];
  return <header className="bg-gradient-to-r from-[#941B80] via-[#692D80] to-[#0096AE] shadow-lg"><div className="max-w-7xl mx-auto px-4 md:px-6 py-4"><div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div className="flex items-center gap-4"><div className="rounded-xl bg-white p-2"><img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="h-auto w-40 object-contain md:w-56" /></div><div><h1 className="text-2xl font-bold text-white md:text-3xl">Inventario Quálitas</h1><p className="text-white/80">Gestión de promocionales y materiales</p></div></div><details className="relative z-20"><summary className="flex cursor-pointer list-none items-center justify-center gap-3 rounded-xl border border-white/30 bg-white/15 px-5 py-3 font-bold text-white shadow-sm hover:bg-white/25"><span>☰ Menú</span><span className="text-xs">▼</span></summary><nav className="absolute right-0 mt-2 grid w-72 max-w-[85vw] gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl sm:w-80">{menu.map(([id,label,icon]) => <button key={id} type="button" onClick={(e) => { onNavigate?.(id); e.currentTarget.closest("details")?.removeAttribute("open"); }} aria-current={currentPage === id ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${currentPage === id ? "bg-[#941B80] text-white" : "text-slate-700 hover:bg-purple-50 hover:text-[#941B80]"}`}>{icon}<span>{label}</span></button>)}</nav></details></div></div></header>;
}
