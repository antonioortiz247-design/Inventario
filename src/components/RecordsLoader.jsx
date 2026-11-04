export default function RecordsLoader({ label = "Cargando registros" }) {
  return <div role="status" aria-live="polite" className="flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-5 py-8">
    <div className="relative flex h-12 w-12 items-center justify-center"><span className="absolute inset-0 animate-spin rounded-full border-[3px] border-[#0096AE]/20 border-t-[#941B80]" /><span className="h-3 w-3 animate-pulse rounded-full bg-[#0096AE]" /></div>
    <span className="text-sm font-semibold text-slate-600">{label}…</span>
    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#941B80] to-[#0096AE]" /></div>
  </div>;
}