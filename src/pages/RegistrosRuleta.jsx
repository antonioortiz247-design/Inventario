import { useCallback, useEffect, useMemo, useState } from "react";
import { FaSearch, FaSyncAlt, FaDownload, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import { supabase, supabaseConfigured } from "../lib/supabase";

export default function RegistrosRuleta() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [prospectos, setProspectos] = useState([]);
  const [premios, setPremios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!supabaseConfigured) { setAuthLoading(false); setError("Supabase no está configurado en esta aplicación."); return; }
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError.message);
      setSession(data?.session || null);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = async (event) => {
    event.preventDefault(); setError(""); setNotice(""); setAuthLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) setError("No se pudo iniciar sesión: " + signInError.message);
    else { setSession(data.session); setPassword(""); setNotice("Sesión iniciada."); }
    setAuthLoading(false);
  };

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true); setError(""); setNotice("");
    const { data: leads, error: leadsError } = await supabase
      .from("ruleta_activaciones_prospectos")
      .select("id,nombre,telefono,correo,municipio,marca,modelo,anio,tiene_seguro,aseguradora,vencimiento,interes_cotizacion,evento,acepta_contacto,created_at")
      .order("created_at", { ascending: false }).limit(2000);
    if (leadsError) {
      setError("No se pudieron leer los prospectos: " + leadsError.message + (leadsError.code ? " (" + leadsError.code + ")" : ""));
      setLoading(false); return;
    }
    setProspectos(leads || []);
    const { data: prizes, error: prizesError } = await supabase
      .from("ruleta_activaciones_historial")
      .select("id,premio,created_at,prospecto_id")
      .order("created_at", { ascending: false }).limit(2000);
    if (prizesError) {
      setPremios([]);
      setNotice("Los prospectos sí se cargaron, pero no se pudo consultar el historial de premios: " + prizesError.message);
    } else setPremios(prizes || []);
    setLoading(false);
  }, [session]);

  useEffect(() => { if (session) load(); }, [session, load]);

  const rows = useMemo(() => prospectos.map((p) => ({
    ...p,
    premio: premios.find((item) => item.prospecto_id === p.id)?.premio || "Sin premio registrado",
  })).filter((p) => {
    const term = query.trim().toLocaleLowerCase("es-MX");
    const date = p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : "";
    return (!term || [p.nombre,p.telefono,p.correo,p.municipio,p.evento,p.premio].some(v => String(v || "").toLocaleLowerCase("es-MX").includes(term)))
      && (!from || date >= from) && (!to || date <= to);
  }), [prospectos, premios, query, from, to]);

  const exportCsv = () => {
    const columns = ["Nombre","Teléfono","Correo","Municipio","Marca","Modelo","Año","Tiene seguro","Aseguradora","Vencimiento","Interés cotización","Evento","Premio","Fecha de registro","Acepta contacto"];
    const escape = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const data = rows.map(p => [p.nombre,p.telefono,p.correo,p.municipio,p.marca,p.modelo,p.anio,p.tiene_seguro,p.aseguradora,p.vencimiento,p.interes_cotizacion,p.evento,p.premio,p.created_at ? new Date(p.created_at).toLocaleString("es-MX") : "",p.acepta_contacto ? "Sí" : "No"]);
    const blob = new Blob(["\uFEFF" + [columns, ...data].map(r => r.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "Registros_Ruleta_Qualitas.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const signOut = async () => { await supabase.auth.signOut(); setSession(null); setProspectos([]); setPremios([]); };

  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-widest text-[#0096AE]">Marketing BTL · Quálitas</p><h1 className="text-3xl font-extrabold text-[#941B80]">Registros de ruleta</h1><p className="mt-1 text-slate-600">Consulta privada de prospectos y premios de las activaciones.</p></div>
    {session && <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-semibold"><FaSignOutAlt/> Cerrar sesión</button>}</div>
    {!session ? <section className="mx-auto max-w-lg rounded-3xl bg-white p-6 shadow-lg"><h2 className="text-xl font-bold text-[#143B46]">Acceso de personal</h2><p className="mt-2 text-sm text-slate-600">Inicia sesión con una cuenta autorizada de Supabase para consultar datos personales.</p>
      <form onSubmit={signIn} className="mt-5 space-y-4"><label className="block text-sm font-semibold">Correo electrónico<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal"/></label>
      <label className="block text-sm font-semibold">Contraseña<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal"/></label>
      <button disabled={authLoading || !supabaseConfigured} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#941B80] px-4 py-3 font-bold text-white disabled:opacity-50"><FaSignInAlt/>{authLoading ? "Cargando…" : "Iniciar sesión"}</button></form>
      {!authLoading && !error && <p className="mt-3 text-xs text-slate-500">Si aún no tienes una cuenta, debe crearla un administrador en Supabase Authentication.</p>}
    </section> : <section className="rounded-3xl bg-white p-5 shadow-lg md:p-6">
      <div className="flex flex-wrap items-center gap-3"><div className="min-w-[220px] flex-1"><label className="relative block"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar nombre, teléfono, municipio o premio" className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3"/></label></div>
      <label className="text-sm text-slate-600">Desde <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="ml-1 rounded-lg border border-slate-300 p-2"/></label><label className="text-sm text-slate-600">Hasta <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="ml-1 rounded-lg border border-slate-300 p-2"/></label>
      <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 font-semibold disabled:opacity-50"><FaSyncAlt/>{loading ? "Actualizando…" : "Actualizar"}</button><button onClick={exportCsv} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-xl bg-[#0096AE] px-3 py-2 font-semibold text-white disabled:opacity-50"><FaDownload/> Exportar CSV</button></div>
      <p className="mt-3 text-sm text-slate-500">Mostrando {rows.length} de {prospectos.length} registros.</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[1450px] w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{["Fecha","Nombre","Teléfono","Correo","Municipio","Vehículo","Seguro actual","Aseguradora","Vencimiento","Interés cotización","Evento","Premio","Contacto comercial"].map(c=><th key={c} className="whitespace-nowrap px-3 py-3 font-semibold">{c}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map(p=><tr key={p.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-3 py-3">{p.created_at ? new Date(p.created_at).toLocaleString("es-MX") : "—"}</td><td className="px-3 py-3 font-semibold">{p.nombre}</td><td className="px-3 py-3">{p.telefono}</td><td className="px-3 py-3">{p.correo || "—"}</td><td className="px-3 py-3">{p.municipio || "—"}</td><td className="px-3 py-3">{[p.marca,p.modelo,p.anio].filter(Boolean).join(" ") || "—"}</td><td className="px-3 py-3">{p.tiene_seguro || "—"}</td><td className="px-3 py-3">{p.aseguradora || "—"}</td><td className="px-3 py-3">{p.vencimiento || "—"}</td><td className="px-3 py-3">{p.interes_cotizacion || "—"}</td><td className="px-3 py-3">{p.evento || "—"}</td><td className="px-3 py-3 font-semibold text-[#941B80]">{p.premio}</td><td className="px-3 py-3">{p.acepta_contacto ? "Sí" : "No"}</td></tr>)}{!loading && !rows.length && <tr><td colSpan={13} className="px-3 py-8 text-center text-slate-500">No hay registros que coincidan con los filtros.</td></tr>}</tbody></table></div>
    </section>}
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{notice}</p>}
  </main>;
}
