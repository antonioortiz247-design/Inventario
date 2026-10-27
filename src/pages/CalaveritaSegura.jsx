import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { FaArrowLeft, FaCheckCircle, FaDownload, FaLock, FaTrophy, FaUsers, FaSyncAlt, FaTrashAlt } from "react-icons/fa";
import * as XLSX from "xlsx";

const QUESTIONS = [
  { q: "¿Qué es lo primero que debe hacer un conductor después de un accidente?", a: ["Retirarse", "Reportar el siniestro", "Llamar a un taller", "Seguir circulando"], correct: 1 },
  { q: "¿Cuál es el principal beneficio de contar con seguro?", a: ["Evitar multas", "Protección financiera", "Menor consumo de gasolina", "Menos verificaciones"], correct: 1 },
  { q: "¿Qué información debe proporcionarse al reportar un siniestro?", a: ["Sólo nombre", "Sólo placas", "Datos del evento y póliza", "Ninguna"], correct: 2 },
  { q: "¿Qué documento acredita la protección de un vehículo?", a: ["INE", "Factura", "Póliza de seguro", "Tarjeta bancaria"], correct: 2 },
  { q: "¿Cuál es una práctica segura de conducción?", a: ["Usar el celular", "Mantener distancia", "Rebasar por la derecha", "Frenar bruscamente"], correct: 1 },
];
const insurers = ["Quálitas", "GNP", "AXA", "HDI", "Banorte", "Mapfre", "Otra"];
const fieldClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none focus:border-[#0096AE] focus:ring-2 focus:ring-[#0096AE]/20";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#941B80] px-5 py-3 font-bold text-white shadow-sm transition hover:bg-[#7e176d] disabled:cursor-not-allowed disabled:opacity-50";
const cardClass = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7";

export default function CalaveritaSegura() {
  const [screen, setScreen] = useState("welcome");
  const [registerStep, setRegisterStep] = useState(0);
  const [quizStep, setQuizStep] = useState(0);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "", correo: "", municipio: "", marca: "", modelo: "", anio: "", tiene_seguro: "", aseguradora: "", vencimiento: "", interes_cotizacion: "" });
  const [registro, setRegistro] = useState(null);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [rows, setRows] = useState([]);
  const [winner, setWinner] = useState(null);
  const [busyAdmin, setBusyAdmin] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data?.session || null));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const setField = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const correctCount = QUESTIONS.reduce((sum, q, i) => sum + (Number(answers[i]) === q.correct ? 1 : 0), 0);
  const classify = () => {
    if (form.tiene_seguro === "Sí" && form.aseguradora === "Quálitas") return "CLIENTE_VIGENTE";
    if (form.tiene_seguro === "Sí" && ["Menos de 30 días", "30 a 60 días", "60 a 90 días"].includes(form.vencimiento)) return "RENOVACION";
    return "PROSPECTO";
  };
  const baseParticipations = (r) => 1 + (r.tipo_cliente === "CLIENTE_VIGENTE" ? 1 : r.tipo_cliente === "RENOVACION" ? 2 : 0) + (Number(r.puntaje_reto || 0) >= 4 ? 1 : 0);

  const registrationSteps = [
    { key: "nombre", title: "¿Cómo te llamas?", subtitle: "Escribe tu nombre completo.", type: "text", placeholder: "Nombre y apellidos", autocomplete: "name" },
    { key: "telefono", title: "¿Cuál es tu teléfono celular?", subtitle: "Lo usaremos para dar seguimiento a tu participación.", type: "tel", placeholder: "10 dígitos", autocomplete: "tel" },
    { key: "correo", title: "¿Cuál es tu correo electrónico?", subtitle: "Te ayudará a mantener tus datos de contacto actualizados.", type: "email", placeholder: "tucorreo@ejemplo.com", autocomplete: "email" },
    { key: "municipio", title: "¿En qué municipio vives?", subtitle: "Queremos conocer la zona de nuestros participantes.", type: "text", placeholder: "Tu municipio", autocomplete: "address-level2" },
    { key: "codigo_postal", title: "¿Cuál es tu código postal?", subtitle: "Nos ayuda a identificar tu zona.", type: "text", placeholder: "Ej. 54700", inputMode: "numeric", maxLength: 5, autocomplete: "postal-code" },
    { key: "marca", title: "¿Qué marca es tu vehículo?", subtitle: "Cuéntanos un poco sobre el auto que conduces.", type: "text", placeholder: "Ej. Nissan" },
    { key: "modelo", title: "¿Qué modelo es?", subtitle: "Escribe el modelo de tu vehículo.", type: "text", placeholder: "Ej. Versa" },
    { key: "anio", title: "¿De qué año es tu vehículo?", subtitle: "Selecciona el año modelo.", type: "number", placeholder: "Ej. 2022" },
    { key: "tiene_seguro", title: "¿Tu vehículo cuenta con seguro actualmente?", subtitle: "Elige la opción que corresponda.", type: "select", options: ["Sí", "No"] },
    ...(form.tiene_seguro === "Sí" ? [
      { key: "aseguradora", title: "¿Con qué aseguradora estás protegido?", subtitle: "Selecciona tu aseguradora actual.", type: "select", options: insurers },
      { key: "vencimiento", title: "¿Cuándo vence tu póliza?", subtitle: "Elige el periodo aproximado.", type: "select", options: ["Menos de 30 días", "30 a 60 días", "60 a 90 días", "Más de 90 días"] }
    ] : form.tiene_seguro === "No" ? [
      { key: "interes_cotizacion", title: "¿Te gustaría recibir una cotización?", subtitle: "Es opcional solicitar información sobre una cobertura.", type: "select", options: ["Sí", "No"] }
    ] : []),
    { key: "privacidad", title: "¿Nos autorizas a tratar tus datos?", subtitle: "Necesitamos tu autorización para gestionar tu participación en el evento.", type: "privacy" }
  ];

  const nextRegistrationStep = () => {
    const current = registrationSteps[registerStep];
    if (!current) return;
    if (current.type === "privacy") {
      if (!privacyAccepted) { setError("Debes aceptar el aviso de privacidad para continuar."); return; }
    } else {
      const value = String(form[current.key] ?? "").trim();
      if (!value) { setError("Completa tu respuesta para continuar."); return; }
      if (current.key === "correo" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setError("Escribe un correo electrónico válido."); return; }
      if (current.key === "telefono" && !/^[0-9+()\-\s]{10,20}$/.test(value)) { setError("Escribe un teléfono válido de 10 a 20 caracteres."); return; }
      if (current.key === "anio" && (Number(value) < 1950 || Number(value) > new Date().getFullYear() + 1)) { setError("Escribe un año de vehículo válido."); return; }
    }
    setError("");
    setRegisterStep(i => Math.min(i + 1, registrationSteps.length - 1));
  };

  const submitRegistration = async (event) => {
    event.preventDefault(); setError(""); setNotice(""); setSaving(true);
    const tipo_cliente = classify();
    const payload = { ...form, anio: Number(form.anio), tipo_cliente, puntaje_reto: 0, participaciones: 1 + (tipo_cliente === "CLIENTE_VIGENTE" ? 1 : tipo_cliente === "RENOVACION" ? 2 : 0), estatus_seguimiento: "PENDIENTE" };
    try {
      if (supabaseConfigured) {
        const { data, error: insertError } = await supabase
          .from("calaverita_2026_registros")
          .insert({
            nombre: payload.nombre,
            telefono: payload.telefono,
            correo: payload.correo,
            municipio: payload.municipio,
            marca: payload.marca,
            modelo: payload.modelo,
            anio: payload.anio,
            tiene_seguro: payload.tiene_seguro,
            aseguradora: payload.aseguradora || null,
            vencimiento: payload.vencimiento || null,
            tipo_cliente: payload.tipo_cliente,
            puntaje_reto: 0,
            participaciones: payload.participaciones,
            interes_cotizacion: payload.interes_cotizacion || null,
            estatus_seguimiento: "PENDIENTE"
          })
          .select()
          .single();
        if (insertError) throw insertError;
        setRegistro(data);
      } else {
        const local = { ...payload, id: crypto.randomUUID(), fecha_registro: new Date().toISOString() };
        localStorage.setItem("calaverita-registro-" + local.id, JSON.stringify(local));
        setRegistro(local);
        setNotice("Modo local: este registro permanece en este dispositivo y no se sincroniza.");
      }
      setScreen("quiz");
    } catch (e) { setError("No se pudo guardar el registro. Verifica la configuración de Supabase y la tabla de Calaverita: " + (e.message || "Error desconocido")); }
    finally { setSaving(false); }
  };

  const finishQuiz = async () => {
    if (!registro) return;
    setError(""); setSaving(true);
    try {
      const score = correctCount;
      if (supabaseConfigured && registro.id) {
        const { data, error: rpcError } = await supabase.rpc("calaverita_2026_finalizar_reto", { p_id: registro.id, p_puntaje: score });
        if (rpcError) throw rpcError;
        if (data) setRegistro(data);
        else setRegistro(old => ({ ...old, puntaje_reto: score, participaciones: baseParticipations({ ...old, puntaje_reto: score }) }));
      } else {
        const updated = { ...registro, puntaje_reto: score, participaciones: baseParticipations({ ...registro, puntaje_reto: score }) };
        localStorage.setItem("calaverita-registro-" + registro.id, JSON.stringify(updated)); setRegistro(updated);
      }
      setScreen("summary");
    } catch (e) { setError("El registro se guardó, pero no se pudo guardar el resultado del reto: " + e.message); }
    finally { setSaving(false); }
  };

  const resetTests = async () => {
    const confirmed = window.confirm("¿Seguro que quieres borrar TODOS los registros de Calaverita Segura 2026? Esta acción no se puede deshacer. Úsala sólo para limpiar pruebas.");
    if (!confirmed) return;
    setResetting(true); setError(""); setNotice("");
    try {
      const { data, error: resetError } = await supabase.rpc("calaverita_2026_reiniciar_pruebas");
      if (resetError) throw resetError;
      setRows([]);
      setWinner(null);
      setNotice("Registros eliminados: " + Number(data?.deleted_count ?? 0) + ". El panel quedó limpio.");
    } catch (e) {
      setError("No se pudieron borrar los registros. Ejecuta el SQL complementario de reinicio en Supabase y vuelve a intentarlo: " + (e.message || "Error desconocido"));
    } finally {
      setResetting(false);
    }
  };

  const loadAdmin = async () => {
    if (!session) return;
    setBusyAdmin(true); setError("");
    const { data, error: loadError } = await supabase.from("calaverita_2026_registros").select("*").order("fecha_registro", { ascending: false }).limit(5000);
    if (loadError) setError("No se pudieron cargar los registros: " + loadError.message);
    else setRows(data || []);
    setBusyAdmin(false);
  };
  useEffect(() => { if (screen === "admin" && session) loadAdmin(); }, [screen, session]);

  const metrics = useMemo(() => ({
    total: rows.length,
    vigentes: rows.filter(r => r.tipo_cliente === "CLIENTE_VIGENTE").length,
    renovaciones: rows.filter(r => r.tipo_cliente === "RENOVACION").length,
    prospectos: rows.filter(r => r.tipo_cliente === "PROSPECTO").length,
    participaciones: rows.reduce((s, r) => s + Number(r.participaciones_activas || 0), 0),
    promedio: rows.length ? (rows.reduce((s, r) => s + Number(r.puntaje_reto || 0), 0) / rows.length).toFixed(1) : "0.0",
  }), [rows]);

  const exportCsv = (data, filename) => {
    const cols = ["fecha_registro","nombre","telefono","correo","municipio","marca","modelo","anio","aseguradora","vencimiento","tipo_cliente","puntaje_reto","participaciones_activas","interes_cotizacion","estatus_seguimiento"];
    const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const csv = "\uFEFF" + [cols, ...data.map(r => cols.map(c => r[c]))].map(line => line.map(q).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows.map(r => ({
      "Fecha de registro": r.fecha_registro, "Nombre": r.nombre, "Teléfono": r.telefono, "Correo": r.correo,
      "Municipio": r.municipio, "Código postal": r.codigo_postal, "Marca": r.marca, "Modelo": r.modelo, "Año": r.anio,
      "Aseguradora": r.aseguradora, "Vencimiento": r.vencimiento, "Tipo de cliente": r.tipo_cliente,
      "Puntaje del reto": r.puntaje_reto, "Participaciones asignadas": r.participaciones,
      "Interés de cotización": r.interes_cotizacion, "Seguimiento": r.estatus_seguimiento
    })));
    worksheet["!cols"] = [{wch:22},{wch:28},{wch:16},{wch:28},{wch:22},{wch:16},{wch:18},{wch:10},{wch:18},{wch:22},{wch:20},{wch:16},{wch:16},{wch:22},{wch:20}];
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Asistentes");
    XLSX.writeFile(workbook, "Calaverita_Segura_Qualitas_2026.xlsx");
  };

  const drawWinner = () => {
    const eligible = rows.filter(r => r.asistencia_confirmada === true);
    if (!eligible.length) { setError("No hay asistentes con asistencia confirmada para realizar la rifa."); return; }
    const pool = eligible.flatMap(r => Array.from({ length: Math.max(0, Math.min(100, Number(r.participaciones_activas || 0))) }, () => r));
    if (!pool.length) { setError("No hay participaciones activas válidas entre los asistentes confirmados."); return; }
    setWinner(pool[Math.floor(Math.random() * pool.length)]); setError("");
  };

  const signIn = async (e) => {
    e.preventDefault(); setError(""); setBusyAdmin(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) setError("No se pudo iniciar sesión: " + authError.message);
    else { setSession(data.session); setPassword(""); }
    setBusyAdmin(false);
  };

  return <main className="min-h-[75vh] bg-slate-50 px-3 py-5 md:px-6 md:py-8">
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => setScreen("welcome")} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#941B80] hover:bg-purple-50"><FaArrowLeft/> Salir al inicio</button>
        <button onClick={() => { setScreen("admin"); setError(""); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><FaLock/> Administración</button>
      </div>
      <header className="mb-6 overflow-hidden rounded-3xl bg-white shadow-lg"><img src="/calaverita-whatsapp.png" alt="Calaverita Segura 2026" className="block h-auto w-full object-cover" /></header>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{notice}</div>}

      {screen === "welcome" && <section className={cardClass + " text-center"}>
        <img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="mx-auto mb-6 h-auto w-full max-w-sm object-contain" />
        <p className="text-sm font-bold uppercase tracking-widest text-[#0096AE]">La Calaverita que Protege</p><h2 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">Bienvenido</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Participa en nuestro Reto Conductor Seguro y obtén la oportunidad de ganar una Dashcam.</p>
        <button onClick={() => { setError(""); setRegisterStep(0); setPrivacyAccepted(false); setQuizStep(0); setAnswers({}); setScreen("register"); }} className={btnPrimary + " mt-7 min-w-48"}>COMENZAR</button>
      </section>}

      {screen === "register" && <section className={cardClass + " mx-auto max-w-2xl"}>
        <img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="mx-auto mb-5 h-auto w-48 object-contain" />
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold uppercase tracking-widest text-[#0096AE]">Registro de participante</p><span className="text-sm font-bold text-slate-500">{registerStep + 1} de {registrationSteps.length}</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#941B80] to-[#0096AE] transition-all duration-300" style={{ width: ((registerStep + 1) / registrationSteps.length * 100) + "%" }} /></div>
        </div>
        <form onSubmit={e => { e.preventDefault(); submitRegistration(e); }} className="min-h-[330px]">
          <div key={registrationSteps[registerStep]?.key} className="animate-[fadeIn_.25s_ease-out]">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0096AE]">Paso {registerStep + 1}</p>
            <h2 className="mt-3 text-2xl font-black leading-tight text-slate-900 md:text-3xl">{registrationSteps[registerStep]?.title}</h2>
            <p className="mt-2 text-slate-600">{registrationSteps[registerStep]?.subtitle}</p>
            <div className="mt-7">
              {registrationSteps[registerStep]?.type === "privacy" ? <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700"><input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#941B80]" /><span>Autorizo el tratamiento de mis datos personales para la gestión de este evento y confirmo que he leído el aviso de privacidad de Quálitas. Esta autorización es necesaria para registrar mi participación.</span></label>
              : registrationSteps[registerStep]?.type === "select" ? <div className="grid gap-3 sm:grid-cols-2">{registrationSteps[registerStep].options.map(option => <button type="button" key={option} onClick={() => { setField(registrationSteps[registerStep].key, option); setError(""); }} className={"rounded-2xl border-2 px-4 py-5 text-left text-lg font-bold transition " + (form[registrationSteps[registerStep].key] === option ? "border-[#941B80] bg-purple-50 text-[#941B80]" : "border-slate-200 bg-white text-slate-700 hover:border-[#0096AE] hover:bg-cyan-50")}>{option}{form[registrationSteps[registerStep].key] === option && <span className="float-right">✓</span>}</button>)}</div>
              : <input autoFocus className={fieldClass + " py-4 text-lg"} value={form[registrationSteps[registerStep].key] || ""} type={registrationSteps[registerStep].type} inputMode={registrationSteps[registerStep].inputMode || (registrationSteps[registerStep].type === "tel" ? "tel" : undefined)} maxLength={registrationSteps[registerStep].maxLength} autoComplete={registrationSteps[registerStep].autocomplete} placeholder={registrationSteps[registerStep].placeholder} min={registrationSteps[registerStep].type === "number" ? 1950 : undefined} max={registrationSteps[registerStep].type === "number" ? new Date().getFullYear() + 1 : undefined} onChange={e => setField(registrationSteps[registerStep].key, registrationSteps[registerStep].key === "codigo_postal" ? e.target.value.replace(/\\D/g, "").slice(0,5) : e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (registerStep < registrationSteps.length - 1) nextRegistrationStep(); } }} />}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={() => { setError(""); if (registerStep === 0) setScreen("welcome"); else setRegisterStep(i => Math.max(0, i - 1)); }} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-600 hover:bg-slate-50">{registerStep === 0 ? "Cancelar" : "← Anterior"}</button>
            {registerStep < registrationSteps.length - 1 ? <button type="button" onClick={nextRegistrationStep} className={btnPrimary}>Continuar →</button> : <button type="submit" disabled={saving || !privacyAccepted} className={btnPrimary}>{saving ? "Guardando registro…" : "GUARDAR Y COMENZAR RETO"}</button>}
          </div>
        </form>
      </section>}

      {screen === "quiz" && <section className={cardClass + " mx-auto max-w-3xl overflow-hidden"}>
        <div className="rounded-2xl bg-gradient-to-r from-[#941B80] to-[#0096AE] p-5 text-white md:p-7">
          <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-widest">Misión vial</span><span className="text-sm font-bold">{quizStep + 1} / {QUESTIONS.length}</span></div>
          <h2 className="mt-4 text-2xl font-black md:text-3xl">Reto Conductor Seguro</h2>
          <p className="mt-2 text-white/90">Resuelve cada situación vial. Acumula al menos 4 respuestas correctas de 5 para obtener una participación adicional.</p>
          <div className="mt-5 flex gap-2">{QUESTIONS.map((q,i)=><div key={q.q} className={"h-2 flex-1 rounded-full "+(i<quizStep?"bg-white":i===quizStep?"bg-white/70":"bg-black/20")}/>)}</div>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#0096AE]">Situación {quizStep+1}</p>
          <h3 className="mt-3 text-xl font-black leading-snug text-slate-900 md:text-2xl">{QUESTIONS[quizStep].q}</h3>
          <p className="mt-2 text-sm text-slate-600">Toca la decisión que tomarías en esta situación.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">{QUESTIONS[quizStep].a.map((a,j)=>{const chosen=Number(answers[quizStep])===j;const answered=answers[quizStep]!==undefined;const correct=j===QUESTIONS[quizStep].correct;return <button type="button" key={a} disabled={answered} onClick={()=>setAnswers(old=>({...old,[quizStep]:j}))} className={"min-h-20 rounded-2xl border-2 p-4 text-left text-base font-bold transition md:text-lg "+(answered&&correct?"border-emerald-500 bg-emerald-50 text-emerald-800":chosen&&!correct?"border-rose-400 bg-rose-50 text-rose-800":chosen?"border-[#941B80] bg-purple-50 text-[#941B80]":"border-slate-200 bg-white hover:border-[#0096AE] hover:bg-cyan-50")}>
            <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm">{["A","B","C","D"][j]}</span>{a}{answered&&correct?<span className="float-right">✓</span>:null}
          </button>})}</div>
          {answers[quizStep]!==undefined&&<div className={"mt-4 rounded-xl p-4 font-semibold "+(Number(answers[quizStep])===QUESTIONS[quizStep].correct?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-900")}>{Number(answers[quizStep])===QUESTIONS[quizStep].correct?"¡Correcto! Buena decisión al volante.":"No es la mejor decisión. La respuesta correcta es: "+QUESTIONS[quizStep].a[QUESTIONS[quizStep].correct]+"."}</div>}
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-3">
          <button onClick={()=>{setScreen("register");setError("");}} className="rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-600">Salir del reto</button>
          {quizStep<QUESTIONS.length-1?<button disabled={answers[quizStep]===undefined} onClick={()=>setQuizStep(i=>i+1)} className={btnPrimary}>Siguiente situación →</button>:<button disabled={saving||Object.keys(answers).length!==QUESTIONS.length} onClick={finishQuiz} className={btnPrimary}>{saving?"Guardando resultado…":"Ver resultado del reto"}</button>}
        </div>
      </section>}

      {screen === "summary" && registro && <section className={cardClass + " text-center"}>
        <img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="mx-auto mb-5 h-auto w-full max-w-xs object-contain" /><FaCheckCircle className="mx-auto text-5xl text-[#0096AE]"/><h2 className="mt-4 text-3xl font-black text-slate-900">{Number(registro.puntaje_reto)>=4 ? "¡Felicidades! Has completado el Reto Conductor Seguro." : "¡Gracias por participar!"}</h2>
        <p className="mt-3 text-slate-600">Has quedado registrado para la rifa de una Dashcam.</p>
        <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-left sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Participante</p><p className="mt-1 text-lg font-bold">{registro.nombre}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Tipo de cliente</p><p className="mt-1 font-bold text-[#941B80]">{registro.tipo_cliente}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Resultado del reto</p><p className="mt-1 font-bold">{registro.puntaje_reto}/5 correctas</p></div><div className="rounded-xl bg-purple-50 p-4"><p className="text-xs font-bold uppercase text-[#941B80]">Participaciones asignadas</p><p className="mt-1 text-3xl font-black text-[#941B80]">{registro.participaciones}</p></div></div>
        <button onClick={()=>{setForm({nombre:"",telefono:"",correo:"",municipio:"",marca:"",modelo:"",anio:"",tiene_seguro:"",aseguradora:"",vencimiento:"",interes_cotizacion:""});setRegisterStep(0);setPrivacyAccepted(false);setRegistro(null);setAnswers({});setQuizStep(0);setNotice("");setScreen("welcome");}} className={btnPrimary+" mt-6"}>REGISTRAR OTRO PARTICIPANTE</button>
      </section>}

      {screen === "admin" && <section className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-widest text-[#0096AE]">Área restringida</p><h2 className="mt-1 text-2xl font-black text-slate-900">Panel administrador</h2><p className="mt-1 text-sm text-slate-600">Acceso autenticado para consultar registros personales y realizar la rifa.</p></div>{session && <button onClick={async()=>{await supabase.auth.signOut();setSession(null);setRows([]);}} className="rounded-xl border px-3 py-2 text-sm font-semibold">Cerrar sesión</button>}</div>
        {!session ? <form onSubmit={signIn} className="mt-6 grid max-w-lg gap-4"><label className="text-sm font-semibold">Correo de administrador<input required type="email" className={fieldClass} value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="text-sm font-semibold">Contraseña<input required type="password" className={fieldClass} value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busyAdmin || !supabaseConfigured} className={btnPrimary}>{busyAdmin?"Validando…":"Iniciar sesión"}</button>{!supabaseConfigured&&<p className="text-sm text-red-700">Configura Supabase para habilitar el panel y guardar registros compartidos.</p>}</form> :
        <><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Asistentes",metrics.total,<FaUsers/>],["Clientes vigentes",metrics.vigentes,"Q"],["Renovaciones",metrics.renovaciones,"↻"],["Prospectos",metrics.prospectos,"+"],["Participaciones",metrics.participaciones,<FaTrophy/>],["Promedio del reto",metrics.promedio+"/5","★"]].map(([label,value,icon])=><div key={label} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between text-sm font-semibold text-slate-500"><span>{label}</span><span className="text-[#0096AE]">{icon}</span></div><p className="mt-2 text-3xl font-black text-[#941B80]">{value}</p></div>)}</div>
        <div className="mt-5 flex flex-wrap gap-2"><button onClick={loadAdmin} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-semibold"><FaSyncAlt/> Actualizar</button><button onClick={()=>exportCsv(rows,"Calaverita_Segura_Quálitas_2026.csv")} className="inline-flex items-center gap-2 rounded-xl bg-[#0096AE] px-4 py-2 font-bold text-white"><FaDownload/> Exportar CSV</button><button onClick={exportExcel} className="inline-flex items-center gap-2 rounded-xl border border-[#0096AE] px-4 py-2 font-bold text-[#007f93]"><FaDownload/> Exportar Excel</button><button onClick={()=>window.print()} className="rounded-xl border px-4 py-2 font-semibold">Imprimir / Guardar PDF</button><button onClick={drawWinner} className={btnPrimary}><FaTrophy/> REALIZAR SORTEO</button><button onClick={resetTests} disabled={resetting || busyAdmin} className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2 font-bold text-red-800 disabled:opacity-50"><FaTrashAlt/> {resetting ? "Borrando registros…" : "Reiniciar pruebas"}</button></div><p className="mt-2 text-xs text-red-700">Atención: el reinicio elimina todos los registros del evento, no sólo los de prueba. Exporta antes si necesitas conservarlos.</p>
        {winner&&<div className="mt-5 rounded-2xl border-2 border-[#0096AE] bg-cyan-50 p-5"><p className="text-sm font-bold uppercase tracking-widest text-[#941B80]">Ganador de la Dashcam</p><h3 className="mt-2 text-3xl font-black">{winner.nombre}</h3><p className="mt-1">Teléfono: {winner.telefono}</p><p>Folio: {winner.id}</p><p>Fecha: {new Date().toLocaleString("es-MX")}</p><button onClick={()=>window.print()} className="mt-3 rounded-xl bg-[#941B80] px-4 py-2 font-bold text-white">Imprimir constancia</button></div>}
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[1100px] w-full text-left text-sm"><thead className="bg-slate-50"><tr>{["Fecha","Nombre","Teléfono","Municipio / C.P.","Vehículo","Aseguradora","Vencimiento","Clasificación","Reto","Participaciones activas","Cotización"].map(h=><th key={h} className="whitespace-nowrap px-3 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map(r=><tr key={r.id}><td className="whitespace-nowrap px-3 py-3">{r.fecha_registro?new Date(r.fecha_registro).toLocaleString("es-MX"):"—"}</td><td className="px-3 py-3 font-semibold">{r.nombre}</td><td className="px-3 py-3">{r.telefono}</td><td className="px-3 py-3">{[r.municipio,r.codigo_postal].filter(Boolean).join(" · ")||"—"}</td><td className="px-3 py-3">{[r.marca,r.modelo,r.anio].filter(Boolean).join(" ")}</td><td className="px-3 py-3">{r.aseguradora||"—"}</td><td className="px-3 py-3">{r.vencimiento||"—"}</td><td className="px-3 py-3">{r.tipo_cliente}</td><td className="px-3 py-3">{r.puntaje_reto}/5</td><td className="px-3 py-3 font-bold">{r.participaciones_activas||0}</td><td className="px-3 py-3">{r.interes_cotizacion||"—"}</td></tr>)}</tbody></table></div></>}
      </section>}
      <footer className="mt-6 flex flex-col items-center gap-3 text-center text-xs text-slate-500"><img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="h-auto w-48 object-contain" /><span>Aseguramos autos, cuidamos personas. · CALAVERITA SEGURA 2026</span></footer>
    </div>
  </main>;
}
