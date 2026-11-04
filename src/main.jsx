import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Captura el evento de instalación antes de que React monte los componentes.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    window.__qualitasInstallPrompt = event;
    window.dispatchEvent(new Event("qualitas-install-available"));
  });
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(error => console.error("No se pudo registrar el service worker:", error));
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
