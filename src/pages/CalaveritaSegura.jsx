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

  const submitRegistration = async (event) => {
    event.preventDefault(); setError(""); setNotice(""); setSaving(true);
    const tipo_cliente = classify();
    const payload = { ...form, anio: Number(form.anio), tipo_cliente, puntaje_reto: 0, participaciones: 1 + (tipo_cliente === "CLIENTE_VIGENTE" ? 1 : tipo_cliente === "RENOVACION" ? 2 : 0), estatus_seguimiento: "PENDIENTE" };
    try {
      if (supabaseConfigured) {
        const { data, error: insertError } = await supabase.rpc("calaverita_2026_registrar", {
          p_nombre: payload.nombre,
          p_telefono: payload.telefono,
          p_correo: payload.correo,
          p_municipio: payload.municipio,
          p_marca: payload.marca,
          p_modelo: payload.modelo,
          p_anio: payload.anio,
          p_tiene_seguro: payload.tiene_seguro,
          p_aseguradora: payload.aseguradora,
          p_vencimiento: payload.vencimiento,
          p_tipo_cliente: payload.tipo_cliente,
          p_interes_cotizacion: payload.interes_cotizacion,
          p_participaciones: payload.participaciones
        });
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
    participaciones: rows.reduce((s, r) => s + Number(r.participaciones || 0), 0),
    promedio: rows.length ? (rows.reduce((s, r) => s + Number(r.puntaje_reto || 0), 0) / rows.length).toFixed(1) : "0.0",
  }), [rows]);

  const exportCsv = (data, filename) => {
    const cols = ["fecha_registro","nombre","telefono","correo","municipio","marca","modelo","anio","aseguradora","vencimiento","tipo_cliente","puntaje_reto","participaciones","interes_cotizacion","estatus_seguimiento"];
    const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const csv = "\uFEFF" + [cols, ...data.map(r => cols.map(c => r[c]))].map(line => line.map(q).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows.map(r => ({
      "Fecha de registro": r.fecha_registro, "Nombre": r.nombre, "Teléfono": r.telefono, "Correo": r.correo,
      "Municipio": r.municipio, "Marca": r.marca, "Modelo": r.modelo, "Año": r.anio,
      "Aseguradora": r.aseguradora, "Vencimiento": r.vencimiento, "Tipo de cliente": r.tipo_cliente,
      "Puntaje del reto": r.puntaje_reto, "Participaciones": r.participaciones,
      "Interés de cotización": r.interes_cotizacion, "Seguimiento": r.estatus_seguimiento
    })));
    worksheet["!cols"] = [{wch:22},{wch:28},{wch:16},{wch:28},{wch:22},{wch:16},{wch:18},{wch:10},{wch:18},{wch:22},{wch:20},{wch:16},{wch:16},{wch:22},{wch:20}];
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Asistentes");
    XLSX.writeFile(workbook, "Calaverita_Segura_Qualitas_2026.xlsx");
  };

  const drawWinner = () => {
    if (!rows.length) { setError("No hay registros para realizar el sorteo."); return; }
    const pool = rows.flatMap(r => Array.from({ length: Math.max(0, Math.min(100, Number(r.participaciones || 0))) }, () => r));
    if (!pool.length) { setError("No hay participaciones válidas."); return; }
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
      <header className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-[#941B80] to-[#0096AE] p-6 text-white shadow-lg md:p-8">
        <div className="flex items-center gap-4"><div className="flex shrink-0 items-center rounded-xl bg-white p-2"><img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="h-auto w-40 object-contain md:w-56" /></div><div><p className="text-xs font-bold uppercase tracking-[.2em] text-white/80">Quálitas · 30 de octubre de 2026</p><h1 className="mt-1 text-2xl font-black md:text-4xl">CALAVERITA SEGURA</h1><p className="mt-1 text-white/90">Evento de Fidelización y Seguridad Vial · 14:30–18:00 h</p></div></div>
        <p className="mt-3 text-sm text-white/90">Plaza San Diego · Cuautitlán, Estado de México</p>
      </header>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{notice}</div>}

      {screen === "welcome" && <section className={cardClass + " text-center"}>
        <img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="mx-auto mb-6 h-auto w-full max-w-sm object-contain" />
        <p className="text-sm font-bold uppercase tracking-widest text-[#0096AE]">La Calaverita que Protege</p><h2 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">Bienvenido</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">Participa en nuestro Reto Conductor Seguro y obtén la oportunidad de ganar una Dashcam.</p>
        <button onClick={() => { setError(""); setScreen("register"); }} className={btnPrimary + " mt-7 min-w-48"}>COMENZAR</button>
      </section>}

      {screen === "register" && <section className={cardClass}>
        <p className="text-sm font-bold uppercase tracking-widest text-[#0096AE]">Paso 1 de 3</p><h2 className="mt-1 text-2xl font-black text-slate-900">Registro de participante</h2><p className="mt-2 text-sm text-slate-600">Completa tus datos para participar. Los campos marcados son obligatorios.</p>
        <form onSubmit={submitRegistration} className="mt-6 grid gap-4 md:grid-cols-2">
          {[["nombre","Nombre completo","text"],["telefono","Teléfono","tel"],["correo","Correo electrónico","email"],["municipio","Municipio","text"],["marca","Marca del vehículo","text"],["modelo","Modelo","text"],["anio","Año del vehículo","number"]].map(([key,label,type]) => <label key={key} className="text-sm font-semibold text-slate-700">{label}<input className={fieldClass} required value={form[key]} type={type} onChange={e=>setField(key,e.target.value)} min={type==="number" ? 1950 : undefined} max={type==="number" ? new Date().getFullYear()+1 : undefined} /></label>)}
          <label className="text-sm font-semibold text-slate-700">¿Cuenta con seguro actualmente?<select required className={fieldClass} value={form.tiene_seguro} onChange={e=>{setField("tiene_seguro",e.target.value);setField("aseguradora","");setField("vencimiento","");setField("interes_cotizacion","");}}><option value="">Selecciona</option><option>Sí</option><option>No</option></select></label>
          {form.tiene_seguro === "Sí" && <><label className="text-sm font-semibold text-slate-700">¿Con qué aseguradora?<select required className={fieldClass} value={form.aseguradora} onChange={e=>setField("aseguradora",e.target.value)}><option value="">Selecciona</option>{insurers.map(i=><option key={i}>{i}</option>)}</select></label><label className="text-sm font-semibold text-slate-700">¿Cuándo vence aproximadamente?<select required className={fieldClass} value={form.vencimiento} onChange={e=>setField("vencimiento",e.target.value)}><option value="">Selecciona</option>{["Menos de 30 días","30 a 60 días","60 a 90 días","Más de 90 días"].map(i=><option key={i}>{i}</option>)}</select></label></>}
          {form.tiene_seguro === "No" && <label className="text-sm font-semibold text-slate-700">¿Te gustaría recibir una cotización?<select required className={fieldClass} value={form.interes_cotizacion} onChange={e=>setField("interes_cotizacion",e.target.value)}><option value="">Selecciona</option><option>Sí</option><option>No</option></select></label>}
          <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2"><input type="checkbox" required className="mt-1 accent-[#941B80]"/>Autorizo el tratamiento de mis datos personales para la gestión de este evento y he leído el aviso de privacidad de Quálitas.</label>
          <div className="md:col-span-2"><button disabled={saving} className={btnPrimary}>{saving ? "Guardando registro…" : "GUARDAR Y COMENZAR RETO"}</button></div>
        </form>
      </section>}

      {screen === "quiz" && <section className={cardClass}>
        <p className="text-sm font-bold uppercase tracking-widest text-[#0096AE]">Paso 2 de 3</p><h2 className="mt-1 text-2xl font-black text-slate-900">Reto Conductor Seguro</h2><p className="mt-2 text-slate-600">Contesta correctamente y obtén una participación adicional al responder al menos 4 de 5 preguntas.</p>
        <div className="mt-6 space-y-5">{QUESTIONS.map((q,i)=><fieldset key={q.q} className="rounded-2xl border border-slate-200 p-4"><legend className="px-1 font-bold text-slate-800">{i+1}. {q.q}</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{q.a.map((a,j)=><label key={a} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${Number(answers[i])===j ? "border-[#941B80] bg-purple-50" : "border-slate-200 hover:bg-slate-50"}`}><input type="radio" name={`q${i}`} checked={Number(answers[i])===j} onChange={()=>setAnswers(old=>({...old,[i]:j}))} className="accent-[#941B80]"/>{a}</label>)}</div></fieldset>)}</div>
        <button disabled={saving || Object.keys(answers).length!==QUESTIONS.length} onClick={finishQuiz} className={btnPrimary + " mt-6"}>{saving ? "Guardando resultado…" : "FINALIZAR RETO"}</button>
      </section>}

      {screen === "summary" && registro && <section className={cardClass + " text-center"}>
        <img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="mx-auto mb-5 h-auto w-full max-w-xs object-contain" /><FaCheckCircle className="mx-auto text-5xl text-[#0096AE]"/><h2 className="mt-4 text-3xl font-black text-slate-900">{Number(registro.puntaje_reto)>=4 ? "¡Felicidades! Has completado el Reto Conductor Seguro." : "¡Gracias por participar!"}</h2>
        <p className="mt-3 text-slate-600">Has quedado registrado para la rifa de una Dashcam.</p>
        <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-left sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Participante</p><p className="mt-1 text-lg font-bold">{registro.nombre}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Tipo de cliente</p><p className="mt-1 font-bold text-[#941B80]">{registro.tipo_cliente}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Resultado del reto</p><p className="mt-1 font-bold">{registro.puntaje_reto}/5 correctas</p></div><div className="rounded-xl bg-purple-50 p-4"><p className="text-xs font-bold uppercase text-[#941B80]">Participaciones asignadas</p><p className="mt-1 text-3xl font-black text-[#941B80]">{registro.participaciones}</p></div></div>
        <button onClick={()=>{setForm({nombre:"",telefono:"",correo:"",municipio:"",marca:"",modelo:"",anio:"",tiene_seguro:"",aseguradora:"",vencimiento:"",interes_cotizacion:""});setRegistro(null);setAnswers({});setNotice("");setScreen("welcome");}} className={btnPrimary+" mt-6"}>REGISTRAR OTRO PARTICIPANTE</button>
      </section>}

      {screen === "admin" && <section className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-widest text-[#0096AE]">Área restringida</p><h2 className="mt-1 text-2xl font-black text-slate-900">Panel administrador</h2><p className="mt-1 text-sm text-slate-600">Acceso autenticado para consultar registros personales y realizar la rifa.</p></div>{session && <button onClick={async()=>{await supabase.auth.signOut();setSession(null);setRows([]);}} className="rounded-xl border px-3 py-2 text-sm font-semibold">Cerrar sesión</button>}</div>
        {!session ? <form onSubmit={signIn} className="mt-6 grid max-w-lg gap-4"><label className="text-sm font-semibold">Correo de administrador<input required type="email" className={fieldClass} value={email} onChange={e=>setEmail(e.target.value)}/></label><label className="text-sm font-semibold">Contraseña<input required type="password" className={fieldClass} value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busyAdmin || !supabaseConfigured} className={btnPrimary}>{busyAdmin?"Validando…":"Iniciar sesión"}</button>{!supabaseConfigured&&<p className="text-sm text-red-700">Configura Supabase para habilitar el panel y guardar registros compartidos.</p>}</form> :
        <><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Asistentes",metrics.total,<FaUsers/>],["Clientes vigentes",metrics.vigentes,"Q"],["Renovaciones",metrics.renovaciones,"↻"],["Prospectos",metrics.prospectos,"+"],["Participaciones",metrics.participaciones,<FaTrophy/>],["Promedio del reto",metrics.promedio+"/5","★"]].map(([label,value,icon])=><div key={label} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between text-sm font-semibold text-slate-500"><span>{label}</span><span className="text-[#0096AE]">{icon}</span></div><p className="mt-2 text-3xl font-black text-[#941B80]">{value}</p></div>)}</div>
        <div className="mt-5 flex flex-wrap gap-2"><button onClick={loadAdmin} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-semibold"><FaSyncAlt/> Actualizar</button><button onClick={()=>exportCsv(rows,"Calaverita_Segura_Quálitas_2026.csv")} className="inline-flex items-center gap-2 rounded-xl bg-[#0096AE] px-4 py-2 font-bold text-white"><FaDownload/> Exportar CSV</button><button onClick={exportExcel} className="inline-flex items-center gap-2 rounded-xl border border-[#0096AE] px-4 py-2 font-bold text-[#007f93]"><FaDownload/> Exportar Excel</button><button onClick={()=>window.print()} className="rounded-xl border px-4 py-2 font-semibold">Imprimir / Guardar PDF</button><button onClick={drawWinner} className={btnPrimary}><FaTrophy/> REALIZAR SORTEO</button><button onClick={resetTests} disabled={resetting || busyAdmin} className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2 font-bold text-red-800 disabled:opacity-50"><FaTrashAlt/> {resetting ? "Borrando registros…" : "Reiniciar pruebas"}</button></div><p className="mt-2 text-xs text-red-700">Atención: el reinicio elimina todos los registros del evento, no sólo los de prueba. Exporta antes si necesitas conservarlos.</p>
        {winner&&<div className="mt-5 rounded-2xl border-2 border-[#0096AE] bg-cyan-50 p-5"><p className="text-sm font-bold uppercase tracking-widest text-[#941B80]">Ganador de la Dashcam</p><h3 className="mt-2 text-3xl font-black">{winner.nombre}</h3><p className="mt-1">Teléfono: {winner.telefono}</p><p>Folio: {winner.id}</p><p>Fecha: {new Date().toLocaleString("es-MX")}</p><button onClick={()=>window.print()} className="mt-3 rounded-xl bg-[#941B80] px-4 py-2 font-bold text-white">Imprimir constancia</button></div>}
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[1100px] w-full text-left text-sm"><thead className="bg-slate-50"><tr>{["Fecha","Nombre","Teléfono","Vehículo","Aseguradora","Vencimiento","Clasificación","Reto","Participaciones","Cotización"].map(h=><th key={h} className="whitespace-nowrap px-3 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map(r=><tr key={r.id}><td className="whitespace-nowrap px-3 py-3">{r.fecha_registro?new Date(r.fecha_registro).toLocaleString("es-MX"):"—"}</td><td className="px-3 py-3 font-semibold">{r.nombre}</td><td className="px-3 py-3">{r.telefono}</td><td className="px-3 py-3">{[r.marca,r.modelo,r.anio].filter(Boolean).join(" ")}</td><td className="px-3 py-3">{r.aseguradora||"—"}</td><td className="px-3 py-3">{r.vencimiento||"—"}</td><td className="px-3 py-3">{r.tipo_cliente}</td><td className="px-3 py-3">{r.puntaje_reto}/5</td><td className="px-3 py-3 font-bold">{r.participaciones}</td><td className="px-3 py-3">{r.interes_cotizacion||"—"}</td></tr>)}</tbody></table></div></>}
      </section>}
      <footer className="mt-6 flex flex-col items-center gap-3 text-center text-xs text-slate-500"><img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="h-auto w-48 object-contain" /><span>Aseguramos autos, cuidamos personas. · CALAVERITA SEGURA 2026</span></footer>
    </div>
  </main>;
}
