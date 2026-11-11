import { useState } from "react";
import {
  FaBars,
  FaChevronRight,
  FaTimes,
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
  FaShieldAlt,
  FaGraduationCap,
} from "react-icons/fa";

export default function Sidebar({
  currentPage = "inicio",
  onNavigate,
  mobileOpen = false,
  onMobileClose,
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
    { id: "desafio-seguridad-vial", label: "Desafío Digital de Seguridad Vial Quálitas", icon: <FaShieldAlt /> },
    { id: "simulador", label: "Simulador", icon: <FaCalculator /> },
    { id: "a2-academy", label: "Estudio Cédula A2", icon: <FaGraduationCap /> },
    { id: "buscar-imagen", label: "Buscar por imagen", icon: <FaCamera /> },
    { id: "reportes", label: "Reportes", icon: <FaChartBar /> },
    { id: "configuracion", label: "Configuración", icon: <FaCog /> },
  ];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
        />
      )}
      <aside className={`liquid-sidebar fixed inset-y-0 left-0 z-50 flex h-screen max-h-screen w-72 shrink-0 flex-col overflow-y-auto text-white transition-transform duration-300 md:sticky md:top-0 md:z-auto md:translate-x-0 md:transition-[width] ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${collapsed ? "md:w-20" : "md:w-64 lg:w-72"}`}>
        <div className={`liquid-sidebar-header flex items-center py-5 ${collapsed ? "flex-col gap-3 px-2" : "flex-col gap-4 px-5"}`}>
          <div className={`flex w-full items-center ${collapsed ? "justify-center" : "justify-between"}`}>
            {!collapsed && (
              <img src="/Logo-horizontal-blanco-sin-fondo.png" alt="Quálitas Compañía de Seguros" className="w-full max-w-[190px] object-contain object-left" />
            )}
            {collapsed && (
              <img src="/Q-blanco.png" alt="Quálitas" className="h-10 w-10 object-contain" />
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.matchMedia("(max-width: 767px)").matches) onMobileClose?.();
              else setCollapsed((value) => !value);
            }}
            aria-label={mobileOpen ? "Cerrar barra lateral" : collapsed ? "Desplegar barra lateral" : "Plegar barra lateral"}
            title={mobileOpen ? "Cerrar menú" : collapsed ? "Desplegar menú" : "Plegar menú"}
            className="liquid-sidebar-toggle flex h-10 w-10 shrink-0 items-center justify-center text-slate-300 transition-all hover:text-white focus:outline-none focus:ring-2 focus:ring-[#0096AE]"
          >
            {mobileOpen ? <FaTimes /> : collapsed ? <FaChevronRight /> : <FaBars />}
          </button>
          {!collapsed && (
            <p className="w-full text-xs font-semibold uppercase tracking-wider text-slate-300">Inventario y Oficina</p>
          )}
        </div>

        <nav className={`liquid-sidebar-nav ${collapsed ? "px-2 py-4" : "px-3 py-4"}`}>
          <ul className="space-y-1.5">
            {menu.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.(item.id);
                    onMobileClose?.();
                  }}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={`
                    liquid-sidebar-link relative flex w-full items-center rounded-2xl py-3 transition-all duration-200
                    ${collapsed ? "justify-center px-2" : "gap-3 px-4"}
                    ${currentPage === item.id
                      ? "is-active font-semibold text-white"
                      : "text-slate-300 hover:text-white"}
                  `}
                >
                  <span className="liquid-sidebar-icon shrink-0 text-lg">{item.icon}</span>
                  {!collapsed && <span className="text-left font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        {!collapsed && (
          <div className="liquid-sidebar-footer mt-auto px-5 py-4 text-[11px] leading-5 text-slate-400">
            Control interno · Sucursal Cuautitlán Romero Rubio
          </div>
        )}
      </aside>
    </>
  );
}
