import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const validate = async (next) => {
      if (!active) return;
      setSession(next || null);
      setRole(null);
      if (!next?.user?.id) { setLoading(false); return; }
      const { data, error: roleError } = await supabase.from("app_user_roles").select("role").eq("user_id", next.user.id).maybeSingle();
      if (!active) return;
      if (roleError) setError("No se pudieron validar tus permisos: " + roleError.message);
      else if (data?.role === "admin" || data?.role === "staff") setRole(data.role);
      else setError("Tu cuenta no tiene permisos para acceder al Hub.");
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => validate(data?.session || null));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setLoading(true); setError(""); validate(next); });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const signIn = async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    setPassword("");
    if (data?.session?.user?.id) {
      const { data: r, error: e } = await supabase.from("app_user_roles").select("role").eq("user_id", data.session.user.id).maybeSingle();
      if (e) setError(e.message);
      else if (r?.role === "admin" || r?.role === "staff") setRole(r.role);
      else setError("La cuenta no tiene rol asignado.");
    }
    setLoading(false);
  };
  const signOut = async () => { await supabase.auth.signOut(); setSession(null); setRole(null); };
  if (loading) return <div className="auth-loading-screen grid min-h-screen place-items-center overflow-hidden px-5" role="status" aria-live="polite"><div className="auth-loading-card w-full max-w-sm rounded-3xl border border-white/70 bg-white/70 p-8 text-center shadow-2xl backdrop-blur-2xl"><div className="relative mx-auto mb-6 grid h-24 w-24 place-items-center"><span className="auth-loading-ring absolute inset-0 rounded-full border-[3px] border-[#941B80]/15 border-t-[#941B80] border-r-[#0096AE]"></span><span className="auth-loading-pulse absolute inset-3 rounded-full bg-gradient-to-br from-[#941B80]/10 to-[#0096AE]/15"></span><img src="/Q-morado.png" alt="" className="relative z-10 h-12 w-12 object-contain"/></div><p className="text-xs font-black uppercase tracking-[.22em] text-[#0096AE]">Quálitas Hub</p><h1 className="mt-2 text-xl font-extrabold text-slate-900">Validando acceso</h1><p className="mt-2 text-sm text-slate-500">Verificando tu sesión y permisos…</p><div className="mx-auto mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"><span className="auth-loading-progress block h-full w-2/5 rounded-full bg-gradient-to-r from-[#941B80] to-[#0096AE]"></span></div></div></div>;
  if (!supabaseConfigured) return <div className="p-8 text-red-700">Supabase no está configurado.</div>;
  if (!session || !role) return <div className="grid min-h-screen place-items-center bg-slate-100 p-5"><form onSubmit={signIn} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl"><h1 className="text-2xl font-black">Acceso al Hub Quálitas</h1><label className="mt-5 block text-sm font-semibold">Correo<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/></label><label className="mt-4 block text-sm font-semibold">Contraseña<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/></label>{error&&<p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button className="mt-5 w-full rounded-xl bg-[#941B80] p-3 font-bold text-white">Iniciar sesión</button></form></div>;
  return <>{children}<button onClick={signOut} className="fixed bottom-4 right-4 z-[60] rounded-full bg-white px-4 py-2 text-xs font-bold shadow">Cerrar sesión · {role}</button></>;
}
