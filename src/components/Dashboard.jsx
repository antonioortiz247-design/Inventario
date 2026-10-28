export default function Dashboard({
  totalArticulos = 0,
  piezasTotales = 0,
  stockBajo = 0,
  stockCritico = 0,
}) {
  const cards = [
    {
      titulo: "Artículos",
      valor: totalArticulos,
      color: "border-[#0096AE]",
      icono: "📦",
    },
    {
      titulo: "Piezas Totales",
      valor: piezasTotales,
      color: "border-[#0096AE]",
      icono: "📊",
    },
    {
      titulo: "Stock Bajo",
      valor: stockBajo,
      color: "border-[#941880]",
      icono: "⚠️",
    },
    {
      titulo: "Crítico",
      valor: stockCritico,
      color: "border-[#7A1369]",
      icono: "🚨",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.titulo}
          className={`rounded-lg border border-slate-200 border-t-[3px] ${card.color} bg-white p-5 shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">{card.titulo}</p>
              <h2 className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                {card.valor}
              </h2>
            </div>

            <span className="text-5xl">
              {card.icono}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
