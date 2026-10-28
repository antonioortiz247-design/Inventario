import {
  FaBoxes,
  FaChartBar,
  FaCog,
  FaHome,
  FaQrcode,
} from "react-icons/fa";

export default function Sidebar({
  currentPage = "inicio",
  onNavigate,
}) {
  const menu = [
    {
      id: "inicio",
      label: "Inicio",
      icon: <FaHome />,
    },
    {
      id: "inventario",
      label: "Inventario",
      icon: <FaBoxes />,
    },
    {
      id: "escaner",
      label: "Escáner QR",
      icon: <FaQrcode />,
    },
    {
      id: "reportes",
      label: "Reportes",
      icon: <FaChartBar />,
    },
    {
      id: "configuracion",
      label: "Configuración",
      icon: <FaCog />,
    },
  ];

  return (
    <aside className="w-72 min-h-screen border-r border-slate-800 bg-slate-900 text-white">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold">
          Quálitas
        </h2>

        <p className="text-sm text-white/70">
          Inventario de Promocionales
        </p>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
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
                  rounded-xl
                  transition
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
