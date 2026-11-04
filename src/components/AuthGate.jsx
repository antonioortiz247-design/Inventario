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
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-100">Validando acceso…</div>;
  if (!supabaseConfigured) return <div className="p-8 text-red-700">Supabase no está configurado.</div>;
  if (!session || !role) return <div className="grid min-h-screen place-items-center bg-slate-100 p-5"><form onSubmit={signIn} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl"><h1 className="text-2xl font-black">Acceso al Hub Quálitas</h1><label className="mt-5 block text-sm font-semibold">Correo<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/></label><label className="mt-4 block text-sm font-semibold">Contraseña<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/></label>{error&&<p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button className="mt-5 w-full rounded-xl bg-[#941B80] p-3 font-bold text-white">Iniciar sesión</button></form></div>;
  return <>{children}<button onClick={signOut} className="fixed bottom-4 right-4 z-[60] rounded-full bg-white px-4 py-2 text-xs font-bold shadow">Cerrar sesión · {role}</button></>;
}
