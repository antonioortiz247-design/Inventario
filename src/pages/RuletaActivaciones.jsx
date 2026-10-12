import { useMemo, useState } from "react";
import { FaBullseye, FaCog, FaRedoAlt, FaTrophy } from "react-icons/fa";

const DEFAULT_PRIZES = [
  "Cotización sin costo",
  "Kit promocional",
  "Limpieza de parabrisas",
  "Asesoría personalizada",
  "Obsequio sorpresa",
  "Participa otra vez",
  "Revisión de póliza",
  "Premio especial",
];
const COLORS = ["#941B80", "#0096AE", "#692D80", "#46B8E9", "#512950", "#0F98D7", "#9279BA", "#037081"];

function polarToCartesian(cx, cy, radius, angle) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function sectorPath(index, total) {
  const startAngle = (index * 360) / total;
  const endAngle = ((index + 1) * 360) / total;
  const start = polarToCartesian(150, 150, 145, startAngle);
  const end = polarToCartesian(150, 150, 145, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M 150 150 L ${start.x} ${start.y} A 145 145 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export default function RuletaActivaciones() {
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
  const [draft, setDraft] = useState(DEFAULT_PRIZES.join("\n"));
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState("");
  const [history, setHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  const slice = 360 / prizes.length;
  const segments = useMemo(() => prizes.map((label, index) => ({ label, color: COLORS[index % COLORS.length], index })), [prizes]);

  const spin = () => {
    if (spinning || prizes.length < 2) return;
    const index = Math.floor(Math.random() * prizes.length);
    const extra = 360 * (6 + Math.floor(Math.random() * 3));
    const alignment = (360 - (index + 0.5) * slice) % 360;
    setWinner("");
    setSpinning(true);
    setRotation((previous) => previous + extra + alignment - (previous % 360));
    // The transition end event records the result after the wheel visibly stops.
    setPendingWinner(prizes[index]);
  };

  const [pendingWinner, setPendingWinner] = useState("");
  const handleTransitionEnd = () => {
    if (!spinning) return;
    setSpinning(false);
    if (pendingWinner) {
      setWinner(pendingWinner);
      setHistory((items) => [{ prize: pendingWinner, time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) }, ...items].slice(0, 10));
      setPendingWinner("");
    }
  };

  const savePrizes = () => {
    const next = draft.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 12);
    if (next.length < 2) return;
    setPrizes(next);
    setDraft(next.join("\n"));
    setRotation(0);
    setWinner("");
    setHistory([]);
    setShowSettings(false);
  };

  const reset = () => {
    setPrizes(DEFAULT_PRIZES);
    setDraft(DEFAULT_PRIZES.join("\n"));
    setRotation(0);
    setWinner("");
    setHistory([]);
    setShowSettings(false);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <section className="overflow-hidden rounded-3xl bg-white shadow-lg">
        <div className="bg-gradient-to-r from-[#941B80] via-[#692D80] to-[#0096AE] px-5 py-7 text-white md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">Marketing BTL · Quálitas</p>
              <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Ruleta de activaciones</h1>
              <p className="mt-2 max-w-2xl text-white/90">Dale un giro a la experiencia: invita a participar, gira la ruleta y descubre el resultado.</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl"><FaBullseye /></div>
          </div>
        </div>

        <div className="grid gap-8 p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] md:p-8">
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-[440px]">
              <div className="absolute left-1/2 top-[-7px] z-10 -translate-x-1/2 text-4xl leading-none drop-shadow-md" aria-hidden="true">▼</div>
              <div className="rounded-full bg-slate-100 p-2 shadow-[0_12px_35px_rgba(20,59,70,0.18)]">
                <svg viewBox="0 0 300 300" role="img" aria-label="Ruleta con premios de activaciones" className="w-full overflow-visible">
                  <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "150px 150px", transition: spinning ? "transform 5.5s cubic-bezier(0.12, 0.72, 0.12, 1)" : "none" }} onTransitionEnd={handleTransitionEnd}>
                    {segments.map((segment) => {
                      const angle = (segment.index + 0.5) * slice;
                      return <g key={segment.index}>
                        <path d={sectorPath(segment.index, prizes.length)} fill={segment.color} stroke="#FFFFFF" strokeWidth="2" />
                        <text x="150" y="150" transform={`rotate(${angle} 150 150) translate(0 -99)`} fill="#FFFFFF" fontSize={prizes.length > 8 ? "7.5" : "9"} fontWeight="700" textAnchor="middle" dominantBaseline="middle">
                          {segment.label.length > 22 ? segment.label.slice(0, 20) + "…" : segment.label}
                        </text>
                      </g>;
                    })}
                    <circle cx="150" cy="150" r="24" fill="#FFFFFF" stroke="#941B80" strokeWidth="5" />
                    <circle cx="150" cy="150" r="9" fill="#0096AE" />
                  </g>
                </svg>
              </div>
            </div>
            <button type="button" onClick={spin} disabled={spinning} className="mt-6 inline-flex min-w-52 items-center justify-center gap-3 rounded-2xl bg-[#941B80] px-8 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-[#762067] disabled:cursor-not-allowed disabled:opacity-60">
              <FaBullseye /> {spinning ? "Girando…" : "¡Girar ruleta!"}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">Cada giro selecciona un resultado al azar entre las opciones configuradas.</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#0096AE]">Resultado</p>
              {winner ? <div className="mt-3 rounded-xl border border-[#0096AE]/30 bg-white p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0096AE]/10 text-2xl text-[#0096AE]"><FaTrophy /></div>
                <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">¡Felicidades!</p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#941B80]">{winner}</h2>
                <p className="mt-2 text-sm text-slate-600">Aseguramos autos, cuidamos personas.</p>
              </div> : <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                <FaTrophy className="mx-auto text-3xl text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700">{spinning ? "La suerte está en movimiento…" : "¿Listo para participar?"}</p>
                <p className="mt-1 text-sm text-slate-500">El resultado aparecerá aquí al detenerse la ruleta.</p>
              </div>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => { setWinner(""); }} disabled={spinning || !winner} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"><FaRedoAlt /> Nuevo giro</button>
                <button type="button" onClick={() => setShowSettings((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-[#0096AE] bg-white px-3 py-2 text-sm font-semibold text-[#00788B]"><FaCog /> Editar premios</button>
              </div>
            </div>

            {showSettings && <div className="rounded-2xl border border-slate-200 p-4">
              <label className="block text-sm font-semibold text-slate-700">Premios y resultados (uno por línea, máximo 12)
                <textarea rows="8" value={draft} onChange={(event) => setDraft(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal focus:border-[#0096AE] focus:outline-none focus:ring-2 focus:ring-[#0096AE]/20" />
              </label>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={savePrizes} disabled={spinning || draft.split("\n").map((item) => item.trim()).filter(Boolean).length < 2} className="rounded-xl bg-[#941B80] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Guardar opciones</button>
                <button type="button" onClick={reset} disabled={spinning} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Restablecer</button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Las opciones se aplican a esta sesión; no modifican existencias ni registran una entrega.</p>
            </div>}

            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-[#143B46]">Últimos resultados</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{history.length}</span></div>
              {history.length ? <ol className="mt-3 space-y-2">{history.map((item, index) => <li key={index} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="font-medium text-slate-700">{item.prize}</span><span className="shrink-0 text-xs tabular-nums text-slate-500">{item.time}</span></li>)}</ol> : <p className="mt-3 text-sm text-slate-500">Los resultados de esta sesión aparecerán aquí.</p>}
            </div>
          </div>
        </div>
      </section>
      <p className="px-1 text-xs text-slate-500">Uso sugerido: activaciones en tianguis de autos, verificentros y eventos locales. Verifica disponibilidad y condiciones de cada premio antes de entregarlo.</p>
    </main>
  );
}
