import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBullseye, FaRedoAlt, FaTrophy } from "react-icons/fa";
import { supabase, supabaseConfigured } from "../lib/supabase";

const DEFAULT_PRIZES = [
  { label: "Pluma", probability: 94 }, { label: "Bolsa", probability: 1 },
  { label: "Cilindro", probability: 1 }, { label: "Libreta", probability: 1 },
  { label: "Tupper", probability: 1 }, { label: "Audífonos", probability: 1 },
  { label: "Lonchera", probability: 1 }, { label: "Lámpara", probability: 0 },
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
    .filter((p) => p.label && Number.isFinite(p.probability) && p.probability >= 0);
}
function weightedChoice(items) {
  const eligible = items.filter((item) => item.probability > 0);
  const totalWeight = eligible.reduce((sum, p) => sum + p.probability, 0);
  if (!eligible.length || totalWeight <= 0) return null;
  let n = Math.random() * totalWeight;
  for (const item of eligible) { n -= item.probability; if (n < 0) return item; }
  return eligible[eligible.length - 1];
}

export default function RuletaActivaciones() {
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [pending, setPending] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [lead, setLead] = useState({ nombre: "", telefono: "", correo: "", municipio: "", marca: "", modelo: "", anio: "", tiene_seguro: "", aseguradora: "", vencimiento: "", interes_cotizacion: "", evento: "" });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [prospectId, setProspectId] = useState(null);
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
      // Fija la distribución solicitada en la configuración compartida de Supabase.
      const { data: existingConfig, error: readError } = await supabase.from(CONFIG).select("id").eq("id", "default").maybeSingle();
      if (readError) {
        setMessage("No se pudo consultar la configuración de premios: " + readError.message);
      } else {
        const write = existingConfig
          ? await supabase.from(CONFIG).update({ premios: DEFAULT_PRIZES }).eq("id", "default")
          : await supabase.from(CONFIG).insert({ id: "default", premios: DEFAULT_PRIZES });
        if (write.error) {
          setMessage("No se pudieron guardar las nuevas probabilidades en Supabase: " + write.error.message);
        } else if (alive) {
          setPrizes(DEFAULT_PRIZES);
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
          setPrizes(loaded);
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: HISTORY }, () => { loadHistory(); })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, [loadHistory]);

  const submitLead = async (event) => {
    event.preventDefault();
    if (!supabaseConfigured) {
      setMessage("No es posible registrar tu participación porque la base de datos no está configurada.");
      return;
    }
    if (!privacyAccepted || leadSaving) return;
    setLeadSaving(true);
    setMessage("");
    const newProspectId = crypto.randomUUID();
    try {
      const { error } = await supabase.from("ruleta_activaciones_prospectos").insert({
        id: newProspectId,
        nombre: lead.nombre.trim(),
        telefono: lead.telefono.trim(),
        correo: lead.correo.trim() || null,
        municipio: lead.municipio.trim(),
        marca: lead.marca.trim(),
        modelo: lead.modelo.trim(),
        anio: Number(lead.anio),
        tiene_seguro: lead.tiene_seguro,
        aseguradora: lead.tiene_seguro === "Sí" ? lead.aseguradora : null,
        vencimiento: lead.tiene_seguro === "Sí" ? lead.vencimiento : null,
        interes_cotizacion: lead.tiene_seguro === "No" ? lead.interes_cotizacion : null,
        evento: lead.evento.trim() || null,
        acepta_aviso: true,
        acepta_contacto: marketingAccepted,
      });
      if (error) {
        console.error("Error al guardar prospecto de ruleta:", error);
        setMessage("No se pudo guardar el registro: " + error.message + (error.code ? " (código " + error.code + ")" : ""));
        return;
      }
      setProspectId(newProspectId);
      setLeadSaved(true);
      setMessage("Registro guardado correctamente. Ya puedes participar.");
    } catch (error) {
      console.error("Error inesperado al guardar prospecto:", error);
      setMessage("Error de conexión al guardar el registro. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setLeadSaving(false);
    }
  };

  const resetParticipant = () => {
    if (spinning) return;
    setLead({ nombre: "", telefono: "", correo: "", municipio: "", marca: "", modelo: "", anio: "", tiene_seguro: "", aseguradora: "", vencimiento: "", interes_cotizacion: "", evento: "" });
    setPrivacyAccepted(false);
    setMarketingAccepted(false);
    setLeadSaved(false);
    setProspectId(null);
    setWinner(null);
    setPending(null);
    setMessage("");
  };

  const spin = () => {
    if (!leadSaved || winner || spinning || loading || total !== 100 || prizes.length !== 8) return;
    const selected = weightedChoice(prizes);
    if (!selected) { setMessage("No hay premios con probabilidad mayor que cero."); return; }
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
      const { error } = await supabase.from(HISTORY).insert({ premio: selected.label, probabilidad: selected.probability, prospecto_id: prospectId });
      if (error) setMessage("El premio salió, pero no se guardó el historial: " + error.message);
      else await loadHistory();
    }
  };

  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <section className="overflow-hidden rounded-3xl bg-white shadow-lg">
      <div className="bg-gradient-to-r from-[#941B80] via-[#692D80] to-[#0096AE] px-5 py-7 text-white md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-4"><div className="rounded-xl bg-white p-2"><img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="h-auto w-40 object-contain md:w-52" /></div><div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">Marketing BTL · Quálitas</p>
          <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Ruleta de activaciones</h1>
          <p className="mt-2 max-w-2xl text-white/90">Premios con probabilidades configuradas y sincronización entre dispositivos.</p>
        </div></div><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl"><FaBullseye /></div></div>
      </div>
      <div className="grid gap-8 p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] md:p-8">
        <div className="flex flex-col items-center">
          {!leadSaved ? <form onSubmit={submitLead} className="mb-6 w-full max-w-[620px] rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6">
            <img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="mx-auto mb-5 h-auto w-full max-w-xs object-contain" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0096AE]">Antes de jugar · Registro de participante</p>
            <h2 className="mt-1 text-xl font-extrabold text-[#143B46]">Registra tus datos para participar</h2>
            <p className="mt-1 text-sm text-slate-600">Completa los datos de contacto y de tu vehículo. Después podrás girar la ruleta una vez.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Nombre completo *
                <input required maxLength={120} autoComplete="name" value={lead.nombre} onChange={e => setLead({ ...lead, nombre: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15" placeholder="Nombre y apellidos" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Teléfono celular *
                <input required type="tel" inputMode="tel" autoComplete="tel" maxLength={20} pattern="[0-9+()\\-\\s]{10,20}" value={lead.telefono} onChange={e => setLead({ ...lead, telefono: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15" placeholder="10 dígitos" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Correo electrónico *
                <input required type="email" autoComplete="email" maxLength={160} value={lead.correo} onChange={e => setLead({ ...lead, correo: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15" placeholder="tucorreo@ejemplo.com" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Municipio *
                <input required maxLength={100} autoComplete="address-level2" value={lead.municipio} onChange={e => setLead({ ...lead, municipio: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15" placeholder="Tu municipio" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Marca del vehículo *
                <input required maxLength={80} value={lead.marca} onChange={e => setLead({ ...lead, marca: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15" placeholder="Ej. Nissan" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Modelo del vehículo *
                <input required maxLength={80} value={lead.modelo} onChange={e => setLead({ ...lead, modelo: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15" placeholder="Ej. Versa" />
              </label>
              <label className="text-sm font-semibold text-slate-700">Año del vehículo *
                <input required type="number" min="1950" max={new Date().getFullYear()+1} value={lead.anio} onChange={e => setLead({ ...lead, anio: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15" placeholder="Ej. 2022" />
              </label>
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">¿Cuenta con seguro actualmente? *
                <select required value={lead.tiene_seguro} onChange={e => setLead({ ...lead, tiene_seguro: e.target.value, aseguradora: "", vencimiento: "", interes_cotizacion: "" })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15">
                  <option value="">Selecciona una opción</option><option>Sí</option><option>No</option>
                </select>
              </label>
              {lead.tiene_seguro === "Sí" && <>
                <label className="text-sm font-semibold text-slate-700">¿Con qué aseguradora? *
                  <select required value={lead.aseguradora} onChange={e => setLead({ ...lead, aseguradora: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15">
                    <option value="">Selecciona una opción</option>{["Quálitas","GNP","AXA","HDI","Banorte","Mapfre","Otra"].map(v=><option key={v}>{v}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold text-slate-700">¿Cuándo vence aproximadamente? *
                  <select required value={lead.vencimiento} onChange={e => setLead({ ...lead, vencimiento: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15">
                    <option value="">Selecciona una opción</option>{["Menos de 30 días","30 a 60 días","60 a 90 días","Más de 90 días"].map(v=><option key={v}>{v}</option>)}
                  </select>
                </label>
              </>}
              {lead.tiene_seguro === "No" && <label className="text-sm font-semibold text-slate-700 sm:col-span-2">¿Te gustaría recibir una cotización? *
                <select required value={lead.interes_cotizacion} onChange={e => setLead({ ...lead, interes_cotizacion: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15">
                  <option value="">Selecciona una opción</option><option>Sí</option><option>No</option>
                </select>
              </label>}
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Evento / ubicación
                <input maxLength={120} value={lead.evento} onChange={e => setLead({ ...lead, evento: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal outline-none focus:border-[#941B80] focus:ring-2 focus:ring-[#941B80]/15" placeholder="Nombre o sede de la activación" />
              </label>
            </div>
            <label className="mt-4 flex items-start gap-3 text-sm text-slate-600">
              <input required type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-[#941B80]" />
              <span>Confirmo que leí el aviso de privacidad disponible con el personal de la activación y autorizo el tratamiento de mis datos para gestionar mi participación. *</span>
            </label>
            <label className="mt-3 flex items-start gap-3 text-sm text-slate-600">
              <input type="checkbox" checked={marketingAccepted} onChange={e => setMarketingAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-[#941B80]" />
              <span>Acepto opcionalmente que Quálitas me contacte para compartir información sobre seguros y cotizaciones.</span>
            </label>
            <button type="submit" disabled={leadSaving || loading || !supabaseConfigured} className="mt-4 w-full rounded-xl bg-[#941B80] px-5 py-3 font-extrabold text-white shadow transition hover:bg-[#762067] disabled:cursor-not-allowed disabled:opacity-60">{leadSaving ? "Registrando…" : "Registrar y participar"}</button>
            {!supabaseConfigured && <p className="mt-2 text-sm text-amber-700">Registro temporalmente no disponible.</p>}
            {message && <p role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
            <p className="mt-2 text-xs text-slate-500">* Campos obligatorios. Tu participación se habilita cuando el registro se guarda correctamente.</p>
          </form> : <div className="mb-6 w-full max-w-[620px] rounded-2xl border border-[#0096AE]/30 bg-[#0096AE]/5 p-4 text-center">
            <img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="mx-auto mb-3 h-auto w-40 object-contain" />
            <p className="font-bold text-[#143B46]">Registro completado</p>
            <p className="mt-1 text-sm text-slate-600">Ya puedes girar la ruleta.</p>
          </div>}
          <div className="relative w-full max-w-[440px]"><div className="absolute left-1/2 top-[-7px] z-10 -translate-x-1/2 text-4xl leading-none drop-shadow-md" aria-hidden="true">▼</div>
            <div className="rounded-full bg-slate-100 p-2 shadow-[0_12px_35px_rgba(20,59,70,0.18)]"><svg viewBox="0 0 300 300" role="img" aria-label="Ruleta de premios ponderada" className="w-full overflow-visible">
              <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "150px 150px", transition: spinning ? "transform 5.5s cubic-bezier(0.12, 0.72, 0.12, 1)" : "none" }} onTransitionEnd={onStop}>
                {segments.map(s => <g key={s.label}><path d={sectorPath(s.index, prizes.length)} fill={s.color} stroke="#FFFFFF" strokeWidth="2" /><text x="150" y="150" transform={`rotate(${(s.index + 0.5) * slice} 150 150) translate(0 -99)`} fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle" dominantBaseline="middle">{s.label}</text></g>)}
                <circle cx="150" cy="150" r="24" fill="#FFFFFF" stroke="#941B80" strokeWidth="5" /><circle cx="150" cy="150" r="9" fill="#0096AE" />
              </g>
            </svg></div>
          </div>
          <button type="button" onClick={spin} disabled={!leadSaved || !!winner || spinning || loading || total !== 100} className="mt-6 inline-flex min-w-52 items-center justify-center gap-3 rounded-2xl bg-[#941B80] px-8 py-4 text-lg font-extrabold text-white shadow-lg transition hover:bg-[#762067] disabled:cursor-not-allowed disabled:opacity-60"><FaBullseye /> {loading ? "Cargando…" : spinning ? "Girando…" : winner ? "Participación finalizada" : leadSaved ? "¡Girar ruleta!" : "Regístrate para jugar"}</button>
          <p className="mt-3 text-center text-xs text-slate-500">La selección usa probabilidades ponderadas, no una distribución uniforme.</p>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-sm font-semibold uppercase tracking-wider text-[#0096AE]">Resultado</p>
            {winner ? <div className="mt-3 rounded-xl border border-[#0096AE]/30 bg-white p-5 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0096AE]/10 text-2xl text-[#0096AE]"><FaTrophy /></div><p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">¡Felicidades!</p><h2 className="mt-1 text-2xl font-extrabold text-[#941B80]">{winner.label}</h2><p className="mt-2 text-sm text-slate-600">Aseguramos autos, cuidamos personas.</p></div> : <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center"><FaTrophy className="mx-auto text-3xl text-slate-300" /><p className="mt-3 font-semibold text-slate-700">{spinning ? "La suerte está en movimiento…" : "¿Listo para participar?"}</p><p className="mt-1 text-sm text-slate-500">El resultado aparecerá aquí al detenerse la ruleta.</p></div>}
            <div className="mt-4 flex flex-wrap gap-2">{winner && <button type="button" onClick={resetParticipant} disabled={spinning} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0096AE] px-4 py-3 text-sm font-extrabold text-white hover:bg-[#087F91] disabled:opacity-40"><FaRedoAlt /> Registrar nuevo participante</button>}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-bold text-[#143B46]">Últimos resultados</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{history.length}</span></div>
            {history.length ? <ol className="mt-3 space-y-2">{history.map((item, i) => <li key={item.id || i} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="font-medium text-slate-700">{item.prize}</span><span className="shrink-0 text-xs tabular-nums text-slate-500">{item.time}</span></li>)}</ol> : <p className="mt-3 text-sm text-slate-500">Los resultados aparecerán aquí.</p>}
          </div>
        </div>
      </div>
    </section>
    {message && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
    <p className="px-1 text-xs text-slate-500">Uso sugerido: activaciones en tianguis de autos, verificentros y eventos locales. Verifica disponibilidad y condiciones de cada premio antes de entregarlo.</p>
  </main>;
}
