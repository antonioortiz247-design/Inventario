import {
  FaBoxes,
  FaChartBar,
  FaCog,
  FaHome,
  FaExchangeAlt,
  FaCalendarAlt,
  FaCalculator,
  FaBullseye,
  FaClipboardList,
  FaSkull,
  FaTicketAlt,
  FaCamera,
} from "react-icons/fa";

export default function Sidebar({
  currentPage = "inicio",
  onNavigate,
}) {
  const menu = [
    { id: "inicio", label: "Inicio", icon: <FaHome /> },
    { id: "inventario", label: "Inventario", icon: <FaBoxes /> },
    { id: "movimientos", label: "Entradas y salidas", icon: <FaExchangeAlt /> },
    { id: "eventos", label: "Modo evento", icon: <FaCalendarAlt /> },
    { id: "ruleta", label: "Ruleta de activaciones", icon: <FaBullseye /> },
    { id: "registros-ruleta", label: "Registros de ruleta", icon: <FaClipboardList /> },
    { id: "calaverita-segura", label: "Calaverita Segura 2026", icon: <FaSkull /> },
    { id: "calaverita-preregistro", label: "Prerregistro Calaverita", icon: <FaTicketAlt /> },
    { id: "simulador", label: "Simulador", icon: <FaCalculator /> },
    { id: "buscar-imagen", label: "Buscar por imagen", icon: <FaCamera /> },
    { id: "reportes", label: "Reportes", icon: <FaChartBar /> },
    { id: "configuracion", label: "Configuración", icon: <FaCog /> },
  ];

  return (
    <aside className="flex min-h-screen max-h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 text-white lg:w-72">
      <div className="border-b border-slate-800 px-5 py-6">
        <img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="mb-4 w-full max-w-[210px] object-contain object-left" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Inventario y Oficina</p>
      </div>

      <nav className="p-3">
        <ul className="space-y-1">
          {menu.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate?.(item.id)}
                className={`
                  w-full
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  rounded-md
                  transition-colors duration-150
                  ${
                    currentPage === item.id
                      ? "bg-[#941880] text-white font-medium"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }
                `}
              >
                <span className="text-lg">
                  {item.icon}
                </span>

                <span className="font-medium">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    <div className="mt-auto border-t border-slate-800 px-5 py-4 text-[11px] leading-5 text-slate-400">Control interno · Sucursal Cuautitlán Romero Rubio</div>
    </aside>
  );
}
