import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaDownload, FaShareSquare, FaPlusSquare, FaEllipsisVertical, FaCheckCircle } from "react-icons/fa";

export default function InstallAppButton({ compact = false }) {
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [browserName, setBrowserName] = useState("tu navegador");
  const [installPrompt, setInstallPrompt] = useState(() => window.__qualitasInstallPrompt || null);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState("");

  useEffect(() => {
    const ua = window.navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIos(isIOS);
    setDesktop(!/Android|iPhone|iPad|iPod/i.test(ua));
    setBrowserName(/Edg\//.test(ua) ? "Microsoft Edge" : /Chrome\//.test(ua) ? "Google Chrome" : /Safari\//.test(ua) && !/Chrome\//.test(ua) ? "Safari" : "tu navegador");

    const checkStandalone = () => {
      const installed = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
      setStandalone(installed);
    };
    const syncInstallPrompt = () => setInstallPrompt(window.__qualitasInstallPrompt || null);
    const onInstalled = () => {
      setStandalone(true);
      setInstallPrompt(null);
      window.__qualitasInstallPrompt = null;
      setOpen(false);
    };
    checkStandalone();
    const media = window.matchMedia("(display-mode: standalone)");
    media.addEventListener?.("change", checkStandalone);
    window.addEventListener("qualitas-install-available", syncInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    syncInstallPrompt();
    return () => {
      media.removeEventListener?.("change", checkStandalone);
      window.removeEventListener("qualitas-install-available", syncInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    const promptEvent = installPrompt || window.__qualitasInstallPrompt;
    setInstallError("");
    if (promptEvent) {
      setInstalling(true);
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        window.__qualitasInstallPrompt = null;
        setInstallPrompt(null);
        if (choice?.outcome === "accepted") {
          setOpen(false);
          setStandalone(true);
        } else {
          setInstallError("La instalación se canceló. Puedes volver a intentarlo desde el menú del navegador.");
          setOpen(true);
        }
      } catch (error) {
        console.error("No se pudo abrir el diálogo nativo de instalación:", error);
        setInstallError("El navegador no permitió abrir la instalación automática. Sigue los pasos de instalación manual.");
        setOpen(true);
      } finally {
        setInstalling(false);
      }
      return;
    }
    setOpen(true);
  };

  if (standalone) return <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><FaCheckCircle /> App instalada</span>;

  return <>
    <button type="button" onClick={install} disabled={installing} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#941B80] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#7d176d] focus:outline-none focus:ring-2 focus:ring-[#0096AE] disabled:cursor-wait disabled:opacity-70 ${compact ? "min-h-10" : "min-h-10"}`} aria-label="Instalar aplicación">
      <FaDownload />{installing ? <span>Abriendo instalación…</span> : compact ? <span>Instalar</span> : <span>Instalar app</span>}
    </button>
    {open && createPortal(<div className="install-app-overlay fixed inset-0 z-[99999] flex items-end justify-center bg-slate-950/70 p-3 sm:items-center" onClick={() => setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="install-app-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#941B80]/10 text-xl text-[#941B80]"><FaDownload /></div><div><h2 id="install-app-title" className="text-lg font-black text-slate-900">Instalar Quálitas Hub</h2><p className="text-xs text-slate-500">Añade la aplicación a tu dispositivo</p></div></div>
        {installError && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">{installError}</p>}
        {ios ? <ol className="space-y-4 text-sm text-slate-700">
          <li className="flex gap-3"><FaShareSquare className="mt-0.5 shrink-0 text-lg text-[#941B80]"/><span><strong>1. Toca Compartir</strong><br/>En Safari, pulsa el icono de compartir.</span></li>
          <li className="flex gap-3"><FaPlusSquare className="mt-0.5 shrink-0 text-lg text-[#941B80]"/><span><strong>2. Añadir a pantalla de inicio</strong><br/>Desplázate en el menú hasta encontrar esta opción.</span></li>
          <li className="flex gap-3"><FaCheckCircle className="mt-0.5 shrink-0 text-lg text-[#0096AE]"/><span><strong>3. Confirma con Añadir</strong><br/>Quálitas Hub aparecerá entre tus aplicaciones.</span></li>
        </ol> : <div className="space-y-3 text-sm leading-6 text-slate-700">
          <p>{desktop ? `En ${browserName}, abre el menú del navegador (⋮ o ⋯) en la esquina superior derecha.` : "Abre el menú de tu navegador (⋮) en la esquina superior derecha."}</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Selecciona <strong>Instalar aplicación</strong>, <strong>Instalar Quálitas Hub</strong> o <strong>Añadir a pantalla de inicio</strong>.</li>
            <li>Confirma pulsando <strong>Instalar</strong> o <strong>Añadir</strong>.</li>
            <li>Abre Quálitas Hub desde el icono que se agregará a tu dispositivo.</li>
          </ol>
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><FaEllipsisVertical className="mt-0.5 shrink-0 text-[#941B80]"/>Si no aparece la opción, actualiza Chrome o Edge y vuelve a abrir esta página con ese navegador. La instalación automática solo está disponible cuando el navegador confirma que el sitio cumple sus requisitos de PWA.</div>
        </div>}
        <button type="button" onClick={() => setOpen(false)} className="mt-5 w-full rounded-xl bg-[#941B80] px-4 py-3 text-sm font-bold text-white">Cerrar</button>
      </section>
    </div>, document.body)}
  </>;
}
