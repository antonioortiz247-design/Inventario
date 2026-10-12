import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBullseye, FaCog, FaRedoAlt, FaTrophy } from "react-icons/fa";
import { supabase, supabaseConfigured } from "../lib/supabase";

const DEFAULT_PRIZES = [
  { label: "Pluma", probability: 45 }, { label: "Bolsa", probability: 15 },
  { label: "Cilindro", probability: 15 }, { label: "Libreta", probability: 8 },
  { label: "Tupper", probability: 8 }, { label: "Audífonos", probability: 6 },
  { label: "Lonchera", probability: 2 }, { label: "Lámpara", probability: 1 },
];
const COLORS = ["#941B80", "#0096AE", "#692D80", "#46B8E9", "#512950", "#0F98D7", "#9279BA", "#037081"];
const CONFIG = "ruleta_activaciones_config";
const HISTORY = "ruleta_activaciones_historial";

function polar(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function sectorPath(index, total) {
  const a = polar(150, 150, 145, index * 360 / total);
  const b = polar(150, 150, 145, (index + 1) * 360 / total);
  return `M 150 150 L ${a.x} ${a.y} A 145 145 0 0 1 ${b.x} ${b.y} Z`;
}
function cleanPrizes(items) {
  if (!Array.isArray(items)) return DEFAULT_PRIZES;
  return items.map((p) => ({ label: String(p.label || "").trim(), probability: Number(p.probability) }))
    .filter((p) => p.label && Number.isFinite(p.probability) && p.probability > 0);
}
function weightedChoice(items) {
  let n = Math.random() * items.reduce((sum, p) => sum + p.probability, 0);
  for (const item of items) { n -= item.probability; if (n < 0) return item; }
  return items[items.length - 1];
}

export default function RuletaActivaciones() {
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
  const [draft, setDraft] = useState(DEFAULT_PRIZES.map(p => `${p.label}|${p.probability}`).join("\n"));
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [pending, setPending] = useState(null);
  const [history, setHistory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const total = prizes.reduce((sum, p) => sum + p.probability, 0);
  const slice = 360 / prizes.length;
  const segments = useMemo(() => prizes.map((p, index) => ({ ...p, index, color: COLORS[index % COLORS.length] })), [prizes]);

  const loadHistory = useCallback(async () => {
    if (!supabaseConfigured) return;
    const { data, error } = await supabase.from(HISTORY).select("id,premio,probabilidad,created_at").order("created_at", { ascending: false }).limit(10);
    if (error) { setMessage("Error al consultar historial: " + error.message); return; }
    setHistory((data || []).map(row => ({ id: row.id, prize: row.premio, probability: Number(row.probabilidad), time: new Date(row.created_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) })));
  }, []);

  useEffect(() => {
    let alive = true;
    async function init() {
      if (!supabaseConfigured) { setMessage("Supabase no está configurado: los cambios no se sincronizarán."); setLoading(false); return; }
      const { data, error } = await supabase.from(CONFIG).select("premios").eq("id", "default").maybeSingle();
      if (error) setMessage("No se pudo cargar la configuración: " + error.message);
      else if (data?.premios && alive) {
        const loaded = cleanPrizes(data.premios);
        if (loaded.length === 8 && loaded.reduce((s, p) => s + p.probability, 0) === 100) {
          setPrizes(loaded); setDraft(loaded.map(p => `${p.label}|${p.probability}`).join("\n"));
        }
      }
      await loadHistory();
      if (alive) setLoading(false);
    }
    init();
    if (!supabaseConfigured) return () => { alive = false; };
    const channel = supabase.channel("ruleta-activaciones-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: CONFIG }, ({ new: row }) => {
        const loaded = cleanPrizes(row?.premios);
        if (loaded.length === 8 && loaded.reduce((s, p) => s + p.probability, 0) === 100) {
          setPrizes(loaded); setDraft(loaded.map(p => `${p.label}|${p.probability}`).join("\n"));
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: HISTORY }, () => { loadHistory(); })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, [loadHistory]);

  const spin = () => {
    if (spinning || loading || total !== 100 || prizes.length !== 8) return;
    const selected = weightedChoice(prizes);
    const index = prizes.findIndex(p => p.label === selected.label);
    const alignment = (360 - (index + 0.5) * slice + 360) % 360;
    setWinner(null); setPending(selected); setSpinning(true);
    setRotation(previous => previous + 360 * (6 + Math.floor(Math.random() * 3)) + alignment - (previous % 360));
  };

  const onStop = async () => {
    if (!spinning || !pending) return;
    const selected = pending;
    setSpinning(false); setWinner(selected); setPending(null);
    setHistory(items => [{ id: "pending-" + Date.now(), prize: selected.label, probability: selected.probability, time: new Date().toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) }, ...items].slice(0, 10));
    if (supabaseConfigured) {
      const { error } = await supabase.from(HISTORY).insert({ premio: selected.label, probabilidad: selected.probability });
      if (error) setMessage("El premio salió, pero no se guardó el historial: " + error.message);
      else await loadHistory();
    }
  };

  const savePrizes = async () => {
    const next = draft.split("\n").map(line => {
      const i = line.lastIndexOf("|");
      return i > 0 ? { label: line.slice(0, i).trim(), probability: Number(line.slice(i + 1).trim()) } : null;
    }).filter(p => p && p.label && Number.isFinite(p.probability) && p.probability > 0);
    if (next.length !== 8 || next.reduce((s, p) => s + p.probability, 0) !== 100) {
      setMessage("Se requieren 8 premios con probabilidades mayores a 0 que sumen exactamente 100%."); return;
    }
    setSaving(true); setMessage("");
    if (supabaseConfigured) {
      const { error } = await supabase.from(CONFIG).upsert({ id: "default", premios: next, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (error) { setMessage("No se guardó la configuración en Supabase: " + error.message); setSaving(false); return; }
    }
    setPrizes(next); setDraft(next.map(p => `${p.label}|${p.probability}`).join("\n"));
    setRotation(0); setWinner(null); setShowSettings(false); setSaving(false);
    setMessage(supabaseConfigured ? "Probabilidades guardadas y sincronizadas." : "Probabilidades aplicadas solo en esta sesión: configura Supabase para sincronizar.");
  };

  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <section className="overflow-hidden rounded-3xl bg-white shadow-lg">
      <div className="bg-gradient-to-r from-[#941B80] via-[#692D80] to-[#0096AE] px-5 py-7 text-white md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4"><div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">Marketing BTL · Quálitas</p>
          <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Ruleta de activaciones</h1>
          <p className="mt-2 max-w-2xl text-white/90">Premios con probabilidades configuradas y sincronización entre dispositivos.</p>
        </div><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl"><FaBullseye /></div></div>
      </div>
      <div className="grid gap-8 p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] md:p-8">
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[440px]"><div className="absolute left-1/2 top-[-7px] z-10 -translate-x-1/2 text-4xl leading-none drop-shadow-md" aria-hidden="true">▼</div>
            <div className="rounded-full bg-slate-100 p-2 shadow-[0_12px_35px_rgba(20,59,70,0.18)]"><svg viewBox="0 0 300 300" role="img" aria-label="Ruleta de premios ponderada" className="w-full overflow-visible">
              <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "150px 150px", transition: spinning ? "transform 5.5s cubic-bezier(0.12, 0.72, 0.12, 1)" : "none" }} onTransitionEnd={onStop}>
                {segments.map(s => <g key={s.label}><path d={sectorPath(s.index, prizes.length)} fill={s.color} stroke="#FFFFFF" strokeWidth="2" /><text x="150" y="150" transform={`rotate(${(s.index + 0.5) * slice} 150 150) translate(0 -99)`} fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle" dominantBaseline="middle">{s.label}</text></g>)}
                <circle cx="150" cy="150" r="24" fill="#FFFFFF" stroke="#941B80" strokeWidth="5" /><circle cx="150" cy="150" r="9" fill="#0096AE" />
              </g>
            </svg></div>
          </div>
          <button type="button" onClick={spin} disabled={spinning || loading || total !== 100} className="mt-6 inline-flex min-w-52 items-center justify-center gap-3 rounded-2xl bg-[#941B80] px-8 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-[#762067] disabled:cursor-not-allowed disabled:opacity-60"><FaBullseye /> {loading ? "Cargando…" : spinning ? "Girando…" : "¡Girar ruleta!"}</button>
          <p className="mt-3 text-center text-xs text-slate-500">La selección usa probabilidades ponderadas, no una distribución uniforme.</p>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-semibold uppercase tracking-wider text-[#0096AE]">Resultado</p>
            {winner ? <div className="mt-3 rounded-xl border border-[#0096AE]/30 bg-white p-5 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0096AE]/10 text-2xl text-[#0096AE]"><FaTrophy /></div><p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">¡Felicidades!</p><h2 className="mt-1 text-2xl font-extrabold text-[#941B80]">{winner.label}</h2><p className="mt-2 text-sm text-slate-600">Probabilidad configurada: {winner.probability}%</p><p className="mt-2 text-sm text-slate-600">Aseguramos autos, cuidamos personas.</p></div> : <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center"><FaTrophy className="mx-auto text-3xl text-slate-300" /><p className="mt-3 font-semibold text-slate-700">{spinning ? "La suerte está en movimiento…" : "¿Listo para participar?"}</p><p className="mt-1 text-sm text-slate-500">El resultado aparecerá aquí al detenerse la ruleta.</p></div>}
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setWinner(null)} disabled={spinning || !winner} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"><FaRedoAlt /> Nuevo giro</button><button type="button" onClick={() => setShowSettings(v => !v)} className="inline-flex items-center gap-2 rounded-xl border border-[#0096AE] bg-white px-3 py-2 text-sm font-semibold text-[#00788B]"><FaCog /> Editar probabilidades</button></div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-bold text-[#143B46]">Probabilidades</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${total === 100 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{total}% total</span></div>
            <ol className="mt-3 space-y-2">{prizes.map((p, i) => <li key={p.label} className="flex items-center gap-3 text-sm"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="flex-1 text-slate-700">{p.label}</span><strong className="tabular-nums text-slate-900">{p.probability}%</strong></li>)}</ol><p className="mt-3 text-xs text-slate-500">El total debe ser exactamente 100%.</p>
          </div>
          {showSettings && <div className="rounded-2xl border border-slate-200 p-4"><label className="block text-sm font-semibold text-slate-700">Una opción por línea: nombre|probabilidad<textarea rows="8" value={draft} onChange={e => setDraft(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-mono text-sm font-normal focus:border-[#0096AE] focus:outline-none focus:ring-2 focus:ring-[#0096AE]/20" /></label><div className="mt-3 flex gap-2"><button type="button" onClick={savePrizes} disabled={saving || spinning} className="rounded-xl bg-[#941B80] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? "Guardando…" : "Guardar y sincronizar"}</button><button type="button" onClick={() => setDraft(DEFAULT_PRIZES.map(p => `${p.label}|${p.probability}`).join("\n"))} disabled={saving || spinning} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">Restablecer</button></div></div>}
          <div className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-bold text-[#143B46]">Últimos resultados</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{history.length}</span></div>
            {history.length ? <ol className="mt-3 space-y-2">{history.map((item, i) => <li key={item.id || i} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="font-medium text-slate-700">{item.prize}<span className="ml-2 text-xs text-slate-500">({item.probability}%)</span></span><span className="shrink-0 text-xs tabular-nums text-slate-500">{item.time}</span></li>)}</ol> : <p className="mt-3 text-sm text-slate-500">Los resultados aparecerán aquí.</p>}
          </div>
        </div>
      </div>
    </section>
    {message && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
    <p className="px-1 text-xs text-slate-500">Uso sugerido: activaciones en tianguis de autos, verificentros y eventos locales. Verifica disponibilidad y condiciones de cada premio antes de entregarlo.</p>
  </main>;
}
