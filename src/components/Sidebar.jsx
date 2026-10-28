import { useState } from "react";
import {
  FaBars,
  FaChevronRight,
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
  const [collapsed, setCollapsed] = useState(false);
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
    <aside className={`sticky top-0 flex h-screen max-h-screen shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900 text-white transition-[width] duration-200 ${collapsed ? "w-20" : "w-64 lg:w-72"}`}>
      <div className={`flex items-center border-b border-slate-800 py-4 ${collapsed ? "flex-col gap-3 px-2" : "flex-col gap-4 px-5"}`}>
        <div className={`flex w-full items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="w-full max-w-[190px] object-contain object-left" />
          )}
          {collapsed && (
            <img src="/Q-morado.png" alt="Quálitas" className="h-10 w-10 object-contain" />
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Desplegar barra lateral" : "Plegar barra lateral"}
          title={collapsed ? "Desplegar menú" : "Plegar menú"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#0096AE]"
        >
          {collapsed ? <FaChevronRight /> : <FaBars />}
        </button>
        {!collapsed && (
          <p className="w-full text-xs font-semibold uppercase tracking-wider text-slate-300">Inventario y Oficina</p>
        )}
      </div>

      <nav className={collapsed ? "px-2 py-3" : "p-3"}>
        <ul className="space-y-1">
          {menu.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate?.(item.id)}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                className={`
                  flex w-full items-center rounded-md py-3 transition-colors duration-150
                  ${collapsed ? "justify-center px-2" : "gap-3 px-4"}
                  ${currentPage === item.id
                    ? "bg-[#941880] font-medium text-white"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"}
                `}
              >
                <span className="shrink-0 text-lg">{item.icon}</span>
                {!collapsed && <span className="text-left font-medium">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {!collapsed && (
        <div className="mt-auto border-t border-slate-800 px-5 py-4 text-[11px] leading-5 text-slate-400">
          Control interno · Sucursal Cuautitlán Romero Rubio
        </div>
      )}
    </aside>
  );
}
