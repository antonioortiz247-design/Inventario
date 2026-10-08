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
    <aside className="w-72 min-h-screen bg-[#143B46] text-white shadow-xl">
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
                      ? "bg-[#0096AE] text-white"
                      : "hover:bg-white/10"
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
    </aside>
  );
}
