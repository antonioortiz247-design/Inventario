import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { exportToExcel } from "../services/excel.service";
import VehicleInspection3D from "../components/VehicleInspection3D.tsx";
import { FaArrowRight, FaArrowLeft, FaCheckCircle, FaShieldAlt, FaClock, FaGift, FaTrophy, FaCar, FaRoad, FaExclamationTriangle, FaSignOutAlt, FaDownload, FaUsers, FaStar } from "react-icons/fa";

const purple="#941B80", aqua="#0096AE";
const MAX_MULTIPLIER_USES=3, MULTIPLIER_DURATION_TICKS=480;
const inputClass="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#0096AE] focus:ring-4 focus:ring-[#0096AE]/10";
const primary="inline-flex items-center justify-center gap-2 rounded-xl bg-[#941B80] px-5 py-3 font-bold text-white shadow-sm transition hover:bg-[#781568] disabled:cursor-not-allowed disabled:opacity-50";
const secondary="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:border-[#0096AE] hover:text-[#0096AE]";
const insurers=["Quálitas","GNP","AXA","MAPFRE","HDI","Chubb","Otra","Sin seguro"];
const triviaBank=[
 {q:"¿Qué debes hacer primero después de un accidente?",a:["Retirarte del lugar","Llamar a tu aseguradora","Discutir con el conductor","Esperar sin reportar"],correct:1,why:"Reportar el siniestro permite que tu aseguradora te indique los pasos y la asistencia correspondiente. Si hay personas lesionadas, solicita ayuda de emergencia."},
 {q:"¿Qué acción aumenta el riesgo de accidente?",a:["Mantener distancia","Utilizar cinturón","Usar el celular mientras conduces","Respetar señales"],correct:2,why:"El celular desvía la vista, las manos y la atención. Configura tu ruta antes de arrancar y detente en un lugar seguro si necesitas usarlo."},
 {q:"¿Qué distancia debes mantener con el vehículo de adelante?",a:["La mínima posible","Una distancia que permita frenar con seguridad","Medio metro","No importa si voy despacio"],correct:1,why:"Conserva espacio suficiente para reaccionar y frenar. Aumenta la distancia con lluvia, poca visibilidad o pavimento resbaloso."},
 {q:"¿Qué debes hacer antes de cambiar de carril?",a:["Acelerar sin mirar","Avisar, revisar espejos y punto ciego","Tocar el claxon y moverte","Frenar de golpe"],correct:1,why:"Señaliza con anticipación, revisa espejos y punto ciego, y cambia solo cuando exista espacio suficiente."},
 {q:"¿Cuál es la forma correcta de viajar en un automóvil?",a:["Sin cinturón en trayectos cortos","Con cinturón todos los ocupantes","Con el cinturón debajo del brazo","Solo el conductor usa cinturón"],correct:1,why:"Todas las personas a bordo deben usar correctamente el cinturón, incluso en trayectos cortos."},
 {q:"Si una llanta pierde presión mientras conduces, ¿qué conviene hacer?",a:["Frenar bruscamente","Sujetar el volante y reducir velocidad gradualmente","Girar de inmediato al acotamiento","Acelerar"],correct:1,why:"Evita movimientos bruscos. Sujeta el volante, reduce la velocidad gradualmente y busca un lugar seguro para detenerte."},
 {q:"¿Qué debes hacer al acercarte a un cruce peatonal?",a:["Acelerar para pasar primero","Reducir la velocidad y ceder el paso","Usar el claxon continuamente","Rebasar al vehículo detenido"],correct:1,why:"Reduce la velocidad y respeta el paso peatonal. Las personas a pie son usuarios vulnerables de la vía."},
 {q:"¿Cuándo debes revisar la presión y el estado de las llantas?",a:["Solo cuando se ponchan","Periódicamente y antes de viajes largos","Nunca si el auto es nuevo","Cuando lo indique otro conductor"],correct:1,why:"La revisión periódica ayuda a detectar desgaste o presión inadecuada que puede afectar el control y la distancia de frenado."}
];
const risks=[
 {icon:"📱",title:"Atención al volante",scene:"Un conductor revisa mensajes mientras el vehículo está en movimiento.",options:["Uso del celular al conducir","Exceso de velocidad","Falta de combustible"],correct:0,why:"Mirar el teléfono reduce la atención y el tiempo de reacción. Nunca lo manipules mientras conduces."},
 {icon:"🧳",title:"Objetos dentro del vehículo",scene:"Hay una mochila, una botella y herramientas sueltas sobre los asientos.",options:["Objetos sueltos que pueden convertirse en proyectiles","Exceso de pasajeros","Falta de señalización"],correct:0,why:"En una frenada o impacto, los objetos sueltos pueden salir proyectados. Guarda la carga y asegúrala."},
 {icon:"🛞",title:"Condición de las llantas",scene:"La banda de rodamiento se ve lisa y con desgaste irregular.",options:["Llantas desgastadas","Luces encendidas","Espejos mal ajustados"],correct:0,why:"Las llantas desgastadas pierden adherencia, especialmente en pavimento mojado. Revisa dibujo, presión y desgaste."},
 {icon:"🚗",title:"Estacionamiento seguro",scene:"Un automóvil quedó estacionado en una curva, con poca visibilidad.",options:["Estacionarse en zona insegura","Uso correcto de intermitentes","Distancia adecuada"],correct:0,why:"Estacionarse en curvas o zonas sin visibilidad expone a otros conductores y al propio vehículo. Busca un sitio permitido y visible."}
];
const puzzleTiles=[1,2,3,4];
const matchPairs=[{left:"Usar el celular al conducir",right:"Distracción y menor tiempo de reacción"},{left:"Llantas desgastadas",right:"Menor adherencia al pavimento"},{left:"Objetos sueltos en cabina",right:"Pueden salir proyectados al frenar"}];
const hazardTargets=["📱","🛞","🧳"];
const inspectionItems=[{id:"llantas",icon:"◉",label:"Llantas",detail:"Neumáticos: presión, dibujo y desgaste.",question:"Antes de un viaje largo, ¿qué señal indica que una llanta debe revisarse o reemplazarse?",options:["El dibujo está muy bajo o hay desgaste irregular","La llanta está limpia y brillante","El rin tiene polvo"],correct:0,why:"El dibujo desgastado reduce el agarre, especialmente con lluvia. También revisa presión en frío y busca cortes o chipotes."},{id:"luces",icon:"✦",label:"Sistema de iluminación",detail:"Faros, direccionales, freno y reversa.",question:"Una direccional trasera no enciende. ¿Qué debes hacer?",options:["Conducir así si es de día","Repararla antes de circular y comprobar todas las luces","Usar las intermitentes todo el camino"],correct:1,why:"Las luces comunican tus maniobras y hacen visible el vehículo. Comprueba bajas, altas, freno, direccionales e intermitentes."},{id:"cinturon",icon:"⌁",label:"Cinturones",detail:"Hebilla, banda, anclajes y retracción.",question:"¿Cuál es la forma correcta de comprobar un cinturón?",options:["Jalarlo suavemente y revisar que se bloquee ante un tirón; comprobar hebilla y banda","Verificar únicamente que la hebilla haga clic","Dejarlo flojo para que sea más cómodo"],correct:0,why:"La banda no debe estar torcida ni cortada; la hebilla debe trabar y liberar correctamente, y el mecanismo debe retraer."},{id:"espejos",icon:"◇",label:"Espejos y visibilidad",detail:"Ajuste, limpieza y puntos ciegos.",question:"Aunque los espejos estén bien ajustados, ¿qué debes hacer antes de cambiar de carril?",options:["Confiar solo en el espejo central","Acelerar para pasar rápido","Revisar espejos y hacer una comprobación breve del punto ciego"],correct:2,why:"Los espejos no eliminan todos los puntos ciegos. Señaliza, revisa espejos y verifica el área lateral antes de maniobrar."}];
const shuffle=(arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const blank={nombre:"",telefono:"",correo:"",tiene_seguro:"",aseguradora:"",anio:"",pernocta:"",uso:"",preocupacion:"",cotizacion:false,asesoria:false,autoriza_promociones:false};
function Brand({small=false}){return <div className="flex min-w-0 items-center gap-3"><img src="/Logo-Horizontal.png" alt="Quálitas Compañía de Seguros" className="h-auto max-h-14 w-auto max-w-[min(72%,260px)] object-contain object-left" />{!small&&<span className="ml-auto hidden shrink-0 rounded-full bg-[#0096AE]/10 px-3 py-1 text-xs font-bold text-[#007D91] sm:inline-flex">QUÁLITAS HUB</span>}</div>}
function Field({label,children}){return <label className="block"><span className="text-sm font-bold text-slate-700">{label}</span><div className="mt-2">{children}</div></label>}
function Progress({step}){const stages=["game","proteccion"];const idx=stages.indexOf(step);const pct=step==="resultado"||step==="sorteo"||step==="fin"?100:idx<0?0:Math.round((idx+1)/2*100);return <div className="mb-6"><div className="mb-2 flex justify-between text-xs font-bold text-slate-500"><span>Tu rally de seguridad vial</span><span>{pct}% completado</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#941B80] to-[#0096AE] transition-all duration-500" style={{width:pct+"%"}}/></div><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">{["Qualicoche Run","Tu protección"].map((s,i)=><div key={s} className={"rounded-lg px-1 py-2 text-center text-[9px] font-bold sm:text-[10px] "+(pct>i*45?"bg-[#941B80]/10 text-[#941B80]":"bg-slate-50 text-slate-400")}>{i+1}. {s}</div>)}</div></div>}
export default function DesafioSeguridadVial({publicMode=false,adminMode=false,onExitAdmin,onOpenAdmin}){
 const restored=(()=>{try{return typeof window!=="undefined"?JSON.parse(window.sessionStorage.getItem("qualitas-desafio-vial-progress")||"{}"):{};}catch{return {};}})();
 const [step,setStep]=useState(["rompecabezas","unir","peligros","decision","inspeccion","proteccion"].includes(restored.step)?"game":(restored.step||"inicio")),[form,setForm]=useState({...blank,...restored.form}),[trivia,setTrivia]=useState(restored.trivia||[]),[riskIndex,setRiskIndex]=useState(restored.riskIndex||0),[answers,setAnswers]=useState(restored.answers||{}),[feedback,setFeedback]=useState(restored.feedback||false),[score,setScore]=useState(restored.score||0),[folio,setFolio]=useState(restored.folio||""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[admin,setAdmin]=useState(false),[session,setSession]=useState(null),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[rows,setRows]=useState([]),[filter,setFilter]=useState(""),[puzzleOrder,setPuzzleOrder]=useState(restored.puzzleOrder||[2,0,3,1]),[puzzlePick,setPuzzlePick]=useState(restored.puzzlePick??null),[matchPick,setMatchPick]=useState(restored.matchPick||{}),[hazardsFound,setHazardsFound]=useState(restored.hazardsFound||[]),[decision,setDecision]=useState(restored.decision||""),[inspectionFound,setInspectionFound]=useState(restored.inspectionFound||[]),[inspectionActive,setInspectionActive]=useState(restored.inspectionActive||"llantas"),[inspectionFeedback,setInspectionFeedback]=useState(restored.inspectionFeedback||{}),[mistakes,setMistakes]=useState(restored.mistakes||{rompecabezas:0,unir:0,peligros:0,decision:0,inspeccion:0});
 const gameCanvasRef=useRef(null),gameEngineRef=useRef(null),gameStageRef=useRef(null);
 const [gameStatus,setGameStatus]=useState("ready"),[gameDistance,setGameDistance]=useState(0),[isGameFullscreen,setIsGameFullscreen]=useState(false);
 const [isMobileViewport,setIsMobileViewport]=useState(()=>typeof window!=="undefined"&&window.matchMedia("(max-width: 640px)").matches);
 const [competitionActive,setCompetitionActive]=useState(false),[competitionModeLoaded,setCompetitionModeLoaded]=useState(false),[competitionModeError,setCompetitionModeError]=useState(""),[participatingRun,setParticipatingRun]=useState(false);const [publicLeaderboard,setPublicLeaderboard]=useState([]),[leaderboardLoading,setLeaderboardLoading]=useState(true),[leaderboardError,setLeaderboardError]=useState("");
 const toggleGameFullscreen=async()=>{const stage=gameStageRef.current;if(!stage)return;try{if(document.fullscreenElement){await document.exitFullscreen();}else if(stage.requestFullscreen){await stage.requestFullscreen();}}catch(e){console.warn("No se pudo activar pantalla completa.",e);}};
 useEffect(()=>{const sync=()=>setIsGameFullscreen(Boolean(document.fullscreenElement&&gameStageRef.current===document.fullscreenElement));document.addEventListener("fullscreenchange",sync);return()=>document.removeEventListener("fullscreenchange",sync);},[]);
 // Vista móvil: en pantallas angostas el juego se presenta a sangre completa,
 // como un juego móvil real, mientras en escritorio conserva su marco.
 useEffect(()=>{const mq=window.matchMedia("(max-width: 640px)");const onChange=e=>setIsMobileViewport(e.matches);setIsMobileViewport(mq.matches);mq.addEventListener("change",onChange);return()=>mq.removeEventListener("change",onChange);},[]);
 const set=(k,v)=>setForm(p=>({...p,[k]:v}));
 const addMistake=(activity)=>setMistakes(p=>({...p,[activity]:Math.min(10,(p[activity]||0)+1)}));
 const awardActivity=(activity)=>setScore(p=>p+Math.max(0,100-(mistakes[activity]||0)*10));
 const activityPoints=(activity)=>Math.max(0,100-(mistakes[activity]||0)*10);
 useEffect(()=>{if(typeof window==="undefined")return;const draft={step,form,trivia,riskIndex,answers,feedback,score,folio,puzzleOrder,puzzlePick,matchPick,hazardsFound,decision,inspectionFound,inspectionActive,inspectionFeedback,mistakes};try{window.sessionStorage.setItem("qualitas-desafio-vial-progress",JSON.stringify(draft));}catch(e){console.warn("No se pudo guardar el avance local del desafío.",e);}},[step,form,trivia,riskIndex,answers,feedback,score,folio,puzzleOrder,puzzlePick,matchPick,hazardsFound,decision,inspectionFound,inspectionActive,inspectionFeedback,mistakes]);

 const isAdmin=adminMode;
 const loadCompetitionMode=async()=>{
  if(!supabaseConfigured){setCompetitionModeError("No hay conexión con Supabase.");setCompetitionModeLoaded(true);return;}
  const {data,error}=await supabase.from("desafio_seguridad_vial_config").select("competencia_activa").eq("id",1).maybeSingle();
  if(error||!data){setCompetitionModeError(error?.message||"No se encontró la configuración del desafío. Ejecuta el SQL actualizado en Supabase.");setCompetitionModeLoaded(true);return;}
  setCompetitionActive(Boolean(data.competencia_activa));setCompetitionModeError("");setCompetitionModeLoaded(true);
 };
 useEffect(()=>{let alive=true;const loadPublicRanking=async()=>{if(!supabaseConfigured){setLeaderboardError("Ranking temporalmente no disponible.");setLeaderboardLoading(false);return;}const {data,error}=await supabase.rpc("obtener_ranking_publico_desafio");if(!alive)return;if(error){setLeaderboardError("El ranking estará disponible cuando se habilite la consulta pública en Supabase.");setPublicLeaderboard([]);}else{setPublicLeaderboard(data||[]);setLeaderboardError("");}setLeaderboardLoading(false);};loadPublicRanking();const ch=supabaseConfigured?supabase.channel("desafio-vial-ranking-public").on("postgres_changes",{event:"INSERT",schema:"public",table:"desafio_seguridad_vial"},loadPublicRanking).subscribe():null;return()=>{alive=false;if(ch)supabase.removeChannel(ch);};},[]);
 useEffect(()=>{loadCompetitionMode();const ch=supabaseConfigured?supabase.channel("desafio-vial-config-public").on("postgres_changes",{event:"UPDATE",schema:"public",table:"desafio_seguridad_vial_config",filter:"id=eq.1"},payload=>{setCompetitionActive(Boolean(payload.new?.competencia_activa));setCompetitionModeError("");setCompetitionModeLoaded(true);}).subscribe():null;return()=>{if(ch)supabase.removeChannel(ch);};},[]);
 useEffect(()=>{if(!supabaseConfigured)return;supabase.auth.getSession().then(({data})=>setSession(data?.session||null));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>data.subscription.unsubscribe();},[]);
 useEffect(()=>{if(!isAdmin||!session)return;let alive=true;const load=async()=>{const {data,error}=await supabase.from("desafio_seguridad_vial").select("*").order("creado_en",{ascending:false}).limit(5000);if(alive){if(error)setError("No se pudieron cargar los registros: "+error.message);else setRows(data||[]);}};load();const ch=supabase.channel("desafio-vial-admin").on("postgres_changes",{event:"*",schema:"public",table:"desafio_seguridad_vial"},load).subscribe();return()=>{alive=false;supabase.removeChannel(ch);};},[isAdmin,session]);
 const filtered=useMemo(()=>rows.filter(r=>[r.folio,r.nombre,r.telefono,r.correo].join(" ").toLowerCase().includes(filter.toLowerCase())),[rows,filter]);
 const metrics=useMemo(()=>({total:rows.length,cotizaciones:rows.filter(r=>r.solicita_cotizacion).length,asesorias:rows.filter(r=>r.solicita_asesoria).length,average:rows.length?Math.round(rows.reduce((s,r)=>s+Number(r.puntaje||0),0)/rows.length):0}),[rows]);
 const dailyLeaderboard=useMemo(()=>{
  const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime(),end=start+86400000;
  return rows.filter(r=>{const t=new Date(r.creado_en).getTime();return Number.isFinite(t)&&t>=start&&t<end;})
   .sort((a,b)=>Number(b.puntaje||0)-Number(a.puntaje||0)||new Date(a.creado_en)-new Date(b.creado_en)).slice(0,10);
 },[rows]);
 const editRecord=async r=>{
  const nombre=window.prompt("Nombre del participante:",r.nombre||"");if(nombre===null)return;
  const telefono=window.prompt("Teléfono:",r.telefono||"");if(telefono===null)return;
  const correo=window.prompt("Correo:",r.correo||"");if(correo===null)return;
  const {error}=await supabase.from("desafio_seguridad_vial").update({nombre:nombre.trim(),telefono:telefono.trim(),correo:correo.trim()||null}).eq("id",r.id);
  if(error)setError("No se pudo editar el registro: "+error.message);
  else{setRows(old=>old.map(x=>x.id===r.id?{...x,nombre:nombre.trim(),telefono:telefono.trim(),correo:correo.trim()||null}:x));setError("");}
 };
 const deleteRecord=async r=>{
  if(!window.confirm("¿Eliminar definitivamente el registro de "+(r.nombre||r.folio)+"? Esta acción no se puede deshacer."))return;
  setBusy(true);
  const {error}=await supabase.from("desafio_seguridad_vial").delete().eq("id",r.id);
  if(error)setError("No se pudo eliminar el registro: "+error.message);
  else setRows(old=>old.filter(x=>x.id!==r.id));
  setBusy(false);
 };

 const startTrivia=()=>{setPuzzleOrder([2,0,3,1]);setPuzzlePick(null);setMatchPick({});setHazardsFound([]);setDecision("");setInspectionFound([]);setAnswers({});setFeedback(false);setScore(0);setGameDistance(0);setGameStatus("ready");gameEngineRef.current=null;setMistakes({rompecabezas:0,unir:0,peligros:0,decision:0,inspeccion:0});setStep("game");};
 const swapPuzzle=(index)=>{if(puzzlePick===null){setPuzzlePick(index);return;}if(puzzlePick===index){setPuzzlePick(null);return;}const next=[...puzzleOrder];const beforeCorrect=puzzleOrder.filter((v,i)=>v===i).length;[next[puzzlePick],next[index]]=[next[index],next[puzzlePick]];const afterCorrect=next.filter((v,i)=>v===i).length;setPuzzleOrder(next);setPuzzlePick(null);if(next.every((v,i)=>v===i)){awardActivity("rompecabezas");setStep("unir");}else if(afterCorrect<beforeCorrect){addMistake("rompecabezas");}};
 const completeMatching=()=>{if(matchPairs.every((p,i)=>matchPick[i]===i)){awardActivity("unir");setStep("peligros");}};
 const toggleHazard=(id)=>{if(hazardsFound.includes(id))return;if(!["phone","tire","bag"].includes(id)){addMistake("peligros");return;}const next=[...hazardsFound,id];setHazardsFound(next);if(next.length===3){awardActivity("peligros");setStep("decision");}};
 const submitDecision=()=>{if(!decision)return;if(decision==="safe")awardActivity("decision");else addMistake("decision");setStep("inspeccion");};
 const answerInspection=(item,index)=>{if(inspectionFound.includes(item.id))return;if(index===item.correct){const next=[...inspectionFound,item.id];setInspectionFound(next);setInspectionFeedback(p=>({...p,[item.id]:{correct:true,text:item.why}}));if(next.length===inspectionItems.length){awardActivity("inspeccion");setTimeout(()=>setStep("proteccion"),900);}}else{addMistake("inspeccion");setInspectionFeedback(p=>({...p,[item.id]:{correct:false,text:"No es la opción más segura. Revisa la descripción y vuelve a intentarlo."}}));}};
 useEffect(()=>{
  if(step!=="game"||gameStatus!=="playing")return;
  const canvas=gameCanvasRef.current;if(!canvas)return;
  // One world, one canvas: the road world is 540px wide and is drawn with a
  // +270px offset inside a 1080px canvas, so the sky, skyline, sidewalks,
  // road, grass, bushes and billboards all share one vanishing point and one
  // distance-based scroll, and the landscape fills a wide screen.
  const ctx=canvas.getContext("2d"),W=1080,H=900,RW=540,OX=270;
  const g=gameEngineRef.current||{lane:1,jump:0,obstacles:[],collectibles:[],ticks:0,distance:0,distancePoints:0,bonusPoints:0,multiplierTicks:0,giftSpawn:240,speed:7.2,spawn:12};gameEngineRef.current=g;
  g.collectibles=g.collectibles||[];g.distancePoints=g.distancePoints||0;g.bonusPoints=g.bonusPoints||0;g.multiplierTicks=g.multiplierTicks||0;g.multiplierUses=g.multiplierUses||0;g.giftSpawn=g.giftSpawn??(220+Math.random()*180);
  let raf=0,alive=true,last=0;
  const laneX=(lane,y)=>{const p=Math.max(0,Math.min(1,y/H));const top=[193,270,347][lane],bottom=[136.7,270,403.3][lane];return OX+top+(bottom-top)*p;};
  const rounded=(x,y,w,h,r,fill,stroke)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}};
  // Roadside scenery: bushes and billboards that live in the grass verges,
  // scroll with the same distance as the road dashes and grow with the same
  // perspective as the lanes, so they never fight the road's motion.
  const wedgePath=(left)=>{ctx.beginPath();if(left){ctx.moveTo(0,0);ctx.lineTo(382,0);ctx.lineTo(270,H);ctx.lineTo(0,H);}else{ctx.moveTo(698,0);ctx.lineTo(W,0);ctx.lineTo(W,H);ctx.lineTo(810,H);}ctx.closePath();};
  const drawBush=(x,y,r)=>{ctx.save();ctx.translate(x,y);ctx.fillStyle="rgba(46,110,52,.35)";ctx.beginPath();ctx.ellipse(0,r*.72,r*1.05,r*.3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#3d7a37";ctx.beginPath();ctx.ellipse(-r*.32,r*.1,r*.62,r*.52,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(r*.34,r*.12,r*.58,r*.48,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#5da24f";ctx.beginPath();ctx.ellipse(0,-r*.22,r*.55,r*.5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="rgba(255,255,255,.18)";ctx.beginPath();ctx.ellipse(-r*.2,-r*.38,r*.22,r*.16,0,0,Math.PI*2);ctx.fill();ctx.restore();};
  const drawBillboard=(cx,cy,maxW,lines,sub,from,to)=>{const p=Math.max(.3,Math.min(1.1,cy/H)),w=Math.min(170*p,maxW),k=w/128;ctx.save();ctx.translate(cx,cy);ctx.scale(k,k);ctx.fillStyle="rgba(10,22,36,.28)";ctx.beginPath();ctx.ellipse(0,66,56,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#5b4636";ctx.fillRect(-44,38,6,26);ctx.fillRect(38,38,6,26);const bg=ctx.createLinearGradient(0,-40,0,40);bg.addColorStop(0,from);bg.addColorStop(1,to);rounded(-64,-40,128,80,10,bg,"rgba(255,255,255,.9)");ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";let size=17;ctx.font="900 "+size+"px Arial";const widest=Math.max(...lines.map(l=>ctx.measureText(l).width));if(widest>112)size=Math.max(9,Math.floor(size*112/widest));ctx.font="900 "+size+"px Arial";lines.forEach((l,i)=>ctx.fillText(l,0,lines.length===1?2:-10+i*22));ctx.font="700 10px Arial";ctx.fillStyle="rgba(255,255,255,.85)";ctx.fillText(sub,0,30);ctx.restore();};
  const drawScenery=()=>{
    for(let i=0;i<16;i++){
      const left=i%2===0,y=((i*137+g.distance*2.5)%(H+160))-80;
      if(y<300||y>H)continue;
      const p=y/H,inner=left?382-112*p:698+112*p,span=left?inner:W-inner;
      const frac=.15+((i*37)%70)/100,cx=left?inner*frac:inner+span*frac;
      const r=Math.min(10+p*26,span*.42);
      ctx.save();wedgePath(left);ctx.clip();drawBush(cx,y,r);ctx.restore();
    }
    // Billboards travel slower than the road (0.7 vs 2.5) and appear earlier,
    // so each message stays on screen long enough to read: they are ads,
    // not obstacles, and at road speed they flash past in under a second.
    [{left:true,lines:["MANEJA","SEGURO"],sub:"QUÁLITAS",from:"#941B80",to:"#5B155F",phase:0},{left:false,lines:["PROTEGE","LO QUE AMAS"],sub:"QUÁLITAS",from:"#0096AE",to:"#087f91",phase:900},{left:true,lines:["EXCELENCIA"],sub:"EN EL SERVICIO",from:"#0096AE",to:"#087f91",phase:1800},{left:false,lines:["QUÁLITAS"],sub:"ASEGURAMOS AUTOS",from:"#941B80",to:"#5B155F",phase:2700}].forEach(b=>{
      const y=((b.phase+g.distance*.7)%3600)-300;
      if(y<200||y>H+40)return;
      const p=y/H,inner=b.left?382-112*p:698+112*p,span=b.left?inner:W-inner;
      const cx=b.left?inner*.5:inner+span*.5;
      ctx.save();wedgePath(b.left);ctx.clip();drawBillboard(cx,y,span*.94,b.lines,b.sub,b.from,b.to);ctx.restore();
    });
  };
  const drawRoad=()=>{
    // One scene, one vanishing point: the road world (540px) is centred in
    // the 1080px canvas with a +270px offset, so the skyline, the sidewalks,
    // the road and the grass all converge to x=540 at the horizon.
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,"#b8dce8");sky.addColorStop(.38,"#e4f0ec");sky.addColorStop(1,"#d4e8e3");
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // Grass verges beside the sidewalks. Their inner edge is the sidewalk
    // outer edge (382->270 left, 698->810 right), so the grass converges to
    // the same vanishing point as the road. It fades in below the skyline
    // instead of painting the sky green.
    const grass=ctx.createLinearGradient(0,0,0,H);
    grass.addColorStop(0,"rgba(228,240,236,0)");grass.addColorStop(.3,"rgba(169,207,181,.55)");grass.addColorStop(.55,"#7fb069");grass.addColorStop(1,"#5d9b4e");
    ctx.fillStyle=grass;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(382,0);ctx.lineTo(270,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(698,0);ctx.lineTo(W,0);ctx.lineTo(W,H);ctx.lineTo(810,H);ctx.closePath();ctx.fill();
    // Distant city skyline, softly blended into atmospheric perspective.
    const skyline=[[-250,160,60,180],[-190,150,64,190],[-130,165,70,175],[-70,150,64,190],[-8,160,104,180],[-2,118,42,220],[40,145,54,190],[82,95,45,245],[118,132,48,208],[420,112,52,228],[458,78,48,262],[500,135,55,205],[545,140,58,200],[620,145,58,195],[680,160,64,180],[740,150,60,190]];
    ctx.save();ctx.translate(OX,0);
    skyline.forEach(([x,y,w,h],i)=>{
      const grad=ctx.createLinearGradient(0,y,0,y+h);grad.addColorStop(0,i%2?"#829eae":"#718d9f");grad.addColorStop(1,"#a9c0c6");
      ctx.fillStyle=grad;ctx.fillRect(x,y,w,h);
      ctx.fillStyle="rgba(239,249,241,.65)";
      for(let wy=y+14;wy<y+h-12;wy+=19)for(let wx=x+8;wx<x+w-6;wx+=14)ctx.fillRect(wx,wy,5,8);
      ctx.fillStyle="rgba(44,70,88,.12)";ctx.fillRect(x+w-4,y,4,h);
    });
    ctx.restore();
    const haze=ctx.createLinearGradient(0,170,0,440);
    haze.addColorStop(0,"rgba(255,255,255,.04)");haze.addColorStop(.6,"rgba(230,246,239,.45)");haze.addColorStop(1,"rgba(230,246,239,0)");
    ctx.fillStyle=haze;ctx.fillRect(0,150,W,310);
    // Sidewalks live inside the game viewport and follow the same vanishing point.
    ctx.save();ctx.translate(OX,0);
    const sidewalk=ctx.createLinearGradient(0,0,RW,0);
    sidewalk.addColorStop(0,"#c3cfca");sidewalk.addColorStop(.5,"#e2e7df");sidewalk.addColorStop(1,"#c3cfca");
    ctx.beginPath();ctx.moveTo(112,0);ctx.lineTo(155,0);ctx.lineTo(70,H);ctx.lineTo(0,H);ctx.closePath();
    ctx.fillStyle=sidewalk;ctx.fill();
    ctx.beginPath();ctx.moveTo(385,0);ctx.lineTo(428,0);ctx.lineTo(RW,H);ctx.lineTo(470,H);ctx.closePath();
    ctx.fillStyle=sidewalk;ctx.fill();
    // Subtle moving expansion joints make the sidewalks feel continuous.
    ctx.strokeStyle="rgba(103,128,126,.22)";ctx.lineWidth=1;
    for(let k=0;k<12;k++){
      const y=((k*105+(g.distance*2.2)%105)+H)%H,p=y/H;
      const lx=112-42*p,rx=428+42*p;
      ctx.beginPath();ctx.moveTo(lx,y);ctx.lineTo(lx-20*p,y+3+5*p);
      ctx.moveTo(rx,y);ctx.lineTo(rx+20*p,y+3+5*p);ctx.stroke();
    }
    // Road trapezoid: narrow at the horizon, broad in the foreground.
    const roadPath=()=>{ctx.beginPath();ctx.moveTo(155,0);ctx.lineTo(385,0);ctx.lineTo(470,H);ctx.lineTo(70,H);ctx.closePath();};
    const asphalt=ctx.createLinearGradient(70,0,470,0);
    asphalt.addColorStop(0,"#344357");asphalt.addColorStop(.5,"#46566a");asphalt.addColorStop(1,"#344357");
    roadPath();ctx.fillStyle=asphalt;ctx.fill();
    ctx.save();roadPath();ctx.clip();
    const sheen=ctx.createLinearGradient(0,0,RW,0);
    sheen.addColorStop(0,"rgba(255,255,255,.02)");sheen.addColorStop(.5,"rgba(255,255,255,.055)");sheen.addColorStop(1,"rgba(255,255,255,.015)");
    ctx.fillStyle=sheen;ctx.fillRect(0,0,RW,H);
    ctx.lineCap="round";
    for(let lane=1;lane<=2;lane++){
      const top=155+lane*76.7,bottom=70+lane*133.3;
      for(let k=-1;k<16;k++){
        const y=((k*88+(g.distance*2.5)%176)+H*2)%(H+176)-88;
        const p=Math.max(0,Math.min(1,y/H)),x=top+(bottom-top)*p;
        const dashH=12+p*28,thick=1.8+p*2.5;
        ctx.fillStyle="rgba(255,255,255,.86)";
        rounded(x-thick/2,y,thick,dashH,thick/2,ctx.fillStyle);
      }
    }
    ctx.restore();
    // Branded road-edge glints reinforce the perspective without adding curbs.
    ctx.strokeStyle="rgba(0,150,174,.72)";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(155,0);ctx.lineTo(70,H);ctx.moveTo(385,0);ctx.lineTo(470,H);ctx.stroke();
    ctx.restore();
    const edgeGlow=ctx.createLinearGradient(0,0,0,H);
    edgeGlow.addColorStop(0,"rgba(148,27,128,.08)");edgeGlow.addColorStop(1,"rgba(0,150,174,.3)");
    ctx.fillStyle=edgeGlow;ctx.fillRect(0,H-10,W,10);
    drawScenery();
  };
  const drawCar=(x,y)=>{
    const jump=g.jump>0?Math.sin((1-g.jump/22)*Math.PI):0;
    const lift=jump*46,scale=1+jump*.055;
    ctx.save();ctx.translate(x,y-lift);ctx.scale(scale,scale);
    // Forward headlight beams, projected ahead of the car in the top-down view.
    const beam=ctx.createLinearGradient(0,-78,0,-205);beam.addColorStop(0,"rgba(255,244,190,.24)");beam.addColorStop(1,"rgba(255,244,190,0)");ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(-29,-78);ctx.lineTo(-53,-205);ctx.lineTo(53,-205);ctx.lineTo(29,-78);ctx.closePath();ctx.fill();
    ctx.shadowColor="rgba(13,28,46,.42)";ctx.shadowBlur=22;ctx.shadowOffsetY=14;
    ctx.beginPath();ctx.moveTo(-37,-77);ctx.quadraticCurveTo(-45,-72,-46,-48);ctx.lineTo(-43,49);ctx.quadraticCurveTo(-42,72,-29,78);ctx.quadraticCurveTo(0,85,29,78);ctx.quadraticCurveTo(42,72,43,49);ctx.lineTo(46,-48);ctx.quadraticCurveTo(45,-72,37,-77);ctx.quadraticCurveTo(0,-91,-37,-77);ctx.closePath();
    const body=ctx.createLinearGradient(-48,0,48,0);body.addColorStop(0,"#5f0d59");body.addColorStop(.16,"#a51b91");body.addColorStop(.48,"#d33abd");body.addColorStop(.78,"#941b80");body.addColorStop(1,"#51094d");ctx.fillStyle=body;ctx.fill();
    ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle="rgba(255,255,255,.5)";ctx.lineWidth=1.5;ctx.stroke();
    // Body highlights and sculpted shoulders
    ctx.beginPath();ctx.moveTo(-37,-67);ctx.quadraticCurveTo(-27,-76,-17,-77);ctx.moveTo(37,-67);ctx.quadraticCurveTo(27,-76,17,-77);ctx.strokeStyle="rgba(255,255,255,.34)";ctx.lineWidth=2;ctx.stroke();
    // Vista estrictamente cenital: las ruedas quedan ocultas bajo la carrocería.
    // Side mirrors
    rounded(-53,-48,13,23,6,"#74116b","rgba(255,255,255,.3)");rounded(40,-48,13,23,6,"#74116b","rgba(255,255,255,.3)");
    // Front windshield with glass reflections
    ctx.beginPath();ctx.moveTo(-29,-56);ctx.quadraticCurveTo(0,-67,29,-56);ctx.lineTo(25,-27);ctx.quadraticCurveTo(0,-20,-25,-27);ctx.closePath();
    const glass=ctx.createLinearGradient(0,-65,0,-20);glass.addColorStop(0,"#101a2b");glass.addColorStop(.5,"#26364b");glass.addColorStop(1,"#0c1422");ctx.fillStyle=glass;ctx.fill();ctx.strokeStyle="rgba(255,255,255,.3)";ctx.lineWidth=1.4;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-21,-51);ctx.quadraticCurveTo(-4,-58,16,-54);ctx.strokeStyle="rgba(255,255,255,.24)";ctx.lineWidth=2;ctx.stroke();
    // Rear deck and trunk
    ctx.beginPath();ctx.moveTo(-31,-16);ctx.quadraticCurveTo(0,-9,31,-16);ctx.lineTo(29,31);ctx.quadraticCurveTo(0,39,-29,31);ctx.closePath();ctx.fillStyle="rgba(80,5,72,.24)";ctx.fill();
    ctx.beginPath();ctx.moveTo(-30,30);ctx.quadraticCurveTo(0,38,30,30);ctx.strokeStyle="rgba(255,255,255,.28)";ctx.lineWidth=1.4;ctx.stroke();
    // Rear windshield / medallion, clearly separated from the trunk lid
    ctx.beginPath();ctx.moveTo(-25,39);ctx.quadraticCurveTo(0,34,25,39);ctx.lineTo(21,54);ctx.quadraticCurveTo(0,59,-21,54);ctx.closePath();
    const rearGlass=ctx.createLinearGradient(0,37,0,57);rearGlass.addColorStop(0,"#34475c");rearGlass.addColorStop(.55,"#17283b");rearGlass.addColorStop(1,"#0b1728");ctx.fillStyle=rearGlass;ctx.fill();ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=1.2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-17,41);ctx.quadraticCurveTo(0,37,16,41);ctx.strokeStyle="rgba(255,255,255,.28)";ctx.lineWidth=1.2;ctx.stroke();
    // Rear tail lamps: moved to the rear edge, away from the cabin center.
    ctx.shadowColor="#ff234f";ctx.shadowBlur=12;rounded(-36,48,8,19,4,"#b71942","#ff9aab");rounded(28,48,8,19,4,"#b71942","#ff9aab");ctx.shadowBlur=0;
    rounded(-33,51,3,12,2,"#ffd0d6");rounded(30,51,3,12,2,"#ffd0d6");
    // Front headlights at the nose, visibly illuminated in the direction of travel.
    ctx.shadowColor="#fff1b8";ctx.shadowBlur=15;rounded(-34,-82,11,9,4,"#fff4c7","#ffffff");rounded(23,-82,11,9,4,"#fff4c7","#ffffff");ctx.shadowBlur=0;
    rounded(-31,-80,5,4,2,"#ffffff");rounded(26,-80,5,4,2,"#ffffff");
    ctx.strokeStyle="rgba(255,244,190,.72)";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-28,-86);ctx.lineTo(-28,-91);ctx.moveTo(28,-86);ctx.lineTo(28,-91);ctx.stroke();
    // Rear bumper and aqua signature
    ctx.beginPath();ctx.moveTo(-34,54);ctx.quadraticCurveTo(0,65,34,54);ctx.strokeStyle="#0096ae";ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-28,68);ctx.quadraticCurveTo(0,76,28,68);ctx.strokeStyle="rgba(255,255,255,.38)";ctx.lineWidth=1.2;ctx.stroke();
    // Top-down body silhouette: tires remain fully concealed beneath the fenders.\n    // Quálitas identity mark on trunk
    ctx.fillStyle="rgba(255,255,255,.94)";ctx.font="700 10px Arial";ctx.textAlign="center";ctx.fillText("Q",0,25);
    ctx.fillStyle="rgba(255,255,255,.65)";ctx.font="600 4px Arial";ctx.fillText("QUÁLITAS",0,32);
    // Specular central reflections
    const shine=ctx.createLinearGradient(-24,0,24,0);shine.addColorStop(0,"rgba(255,255,255,0)");shine.addColorStop(.5,"rgba(255,255,255,.2)");shine.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=shine;ctx.beginPath();ctx.moveTo(-15,-74);ctx.quadraticCurveTo(0,-80,15,-74);ctx.lineTo(20,-36);ctx.quadraticCurveTo(0,-30,-20,-36);ctx.closePath();ctx.fill();
    ctx.restore();
  };
  const drawObstacle=o=>{
    const x=laneX(o.lane,o.y),y=o.y,p=Math.max(.5,Math.min(1.4,.58+y/H*.78)),w=24*p,h=34*p;
    ctx.save();ctx.translate(x,y);ctx.scale(p,p);
    // Tight, crisp contact shadow only; no blur on the obstacle artwork.
    ctx.fillStyle="rgba(10,22,36,.24)";ctx.beginPath();ctx.ellipse(0,h*.68,w*.88,4*p,0,0,Math.PI*2);ctx.fill();
    if(o.type==="cone"){
      rounded(-22,-1,44,10,4,"#202b39","#111827");rounded(-18,-3,36,5,2,"#526176");
      ctx.beginPath();ctx.moveTo(-2,-52);ctx.quadraticCurveTo(0,-55,2,-52);ctx.lineTo(17,-4);ctx.quadraticCurveTo(18,0,13,1);ctx.lineTo(-13,1);ctx.quadraticCurveTo(-18,0,-17,-4);ctx.closePath();
      const cg=ctx.createLinearGradient(-18,0,18,0);cg.addColorStop(0,"#a83d12");cg.addColorStop(.25,"#f36b1e");cg.addColorStop(.55,"#ff963c");cg.addColorStop(.82,"#df5917");cg.addColorStop(1,"#8d3212");ctx.fillStyle=cg;ctx.fill();
      ctx.beginPath();ctx.moveTo(-12,-20);ctx.lineTo(12,-20);ctx.lineTo(14,-12);ctx.lineTo(-14,-12);ctx.closePath();ctx.fillStyle="#fff8ed";ctx.fill();
      ctx.beginPath();ctx.moveTo(-8,-34);ctx.lineTo(8,-34);ctx.lineTo(10,-27);ctx.lineTo(-10,-27);ctx.closePath();ctx.fillStyle="#fff8ed";ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.45)";ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(-2,-49);ctx.lineTo(-13,-5);ctx.stroke();
    }else if(o.type==="hole"){
      ctx.beginPath();ctx.ellipse(0,0,32,16,0,0,Math.PI*2);ctx.fillStyle="#8c98a7";ctx.fill();
      ctx.beginPath();ctx.ellipse(0,-1,28,13,0,0,Math.PI*2);ctx.fillStyle="#202b3a";ctx.fill();
      ctx.beginPath();ctx.ellipse(-2,-3,22,8,0,-.1,Math.PI*1.1);ctx.fillStyle="#0b1421";ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,.3)";ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(-2,-3,23,9,-.08,Math.PI,Math.PI*1.85);ctx.stroke();
      ctx.strokeStyle="#aeb9c5";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-23,-6);ctx.lineTo(-29,-11);ctx.lineTo(-25,-2);ctx.moveTo(18,7);ctx.lineTo(26,11);ctx.lineTo(22,2);ctx.stroke();
    }else{
      rounded(-32,10,64,8,3,"#263548","#111827");rounded(-27,5,10,10,2,"#3c4a5c");rounded(17,5,10,10,2,"#3c4a5c");
      ctx.beginPath();ctx.moveTo(-30,-18);ctx.quadraticCurveTo(-30,-23,-25,-23);ctx.lineTo(25,-23);ctx.quadraticCurveTo(30,-23,30,-18);ctx.lineTo(27,7);ctx.lineTo(-27,7);ctx.closePath();
      const bg=ctx.createLinearGradient(0,-23,0,8);bg.addColorStop(0,"#ffe36a");bg.addColorStop(.45,"#f3bd22");bg.addColorStop(1,"#bd8111");ctx.fillStyle=bg;ctx.fill();ctx.strokeStyle="#fff0a0";ctx.lineWidth=1.3;ctx.stroke();
      ctx.save();ctx.beginPath();ctx.roundRect(-27,-19,54,23,3);ctx.clip();ctx.fillStyle="#344052";
      for(let k=-3;k<4;k++){ctx.beginPath();ctx.moveTo(k*18-7,-20);ctx.lineTo(k*18+2,-20);ctx.lineTo(k*18-8,7);ctx.lineTo(k*18-17,7);ctx.closePath();ctx.fill();}
      ctx.restore();rounded(-31,-20,5,27,2,"#f7f1d6");rounded(26,-20,5,27,2,"#f7f1d6");
    }
    ctx.restore();
  };
  const drawCollectible=o=>{
    const x=laneX(o.lane,o.y),y=o.y,p=Math.max(.52,Math.min(1.45,.58+y/H*.78));
    const size=24*p, bob=Math.sin((g.ticks*.09)+(o.phase||0))*3*p;
    ctx.save();ctx.translate(x,y+bob);ctx.scale(p,p);
    ctx.fillStyle="rgba(8,20,34,.24)";ctx.beginPath();ctx.ellipse(0,24,23,6,0,0,Math.PI*2);ctx.fill();
    if(o.type==="multiplier"){
      const glow=ctx.createRadialGradient(0,0,3,0,0,37);glow.addColorStop(0,"rgba(111,227,232,.42)");glow.addColorStop(1,"rgba(111,227,232,0)");
      ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,37,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#073c4a";ctx.strokeStyle="#8df5f1";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,size,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle="#fff";ctx.font="900 18px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("x2",0,1);
    }else{
      const special=o.type==="special";
      const grad=ctx.createLinearGradient(-size,-size,size,size);grad.addColorStop(0,special?"#fff2a8":"#f7b8ed");grad.addColorStop(.5,special?"#f5bd38":"#b72ca2");grad.addColorStop(1,special?"#bd7815":"#74116b");
      ctx.fillStyle=grad;ctx.strokeStyle=special?"#fff2a8":"#ffd9f6";ctx.lineWidth=2;
      ctx.beginPath();ctx.roundRect(-size,-size,size*2,size*2,5);ctx.fill();ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,.85)";ctx.fillRect(-2.5,-size,5,size*2);ctx.fillRect(-size,-2.5,size*2,5);
      ctx.fillStyle="#fff";ctx.font="900 10px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(special?"★":"+ ",0,0);
    }
    ctx.restore();
  };
  const totalScore=()=>Math.floor(g.distancePoints)+g.bonusPoints;
  const frame=t=>{
    if(!alive)return;const dt=Math.min((t-last)/16.67||1,2);last=t;g.ticks++;g.distance+=g.speed*dt;g.distancePoints+=(g.speed*dt/10)*(g.multiplierTicks>0?2:1);const difficultyLevel=Math.floor(g.distance/10000);if(difficultyLevel>(g.level||0)){g.level=difficultyLevel;g.levelNotice=150;}g.speed=Math.min(15.5,7.2+difficultyLevel*0.85);
    ctx.clearRect(0,0,W,H);drawRoad();
    // Day/night cycle: the sun and moon physically travel across the sky.
     const timePhase=(g.distance%40000)/40000;
     const nightMix=(1-Math.cos(timePhase*Math.PI*2))/2;
     const twilight=Math.max(0,1-Math.abs(nightMix-.5)*4);
     if(nightMix>.02){ctx.fillStyle="rgba(8,18,48,"+(nightMix*.48).toFixed(3)+")";ctx.fillRect(0,0,W,H);}
     if(twilight>.02){ctx.fillStyle="rgba(255,143,82,"+(twilight*.12).toFixed(3)+")";ctx.fillRect(0,0,W,H);}
     const isMoon=timePhase>=.5;
     const celestialProgress=isMoon?(timePhase-.5)*2:timePhase*2;
     const celestialX=34+celestialProgress*1012;
     const celestialY=230-Math.sin(celestialProgress*Math.PI)*174;
     ctx.save();
     const glowRadius=isMoon?66:88;
     const celestialGlow=ctx.createRadialGradient(celestialX,celestialY,3,celestialX,celestialY,glowRadius);
     if(isMoon){celestialGlow.addColorStop(0,"rgba(218,235,255,.3)");celestialGlow.addColorStop(1,"rgba(218,235,255,0)");}
     else{celestialGlow.addColorStop(0,"rgba(255,220,139,.48)");celestialGlow.addColorStop(.4,"rgba(255,220,139,.18)");celestialGlow.addColorStop(1,"rgba(255,220,139,0)");}
     ctx.fillStyle=celestialGlow;ctx.beginPath();ctx.arc(celestialX,celestialY,glowRadius,0,Math.PI*2);ctx.fill();
     if(!isMoon){
       ctx.strokeStyle="rgba(255,226,165,.4)";ctx.lineWidth=2;
       for(let ray=0;ray<12;ray++){const a=ray*Math.PI/6;ctx.beginPath();ctx.moveTo(celestialX+Math.cos(a)*24,celestialY+Math.sin(a)*24);ctx.lineTo(celestialX+Math.cos(a)*34,celestialY+Math.sin(a)*34);ctx.stroke();}
       ctx.shadowBlur=20;ctx.shadowColor="rgba(255,218,130,.85)";ctx.fillStyle="#ffd879";ctx.beginPath();ctx.arc(celestialX,celestialY,20,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle="rgba(255,249,218,.9)";ctx.lineWidth=2;ctx.stroke();
     }else{
       ctx.shadowBlur=13;ctx.shadowColor="rgba(224,237,255,.8)";ctx.fillStyle="#edf5ff";ctx.beginPath();ctx.arc(celestialX,celestialY,16,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
       ctx.fillStyle="rgba(8,18,48,.78)";ctx.beginPath();ctx.arc(celestialX+8,celestialY-6,14,0,Math.PI*2);ctx.fill();
       ctx.fillStyle="rgba(255,255,255,.86)";for(let s=0;s<24;s++){const sx=(s*83+29)%W,sy=(s*47+19)%250;if(sx<360||sx>720){ctx.beginPath();ctx.arc(sx,sy,1+(s%3)*.35,0,Math.PI*2);ctx.fill();}}
     }
     ctx.restore();
     g.spawn-=dt;
    if(g.spawn<=0){
      // Never create an obstacle in the same lane and near the same depth as a gift.
      const lanes=[0,1,2].sort(()=>Math.random()-.5);
      const safeLane=lanes.find(lane=>!g.collectibles.some(item=>item.lane===lane&&Math.abs(item.y-(-45))<155));
      if(safeLane!==undefined){
        g.obstacles.push({lane:safeLane,y:-45,type:["cone","hole","barrier","signal"][Math.floor(Math.random()*4)]});
        g.spawn=Math.max(25,42-difficultyLevel*3.5)+Math.random()*8;
      }else{
        // Retry shortly rather than placing an obstacle over a collectible.
        g.spawn=8;
      }
    }
    g.obstacles.forEach(o=>{o.y+=g.speed*dt*1.7;o.phase=(o.phase||0)+dt*.08;});g.obstacles=g.obstacles.filter(o=>o.y<H+70);g.obstacles.slice().sort((a,b)=>a.y-b.y).forEach(drawObstacle);
    g.multiplierTicks=Math.max(0,g.multiplierTicks-dt);
    g.giftSpawn-=dt;
    if(g.giftSpawn<=0&&g.collectibles.length===0){
      // Gifts are only spawned in a lane with enough clear road around them.
      // Obstacles and gifts move at the same speed, so this spacing remains stable.
      const lanes=[0,1,2].sort(()=>Math.random()-.5);
      const safeLane=lanes.find(lane=>!g.obstacles.some(obstacle=>obstacle.lane===lane&&Math.abs(obstacle.y-(-35))<155));
      if(safeLane!==undefined){
        const roll=Math.random(),type=(!g.multiplierTicks&&g.multiplierUses<MAX_MULTIPLIER_USES&&roll<.12)?"multiplier":roll<.34?"special":"common";
        g.collectibles.push({lane:safeLane,y:-35,type,phase:Math.random()*Math.PI*2});
        g.giftSpawn=260+Math.random()*260;
      }else{
        // Wait for a clear lane; do not overlap a gift with an obstacle.
        g.giftSpawn=12;
      }
    }
    g.collectibles.forEach(o=>{o.y+=g.speed*dt*1.7;o.phase=(o.phase||0)+dt*.08;});
    g.collectibles=g.collectibles.filter(o=>o.y<H+55);
    const playerLane=g.lane,collectibleIndex=g.collectibles.findIndex(o=>o.lane===playerLane&&o.y>H-220&&o.y<H-105);
    if(collectibleIndex>=0){
      const item=g.collectibles.splice(collectibleIndex,1)[0];
      if(item.type==="multiplier"){
        if(g.multiplierTicks>0){
          g.pickupNotice={text:"¡EL x2 YA ESTÁ ACTIVO!",life:105};
        }else if(g.multiplierUses<MAX_MULTIPLIER_USES){
          g.multiplierUses++;
          g.multiplierTicks=MULTIPLIER_DURATION_TICKS;
          g.pickupNotice={text:"¡MULTIPLICADOR x2! · "+(MAX_MULTIPLIER_USES-g.multiplierUses)+" RESTANTES",life:105};
        }else{
          g.pickupNotice={text:"¡MULTIPLICADORES AGOTADOS!",life:105};
        }
      }else{
        const base=item.type==="special"?250:100;
        const awarded=base*(g.multiplierTicks>0?2:1);
        g.bonusPoints+=awarded;
        g.pickupNotice={text:"¡REGALO RECOGIDO! +"+awarded+" PTS",life:105};
      }
      setScore(totalScore());
    }
    g.collectibles.slice().sort((a,b)=>a.y-b.y).forEach(drawCollectible);
    if(g.jump>0)g.jump=Math.max(0,g.jump-dt);
    const playerX=laneX(g.lane,H-150),playerY=H-150;
    const hit=g.obstacles.some(o=>o.lane===g.lane&&o.y>H-220&&o.y<H-105&&g.jump<8);
    if(hit){alive=false;const v=totalScore();setScore(v);setGameDistance(Math.floor(g.distance/10));setGameStatus("over");return;}
    drawCar(playerX,playerY);
    // Minimal in-world telemetry
    ctx.save();ctx.fillStyle="rgba(9,22,38,.34)";rounded(18,18,168,56,13,ctx.fillStyle);
    ctx.fillStyle="#fff";ctx.font="700 10px Arial";ctx.textAlign="left";ctx.fillText("DISTANCIA",30,39);
    ctx.font="800 19px Arial";ctx.fillText(Math.floor(g.distance/10)+" m",30,61);
    ctx.fillStyle="rgba(255,255,255,.72)";ctx.font="700 9px Arial";ctx.fillText("MANTÉN EL CONTROL",W-157,40);
    ctx.restore();
    if(g.levelNotice>0){const alpha=Math.min(1,g.levelNotice/24);ctx.save();ctx.globalAlpha=alpha;rounded(362,330,356,104,18,"rgba(24,20,48,.86)","rgba(255,255,255,.65)");ctx.textAlign="center";ctx.shadowColor="rgba(0,150,174,.8)";ctx.shadowBlur=18;ctx.fillStyle="#75edf0";ctx.font="900 23px Arial";ctx.fillText("¡SUBISTE DE NIVEL!",540,371);ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.font="800 14px Arial";ctx.fillText("NIVEL "+(g.level+1)+"  ·  MÁS VELOCIDAD",540,402);ctx.restore();g.levelNotice=Math.max(0,g.levelNotice-dt);}
    ctx.save();rounded(W-184,78,166,58,12,g.multiplierTicks>0?"rgba(7,60,74,.9)":"rgba(25,18,48,.84)",g.multiplierTicks>0?"rgba(111,227,232,.9)":"rgba(255,255,255,.45)");
    ctx.fillStyle="#8df5f1";ctx.textAlign="center";ctx.font="900 14px Arial";ctx.fillText(g.multiplierTicks>0?"PUNTOS x2":"MULTIPLICADOR",W-101,97);
    ctx.font="700 10px Arial";ctx.fillStyle="#fff";ctx.fillText(g.multiplierTicks>0?Math.ceil(g.multiplierTicks/60)+" s · "+(MAX_MULTIPLIER_USES-g.multiplierUses)+" usos":"Disponibles: "+(MAX_MULTIPLIER_USES-g.multiplierUses)+"/"+MAX_MULTIPLIER_USES,W-101,119);ctx.restore();
    if(g.pickupNotice&&g.pickupNotice.life>0){
      const alpha=Math.min(1,g.pickupNotice.life/22);ctx.save();ctx.globalAlpha=alpha;
      rounded(300,250,480,68,16,"rgba(25,18,48,.88)","rgba(255,255,255,.72)");
      ctx.fillStyle="#8df5f1";ctx.textAlign="center";ctx.font="900 22px Arial";ctx.fillText(g.pickupNotice.text,540,292);
      ctx.restore();g.pickupNotice.life=Math.max(0,g.pickupNotice.life-dt);
    }
    if(g.ticks%8===0){const v=totalScore();setScore(v);setGameDistance(Math.floor(g.distance/10));}
    raf=requestAnimationFrame(frame);
  };
  raf=requestAnimationFrame(frame);
  const key=e=>{if(["ArrowLeft","ArrowRight","ArrowUp"," ","a","d","A","D"].includes(e.key)){e.preventDefault();if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a")g.lane=Math.max(0,g.lane-1);if(e.key==="ArrowRight"||e.key.toLowerCase()==="d")g.lane=Math.min(2,g.lane+1);if(e.key===" "||e.key==="ArrowUp")g.jump=22;}};
  window.addEventListener("keydown",key);return()=>{alive=false;cancelAnimationFrame(raf);window.removeEventListener("keydown",key);};
 },[step,gameStatus]);
 const startDriving=()=>{gameEngineRef.current={lane:1,jump:0,obstacles:[],collectibles:[],ticks:0,distance:0,distancePoints:0,bonusPoints:0,multiplierTicks:0,multiplierUses:0,giftSpawn:220+Math.random()*180,speed:7.2,spawn:12,level:0,levelNotice:0};setScore(0);setGameDistance(0);setGameStatus("playing");};
 const moveCar=direction=>{const g=gameEngineRef.current;if(!g||gameStatus!=="playing")return;if(direction==="left")g.lane=Math.max(0,g.lane-1);if(direction==="right")g.lane=Math.min(2,g.lane+1);if(direction==="jump")g.jump=22;};
 const touchStartRef=useRef(null);
 const handleGamePointerDown=e=>{if(gameStatus!=="playing")return;touchStartRef.current={x:e.clientX,y:e.clientY,id:e.pointerId};};
 const handleGamePointerUp=e=>{const start=touchStartRef.current;touchStartRef.current=null;if(!start||gameStatus!=="playing")return;const dx=e.clientX-start.x,dy=e.clientY-start.y;const threshold=28;if(Math.max(Math.abs(dx),Math.abs(dy))<threshold)return;if(Math.abs(dx)>Math.abs(dy))moveCar(dx<0?"left":"right");else if(dy<0)moveCar("jump");};
 const currentTriviaIndex=Math.max(0,Object.keys(answers).length-(feedback?1:0));
 const profile=()=>"Qualicoche Run";
 const profileCopy={"Protección Básica":"Tu prioridad es contar con una base de respaldo ante imprevistos y responsabilidad frente a terceros. Revisa que las coberturas respondan a tus necesidades de movilidad.","Protección Intermedia":"Tu rutina y el entorno de resguardo hacen conveniente valorar protecciones adicionales. Compara opciones que amplíen tu respaldo ante incidentes frecuentes.","Protección Integral":"Tu vehículo tiene una exposición mayor por su uso, antigüedad o lugar de resguardo. Conviene revisar una protección amplia y asistencias que acompañen tu actividad.","Qualicoche Run":"Tu resultado refleja la distancia recorrida al volante del Qualicoche. Conduce con atención, anticipa riesgos y mantén siempre una movilidad segura."};
 const finish=async()=>{setError("");if(!participatingRun){setStep("fin");return;}if(!competitionActive){setError("La competencia fue desactivada. Esta partida ya no puede registrarse como participación.");return;}if(!supabaseConfigured){setError("No hay conexión con la base de datos. Configura Supabase para registrar tu participación.");return;}setBusy(true);try{const payload={p_nombre:form.nombre.trim(),p_telefono:form.telefono.replace(/\D/g,""),p_correo:form.correo.trim().toLowerCase(),p_tiene_seguro:form.tiene_seguro,p_aseguradora:form.tiene_seguro==="No"?"Sin seguro":form.aseguradora,p_anio:null,p_pernocta:null,p_uso:null,p_preocupacion:null,p_puntaje:score,p_perfil:profile(),p_solicita_cotizacion:form.cotizacion,p_solicita_asesoria:form.asesoria,p_autoriza_promociones:form.autoriza_promociones};const {data,error}=await supabase.rpc("registrar_desafio_seguridad_vial",payload);if(error)throw error;const row=Array.isArray(data)?data[0]:data;setFolio(row.folio);setStep("fin");}catch(e){setError(e?.message||"No se pudo registrar tu participación.");}finally{setBusy(false);}};
 const beginExperience=()=>{setError("");if(!competitionModeLoaded){setError("Estamos verificando el modo de juego. Intenta nuevamente en unos segundos.");return;}if(competitionModeError){setError("No se puede iniciar: "+competitionModeError);return;}setFolio("");if(competitionActive){setParticipatingRun(true);setStep("registro");}else{setParticipatingRun(false);setForm(blank);startTrivia();}};
 const changeCompetitionMode=async next=>{if(!session||busy)return;setBusy(true);setError("");const {error}=await supabase.rpc("configurar_modo_competencia",{p_activo:next});if(error){setError("No se pudo cambiar el modo: "+error.message);}else{setCompetitionActive(next);setCompetitionModeError("");}setBusy(false);};
 const logout=async()=>{await supabase.auth.signOut();setSession(null);};
 if(isAdmin){return <div className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-wrap items-center justify-between gap-4"><Brand/><div className="flex flex-wrap items-center gap-2"><button type="button" className={secondary} onClick={onExitAdmin}><FaArrowLeft/> Volver al desafío</button><button className={secondary} onClick={logout}><FaSignOutAlt/> Cerrar sesión</button></div></div>{!session?<div className="mx-auto max-w-md rounded-3xl bg-white p-7 shadow-xl"><h1 className="text-2xl font-extrabold text-[#941B80]">Acceso de organizadores</h1><p className="mt-2 text-sm text-slate-500">Ingresa con una cuenta autorizada de Quálitas Hub.</p><form className="mt-6 space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);setError("");const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setError(error.message);setBusy(false);}}><Field label="Correo"><input className={inputClass} type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></Field><Field label="Contraseña"><input className={inputClass} type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></Field>{error&&<p className="text-sm text-red-600">{error}</p>}<button className={primary+" w-full"} disabled={busy}>Iniciar sesión</button></form></div>:<><div className="mb-6"><p className="text-sm font-bold uppercase tracking-widest text-[#0096AE]">Panel privado</p><h1 className="text-3xl font-black text-slate-900">Desafío Digital de Seguridad Vial</h1><p className="mt-1 text-sm text-slate-500">Registros y solicitudes recibidas.</p></div>
 <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-[#0096AE]">Control de experiencia</p><h2 className="mt-1 text-xl font-black text-slate-900">Modo de juego</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">Demo permite jugar sin registro ni almacenamiento. Competencia solicita los datos y registra los resultados para el ranking.</p></div><div className="flex items-center gap-3"><span className={"rounded-full px-3 py-2 text-xs font-black "+(competitionActive?"bg-emerald-100 text-emerald-800":"bg-slate-100 text-slate-700")}>{competitionActive?"COMPETENCIA ACTIVA":"MODO DEMO"}</span><button type="button" role="switch" aria-checked={competitionActive} disabled={!competitionModeLoaded||Boolean(competitionModeError)||busy} onClick={()=>changeCompetitionMode(!competitionActive)} className={"relative h-8 w-16 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 "+(competitionActive?"bg-[#941B80]":"bg-slate-300")}><span className={"absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all "+(competitionActive?"left-9":"left-1")}/></button></div></div>
  {!competitionModeLoaded?<p className="mt-4 text-sm text-slate-500">Consultando configuración…</p>:competitionModeError?<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{competitionModeError}</p>:<p className="mt-4 text-xs text-slate-500">El cambio aplica a las partidas nuevas. Si desactivas la competencia mientras alguien juega, su resultado no podrá registrarse.</p>}
 </section>
 <section className="mb-6 overflow-hidden rounded-3xl border border-[#941B80]/15 bg-gradient-to-r from-[#35123e] via-[#68135f] to-[#087f91] p-5 text-white shadow-lg sm:p-7">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#a9f4f1]">Clasificación de hoy</p><h2 className="mt-1 text-2xl font-black">🏆 Líder Qualicoche del día</h2><p className="mt-1 text-sm text-white/75">Se actualiza con los registros de la jornada.</p></div><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">{new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"})}</span></div>
  {dailyLeaderboard.length===0?<div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-5 text-sm text-white/80">Todavía no hay puntuaciones registradas hoy.</div>:<>
   <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
    <div className="rounded-2xl border border-white/20 bg-white/10 p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#a9f4f1]">Primer lugar provisional</p><div className="mt-2 text-3xl font-black">{dailyLeaderboard[0].nombre}</div><div className="mt-1 text-5xl font-black text-[#8df1ed]">{Number(dailyLeaderboard[0].puntaje||0).toLocaleString("es-MX")} <span className="text-base">pts</span></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><span className="block text-xs text-white/60">Teléfono de contacto</span><strong className="text-lg">{dailyLeaderboard[0].telefono}</strong></div><div><span className="block text-xs text-white/60">Folio</span><strong>{dailyLeaderboard[0].folio}</strong></div></div></div>
    <div className="rounded-2xl border border-white/15 bg-black/10 p-4"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-white/70">Top 10 de hoy</p><div className="space-y-2">{dailyLeaderboard.map((r,i)=><div key={r.id} className={"flex items-center gap-3 rounded-xl px-3 py-2 "+(i===0?"bg-white/20":"bg-white/5")}><span className="w-6 text-sm font-black text-[#a9f4f1]">{i+1}.</span><span className="min-w-0 flex-1 truncate text-sm font-bold">{r.nombre}</span><span className="text-sm font-black tabular-nums">{Number(r.puntaje||0).toLocaleString("es-MX")} pts</span></div>)}</div></div>
   </div><p className="mt-3 text-[11px] text-white/65">En caso de empate, se prioriza el registro más antiguo. El teléfono solo se muestra en este panel privado.</p>
  </>}
 </section>
 <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{[{label:"Participantes",value:metrics.total,icon:<FaUsers/>},{label:"Puntos promedio",value:metrics.average,icon:<FaStar/>},{label:"Solicitudes de cotización",value:metrics.cotizaciones,icon:<FaCar/>},{label:"Solicitudes de asesoría",value:metrics.asesorias,icon:<FaShieldAlt/>}].map(x=><div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" key={x.label}><div className="flex items-center justify-between text-sm font-semibold text-slate-500"><span>{x.label}</span><span className="text-[#0096AE]">{x.icon}</span></div><div className="mt-2 text-3xl font-black text-[#941B80]">{x.value}</div></div>)}</div><div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"><div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3"><input className={inputClass+" max-w-sm"} placeholder="Buscar folio, nombre, teléfono o correo" value={filter} onChange={e=>setFilter(e.target.value)}/><button className={primary} onClick={()=>exportToExcel(filtered.map(r=>({Folio:r.folio,Nombre:r.nombre,Telefono:r.telefono,Correo:r.correo,Seguro:r.tiene_seguro,Aseguradora:r.aseguradora,Año:r.anio,Resguardo:r.pernocta,Uso:r.uso,Preocupacion:r.preocupacion,Puntos:r.puntaje,Perfil:r.perfil,Cotizacion:r.solicita_cotizacion?"Sí":"No",Asesoria:r.solicita_asesoria?"Sí":"No",AutorizaPromociones:r.autoriza_promociones?"Sí":"No",Fecha:r.creado_en})),"Desafio_Seguridad_Vial")}><FaDownload/> Exportar a Excel</button></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{["Folio","Participante","Contacto","Puntos","Perfil","Cotización","Asesoría","Promociones","Fecha","Acciones"].map(h=><th className="px-3 py-3 font-bold" key={h}>{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(r=><tr key={r.id} className="hover:bg-slate-50"><td className="px-3 py-3 font-extrabold text-[#941B80]">{r.folio}</td><td className="px-3 py-3 font-semibold">{r.nombre}</td><td className="px-3 py-3">{r.telefono}<br/>{r.correo}</td><td className="px-3 py-3 font-bold">{r.puntaje}</td><td className="px-3 py-3">{r.perfil}</td><td className="px-3 py-3">{r.solicita_cotizacion?"Sí":"No"}</td><td className="px-3 py-3">{r.solicita_asesoria?"Sí":"No"}</td><td className="px-3 py-3 font-semibold">{r.autoriza_promociones?"Autorizó":"No autorizó"}</td><td className="px-3 py-3">{new Date(r.creado_en).toLocaleString("es-MX")}</td><td className="px-3 py-3"><div className="flex gap-2"><button type="button" disabled={busy} onClick={()=>editRecord(r)} className="rounded-lg border border-[#941B80] px-3 py-1.5 font-bold text-[#941B80] disabled:opacity-50">Editar</button><button type="button" disabled={busy} onClick={()=>deleteRecord(r)} className="rounded-lg border border-rose-200 px-3 py-1.5 font-bold text-rose-700 disabled:opacity-50">Eliminar</button></div></td></tr>)}</tbody></table>{filtered.length===0&&<p className="py-10 text-center text-sm text-slate-400">No hay participantes para mostrar.</p>}</div></div></>}</div></div>}
 return <div className={publicMode?"min-h-screen bg-slate-50":"min-h-[calc(100vh-4rem)] bg-slate-50"}><div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8"><div className="mb-6 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm sm:px-6"><Brand/></div>{step!=="inicio"&&step!=="registro"&&step!=="sorteo"&&step!=="fin"&&<><Progress step={step}/>{["rompecabezas","unir","peligros","decision","inspeccion","proteccion"].includes(step)&&<div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#941B80]/15 bg-white px-4 py-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Puntuación de Qualicoche Run</p><p className="text-xl font-black text-[#941B80]">{score} <span className="text-xs font-bold text-slate-400">puntos acumulados</span></p></div><p className="text-xs font-semibold text-slate-500">Cada error resta 10 puntos de la actividad.</p></div>}</>}<main className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60">
 {step==="inicio"&&<div className="space-y-6">
 <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#941B80] via-[#71136f] to-[#075f76] px-6 py-9 text-white shadow-2xl sm:px-10 sm:py-12">
  <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border-[42px] border-white/10"/><div className="pointer-events-none absolute -bottom-36 left-[28%] h-80 w-80 rounded-full border-[34px] border-[#00b4c7]/20"/>
  <div className="relative">
   <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em]">Quálitas presenta</span><span className="rounded-full bg-[#00a1b5] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider">Activación especial · Cuautitlán Izcalli</span></div>
   <div className="mt-8 grid items-center gap-8 lg:grid-cols-[1.2fr_.8fr]">
    <div><p className="text-sm font-extrabold uppercase tracking-[.2em] text-[#8df5f1]">Un reto. Una jornada. Un campeón.</p><h1 className="mt-3 max-w-3xl text-5xl font-black leading-[.98] tracking-tight sm:text-6xl">RETO <span className="text-[#8df5f1]">QUALICOCHE</span> RUN</h1><p className="mt-5 max-w-xl text-base leading-7 text-white/85 sm:text-lg">Quálitas te invita a poner a prueba tus reflejos en nuestro desafío digital de seguridad vial. Esquiva obstáculos, recoge recompensas y consigue la puntuación más alta.</p>
     <div className="mt-7 flex flex-wrap gap-3"><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-[#941B80] shadow-xl transition hover:-translate-y-0.5 disabled:opacity-50" disabled={!competitionModeLoaded||Boolean(competitionModeError)} onClick={beginExperience}>{!competitionModeLoaded?"VERIFICANDO…":"PARTICIPA EN EL RETO"} <FaArrowRight/></button><a href="#premios-qualitas" className="inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/10 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/20">Conoce los premios</a></div>
     <p className="mt-3 text-xs text-white/65">{competitionModeLoaded?(competitionActive?"La competencia está habilitada para registrar resultados.":"El modo competencia todavía no está habilitado."):"Verificando disponibilidad del juego…"}</p>
    </div>
    <div className="relative mx-auto w-full max-w-[390px]"><div className="absolute inset-5 rounded-full bg-[#00a6b8]/30 blur-3xl"/><div className="relative rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-widest text-[#8df5f1]">Desafío Quálitas</span><FaTrophy className="text-2xl text-[#8df5f1]"/></div><img src="/dinamicas/Auto.png" alt="Vehículo ilustrativo del reto Qualicoche" className="mx-auto mt-3 h-44 w-full object-contain drop-shadow-2xl"/><div className="mt-2 rounded-2xl border border-white/15 bg-[#220b32]/35 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Fecha del evento</p><p className="mt-1 text-2xl font-black">20 de noviembre de 2026</p><p className="text-sm font-semibold text-[#8df5f1]">11:00 a 15:30 h · Una sola jornada</p></div></div></div>
   </div>
   <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">{[{n:"01",t:"Una jornada",d:"Un solo día para competir"},{n:"02",t:"Un ranking",d:"Puntuaciones de la jornada"},{n:"03",t:"Un campeón",d:"Gana el puntaje más alto"},{n:"04",t:"Experiencia",d:"Juego digital de seguridad vial"}].map(x=><div key={x.n} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur"><p className="text-[10px] font-black text-[#8df5f1]">{x.n}</p><p className="mt-1 text-sm font-black">{x.t}</p><p className="mt-1 text-[11px] leading-4 text-white/65">{x.d}</p></div>)}</div>
  </div>
 </section>
 <section aria-labelledby="ranking-publico" className="rounded-3xl border border-[#941B80]/15 bg-white p-5 shadow-sm sm:p-7">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#0096AE]">Clasificación de la jornada</p><h2 id="ranking-publico" className="mt-1 text-2xl font-black text-slate-900"><FaTrophy className="mr-2 inline text-[#941B80]"/>Top 10 Qualicoche Run</h2><p className="mt-1 text-sm text-slate-500">Los mejores puntajes registrados en la competencia.</p></div><span className="rounded-full bg-[#941B80]/10 px-3 py-1.5 text-xs font-bold text-[#941B80]">Actualización automática</span></div>
  {leaderboardLoading?<p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Cargando clasificación…</p>:leaderboardError?<p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{leaderboardError}</p>:publicLeaderboard.length===0?<p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Aún no hay puntuaciones registradas. ¡Sé el primero en aparecer!</p>:<div className="mt-5 overflow-hidden rounded-2xl border border-slate-100"><div className="grid grid-cols-[42px_minmax(0,1fr)_90px] gap-2 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500"><span>Lugar</span><span>Participante</span><span className="text-right">Puntos</span></div>{publicLeaderboard.map((r,i)=><div key={r.folio||i} className={"grid grid-cols-[42px_minmax(0,1fr)_90px] items-center gap-2 border-t border-slate-100 px-4 py-3 "+(i===0?"bg-[#941B80]/5":"bg-white")}><span className={"flex h-8 w-8 items-center justify-center rounded-full text-xs font-black "+(i===0?"bg-amber-100 text-amber-800":"bg-slate-100 text-slate-600")}>{i+1}</span><span className="truncate text-sm font-bold text-slate-800">{r.nombre}</span><span className="text-right text-sm font-black tabular-nums text-[#0096AE]">{Number(r.puntaje||0).toLocaleString("es-MX")}</span></div>)}</div>}
  <p className="mt-3 text-[11px] text-slate-400">Solo se muestran nombre y puntuación; los datos de contacto permanecen privados.</p>
 </section>
 <section id="premios-qualitas" className="grid gap-4 md:grid-cols-[1fr_1fr]">
  <div className="relative overflow-hidden rounded-3xl bg-[#941B80] p-6 text-white shadow-lg"><div className="absolute -right-8 -top-8 text-[120px] opacity-10">%</div><p className="text-xs font-black uppercase tracking-[.18em] text-white/70">Premio para el campeón</p><p className="mt-3 text-6xl font-black tracking-tight">30%</p><h2 className="mt-1 text-xl font-black">de descuento al contratar tu póliza Quálitas</h2><p className="mt-3 text-xs leading-5 text-white/75">Descuento autorizado. Aplican las condiciones comerciales y criterios de elegibilidad definidos por Quálitas.</p></div>
  <div className="relative overflow-hidden rounded-3xl border border-[#0096AE]/20 bg-gradient-to-br from-[#e8fbfc] to-white p-6 shadow-lg"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.18em] text-[#007d91]">Premio físico</p><FaGift className="text-2xl text-[#0096AE]"/></div><div className="mt-3 flex items-center gap-4"><div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-[#0096AE]/10 text-6xl">🔦</div><div><h2 className="text-xl font-black text-slate-900">Lámpara Quálitas</h2><p className="mt-1 text-sm leading-5 text-slate-600">Con kit de herramientas incluido.</p></div></div><p className="mt-4 text-xs text-slate-500">Premio sujeto a disponibilidad y validación de la organización.</p></div>
 </section>
 <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.18em] text-[#0096AE]">Cómo participar</p><h2 className="mt-2 text-3xl font-black text-slate-900">Tu camino para ser el campeón</h2><p className="mt-2 text-sm leading-6 text-slate-500">La participación se realiza en el módulo de Quálitas durante el horario oficial del evento.</p></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{n:"01",t:"Regístrate",d:"Comparte tus datos con el equipo Quálitas para habilitar tu participación oficial."},{n:"02",t:"Practica",d:"Conoce el juego en modo demo y familiarízate con los controles."},{n:"03",t:"Compite",d:"Realiza tu partida oficial. Tu puntuación quedará registrada."},{n:"04",t:"Gana",d:"Al cierre de la jornada, la puntuación válida más alta define al campeón."}].map(x=><div key={x.n} className="rounded-2xl bg-slate-50 p-4"><span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#941B80]/10 text-sm font-black text-[#941B80]">{x.n}</span><h3 className="mt-3 font-black text-slate-900">{x.t}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{x.d}</p></div>)}</div></section>
 <section className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]"><div className="rounded-3xl bg-slate-950 p-6 text-white"><p className="text-xs font-black uppercase tracking-[.18em] text-[#8df5f1]">Sede del evento</p><h2 className="mt-2 text-2xl font-black">Bazar de Autos El Vaquero</h2><p className="mt-2 text-sm text-white/70">Socio comercial y anfitrión de esta activación de Quálitas.</p><div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"><FaCar className="mt-1 text-xl text-[#8df5f1]"/><div><p className="font-bold">Cuautitlán Izcalli, Estado de México</p><p className="mt-1 text-xs text-white/55">Bélgica Manzana #068, Centro Urbano, Cuautitlán Izcalli, 54700, Estado de México.</p></div></div><p className="mt-4 text-[11px] text-white/50">Quálitas organiza y protagoniza el reto. El Bazar de Autos El Vaquero participa como socio comercial y sede.</p></div><div className="rounded-3xl border border-slate-200 bg-white p-6"><p className="text-xs font-black uppercase tracking-[.18em] text-[#0096AE]">Agenda de la jornada</p><h2 className="mt-2 text-2xl font-black text-slate-900">20 de noviembre · 11:00 a 15:30 h</h2><div className="mt-5 space-y-3">{[{t:"Apertura y convocatoria",d:"Instalación del módulo, bienvenida e inicio de registros."},{t:"Reto abierto",d:"Prácticas demo y partidas oficiales con seguimiento del ranking."},{t:"Cierre de competencia",d:"Validación de resultados y revisión de posibles empates."},{t:"Premiación Quálitas",d:"Anuncio del campeón, entrega de premios y fotografía oficial."}].map((x,i)=><div key={x.t} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0096AE]/10 text-xs font-black text-[#007d91]">{i+1}</span><div><p className="text-sm font-black text-slate-800">{x.t}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{x.d}</p></div></div>)}</div><p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">Horario exacto y hora de cierre por confirmar con la sede y el equipo organizador.</p></div></section>
 <section className="rounded-3xl border border-[#941B80]/15 bg-gradient-to-r from-[#fff] to-[#f8eff8] p-6 sm:p-8"><div className="grid items-center gap-5 md:grid-cols-[1fr_auto]"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#941B80]">Quálitas · Aseguramos autos, cuidamos personas</p><h2 className="mt-2 text-2xl font-black text-slate-900">La seguridad vial también se vive jugando.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Ven a conocer la experiencia, participa y descubre cómo Quálitas puede acompañarte en el camino.</p></div><button className={primary+" whitespace-nowrap"} disabled={!competitionModeLoaded||Boolean(competitionModeError)} onClick={beginExperience}>JUGAR AHORA <FaArrowRight/></button></div></section>
 <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5"><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Información de organización · propuesta para revisión</p><p className="mt-2 text-xs leading-5 text-slate-600">Descuento del 30% autorizado. Confirmar presupuesto de edecán y stand, personal asignado, aviso de privacidad aplicable y logística final. La competencia deberá configurarse para la jornada y el ranking cerrarse a las 15:30 h.</p></section>
 </div>}{step==="registro"&&<div className="p-6 sm:p-10"><div className="mb-7"><p className="text-xs font-black uppercase tracking-widest text-[#0096AE]">Antes de comenzar</p><h1 className="mt-2 text-3xl font-black text-slate-900">Registro del participante</h1><p className="mt-2 text-sm text-slate-500">Completa tus datos para guardar tu resultado y generar tu folio.</p></div><form onSubmit={e=>{e.preventDefault();setError("");startTrivia();}} className="grid gap-5 sm:grid-cols-2"><Field label="Nombre completo"><input className={inputClass} required minLength={3} value={form.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Tu nombre y apellidos"/></Field><Field label="Teléfono"><input className={inputClass} required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={form.telefono} onChange={e=>set("telefono",e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10 dígitos"/></Field><Field label="Correo electrónico"><input className={inputClass} type="email" required value={form.correo} onChange={e=>set("correo",e.target.value)} placeholder="nombre@correo.com"/></Field><Field label="¿Actualmente cuentas con seguro?"><select className={inputClass} required value={form.tiene_seguro} onChange={e=>{const value=e.target.value;setForm(p=>({...p,tiene_seguro:value,aseguradora:value==="No"?"Sin seguro":(p.aseguradora==="Sin seguro"?"":p.aseguradora)}));}}><option value="">Selecciona</option><option>Sí</option><option>No</option></select></Field><div className="sm:col-span-2"><Field label="¿Quién asegura actualmente tu vehículo?"><select className={inputClass} required value={form.aseguradora} disabled={form.tiene_seguro==="No"} onChange={e=>set("aseguradora",e.target.value)}><option value="">Selecciona una opción</option>{(form.tiene_seguro==="No"?["Sin seguro"]:insurers.filter(x=>x!=="Sin seguro")).map(x=><option key={x}>{x}</option>)}</select></Field></div><div className="sm:col-span-2 rounded-2xl border border-[#0096AE]/20 bg-[#0096AE]/5 p-4"><label className="flex items-start gap-3 text-sm text-slate-700"><input type="checkbox" checked={Boolean(form.autoriza_promociones)} onChange={e=>set("autoriza_promociones",e.target.checked)} className="mt-1 accent-[#941B80]"/><span><strong>Autorizo que Quálitas me contacte para enviarme promociones, beneficios, campañas e información comercial relacionada con seguros.</strong><span className="mt-1 block text-xs leading-5 text-slate-500">Esta autorización es opcional y no condiciona tu participación en el reto. Puedes revocarla o solicitar limitar el uso de tus datos mediante el Departamento de Datos Personales de Quálitas.</span><a className="mt-2 inline-block text-xs font-bold text-[#941B80] underline" href="https://www.qualitas.com.mx/documents/19189400/21589031/Condiciones%2BParticulares%2Bpara%2BWEB.pdf/f6568a04-0ec4-3067-07ec-5839659594fb?t=1700720976026" target="_blank" rel="noreferrer">Consultar Aviso de Privacidad Integral de Quálitas</a><span className="mt-1 block text-[11px] text-slate-500">Departamento de Datos Personales: datospersonales@qualitas.com.mx</span></span></label></div><div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5"><span className="text-xs text-slate-400">Completa tu registro para desbloquear el juego Qualicoche Run.</span><button className={primary}>CONTINUAR <FaArrowRight/></button></div></form>{error&&<p className="mt-4 text-sm text-red-600">{error}</p>}</div>}
 {step==="game"&&<div ref={gameStageRef} className={isGameFullscreen?"fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-slate-950 p-3 text-white sm:p-5":"p-3 sm:p-8"}>
 <div className="mb-4 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between"><div className={isGameFullscreen?"max-sm:hidden":""}><span className="rounded-full bg-[#941B80]/15 px-3 py-1 text-xs font-black text-[#dca3d4]">QUALICOCHE RUN</span><h2 className={isGameFullscreen?"mt-1 text-xl font-black text-white sm:mt-2 sm:text-3xl":"mt-1 text-lg font-black text-slate-900 sm:mt-3 sm:text-3xl"}>¡A la ruta de la seguridad!</h2><p className={isGameFullscreen?"hidden text-sm text-slate-300 sm:block sm:mt-1":"hidden text-sm text-slate-500 sm:mt-1 sm:block"}>Conduce el Qualicoche, esquiva obstáculos y consigue la mayor distancia.</p></div><div className="grid grid-cols-[minmax(118px,1fr)_auto_auto] items-stretch gap-2 sm:flex sm:items-center"><div className={isGameFullscreen?"min-w-[118px] rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-center sm:min-w-[150px] sm:rounded-2xl sm:px-5 sm:py-2":"min-w-[118px] rounded-xl bg-[#941B80]/5 px-3 py-2 text-center sm:min-w-[150px] sm:rounded-2xl sm:px-5 sm:py-3"}><p className="whitespace-nowrap text-[9px] font-black uppercase tracking-wider opacity-70 sm:text-[10px]">Puntuación</p><p className="whitespace-nowrap text-2xl font-black leading-tight text-[#6FE3E8] sm:text-3xl">{Number(score).toLocaleString("es-MX")}</p><p className="hidden whitespace-nowrap text-[9px] font-bold text-[#8df5f1] sm:block">Regalos +100 / +250 · x2 hasta 3 usos</p></div>{gameStatus==="playing"||gameStatus==="paused"?<button type="button" onClick={()=>setGameStatus(gameStatus==="playing"?"paused":"playing")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#0096AE]/50 bg-[#0096AE]/15 px-3 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-[#0096AE]/30 sm:px-4 sm:py-3 sm:text-sm">{gameStatus==="playing"?"Ⅱ Pausar":"▶ Continuar"}</button>:null}<button type="button" onClick={toggleGameFullscreen} className={"inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-black text-white shadow-md transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0096AE] sm:px-4 sm:py-3 sm:text-sm "+(isGameFullscreen?"border-white/30 bg-white/15 hover:bg-white/25":"border-[#941B80] bg-[#941B80] hover:bg-[#781568]") }>{isGameFullscreen?"Salir":"⛶ Expandir"}</button></div></div>
 <div onPointerDown={handleGamePointerDown} onPointerUp={handleGamePointerUp} onPointerCancel={()=>{touchStartRef.current=null;}} className={(isGameFullscreen?"relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-[radial-gradient(120%_90%_at_50%_0%,#3b1150_0%,#1c0b26_55%,#0b0612_100%)] shadow-2xl":"relative mx-auto flex w-full max-w-[960px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-[#e7f7f8] shadow-xl sm:rounded-2xl sm:border-4")+" touch-none select-none"}><canvas ref={gameCanvasRef} width="1080" height="900" style={isGameFullscreen?(isMobileViewport?{width:"100%",height:"100%",minHeight:0,objectFit:"cover",flex:"1 1 auto"}:{width:"min(100%,98.4vh)",height:"auto",maxHeight:"82vh",aspectRatio:"6 / 5",objectFit:"contain",flex:"0 0 auto"}):undefined} className={isGameFullscreen&&isMobileViewport?"relative z-10 mx-auto block h-full w-full shrink-0 touch-none object-cover":"relative z-10 mx-auto block aspect-[6/5] w-full max-w-[1080px] shrink-0 touch-none"}/>{gameStatus==="paused"?<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/65 px-4 py-4 text-center text-white backdrop-blur-sm"><div className="text-4xl font-black text-[#6FE3E8]">Ⅱ</div><h3 className="text-2xl font-black">Partida en pausa</h3><p className="text-sm text-white/80">Tu recorrido está detenido. Continúa cuando estés listo.</p><button type="button" className="rounded-xl bg-gradient-to-r from-[#941B80] to-[#0096AE] px-7 py-3 font-black text-white shadow-lg" onClick={()=>setGameStatus("playing")}>▶ CONTINUAR</button></div>:gameStatus!=="playing"&&<div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1.5 bg-slate-950/80 px-3 py-2 text-center text-white backdrop-blur-sm sm:gap-2 sm:p-5"><div className="text-2xl sm:text-5xl">{gameStatus==="over"?"🚧":"🚗"}</div><h3 className="text-base font-black sm:mt-2 sm:text-2xl">{gameStatus==="over"?"¡Fin del recorrido!":"Tu Qualicoche está listo"}</h3><p className="max-w-xs text-[11px] leading-tight text-white/80 sm:mt-2 sm:text-sm">{gameStatus==="over"?"Tu recorrido terminó al encontrar un obstáculo. ¡Inténtalo otra vez para superar tu puntuación!":"Muévete entre carriles, salta obstáculos y recoge regalos (+100 / +250) o el multiplicador x2 para aumentar tu puntuación."}</p><div className="mt-1 flex flex-wrap justify-center gap-2 sm:mt-4">{gameStatus==="over"&&<button className="rounded-xl border border-white/30 px-5 py-3 font-bold" onClick={()=>setStep("resultado")}>Ver mi resultado</button>}<button className="rounded-lg bg-gradient-to-r from-[#941B80] to-[#0096AE] px-4 py-2 text-xs font-black text-white sm:rounded-xl sm:px-6 sm:py-3 sm:text-base" onClick={startDriving}>{gameStatus==="over"?"VOLVER A JUGAR":"INICIAR RECORRIDO"}</button></div></div>}
 <div className="mt-2 grid grid-cols-3 gap-2 sm:hidden"><button onClick={()=>moveCar("left")} className="min-h-[54px] rounded-xl bg-[#941B80] py-3 text-xl font-black text-white shadow-md active:scale-[.98]">←</button><button onClick={()=>moveCar("jump")} className="min-h-[54px] rounded-xl bg-[#0096AE] py-3 text-sm font-black text-white shadow-md active:scale-[.98]">SALTAR</button><button onClick={()=>moveCar("right")} className="min-h-[54px] rounded-xl bg-[#941B80] py-3 text-xl font-black text-white shadow-md active:scale-[.98]">→</button></div><div className={isGameFullscreen?"mt-3 flex items-center justify-center gap-3 text-xs font-semibold text-slate-300 max-sm:hidden":"mt-4 hidden items-center justify-center gap-3 text-xs font-semibold text-slate-500 sm:flex"}><span className="rounded-lg bg-white/10 px-3 py-2">← → Cambiar carril</span><span className="rounded-lg bg-white/10 px-3 py-2">ESPACIO / ↑ Saltar</span></div><div className={isGameFullscreen?"mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-400 sm:mt-3 sm:text-xs":"mt-2 flex items-center justify-between gap-3 text-[10px] leading-tight text-slate-400 sm:mt-4 sm:text-xs"}><span>Distancia: {gameDistance} m</span><span>Quálitas · Aseguramos autos, cuidamos personas.</span></div></div></div>}{step==="resultado"&&<div className="p-6 text-center sm:p-12"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-4xl">🏆</div><p className="mt-5 text-xs font-black uppercase tracking-widest text-[#0096AE]">Desafío completado</p><h2 className="mt-2 text-3xl font-black text-slate-900">¡Excelente{participatingRun&&form.nombre.trim()?", "+form.nombre.trim().split(" ")[0]:""}!</h2><p className="mt-2 text-slate-500">Este es tu resultado en el rally de seguridad vial.</p><div className="mx-auto mt-7 grid max-w-xl gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-[#941B80]/5 p-6"><FaStar className="mx-auto text-2xl text-[#941B80]"/><div className="mt-2 text-4xl font-black text-[#941B80]">{score}</div><div className="text-xs font-bold text-slate-500">PUNTOS OBTENIDOS</div></div><div className="rounded-2xl bg-[#0096AE]/10 p-6"><FaShieldAlt className="mx-auto text-2xl text-[#0096AE]"/><div className="mt-3 text-xl font-black text-[#007D91]">{profile()}</div><div className="mt-1 text-xs font-bold text-slate-500">TU PERFIL ORIENTATIVO</div></div></div><p className="mx-auto mt-5 max-w-xl rounded-xl bg-slate-50 p-5 text-left text-sm leading-6 text-slate-600">{profileCopy[profile()]} Este resultado es informativo y no sustituye una evaluación ni una cotización formal.</p><p className="mt-6 font-semibold text-slate-700">Gracias por participar en el Desafío Digital de Seguridad Vial Quálitas.</p>{participatingRun?<button className={primary+" mt-7"} onClick={()=>setStep("sorteo")}>Continuar con mi participación <FaArrowRight/></button>:<div className="mt-7"><p className="font-bold text-slate-700">Esta fue una partida de demostración.</p><p className="mt-1 text-sm text-slate-500">No se registraron tus datos ni tu puntuación.</p><button className={primary+" mt-4"} onClick={()=>setStep("fin")}>Finalizar demo</button></div>}</div>}
 {step==="sorteo"&&<div className="p-6 text-center sm:p-12"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl text-emerald-600"><FaCheckCircle/></div><h2 className="mt-5 text-3xl font-black text-slate-900">Confirma tu participación</h2><p className="mt-2 text-slate-500">Selecciona si deseas que el equipo Quálitas te contacte. Al confirmar, guardaremos tu resultado y generaremos tu folio.</p><div className="mx-auto mt-7 max-w-sm rounded-2xl border-2 border-dashed border-[#941B80]/40 bg-[#941B80]/5 p-6"><p className="text-xs font-black uppercase tracking-widest text-[#941B80]">Tu folio de participación</p><div className="mt-3 text-4xl font-black tracking-wider text-[#941B80]">{folio}</div></div><div className="mx-auto mt-6 max-w-md space-y-3 text-left"><label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm"><input type="checkbox" checked={form.cotizacion} onChange={e=>set("cotizacion",e.target.checked)} className="mt-1 accent-[#941B80]"/> <span><strong>Deseo recibir una cotización personalizada</strong><span className="mt-1 block text-xs text-slate-500">Autorizo que me contacten para conocer opciones de seguro.</span></span></label><label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm"><input type="checkbox" checked={form.asesoria} onChange={e=>set("asesoria",e.target.checked)} className="mt-1 accent-[#941B80]"/> <span><strong>Deseo agendar una asesoría gratuita</strong><span className="mt-1 block text-xs text-slate-500">Me interesa recibir orientación sobre protección vehicular.</span></span></label></div><p className="mt-5 text-xs text-slate-400">Las preferencias de contacto se guardan con tu registro.</p><button className={primary+" mt-6"} disabled={busy} onClick={finish}>{busy?"Registrando...":"CONFIRMAR PARTICIPACIÓN"}</button></div>}
 {step==="fin"&&<div className="p-10 text-center sm:p-16"><div className="text-6xl">{participatingRun?"🎉":"🚘"}</div><h2 className="mt-5 text-3xl font-black text-[#941B80]">{participatingRun?"¡Tu participación ha sido registrada!":"¡Demo completada!"}</h2><p className="mt-3 text-slate-600">{participatingRun?"Gracias por participar en el Desafío Digital de Seguridad Vial Quálitas. Conserva tu folio:":"Esta partida fue únicamente de demostración. No se guardaron datos personales, puntuación ni folio."}</p>{participatingRun&&<div className="mx-auto mt-6 max-w-sm rounded-2xl border-2 border-dashed border-[#941B80]/40 bg-[#941B80]/5 p-6"><p className="text-xs font-black uppercase tracking-widest text-[#941B80]">Tu folio de participación</p><div className="mt-3 text-4xl font-black tracking-wider text-[#941B80]">{folio}</div></div>}<div className="mt-5 text-2xl font-black text-[#0096AE]">{Number(score||0).toLocaleString("es-MX")} puntos</div><button className={secondary+" mt-7"} onClick={()=>{setStep("inicio");setForm(blank);setScore(0);setFolio("");setRiskIndex(0);setAnswers({});setParticipatingRun(false);}}>Volver al inicio</button></div>}
 </main><footer className="mt-5 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-400"><span>Quálitas Compañía de Seguros · Aseguramos autos, cuidamos personas.</span><span className="flex flex-wrap items-center gap-4">Desafío educativo · Participación gratuita <button type="button" onClick={onOpenAdmin} className="font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-[#941B80]">Acceso organizadores</button></span></footer>{error&&<div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-4 text-sm font-semibold text-red-700 shadow-xl">{error}<button className="float-right ml-3" onClick={()=>setError("")}>×</button></div>}</div></div>;
}
