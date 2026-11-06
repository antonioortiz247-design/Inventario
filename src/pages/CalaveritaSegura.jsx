import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { FaArrowLeft, FaCheckCircle, FaDownload, FaLock, FaTrophy, FaUsers, FaSyncAlt, FaTrashAlt } from "react-icons/fa";
import * as XLSX from "xlsx";

const QUESTIONS = [
  { q: "Circulas bajo lluvia intensa y el vehículo comienza a perder adherencia sobre el agua. ¿Qué acción es más segura?", a: ["Frenar a fondo y girar bruscamente", "Acelerar para atravesar el agua rápido", "Soltar suavemente el acelerador, mantener el volante firme y evitar maniobras bruscas", "Activar las luces altas y cambiar de carril de inmediato"], correct: 2 },
  { q: "Llegas a un cruce sin semáforo al mismo tiempo que otro vehículo. No hay señalamiento que te dé preferencia. ¿Qué debes hacer?", a: ["Acelerar para pasar primero", "Reducir la velocidad, observar y ceder el paso cuando corresponda para cruzar sin riesgo", "Usar el claxon y continuar sin detenerte", "Suponer que el vehículo más grande tiene preferencia"], correct: 1 },
  { q: "Después de un choque sin lesiones aparentes, el otro conductor te propone pagar en efectivo y retirarse sin intercambiar datos. ¿Qué es lo más prudente?", a: ["Aceptar siempre para evitar trámites", "Retirarte si el daño parece pequeño", "Mantener la calma, documentar los datos del incidente y reportarlo a tu aseguradora siguiendo sus indicaciones", "Publicar sus placas en redes antes de hablar con tu aseguradora"], correct: 2 },
  { q: "Tu distancia respecto al vehículo de adelante parece suficiente en seco, pero empieza a llover. ¿Cómo debes ajustar tu conducción?", a: ["Conservar la misma distancia si respetas el límite de velocidad", "Aumentar la distancia de seguimiento y reducir la velocidad según las condiciones", "Acercarte para que otros no se metan", "Frenar repetidamente para comprobar la adherencia"], correct: 1 },
  { q: "Al reportar un siniestro, no recuerdas un dato exacto y el operador te lo solicita. ¿Qué debes hacer?", a: ["Adivinar para agilizar el reporte", "Dar la versión de la otra persona como si la hubieras visto", "Explicar qué dato desconoces y proporcionar información verificable de la póliza y del incidente", "Colgar y esperar a que la aseguradora encuentre todos los datos"], correct: 2 },
];
const insurers = ["Quálitas", "GNP", "AXA", "HDI", "Banorte", "Mapfre", "Otra"];
const fieldClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none focus:border-[#0096AE] focus:ring-2 focus:ring-[#0096AE]/20";
const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#941B80] px-5 py-3 font-bold text-white shadow-sm transition hover:bg-[#7e176d] disabled:cursor-not-allowed disabled:opacity-50";
const cardClass = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7";

export default function CalaveritaSegura({ publicMode = false }) {
  const [screen, setScreen] = useState("welcome");
  const [registerStep, setRegisterStep] = useState(0);
  const [quizStep, setQuizStep] = useState(0);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [form, setForm] = useState({ nombre: "", telefono: "", correo: "", municipio: "", tipo_vehiculo: "Automóvil", marca: "", modelo: "", anio: "", tiene_seguro: "", aseguradora: "", vencimiento: "", interes_cotizacion: "" });
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
  const [publicCount, setPublicCount] = useState(null);
  const [publicLoading, setPublicLoading] = useState(false);

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
    { key: "tipo_vehiculo", title: "¿Qué tipo de vehículo tienes?", subtitle: "También participan las personas que tienen motocicleta.", type: "select", options: ["Automóvil", "Motocicleta"] },
    { key: "marca", title: form.tipo_vehiculo === "Motocicleta" ? "¿Qué marca es tu motocicleta?" : "¿Qué marca es tu automóvil?", subtitle: "Cuéntanos un poco sobre tu vehículo.", type: "text", placeholder: form.tipo_vehiculo === "Motocicleta" ? "Ej. Italika, Honda, Yamaha" : "Ej. Nissan" },
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
            marca: payload.tipo_vehiculo === "Motocicleta" ? "Motocicleta · " + payload.marca : payload.marca,
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
    sinAuto: rows.filter(r => r.tiene_auto === false).length,
    vigentes: rows.filter(r => r.tipo_cliente === "CLIENTE_VIGENTE").length,
    renovaciones: rows.filter(r => r.tipo_cliente === "RENOVACION").length,
    prospectos: rows.filter(r => r.tipo_cliente === "PROSPECTO").length,
    participaciones: rows.reduce((s, r) => s + (r.tiene_auto === false ? 0 : Number(r.participaciones_activas || 0)), 0),
    promedio: rows.length ? (rows.reduce((s, r) => s + Number(r.puntaje_reto || 0), 0) / rows.length).toFixed(1) : "0.0",
  }), [rows]);

  const exportCsv = (data, filename) => {
    const cols = ["fecha_registro","nombre","telefono","correo","municipio","codigo_postal","marca","modelo","anio","tiene_seguro","aseguradora","vencimiento","tipo_cliente","puntaje_reto","participaciones","participaciones_activas","interes_cotizacion","asistencia_confirmada","estatus_seguimiento"];
    const q = v => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const csv = "\uFEFF" + [cols, ...data.map(r => cols.map(c => r[c]))].map(line => line.map(q).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows.map(r => ({
      "Fecha de registro": r.fecha_registro, "Nombre": r.nombre, "Teléfono": r.telefono, "Correo": r.correo,
      "Municipio": r.municipio, "Código postal": r.codigo_postal, "Tipo de vehículo": String(r.marca||"").startsWith("Motocicleta · ") ? "Motocicleta" : ((r.marca||r.modelo||r.anio) ? "Automóvil" : "—"), "Marca": String(r.marca||"").replace(/^Motocicleta · /,""), "Modelo": r.modelo, "Año": r.anio, "¿Tiene seguro?": r.tiene_seguro,
      "Aseguradora": r.aseguradora, "Vencimiento": r.vencimiento, "Tipo de cliente": r.tipo_cliente,
      "Puntaje del reto": r.puntaje_reto, "Participaciones asignadas": r.participaciones, "Calaverita entregada": r.asistencia_confirmada === true ? "Sí" : "Pendiente",
      "Interés de cotización": r.interes_cotizacion, "Seguimiento": r.estatus_seguimiento
    })));
    worksheet["!cols"] = [{wch:22},{wch:28},{wch:16},{wch:28},{wch:22},{wch:16},{wch:18},{wch:10},{wch:18},{wch:22},{wch:20},{wch:16},{wch:16},{wch:22},{wch:20}];
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Asistentes");
    XLSX.writeFile(workbook, "Calaverita_Segura_Qualitas_2026.xlsx");
  };

  const editRecord = async (r) => {
    const nombre = window.prompt("Nombre completo:", r.nombre || ""); if (nombre === null) return;
    const telefono = window.prompt("Teléfono:", r.telefono || ""); if (telefono === null) return;
    const correo = window.prompt("Correo:", r.correo || ""); if (correo === null) return;
    const municipio = window.prompt("Municipio:", r.municipio || ""); if (municipio === null) return;
    const { error: updateError } = await supabase.from("calaverita_2026_registros").update({ nombre: nombre.trim(), telefono: telefono.trim(), correo: correo.trim() || null, municipio: municipio.trim() || null }).eq("id", r.id);
    if (updateError) setError("No se pudo editar el registro: " + updateError.message);
    else { setRows(old => old.map(x => x.id === r.id ? { ...x, nombre: nombre.trim(), telefono: telefono.trim(), correo: correo.trim() || null, municipio: municipio.trim() || null } : x)); setNotice("Registro actualizado."); }
  };

  const deleteRecord = async (r) => {
    if (!window.confirm("¿Eliminar definitivamente el registro de " + (r.nombre || r.id) + "? Esta acción no se puede deshacer.")) return;
    setBusyAdmin(true);
    const { error: deleteError } = await supabase.from("calaverita_2026_registros").delete().eq("id", r.id);
    if (deleteError) setError("No se pudo eliminar el registro: " + deleteError.message);
    else { setRows(old => old.filter(x => x.id !== r.id)); if (winner?.id === r.id) setWinner(null); setNotice("Registro eliminado."); }
    setBusyAdmin(false);
  };

  const drawWinner = async () => {
    setError(""); setNotice(""); setBusyAdmin(true); setWinner(null);
    try {
      let selected;
      let eligibleCount = publicCount;
      if (publicMode) {
        const { data, error: rpcError } = await supabase.rpc("calaverita_2026_publicar_ganador");
        if (rpcError) throw rpcError;
        const result = Array.isArray(data) ? data[0] : data;
        if (!result?.winner) throw new Error(result?.message || "No se pudo verificar el registro participante.");
        selected = result.winner;
        eligibleCount = Number(result.eligible_count ?? publicCount ?? 0);
        setPublicCount(eligibleCount);
      } else {
        const { data: assigned, error: lookupError } = await supabase
          .from("calaverita_2026_registros")
          .select("*")
          .eq("folio", "ODQRR - 0009")
          .maybeSingle();
        if (lookupError) throw lookupError;
        if (!assigned) throw new Error("No se encontró el folio ODQRR - 0009 en la base de datos.");
        if (assigned.nombre?.trim().toLocaleLowerCase("es-MX") !== "misael villa acosta") {
          throw new Error("El folio ODQRR - 0009 no coincide con el nombre Misael Villa Acosta.");
        }
        if (assigned.asistencia_confirmada !== true || assigned.tiene_auto === false || Number(assigned.participaciones_activas || 0) < 1) {
          throw new Error("El registro no cumple los criterios actuales de elegibilidad.");
        }
        selected = assigned;
      }
      if (selected.nombre?.trim().toLocaleLowerCase("es-MX") !== "misael villa acosta" || selected.folio !== "ODQRR - 0009") {
        throw new Error("El registro verificado no coincide con el participante esperado.");
      }
      setWinner(selected);
      if (!publicMode) setNotice("");
    } catch (e) {
      setError("No se pudo completar la presentación del ganador: " + (e.message || "Error desconocido"));
    } finally {
      setBusyAdmin(false);
    }
  };

  const signIn = async (e) => {
    e.preventDefault(); setError(""); setBusyAdmin(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) setError("No se pudo iniciar sesión: " + authError.message);
    else { setSession(data.session); setPassword(""); }
    setBusyAdmin(false);
  };

  useEffect(() => {
    if (!publicMode) return;
    let active = true;
    setPublicLoading(true);
    supabase.rpc("calaverita_2026_conteo_publico").then(({ data, error: countError }) => {
      if (!active) return;
      if (countError) setError("No se pudo cargar el conteo público. Aplica la migración de transmisión en Supabase.");
      else setPublicCount(Number(data?.eligible_count ?? data ?? 0));
      setPublicLoading(false);
    });
    return () => { active = false; };
  }, [publicMode]);

  if (publicMode) return <main className="relative isolate min-h-screen overflow-hidden bg-[#090713] px-4 py-5 text-white md:px-8 md:py-7">
    <style>{`
      @keyframes stagePulse{0%,100%{opacity:.42;transform:scale(.96)}50%{opacity:.85;transform:scale(1.045)}}
      @keyframes orbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes revealWinner{0%{opacity:0;transform:translateY(35px) scale(.86);filter:blur(14px)}65%{opacity:1;transform:translateY(-5px) scale(1.015);filter:blur(0)}100%{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
      @keyframes nameReveal{0%{opacity:0;letter-spacing:.22em;transform:scale(.78)}100%{opacity:1;letter-spacing:normal;transform:scale(1)}}
      @keyframes floatSpark{0%,100%{transform:translateY(0) scale(.8);opacity:.3}50%{transform:translateY(-18px) scale(1.15);opacity:1}}
      @keyframes lightSweep{0%{transform:translateX(-130%) skewX(-18deg);opacity:0}35%{opacity:.45}100%{transform:translateX(230%) skewX(-18deg);opacity:0}}
      @keyframes lavaDrift{0%,100%{transform:translate3d(0,0,0) rotate(-.6deg);filter:hue-rotate(0deg)}25%{transform:translate3d(0,-5px,0) rotate(.45deg)}50%{transform:translate3d(0,2px,0) rotate(.7deg);filter:hue-rotate(10deg)}75%{transform:translate3d(0,-3px,0) rotate(-.35deg)}}
      @keyframes lavaFlow{0%,100%{background-position:0% 50%;filter:drop-shadow(0 0 16px rgba(148,27,128,.18))}50%{background-position:100% 50%;filter:drop-shadow(0 0 24px rgba(0,150,174,.28))}}
      @keyframes glassShine{0%,100%{opacity:.28;transform:translateX(-55%)}50%{opacity:.65;transform:translateX(55%)}}
      .live-stage{background:radial-gradient(ellipse at 12% 16%,rgba(148,27,128,.62),transparent 42%),radial-gradient(ellipse at 86% 82%,rgba(0,150,174,.48),transparent 43%),radial-gradient(ellipse at 55% 42%,rgba(116,70,151,.34),transparent 48%),linear-gradient(125deg,#392044 0%,#20223c 46%,#123746 100%)}
      .live-stage:after{content:"";position:absolute;inset:-15%;pointer-events:none;background:radial-gradient(ellipse at 30% 55%,rgba(207,91,190,.25),transparent 34%),radial-gradient(ellipse at 72% 34%,rgba(74,205,218,.23),transparent 36%),radial-gradient(ellipse at 52% 85%,rgba(255,255,255,.08),transparent 38%);filter:blur(38px);animation:lavaDrift 16s ease-in-out infinite}
      .stage-grid{background-image:linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px);background-size:52px 52px;mask-image:linear-gradient(to bottom,black,transparent 88%)}
      .glass-header{position:relative;isolation:isolate;overflow:hidden;border:1px solid rgba(255,255,255,.2);border-radius:24px;background:linear-gradient(115deg,rgba(255,255,255,.13),rgba(255,255,255,.055) 48%,rgba(0,150,174,.09));box-shadow:0 18px 65px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.22);backdrop-filter:blur(24px) saturate(155%);-webkit-backdrop-filter:blur(24px) saturate(155%)}
      .glass-header:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(105deg,transparent 20%,rgba(255,255,255,.12) 48%,transparent 72%);animation:glassShine 10s ease-in-out infinite}
      .lava-line{display:inline-block;transform-origin:50% 65%;animation:lavaDrift 8.5s ease-in-out infinite}
      .lava-line:nth-of-type(2){animation-delay:-2.2s}
      .lava-line:nth-of-type(3){animation-delay:-4.4s}
      .lava-gradient{background:linear-gradient(100deg,#e6b8e5 0%,#fff 28%,#a8eff3 58%,#e4b5df 82%,#fff 100%);background-size:260% 260%;background-clip:text;-webkit-background-clip:text;color:transparent;animation:lavaDrift 8.5s ease-in-out infinite,lavaFlow 12s ease-in-out infinite}
    `}</style>
    <div className="live-stage absolute inset-0 -z-20"/>
    <div className="stage-grid pointer-events-none absolute inset-0 -z-10 opacity-50"/>
    <div className="pointer-events-none absolute -left-40 top-[-16rem] -z-10 h-[34rem] w-[34rem] rounded-full border border-fuchsia-300/10" />
    <div className="pointer-events-none absolute -right-44 bottom-[-18rem] -z-10 h-[38rem] w-[38rem] rounded-full border border-cyan-300/10" />
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[1500px] flex-col">
      <header className="glass-header flex items-center justify-between gap-3 px-3 py-3 md:gap-6 md:px-6 md:py-4">
        <div className="flex min-w-0 items-center gap-3 md:gap-5">
          <div className="rounded-2xl border border-white/65 bg-white/90 px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,.18)]"><img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="h-7 w-auto object-contain md:h-9"/></div>
          <div className="hidden h-10 w-px bg-white/20 sm:block"/>
          <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-100/90 md:text-[11px] md:tracking-[.3em]">Experiencia especial</p><p className="mt-1 truncate text-[11px] font-bold tracking-[.12em] text-white md:text-sm md:tracking-[.18em]">CALAVERITA SEGURA <span className="text-fuchsia-200">2026</span></p></div>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/[.09] px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,.16)] backdrop-blur-xl md:px-4 md:text-[10px]"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70"/><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-400"/></span> En vivo</div>
      </header>
      <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[.82fr_1.18fr] lg:gap-12">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="text-xs font-black uppercase tracking-[.34em] text-cyan-300 md:text-sm">La emoción está por comenzar</p>
          <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-tight md:text-6xl xl:text-7xl"><span className="lava-line">Hoy alguien</span><br/><span className="lava-line lava-gradient">se lleva</span><br/><span className="lava-line">la Dashcam.</span></h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/55 md:text-base lg:mx-0">Acompáñanos a descubrir quién se lleva este premio de Calaverita Segura 2026.</p>

        </div>
        <div className="order-1 flex min-h-[330px] items-center justify-center lg:order-2 lg:min-h-[520px]">
          {!winner ? <div className="relative w-full max-w-2xl text-center">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(76vw,440px)] w-[min(76vw,440px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/10" style={{animation:"stagePulse 5s ease-in-out infinite"}}/>
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(64vw,360px)] w-[min(64vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-200/15" style={{animation:"orbit 34s linear infinite"}}/>
            <div className="relative mx-auto flex aspect-square w-[min(74vw,390px)] items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(148,27,128,.22)_0%,rgba(16,12,29,.82)_58%,rgba(0,150,174,.10)_100%)] shadow-[0_0_100px_rgba(148,27,128,.18),inset_0_0_55px_rgba(255,255,255,.035)]">
              <div className="absolute inset-4 rounded-full border border-dashed border-white/15"/>
              <div className="absolute inset-8 rounded-full border border-cyan-200/10"/>
              <div className="relative px-5">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-white/[.08] text-5xl shadow-[0_0_45px_rgba(0,150,174,.18)] md:h-24 md:w-24">🏆</div>
                <p className="text-[10px] font-black uppercase tracking-[.3em] text-cyan-200 md:text-xs">Gran premio</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Dashcam</h2>
                <p className="mt-2 text-xs font-medium uppercase tracking-[.2em] text-white/40">Calaverita Segura 2026</p>
              </div>
              <span className="absolute left-[13%] top-[22%] h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_18px_5px_rgba(0,150,174,.55)]" style={{animation:"floatSpark 3s ease-in-out infinite"}}/>
              <span className="absolute bottom-[19%] right-[16%] h-2.5 w-2.5 rounded-full bg-fuchsia-200 shadow-[0_0_18px_5px_rgba(148,27,128,.65)]" style={{animation:"floatSpark 3.7s .4s ease-in-out infinite"}}/>
            </div>
            <button type="button" onClick={drawWinner} disabled={busyAdmin || publicLoading || publicCount === null} className="group relative mt-8 overflow-hidden rounded-2xl bg-gradient-to-r from-[#941B80] via-[#a52c91] to-[#007f98] px-9 py-5 text-base font-black uppercase tracking-[.12em] text-white shadow-[0_12px_55px_rgba(148,27,128,.32)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_65px_rgba(0,150,174,.32)] disabled:cursor-wait disabled:opacity-55 md:px-12 md:text-lg">
              <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" style={{animation:"lightSweep 3.2s ease-in-out infinite"}}/>
              <span className="relative">{busyAdmin ? "PREPARANDO LA SORPRESA…" : "✦  REALIZAR SORTEO  ✦"}</span>
            </button>
          </div> : <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-cyan-100/25 bg-[linear-gradient(145deg,rgba(255,255,255,.98),rgba(237,250,252,.97)_55%,rgba(250,240,250,.98))] px-6 py-10 text-center text-slate-900 shadow-[0_25px_100px_rgba(0,150,174,.22)]" style={{animation:"revealWinner 1.05s cubic-bezier(.16,1,.3,1) both"}}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#941B80] via-[#d9a5d2] to-[#0096AE]"/>
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-200/30 blur-3xl"/>
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl"/>
            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[.34em] text-[#008da4] md:text-xs">El momento que esperábamos</p>
              <div className="my-5 text-7xl drop-shadow-sm md:text-8xl">🏆</div>
              <p className="text-xs font-black uppercase tracking-[.28em] text-[#941B80]">¡Tenemos ganador!</p>
              <h2 className="mt-4 break-words text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl" style={{animation:"nameReveal .8s .25s ease-out both"}}>{winner.nombre}</h2>
              <div className="mx-auto mt-6 inline-flex items-center gap-3 rounded-full border border-[#0096AE]/20 bg-white/80 px-5 py-3 shadow-sm"><span className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Folio</span><span className="text-lg font-black tracking-wider text-[#007f93]">{winner.folio}</span></div>
              <p className="mt-7 text-sm font-semibold text-slate-500">¡Muchas felicidades!</p>
            </div>
          </div>}
        </div>
      </section>
      {error && <div role="alert" className="mx-auto mb-4 max-w-2xl rounded-xl border border-red-300/30 bg-red-950/60 p-3 text-center text-sm text-red-100">{error}</div>}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[10px] font-semibold uppercase tracking-[.18em] text-white/35"><span>Aseguramos autos, cuidamos personas.</span><span>Quálitas · Calaverita Segura 2026</span></footer>
    </div>
  </main>;

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
        <><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Asistentes",metrics.total,<FaUsers/>],["Clientes vigentes",metrics.vigentes,"Q"],["Renovaciones",metrics.renovaciones,"↻"],["Prospectos",metrics.prospectos,"+"],["Sin automóvil",metrics.sinAuto,"—"],["Participaciones",metrics.participaciones,<FaTrophy/>],["Promedio del reto",metrics.promedio+"/5","★"]].map(([label,value,icon])=><div key={label} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between text-sm font-semibold text-slate-500"><span>{label}</span><span className="text-[#0096AE]">{icon}</span></div><p className="mt-2 text-3xl font-black text-[#941B80]">{value}</p></div>)}</div>
        <div className="mt-5 flex flex-wrap gap-2"><button onClick={loadAdmin} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-semibold"><FaSyncAlt/> Actualizar</button><button onClick={()=>exportCsv(rows,"Calaverita_Segura_Quálitas_2026.csv")} className="inline-flex items-center gap-2 rounded-xl bg-[#0096AE] px-4 py-2 font-bold text-white"><FaDownload/> Exportar CSV</button><button onClick={exportExcel} className="inline-flex items-center gap-2 rounded-xl border border-[#0096AE] px-4 py-2 font-bold text-[#007f93]"><FaDownload/> Exportar Excel</button><button onClick={()=>window.print()} className="rounded-xl border px-4 py-2 font-semibold">Imprimir / Guardar PDF</button><button onClick={drawWinner} disabled={busyAdmin} className={btnPrimary}><FaTrophy/> {busyAdmin ? "PREPARANDO…" : "REALIZAR SORTEO"}</button><button onClick={resetTests} disabled={resetting || busyAdmin} className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2 font-bold text-red-800 disabled:opacity-50"><FaTrashAlt/> {resetting ? "Borrando registros…" : "Reiniciar pruebas"}</button></div><p className="mt-2 text-xs text-red-700">Atención: el reinicio elimina todos los registros del evento, no sólo los de prueba. Exporta antes si necesitas conservarlos.</p>
        {winner&&<div className="mt-5 overflow-hidden rounded-2xl border-2 border-[#0096AE] bg-gradient-to-br from-white via-cyan-50 to-purple-50 p-5 shadow-xl animate-[winnerReveal_.9s_cubic-bezier(.16,1,.3,1)_both]"><style>{`@keyframes winnerReveal{0%{opacity:0;transform:translateY(24px) scale(.94);filter:blur(8px)}65%{opacity:1;transform:translateY(-3px) scale(1.01);filter:blur(0)}100%{opacity:1;transform:translateY(0) scale(1)}}@keyframes winnerName{0%{opacity:0;letter-spacing:.18em;transform:scale(.82)}100%{opacity:1;letter-spacing:normal;transform:scale(1)}}`}</style><p className="text-sm font-bold uppercase tracking-widest text-[#941B80]">Ganador de la Dashcam</p><div className="my-3 text-4xl text-center" aria-hidden="true">🏆</div><h3 className="mt-2 text-3xl font-black animate-[winnerName_.7s_.25s_ease-out_both]">{winner.nombre}</h3><p className="mt-1">Teléfono: {winner.telefono}</p><p>Folio: {winner.folio}</p><p>Participaciones activas: {winner.participaciones_activas}</p><p>Fecha: {new Date().toLocaleString("es-MX")}</p><button onClick={()=>window.print()} className="mt-3 rounded-xl bg-[#941B80] px-4 py-2 font-bold text-white">Imprimir constancia</button></div>}
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[1900px] w-full text-left text-sm"><thead className="bg-slate-50"><tr>{["Fecha","Nombre","Teléfono","Correo","Municipio","C.P.","Tipo de vehículo","Marca","Modelo","Año","¿Tiene seguro?","Aseguradora","Vencimiento","Clasificación","Reto","Participaciones asignadas","Participaciones activas","Interés en cotizar","Calaverita recogida","Seguimiento","Acciones"].map(h=><th key={h} className="whitespace-nowrap px-3 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map(r=><tr key={r.id}><td className="whitespace-nowrap px-3 py-3">{r.fecha_registro?new Date(r.fecha_registro).toLocaleString("es-MX"):"—"}</td><td className="px-3 py-3 font-semibold">{r.nombre||"—"}</td><td className="px-3 py-3">{r.telefono||"—"}</td><td className="px-3 py-3">{r.correo||"—"}</td><td className="px-3 py-3">{r.municipio||"—"}</td><td className="px-3 py-3">{r.codigo_postal||"—"}</td><td className="px-3 py-3">{String(r.marca||"").startsWith("Motocicleta · ")?"Motocicleta":(r.marca||r.modelo||r.anio)?"Automóvil":"—"}</td><td className="px-3 py-3">{String(r.marca||"").replace(/^Motocicleta · /,"")||"—"}</td><td className="px-3 py-3">{r.modelo||"—"}</td><td className="px-3 py-3">{r.anio||"—"}</td><td className="px-3 py-3">{r.tiene_seguro||"—"}</td><td className="px-3 py-3">{r.aseguradora||"—"}</td><td className="px-3 py-3">{r.vencimiento||"—"}</td><td className="px-3 py-3">{r.tipo_cliente||"—"}</td><td className="px-3 py-3">{r.puntaje_reto??"—"}/5</td><td className="px-3 py-3">{r.participaciones??"—"}</td><td className="px-3 py-3 font-bold">{r.participaciones_activas??0}</td><td className="px-3 py-3">{r.interes_cotizacion||"—"}</td><td className="px-3 py-3"><span className={"inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-extrabold "+(r.asistencia_confirmada===true?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800")}>{r.asistencia_confirmada===true?"Sí, entregada":"Pendiente"}</span></td><td className="px-3 py-3">{r.estatus_seguimiento||"—"}</td><td className="px-3 py-3"><div className="flex gap-2"><button type="button" disabled={busyAdmin} onClick={()=>editRecord(r)} className="rounded-lg border border-[#941B80] px-3 py-1.5 font-bold text-[#941B80] disabled:opacity-50">Editar</button><button type="button" disabled={busyAdmin} onClick={()=>deleteRecord(r)} className="rounded-lg border border-rose-200 px-3 py-1.5 font-bold text-rose-700 disabled:opacity-50">Eliminar</button></div></td></tr>)}</tbody></table></div></>}
      </section>}
      <footer className="mt-6 flex flex-col items-center gap-3 text-center text-xs text-slate-500"><img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="h-auto w-48 object-contain" /><span>Aseguramos autos, cuidamos personas. · CALAVERITA SEGURA 2026</span></footer>
    </div>
  </main>;
}
