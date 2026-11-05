import { useCallback, useEffect, useMemo, useState } from "react";
import { FaShieldAlt, FaUsers, FaDatabase, FaSyncAlt, FaUserPlus, FaTrashAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { supabase, supabaseConfigured } from "../lib/supabase";

const roleLabel = { admin: "Administrador", staff: "Personal" };
const tables = [
  { key: "inventario_qualitas", label: "Inventario" },
  { key: "eventos", label: "Eventos" },
  { key: "ruleta_activaciones_prospectos", label: "Prospectos de ruleta" },
  { key: "calaverita_2026_registros", label: "Calaverita Segura" },
  { key: "app_user_roles", label: "Control de accesos" },
];
function Panel({ children, className = "" }) {
  return <section className={`rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg shadow-slate-200/40 backdrop-blur-xl md:p-6 ${className}`}>{children}</section>;
}

export default function Configuracion() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uuid, setUuid] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      if (!supabaseConfigured) throw new Error("Supabase no está configurado en este entorno.");
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth?.user) throw new Error("No se encontró una sesión activa.");
      setUser(auth.user);
      const { data: own, error: ownError } = await supabase.from("app_user_roles").select("role").eq("user_id", auth.user.id).maybeSingle();
      if (ownError) throw ownError;
      if (!["admin", "staff"].includes(own?.role)) throw new Error("Tu cuenta no tiene permisos para administrar el Hub.");
      setRole(own.role);
      const checks = await Promise.all(tables.map(async (table) => {
        const { count, error: queryError } = await supabase.from(table.key).select("*", { count: "exact", head: true });
        return { ...table, count: queryError ? null : count, error: queryError?.message || "" };
      }));
      setDiagnostics(checks);
      if (own.role === "admin") {
        const { data, error: listError } = await supabase.from("app_user_roles").select("user_id,role,created_at,updated_at").order("created_at", { ascending: true });
        if (listError) throw listError;
        setUsers(data || []);
      } else setUsers([]);
    } catch (e) { setError(e.message || "No se pudo cargar la configuración."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const adminCount = useMemo(() => users.filter((item) => item.role === "admin").length, [users]);

  const saveUserRole = async (event) => {
    event.preventDefault(); setError(""); setSuccess("");
    const id = uuid.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      setError("Escribe un UUID válido de una cuenta que ya exista en Supabase Auth."); return;
    }
    setSaving(true);
    try {
      const { error: saveError } = await supabase.from("app_user_roles").upsert({ user_id: id, role: newRole, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (saveError) throw saveError;
      setUuid(""); setSuccess("Permisos guardados correctamente."); await load();
    } catch (e) { setError(e.message || "No se pudieron guardar los permisos."); }
    finally { setSaving(false); }
  };

  const changeRole = async (entry, nextRole) => {
    if (entry.user_id === user?.id && nextRole !== "admin") { setError("No puedes retirar tu propio rol de administrador desde esta sesión."); return; }
    if (entry.role === "admin" && nextRole !== "admin" && adminCount <= 1) { setError("No puedes retirar el último acceso de administrador."); return; }
    setError(""); setSuccess(""); setSaving(true);
    try {
      const { error: updateError } = await supabase.from("app_user_roles").update({ role: nextRole, updated_at: new Date().toISOString() }).eq("user_id", entry.user_id);
      if (updateError) throw updateError;
      setSuccess("Rol actualizado."); await load();
    } catch (e) { setError(e.message || "No se pudo actualizar el rol."); }
    finally { setSaving(false); }
  };

  const removeUser = async (entry) => {
    if (entry.user_id === user?.id) { setError("No puedes retirar tu propio acceso desde esta sesión."); return; }
    if (entry.role === "admin" && adminCount <= 1) { setError("No puedes eliminar el último administrador."); return; }
    if (!window.confirm("¿Retirar el acceso de esta cuenta al Quálitas Hub? La cuenta de Supabase Auth no será eliminada.")) return;
    setError(""); setSuccess(""); setSaving(true);
    try {
      const { error: deleteError } = await supabase.from("app_user_roles").delete().eq("user_id", entry.user_id);
      if (deleteError) throw deleteError;
      setSuccess("Acceso retirado. La cuenta de autenticación permanece intacta."); await load();
    } catch (e) { setError(e.message || "No se pudo retirar el acceso."); }
    finally { setSaving(false); }
  };

  if (loading) return <main className="mx-auto max-w-6xl p-5 md:p-8"><Panel><div className="animate-pulse space-y-3"><div className="h-4 w-32 rounded bg-slate-200"/><div className="h-8 w-64 rounded bg-slate-200"/><div className="h-24 rounded-2xl bg-slate-100"/></div></Panel></main>;

  return <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-7">
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#941B80] via-[#71327F] to-[#0096AE] p-6 text-white shadow-xl md:p-8">
      <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/15 bg-white/10 blur-2xl"/>
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-white/70">Administración del sistema</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Configuración</h1><p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">Controla los accesos y consulta el estado de los módulos conectados. Las opciones visibles corresponden a funciones operativas reales.</p></div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/25 disabled:opacity-60"><FaSyncAlt/> Actualizar</button>
      </div>
      <div className="relative mt-6 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5">Cuenta: {user?.email || "Sesión activa"}</span><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5">Rol: {roleLabel[role] || "Sin rol"}</span><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5">Quálitas Hub</span></div>
    </header>

    {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><FaExclamationTriangle className="mt-0.5 shrink-0"/><span>{error}</span></div>}
    {success && <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><FaCheckCircle className="mt-0.5 shrink-0"/><span>{success}</span></div>}

    <div className="grid gap-4 sm:grid-cols-2">
      <Panel><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-fuchsia-100 text-xl text-[#941B80]"><FaShieldAlt/></span><div><p className="text-sm text-slate-500">Nivel de acceso</p><p className="text-xl font-bold text-slate-900">{roleLabel[role] || "No asignado"}</p></div></div><p className="mt-3 text-sm text-slate-500">{role === "admin" ? "Puedes administrar los permisos de las cuentas autorizadas." : "Puedes consultar el estado del sistema. La administración de accesos está reservada a administradores."}</p></Panel>
      <Panel><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-100 text-xl text-[#007D91]"><FaUsers/></span><div><p className="text-sm text-slate-500">Cuentas con acceso</p><p className="text-xl font-bold text-slate-900">{role === "admin" ? users.length : "Restringido"}</p></div></div><p className="mt-3 text-sm text-slate-500">{role === "admin" ? `${adminCount} administrador(es) · ${users.filter((item) => item.role === "staff").length} integrante(s) del personal` : "Solo los administradores pueden consultar la lista de accesos."}</p></Panel>
    </div>

    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#0096AE]">Conectividad y datos</p><h2 className="mt-1 text-xl font-bold text-slate-900">Estado de los módulos</h2><p className="mt-1 text-sm text-slate-500">Consulta de disponibilidad y número de registros almacenados.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"><FaDatabase className="mr-1 inline"/> Supabase</span></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{diagnostics.map((item) => <div key={item.key} className="rounded-2xl border border-slate-200 bg-white/70 p-4"><div className="flex items-center justify-between gap-2"><p className="font-semibold text-slate-800">{item.label}</p>{item.error ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">Sin lectura</span> : <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800">Conectado</span>}</div><p className="mt-2 text-2xl font-black tabular-nums text-[#941B80]">{item.count === null ? "—" : item.count.toLocaleString("es-MX")}</p><p className="mt-1 text-xs text-slate-500">{item.error ? "No fue posible consultar esta tabla con los permisos actuales." : "Registros disponibles"}</p></div>)}</div>
    </Panel>

    {role === "admin" && <Panel>
      <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-fuchsia-100 text-xl text-[#941B80]"><FaUsers/></span><div><p className="text-xs font-bold uppercase tracking-wider text-[#0096AE]">Administración de accesos</p><h2 className="mt-1 text-xl font-bold text-slate-900">Usuarios y permisos</h2><p className="mt-1 text-sm text-slate-500">Asigna un rol a una cuenta que ya exista en Supabase Auth. Aquí no se crean usuarios ni se modifican contraseñas.</p></div></div>
      <form onSubmit={saveUserRole} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[1fr_180px_auto]">
        <label className="text-sm font-semibold text-slate-700">UUID de la cuenta<input value={uuid} onChange={(e) => setUuid(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm outline-none focus:border-[#0096AE] focus:ring-2 focus:ring-cyan-100"/></label>
        <label className="text-sm font-semibold text-slate-700">Rol<select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3"><option value="staff">Personal</option><option value="admin">Administrador</option></select></label>
        <div className="flex items-end"><button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#941B80] to-[#0096AE] px-4 py-3 font-bold text-white shadow-md disabled:opacity-60"><FaUserPlus/> Asignar acceso</button></div>
      </form>
      <div className="mt-5 space-y-2">{users.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">No hay cuentas con rol asignado.</p> : users.map((entry) => <div key={entry.user_id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 md:flex-row md:items-center"><div className="min-w-0 flex-1"><p className="break-all font-mono text-xs text-slate-700">{entry.user_id}</p><div className="mt-1 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${entry.role === "admin" ? "bg-fuchsia-100 text-[#941B80]" : "bg-cyan-100 text-cyan-800"}`}>{roleLabel[entry.role] || entry.role}</span>{entry.user_id === user?.id && <span className="text-xs font-semibold text-slate-500">Tu cuenta</span>}<span className="text-xs text-slate-400">Alta: {entry.created_at ? new Date(entry.created_at).toLocaleDateString("es-MX") : "—"}</span></div></div><div className="flex flex-wrap items-center gap-2"><select aria-label={`Rol para ${entry.user_id}`} value={entry.role} disabled={saving || entry.user_id === user?.id} onChange={(e) => changeRole(entry, e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"><option value="staff">Personal</option><option value="admin">Administrador</option></select><button type="button" title="Retirar acceso" aria-label={`Retirar acceso a ${entry.user_id}`} disabled={saving || entry.user_id === user?.id || (entry.role === "admin" && adminCount <= 1)} onClick={() => removeUser(entry)} className="grid h-10 w-10 place-items-center rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-35"><FaTrashAlt/></button></div></div>)}</div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Retirar el rol bloquea el acceso al Hub, pero no elimina la cuenta de autenticación ni sus datos. No puedes retirar tu propio acceso ni dejar el sistema sin administrador.</p>
    </Panel>}
    <p className="px-1 text-xs text-slate-400">Quálitas Hub · Administración interna · Los permisos efectivos también dependen de las políticas RLS configuradas en Supabase.</p>
  </main>;
}
