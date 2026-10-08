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
      color: "bg-[#0096AE]",
      icono: "📦",
    },
    {
      titulo: "Piezas Totales",
      valor: piezasTotales,
      color: "bg-[#0F98D7]",
      icono: "📊",
    },
    {
      titulo: "Stock Bajo",
      valor: stockBajo,
      color: "bg-[#941B80]",
      icono: "⚠️",
    },
    {
      titulo: "Crítico",
      valor: stockCritico,
      color: "bg-[#692D80]",
      icono: "🚨",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <div
          key={card.titulo}
          className={`${card.color} text-white rounded-3xl shadow-lg p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{card.titulo}</p>
              <h2 className="text-4xl font-bold mt-2">
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
