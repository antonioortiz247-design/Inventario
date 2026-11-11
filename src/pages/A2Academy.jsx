import { useEffect, useMemo, useState } from "react";
import { loadOriginalA2Exams, manualA2Exam } from "../data/a2Exams";
import { FaBookOpen, FaBrain, FaClipboardCheck, FaGraduationCap, FaLayerGroup, FaChartLine, FaCheckCircle, FaTimesCircle, FaArrowRight, FaRedo } from "react-icons/fa";

const materias = [
  { id: "generales", title: "Aspectos generales", description: "Actividad aseguradora, riesgo, bases técnicas, marco jurídico y agentes.", topics: ["Actividad aseguradora", "Tipos y características del riesgo", "Prima y costo del seguro", "Contrato y póliza", "Instituciones y autoridades", "Intermediación y agentes"] },
  { id: "accidentes", title: "Accidentes personales", description: "Coberturas, escalas de pérdidas orgánicas, periodos y exclusiones.", topics: ["Muerte accidental", "Pérdidas orgánicas", "Incapacidad", "Reembolso de gastos médicos", "Riesgos y exclusiones"] },
  { id: "gmm", title: "Gastos médicos mayores", description: "Deducible, coaseguro, suma asegurada, condiciones y reclamaciones.", topics: ["Conceptos del ramo", "Deducible y coaseguro", "Condiciones generales", "Reclamaciones", "Reinstalación de suma asegurada"] },
  { id: "salud", title: "Seguro de salud", description: "ISES, copago, prevención, niveles de atención y CONAMED.", topics: ["Objetivos del seguro de salud", "Copago", "Selección de riesgos", "ISES y autoridades", "Niveles de atención"] },
  { id: "autos", title: "Automóviles", description: "Tipos de vehículos y pólizas, valores, coberturas y siniestros.", topics: ["Marco conceptual", "Tipos de póliza", "Valores", "Coberturas básicas y adicionales", "Siniestros"] },
  { id: "hogar", title: "Hogar", description: "Póliza múltiple familiar, formas de aseguramiento, coberturas y siniestros.", topics: ["Marco conceptual y jurídico", "Formas de aseguramiento", "Estructura de la póliza", "Coberturas y exclusiones", "Siniestros"] },
  { id: "embarcaciones", title: "Embarcaciones menores de placer", description: "Navegación, averías, PANDI, bienes cubiertos y excluidos.", topics: ["Tipos de embarcaciones", "Tipos de navegación", "Avería particular y gruesa", "Cobertura PANDI", "Bienes cubiertos y excluidos"] },
];

