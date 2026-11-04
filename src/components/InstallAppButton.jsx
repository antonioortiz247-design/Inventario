import { useEffect, useState } from "react";
import { FaDownload, FaShareSquare, FaPlusSquare } from "react-icons/fa";

export default function InstallAppButton({ compact = false }) {
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const ua = window.navigator.userAgent || "";
    setIos(/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setStandalone(isStandalone);
    const capture = (event) => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", () => { setStandalone(true); setInstallPrompt(null); });
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  const install = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } else setOpen(true);
  };

  if (standalone) return <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">App instalada</span>;

  return <>
    <button type="button" onClick={install} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#941B80] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#7d176d] focus:outline-none focus:ring-2 focus:ring-[#0096AE] ${compact ? "min-h-10" : "min-h-10"}`} aria-label="Instalar aplicación">
      <FaDownload />{compact ? <span>Instalar</span> : <span>Instalar app</span>}
    </button>
    {open && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-3 sm:items-center" onClick={() => setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="install-app-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#941B80]/10 text-xl text-[#941B80]"><FaDownload /></div><div><h2 id="install-app-title" className="text-lg font-black text-slate-900">Instalar Quálitas Hub</h2><p className="text-xs text-slate-500">Acceso directo desde la pantalla de inicio</p></div></div>
        {ios ? <ol className="space-y-4 text-sm text-slate-700">
          <li className="flex gap-3"><FaShareSquare className="mt-0.5 shrink-0 text-lg text-[#941B80]"/><span><strong>1. Abre el menú Compartir</strong><br/>En Safari, toca el icono de compartir en la parte inferior.</span></li>
          <li className="flex gap-3"><FaPlusSquare className="mt-0.5 shrink-0 text-lg text-[#941B80]"/><span><strong>2. Selecciona “Añadir a pantalla de inicio”</strong><br/>Si no aparece, desplázate hacia abajo en el menú.</span></li>
          <li className="flex gap-3"><FaDownload className="mt-0.5 shrink-0 text-lg text-[#941B80]"/><span><strong>3. Confirma con “Añadir”</strong><br/>El icono de Quálitas Hub quedará en tu pantalla de inicio.</span></li>
        </ol> : <div className="text-sm leading-6 text-slate-700">{installPrompt ? "Confirma la instalación en la ventana del navegador." : <>En el menú de tu navegador, selecciona <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</>}</div>}
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">En iPhone y iPad, la instalación se realiza desde Safari. Esta opción no instala la app directamente; te guía al menú oficial de iOS.</p>
        <button type="button" onClick={() => setOpen(false)} className="mt-5 w-full rounded-xl bg-[#941B80] px-4 py-3 text-sm font-bold text-white">Entendido</button>
      </section>
    </div>}
  </>;
}