const preguntas = [
  { id: 1, area: "Aspectos generales", q: "¿Cómo se clasifican los riesgos?", options: ["Puro, personal y catastrófico", "Puro y especulativo", "Personal, catastrófico y especulativo", "Personal y catastrófico"], answer: 1, why: "El examen de Aspectos Generales señala la clasificación en riesgos puros y especulativos." },
  { id: 2, area: "Aspectos generales", q: "¿Qué entidad se constituye por asociación de personas y no produce utilidades para sus asociados?", options: ["Sociedad Anónima", "Sociedad Mutualista", "Institución de Seguros", "Cooperativa"], answer: 1, why: "La respuesta marcada en el examen es Sociedad Mutualista." },
  { id: 3, area: "Aspectos generales", q: "¿Cómo se llama el contrato por el que una aseguradora toma total o parcialmente un riesgo ya cubierto por otra?", options: ["Coaseguro", "Contrato de Seguro", "Reaseguro", "Contrato Social"], answer: 2, why: "El contrato descrito es el contrato de reaseguro." },
  { id: 4, area: "Aspectos generales", q: "Si ocurre un siniestro en un riesgo reasegurado, ¿quién está obligado frente al asegurado?", options: ["La reaseguradora", "La aseguradora", "El apoderado legal del reaseguro", "Ambas compañías"], answer: 1, why: "La respuesta marcada en el examen es la aseguradora." },
  { id: 5, area: "Accidentes personales", q: "¿Qué cobertura reembolsa los gastos por atención médica urgente después de un accidente?", options: ["Pérdidas orgánicas", "Incapacidad", "Reembolso de gastos médicos", "Muerte accidental"], answer: 2, why: "El cuestionario identifica esta protección como Reembolso de Gastos Médicos." },
  { id: 6, area: "Accidentes personales", q: "¿Qué riesgos pueden cubrirse bajo convenio expreso?", options: ["Enfermedad corporal o mental y hernias", "Motociclismo y alpinismo", "Energía nuclear atómica", "Infecciones bacterianas"], answer: 1, why: "La respuesta resaltada en el examen es motociclismo y alpinismo." },
  { id: 7, area: "Gastos médicos mayores", q: "¿Después de qué concepto se aplica el coaseguro?", options: ["La prima", "El reaseguro", "El deducible", "La extraprima"], answer: 2, why: "El cuestionario indica que primero se aplica el deducible y después el coaseguro." },
  { id: 8, area: "Gastos médicos mayores", q: "¿Qué ocurre si se agota la suma asegurada por una enfermedad y después sucede un accidente independiente durante la misma vigencia?", options: ["Se reinstala automáticamente el 100% de la suma asegurada", "Se cancela el seguro", "Se requiere pagar otra prima", "Se rescinde el contrato"], answer: 0, why: "La respuesta marcada en el examen indica reinstalación automática para el accidente no relacionado." },
  { id: 9, area: "Salud", q: "¿Cuál es el objetivo principal del seguro de salud según el cuestionario?", options: ["Evitar reclamaciones de GMM", "Promoción, fomento, prevención, diagnóstico, tratamiento y rehabilitación", "Otorgar seguro popular", "Fomentar campañas de vacunación"], answer: 1, why: "El cuestionario define el objetivo mediante esos servicios de atención integral." },
  { id: 10, area: "Salud", q: "¿Qué significa CONAMED?", options: ["Congreso Nacional de Autodiagnóstico Médico", "Consejo Nacional de Arbitraje Médico", "Comisión Nacional de Ayuda Médica", "Comisión Nacional de Arbitraje Médico"], answer: 3, why: "La opción marcada por el material es Comisión Nacional de Arbitraje Médico." },
  { id: 11, area: "Embarcaciones", q: "¿Qué tipo de navegación implica viajes que traspasan los límites territoriales de la nación?", options: ["Cabotaje", "Altura", "Interior", "Tránsito terrestre"], answer: 1, why: "El cuestionario identifica este tipo de navegación como navegación de altura." },
  { id: 12, area: "Embarcaciones", q: "¿Qué es una avería gruesa o general?", options: ["Daño ordenado por el capitán para salvar la embarcación y evitar daños mayores", "Daño accidental a la embarcación o carga", "Instalación para construir embarcaciones", "Exposición a riesgos marítimos"], answer: 0, why: "La definición corresponde a la avería gruesa o general." },
];

const flashcards = [
  ["Riesgo puro", "Puede producir pérdidas o daños; no contempla una ganancia."],
  ["Riesgo especulativo", "Existe posibilidad de pérdida o de ganancia."],
  ["Reaseguro", "Una aseguradora toma total o parcialmente un riesgo cubierto por otra."],
  ["Deducible", "Cantidad fija a cargo del asegurado que se aplica al iniciar la reclamación, según el cuestionario."],
  ["Copago", "Participación económica a cargo del asegurado al utilizar un servicio."],
  ["Avería particular", "Daño sufrido accidentalmente por la embarcación o su carga."],
  ["Avería gruesa", "Daño ordenado por el capitán para salvar la embarcación y evitar daños mayores."],
  ["Navegación de altura", "Viaje que traspasa los límites territoriales de la nación."],
];

export default function A2Academy() {
  const [tab, setTab] = useState("inicio");
  const [tutorialOpen, setTutorialOpen] = useState(() => { try { return localStorage.getItem("a2-tutorial-seen") !== "1"; } catch { return true; } });
  const [tutorialStep, setTutorialStep] = useState(0);
  const tutorialSteps = [
    { title: "Bienvenido a A2 Academy", text: "Esta herramienta organiza tu preparación para la Cédula A2. Avanza por las secciones a tu ritmo y vuelve a consultar esta guía cuando lo necesites.", tip: "Empieza por explorar las materias y después practica con preguntas." },
    { title: "1. Explora las materias", text: "En “Materias” encontrarás las áreas y sus temas. Selecciona una materia para revisar su estructura y ubicar los contenidos que necesitas estudiar.", tip: "A2 corresponde a Autos, Hogar y Embarcaciones Menores de Placer. Aspectos Generales funciona como fundamento común; Accidentes y Enfermedades pertenecen al ámbito A1." },
    { title: "2. Practica con preguntas", text: "En “Practicar” selecciona una materia o “Todas las materias”. Lee la pregunta y elige una opción. Al responder verás la respuesta correcta y una explicación cuando esté disponible.", tip: "Pulsa “Siguiente pregunta” para continuar. Las respuestas incorrectas se guardan como temas por reforzar." },
    { title: "3. Presenta los exámenes", text: "En “Exámenes” encontrarás los cuestionarios originales y un examen nuevo elaborado con el Manual A2. El modo práctica te permite comprobar cada reactivo; el modo examen guarda tus respuestas y muestra la calificación al finalizar.", tip: "Algunos cuestionarios originales no tienen todas las respuestas marcadas. Esos reactivos se pueden contestar, pero no se califican hasta validar su clave." },
    { title: "4. Repasa con tarjetas", text: "En “Tarjetas” toca la tarjeta para revelar la definición. Marca “La domino” cuando recuerdes el concepto sin ayuda; también puedes avanzar o regresar.", tip: "Las tarjetas dominadas se reflejan en el resumen y en Mi avance." },
    { title: "5. Consulta tu avance", text: "En “Mi avance” revisa las tarjetas dominadas y las preguntas que necesitas reforzar. Por ahora, el progreso se guarda en este dispositivo.", tip: "Si cambias de navegador o dispositivo, el avance local no se transfiere automáticamente." }
  ];
  const cerrarTutorial = () => { setTutorialOpen(false); try { localStorage.setItem("a2-tutorial-seen", "1"); } catch {} };
  const [originalExams, setOriginalExams] = useState([]);
  const [examLoadError, setExamLoadError] = useState("");
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [examMode, setExamMode] = useState("practice");
  const [examIndex, setExamIndex] = useState(0);
  const [examQuestionOrder, setExamQuestionOrder] = useState([]);
  const [examAnswers, setExamAnswers] = useState({});
  const [examFinished, setExamFinished] = useState(false);
  const [examChecked, setExamChecked] = useState(false);
  const [examSeconds, setExamSeconds] = useState(0);
  useEffect(() => {
    let active = true;
    loadOriginalA2Exams().then(data => { if (active) setOriginalExams(data); })
      .catch(() => { if (active) setExamLoadError("No se pudieron cargar los cuestionarios originales. Actualiza la página e inténtalo nuevamente."); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!selectedExamId || examFinished) return;
    const timer = window.setInterval(() => setExamSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [selectedExamId, examFinished]);
  const allExams = [...originalExams, manualA2Exam];
  const selectedExam = allExams.find(exam => exam.id === selectedExamId);
  const currentQuestionIndex = examQuestionOrder[examIndex] ?? examIndex;
  const currentExamQuestion = selectedExam?.questions?.[currentQuestionIndex];
  const scoredQuestions = selectedExam ? examQuestionOrder.map(index => selectedExam.questions[index]).filter(q => q?.answerStatus === "verified" && q.options?.length) : [];
  const examScore = selectedExam ? examQuestionOrder.reduce((sum, questionIndex) => {
    const q = selectedExam.questions[questionIndex];
    if (!q || q.answerStatus !== "verified" || !q.options?.length) return sum;
    const chosen = examAnswers[questionIndex] || [];
    const key = q.answerKey || [];
    return sum + (chosen.length === key.length && chosen.every(value => key.includes(value)) ? 1 : 0);
  }, 0) : 0;
  const examErrors = Math.max(0, scoredQuestions.length - examScore);
  const examPending = Math.max(0, examQuestionOrder.length - scoredQuestions.length);
  const wrongQuestionIndexes = selectedExam ? examQuestionOrder.filter(index => {
    const q = selectedExam.questions[index];
    if (!q || q.answerStatus !== "verified" || !q.options?.length) return false;
    const chosen = examAnswers[index] || [];
    const key = q.answerKey || [];
    return chosen.length !== key.length || !chosen.every(value => key.includes(value));
  }) : [];
  const startExam = (exam, mode) => {
    const order = Array.from({ length: exam.questions.length }, (_, index) => index);
    if (exam.id === "manual-a2") {
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }
    setSelectedExamId(exam.id); setExamMode(mode); setExamIndex(0); setExamQuestionOrder(order); setExamAnswers({});
    setExamFinished(false); setExamChecked(false); setExamSeconds(0);
  };
  const retryWrongQuestions = () => {
    setExamQuestionOrder(wrongQuestionIndexes); setExamMode("practice"); setExamIndex(0);
    setExamAnswers({}); setExamFinished(false); setExamChecked(false); setExamSeconds(0);
  };
  const answerExamQuestion = (value) => {
    if (!currentExamQuestion || examFinished || (examMode === "practice" && examChecked)) return;
    setExamAnswers(prev => {
      const current = prev[currentQuestionIndex] || [];
      const multiple = (currentExamQuestion.answerKey || []).length > 1;
      const next = multiple
        ? (current.includes(value) ? current.filter(v => v !== value) : [...current, value])
        : [value];
      return { ...prev, [currentQuestionIndex]: next };
    });
  };
  const finishExam = () => setExamFinished(true);
  const checkPracticeAnswer = () => setExamChecked(true);
  const formatTime = (seconds) => `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  const [materia, setMateria] = useState("generales");
  const [indice, setIndice] = useState(0);
  const [respuesta, setRespuesta] = useState(null);
  const [revelar, setRevelar] = useState(false);
  const [card, setCard] = useState(0);
  const [conocidas, setConocidas] = useState(() => { try { return JSON.parse(localStorage.getItem("a2-known") || "[]"); } catch { return []; } });
  const [resultados, setResultados] = useState(() => { try { return JSON.parse(localStorage.getItem("a2-results") || "[]"); } catch { return []; } });
  const [fallos, setFallos] = useState(() => { try { return JSON.parse(localStorage.getItem("a2-missed") || "[]"); } catch { return []; } });
  const lista = useMemo(() => preguntas.filter(p => materia === "todas" || p.area.toLowerCase().includes(materia === "generales" ? "generales" : materia === "accidentes" ? "accidentes" : materia === "gmm" ? "gastos médicos" : materia === "salud" ? "salud" : materia === "embarcaciones" ? "embarcaciones" : materia)), [materia]);
  const actual = lista[indice % Math.max(1, lista.length)];
  const progreso = Math.round((conocidas.length / flashcards.length) * 100);
  const guardar = (key, value, setter) => { setter(value); try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const elegir = (i) => { if (respuesta !== null) return; setRespuesta(i); if (i !== actual.answer) guardar("a2-missed", [...new Set([...fallos, actual.id])], setFallos); };
  const siguiente = () => { setIndice(v => (v + 1) % lista.length); setRespuesta(null); };
  const tabs = [{id:"inicio",label:"Resumen",icon:<FaGraduationCap/>},{id:"lecciones",label:"Materias",icon:<FaBookOpen/>},{id:"practica",label:"Practicar",icon:<FaClipboardCheck/>},{id:"examenes",label:"Exámenes",icon:<FaClipboardCheck/>},{id:"tarjetas",label:"Tarjetas",icon:<FaLayerGroup/>},{id:"avance",label:"Mi avance",icon:<FaChartLine/>}];

  return <main className="mx-auto max-w-7xl space-y-6 p-4 pb-10 md:p-6">
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#5b185d] via-[#941B80] to-[#0096AE] p-6 text-white shadow-xl md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-white/75">Quálitas Hub · Formación</p><h1 className="mt-2 text-3xl font-black md:text-4xl">A2 Academy</h1><p className="mt-2 max-w-2xl text-sm text-white/85 md:text-base">Tu espacio de preparación para la Cédula A2 de la CNSF.</p></div><div className="flex flex-col items-center gap-3"><div className="rounded-2xl border border-white/20 bg-white/15 p-4 text-center backdrop-blur-xl"><FaGraduationCap className="mx-auto text-3xl"/><p className="mt-1 text-xs font-semibold">Preparación A2</p></div><button onClick={()=>{setTutorialStep(0);setTutorialOpen(true);}} className="rounded-xl border border-white/40 bg-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/25">Ver tutorial</button></div></div>
      <div className="mt-6 grid grid-cols-3 gap-2 md:max-w-xl"><div className="rounded-xl bg-white/15 p-3"><p className="text-2xl font-black">{materias.length}</p><p className="text-xs text-white/75">Materias</p></div><div className="rounded-xl bg-white/15 p-3"><p className="text-2xl font-black">{originalExams.reduce((sum, exam) => sum + exam.questions.length, manualA2Exam.questions.length)}</p><p className="text-xs text-white/75">Reactivos de examen</p></div><div className="rounded-xl bg-white/15 p-3"><p className="text-2xl font-black">{progreso}%</p><p className="text-xs text-white/75">Tarjetas dominadas</p></div></div>
    </section>
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-white/70 bg-white/70 p-2 shadow-sm backdrop-blur-xl">{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${tab===t.id?"bg-[#941B80] text-white shadow-md":"text-slate-600 hover:bg-slate-100"}`}>{t.icon}{t.label}</button>)}</nav>
    {tab==="inicio" && <section className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-white/70 bg-white/75 p-6 shadow-sm"><p className="text-sm font-bold uppercase tracking-wider text-[#0096AE]">Ruta de estudio</p><h2 className="mt-2 text-2xl font-bold text-slate-800">Avanza por áreas</h2><p className="mt-2 text-sm leading-6 text-slate-600">Estudia cada materia, practica la recuperación de información y comprueba tus conocimientos con preguntas de opción múltiple.</p><button onClick={()=>setTab("lecciones")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#941B80] px-5 py-3 font-semibold text-white">Ver materias <FaArrowRight/></button></div><div className="rounded-2xl border border-white/70 bg-white/75 p-6 shadow-sm"><p className="text-sm font-bold uppercase tracking-wider text-[#0096AE]">Sesión rápida</p><h2 className="mt-2 text-2xl font-bold text-slate-800">Pon a prueba lo aprendido</h2><p className="mt-2 text-sm leading-6 text-slate-600">Responde preguntas basadas en los cuestionarios que compartiste. La explicación aparece después de responder.</p><button onClick={()=>{setMateria("todas");setIndice(0);setRespuesta(null);setTab("practica");}} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0096AE] px-5 py-3 font-semibold text-white">Comenzar práctica <FaArrowRight/></button></div><div className="md:col-span-2 rounded-2xl border border-white/70 bg-white/75 p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-800">Materias de la Cédula A2</h2><p className="mt-1 text-sm text-slate-500">Estructura basada en el temario de la guía de estudios.</p></div><button onClick={()=>setTab("lecciones")} className="text-sm font-bold text-[#941B80]">Explorar</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{materias.map(m=><button key={m.id} onClick={()=>{setMateria(m.id);setTab("lecciones");}} className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#0096AE] hover:shadow-md"><p className="font-bold text-slate-800">{m.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{m.description}</p></button>)}</div></div></section>}
    {tab==="lecciones" && <section className="space-y-4"><div><h2 className="text-2xl font-bold text-slate-800">Materias y temario</h2><p className="text-sm text-slate-500">Selecciona un área para consultar su estructura de estudio.</p></div><div className="grid gap-3 md:grid-cols-2">{materias.map(m=><button key={m.id} onClick={()=>setMateria(m.id)} className={`rounded-2xl border p-5 text-left ${materia===m.id?"border-[#941B80] bg-purple-50/70 ring-1 ring-[#941B80]":"border-white/70 bg-white/75"}`}><h3 className="font-bold text-slate-800">{m.title}</h3><p className="mt-1 text-sm text-slate-500">{m.description}</p><div className="mt-3 flex flex-wrap gap-2">{m.topics.map(x=><span key={x} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{x}</span>)}</div></button>)}</div><p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">El temario ya está organizado. Las lecciones desarrolladas se irán incorporando desde el manual A2; no se completarán con información externa sin distinguirla.</p></section>}
    {tab==="practica" && <section className="mx-auto max-w-3xl rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm md:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#0096AE]">Práctica de conocimientos</p><h2 className="mt-1 text-xl font-bold text-slate-800">Pregunta {indice+1} de {lista.length}</h2></div><select value={materia} onChange={e=>{setMateria(e.target.value);setIndice(0);setRespuesta(null);}} className="rounded-xl border border-slate-200 p-2 text-sm"><option value="todas">Todas las materias</option>{materias.filter(m=>!["autos","hogar"].includes(m.id)).map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0096AE]" style={{width:`${((indice+1)/lista.length)*100}%`}}/></div><p className="mt-5 text-xs font-bold uppercase tracking-wider text-[#941B80]">{actual?.area}</p><h3 className="mt-2 text-lg font-bold leading-7 text-slate-800">{actual?.q}</h3><div className="mt-5 space-y-3">{actual?.options.map((o,i)=><button key={o} onClick={()=>elegir(i)} className={`w-full rounded-xl border p-4 text-left text-sm font-medium transition ${respuesta===null?"border-slate-200 bg-white hover:border-[#0096AE] hover:bg-cyan-50":i===actual.answer?"border-emerald-300 bg-emerald-50 text-emerald-900":respuesta===i?"border-rose-300 bg-rose-50 text-rose-900":"border-slate-200 bg-slate-50 text-slate-500"}`}><span className="mr-3 font-bold text-[#941B80]">{String.fromCharCode(65+i)}.</span>{o}{respuesta!==null&&i===actual.answer&&<FaCheckCircle className="float-right mt-1 text-emerald-600"/>}{respuesta===i&&i!==actual.answer&&<FaTimesCircle className="float-right mt-1 text-rose-600"/>}</button>)}</div>{respuesta!==null&&<div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4"><p className="font-bold text-cyan-950">{respuesta===actual.answer?"¡Correcto!":"Respuesta incorrecta"}</p><p className="mt-1 text-sm leading-6 text-cyan-900">{actual.why}</p><button onClick={siguiente} className="mt-4 rounded-xl bg-[#941B80] px-5 py-2.5 font-semibold text-white">Siguiente pregunta</button></div>}</section>}
    {tab==="examenes" && <section className="space-y-5">
      {!selectedExamId && <>
        <div><p className="text-xs font-bold uppercase tracking-wider text-[#0096AE]">Evaluación interactiva</p><h2 className="mt-1 text-2xl font-bold text-slate-800">Centro de exámenes</h2><p className="mt-1 text-sm text-slate-500">Elige un cuestionario original o el examen nuevo elaborado con el manual.</p></div>
        {examLoadError && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{examLoadError}</p>}
        {!originalExams.length && !examLoadError && <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Cargando cuestionarios originales…</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {allExams.map(exam => {
            const total=exam.questions.length;
            const verified=exam.questions.filter(q=>q.answerStatus==="verified"&&q.options?.length).length;
            const pending=total-verified;
            const manual=exam.id==="manual-a2";
            return <article key={exam.id} className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold uppercase text-[#941B80]">{manual?"Nuevo · Manual":"Cuestionario original"}</span><h3 className="mt-3 text-lg font-bold text-slate-800">{exam.title}</h3></div><FaClipboardCheck className="mt-1 text-2xl text-[#0096AE]"/></div>
              <p className="mt-2 text-sm text-slate-500">{total} reactivos · {verified} con clave identificada · {pending} por validar</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{exam.source}</p>
              {pending>0&&<p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs leading-5 text-amber-800">Algunos reactivos no tienen una clave marcada verificable en el archivo original. Se mostrarán, pero no contarán en la calificación.</p>}
              <div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>startExam(exam,"practice")} className="rounded-xl bg-[#0096AE] px-4 py-2.5 text-sm font-bold text-white">Modo práctica</button><button onClick={()=>startExam(exam,"exam")} className="rounded-xl bg-[#941B80] px-4 py-2.5 text-sm font-bold text-white">Modo examen</button></div>
            </article>;
          })}
        </div>
      </>}
      {selectedExam && !examFinished && currentExamQuestion && <div className="mx-auto max-w-3xl rounded-2xl border border-white/70 bg-white/85 p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#0096AE]">{examMode==="exam"?"Simulación de examen":"Práctica guiada"}</p><h2 className="mt-1 text-xl font-bold text-slate-800">{selectedExam.title}</h2></div><div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold tabular-nums text-slate-700">{formatTime(examSeconds)}</div></div>
        <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500"><span>Reactivo {examIndex+1} de {examQuestionOrder.length}</span><span>{Math.round(((examIndex+1)/examQuestionOrder.length)*100)}%</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#0096AE] transition-all" style={{width:`${((examIndex+1)/examQuestionOrder.length)*100}%`}}/></div>
        <div className="mt-6"><p className="text-xs font-bold uppercase tracking-wider text-[#941B80]">Pregunta {currentExamQuestion.number}</p><h3 className="mt-2 text-lg font-bold leading-7 text-slate-800">{currentExamQuestion.stem}</h3>
          {currentExamQuestion.supportingText?.length>0&&<div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{currentExamQuestion.supportingText.map((line,i)=><p key={i} className="mb-1 last:mb-0">{line}</p>)}</div>}
          {currentExamQuestion.options?.length>0 ? <div className="mt-5 space-y-2">{currentExamQuestion.options.map(option=>{
            const chosen=examAnswers[currentQuestionIndex]||[];
            const active=chosen.includes(option.value);
            const reveal=examMode==="practice"&&examChecked;
            const correct=reveal&&(currentExamQuestion.answerKey||[]).includes(option.value);
            return <button key={option.value} onClick={()=>answerExamQuestion(option.value)} disabled={reveal} className={`w-full rounded-xl border p-4 text-left text-sm leading-6 transition ${correct?"border-emerald-300 bg-emerald-50 text-emerald-950":active?"border-[#941B80] bg-purple-50 text-slate-900":"border-slate-200 bg-white hover:border-[#0096AE] hover:bg-cyan-50"} `}>
              <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-[#941B80]">{option.value}</span>{option.text}
              {correct&&<FaCheckCircle className="float-right mt-1 text-emerald-600"/>}
            </button>;
          })}</div> : <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Este reactivo incluye una lista o estructura que no se pudo separar en opciones sin alterar el documento. Revísalo como aparece arriba y continúa.</p>}
          {examMode==="practice"&&currentExamQuestion.options?.length>0&&!examChecked&&<button onClick={checkPracticeAnswer} disabled={!examAnswers[currentQuestionIndex]?.length} className="mt-4 rounded-xl bg-[#0096AE] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">Comprobar respuesta</button>}
          {examMode==="practice"&&(examChecked||!currentExamQuestion.options?.length)&&<div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4"><p className="font-bold text-cyan-950">{currentExamQuestion.answerStatus==="verified"?"Clave identificada en el documento": "Clave pendiente de validar"}</p><p className="mt-1 text-sm leading-6 text-cyan-900">{currentExamQuestion.explanation}</p>{currentExamQuestion.answerKey?.length>0&&<p className="mt-2 text-sm font-bold text-cyan-950">Respuesta marcada: {currentExamQuestion.answerKey.join(", ")}</p>}</div>}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2"><button onClick={()=>{setSelectedExamId(null);setExamFinished(false);}} className="text-sm font-semibold text-slate-500">Salir del examen</button><div className="flex gap-2">{examIndex>0&&<button onClick={()=>{setExamIndex(v=>v-1);setExamChecked(false);}} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Anterior</button>}{examIndex<examQuestionOrder.length-1?<button onClick={()=>{setExamIndex(v=>v+1);setExamChecked(false);}} disabled={examMode==="practice"&&currentExamQuestion.options?.length>0&&!examChecked} className="rounded-xl bg-[#941B80] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">{examMode==="practice"?"Siguiente reactivo":"Siguiente"}</button>:<button onClick={finishExam} className="rounded-xl bg-[#941B80] px-5 py-2.5 text-sm font-bold text-white">Finalizar y calificar</button>}</div></div>
        {examMode==="exam"&&<p className="mt-3 text-xs text-slate-400">Puedes cambiar tus respuestas con los botones Anterior y Siguiente. La calificación se muestra al finalizar.</p>}
      </div>}
      {selectedExam && examFinished && <div className="mx-auto max-w-2xl rounded-3xl border border-white/70 bg-white/85 p-7 text-center shadow-lg">
        <FaGraduationCap className="mx-auto text-4xl text-[#941B80]"/><p className="mt-3 text-xs font-bold uppercase tracking-wider text-[#0096AE]">Resultado de evaluación</p><h2 className="mt-1 text-2xl font-black text-slate-800">{selectedExam.title}</h2>
        <p className="mt-5 text-5xl font-black text-[#941B80]">{examScore}/{scoredQuestions.length}</p><p className="mt-1 text-sm text-slate-500">{scoredQuestions.length?Math.round(examScore/scoredQuestions.length*100):0}% de aciertos · {formatTime(examSeconds)}</p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-left"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-2xl font-black text-emerald-700">{examScore}</p><p className="text-xs text-emerald-800">Aciertos</p></div><div className="rounded-xl bg-rose-50 p-3"><p className="text-2xl font-black text-rose-700">{examErrors}</p><p className="text-xs text-rose-800">Errores</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-2xl font-black text-amber-700">{examPending}</p><p className="text-xs text-amber-800">Por validar</p></div></div>
        <p className="mt-4 text-sm leading-6 text-slate-600">Se califican únicamente los reactivos cuya respuesta está marcada en el documento fuente. Los reactivos sin clave verificable no afectan tu resultado.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2"><button onClick={()=>startExam(selectedExam,examMode)} className="rounded-xl bg-[#941B80] px-5 py-2.5 text-sm font-bold text-white">Repetir examen</button><button onClick={retryWrongQuestions} disabled={!wrongQuestionIndexes.length} className="rounded-xl bg-[#0096AE] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">Practicar errores ({wrongQuestionIndexes.length})</button><button onClick={()=>{setSelectedExamId(null);setExamFinished(false);}} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700">Volver a exámenes</button></div>
      </div>}
    </section>}
    {tab==="tarjetas" && <section className="mx-auto max-w-xl"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-bold text-slate-800">Tarjetas de estudio</h2><p className="text-sm text-slate-500">Tarjeta {card+1} de {flashcards.length}</p></div><span className="text-sm font-bold text-[#0096AE]">{progreso}% dominado</span></div><button onClick={()=>setRevelar(v=>!v)} className="flex min-h-64 w-full flex-col items-center justify-center rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-lg"><FaBrain className="mb-5 text-3xl text-[#941B80]"/><p className="text-xs font-bold uppercase tracking-widest text-[#0096AE]">{revelar?"Respuesta":"Concepto"}</p><h3 className="mt-3 text-2xl font-black text-slate-800">{revelar?flashcards[card][1]:flashcards[card][0]}</h3><p className="mt-5 text-xs text-slate-400">Toca para {revelar?"ver el concepto":"revelar la respuesta"}</p></button><div className="mt-4 grid grid-cols-3 gap-2"><button onClick={()=>{setCard(v=>(v-1+flashcards.length)%flashcards.length);setRevelar(false);}} className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">Anterior</button><button onClick={()=>{const next=[...new Set([...conocidas,card])];guardar("a2-known",next,setConocidas);setCard(v=>(v+1)%flashcards.length);setRevelar(false);}} className="rounded-xl bg-emerald-600 p-3 text-sm font-semibold text-white">La domino ✓</button><button onClick={()=>{setCard(v=>(v+1)%flashcards.length);setRevelar(false);}} className="rounded-xl bg-[#941B80] p-3 text-sm font-semibold text-white">Siguiente</button></div></section>}
    {tab==="avance" && <section className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl bg-white/80 p-5 shadow-sm"><p className="text-sm text-slate-500">Tarjetas dominadas</p><p className="mt-2 text-3xl font-black text-[#941B80]">{conocidas.length}/{flashcards.length}</p><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#0096AE]" style={{width:`${progreso}%`}}/></div></div><div className="rounded-2xl bg-white/80 p-5 shadow-sm"><p className="text-sm text-slate-500">Preguntas por reforzar</p><p className="mt-2 text-3xl font-black text-amber-600">{fallos.length}</p></div><div className="rounded-2xl bg-white/80 p-5 shadow-sm"><p className="text-sm text-slate-500">Preguntas disponibles</p><p className="mt-2 text-3xl font-black text-[#0096AE]">{preguntas.length}</p></div><div className="rounded-2xl border border-slate-200 bg-white/80 p-5 md:col-span-3"><h3 className="font-bold text-slate-800">Refuerzo recomendado</h3><p className="mt-1 text-sm text-slate-500">Las preguntas falladas se conservan en este dispositivo para retomarlas en otra sesión.</p><button onClick={()=>{setMateria("todas");setIndice(0);setRespuesta(null);setTab("practica");}} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#941B80] px-4 py-2.5 text-sm font-semibold text-white"><FaRedo/> Practicar nuevamente</button><button onClick={()=>{if(confirm("¿Borrar el avance local de A2 Academy en este dispositivo?")){guardar("a2-known",[],setConocidas);guardar("a2-missed",[],setFallos);}}} className="ml-2 mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Reiniciar avance</button></div></section>}
    <p className="text-center text-xs text-slate-400">Contenido inicial basado en los documentos de estudio compartidos. El avance se guarda localmente en este dispositivo.</p>
    {tutorialOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="a2-tutorial-title">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-[#941B80] to-[#0096AE] px-6 pb-6 pt-5 text-white">
          <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[.18em] text-white/80">Guía de uso · A2 Academy</span><button onClick={cerrarTutorial} aria-label="Cerrar tutorial" className="rounded-full bg-white/15 p-2 text-white hover:bg-white/25">✕</button></div>
          <div className="mt-5 flex items-end justify-between"><div><p className="text-sm text-white/75">Paso {tutorialStep+1} de {tutorialSteps.length}</p><h2 id="a2-tutorial-title" className="mt-1 text-2xl font-black">{tutorialSteps[tutorialStep].title}</h2></div><span className="text-3xl font-black text-white/35">0{tutorialStep+1}</span></div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white transition-all duration-300" style={{width:`${((tutorialStep+1)/tutorialSteps.length)*100}%`}}/></div>
        </div>
        <div className="p-6"><p className="text-sm leading-7 text-slate-700">{tutorialSteps[tutorialStep].text}</p>
          <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-4"><p className="text-xs font-extrabold uppercase tracking-wider text-[#0096AE]">Recomendación</p><p className="mt-1 text-sm leading-6 text-slate-700">{tutorialSteps[tutorialStep].tip}</p></div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><button onClick={cerrarTutorial} className="text-sm font-semibold text-slate-500 hover:text-slate-800">Omitir tutorial</button><div className="flex gap-2">{tutorialStep>0&&<button onClick={()=>setTutorialStep(v=>v-1)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Anterior</button>}<button onClick={()=>{if(tutorialStep<tutorialSteps.length-1)setTutorialStep(v=>v+1);else cerrarTutorial();}} className="rounded-xl bg-[#941B80] px-5 py-2.5 text-sm font-bold text-white shadow-md">{tutorialStep===tutorialSteps.length-1?"Comenzar a estudiar":"Siguiente"}</button></div></div>
        </div>
      </div>
    </div>}
  </main>;
}
