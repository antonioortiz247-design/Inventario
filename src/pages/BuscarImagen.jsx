import { useEffect, useMemo, useRef, useState } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import { getItemById, getInventoryPhotoIds } from "../services/inventory.service";
import "@tensorflow/tfjs";

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function getEmbedding(model, src) {
  const image = await loadImage(src);
  const embedding = model.infer(image, true);
  const values = Array.from(await embedding.data());
  embedding.dispose();
  return values;
}

export default function BuscarImagen({ inventario = [] }) {
  const [model, setModel] = useState(null);
  const [preview, setPreview] = useState("");
  const [results, setResults] = useState([]);
  const [loadingModel, setLoadingModel] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [photoIds, setPhotoIds] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoProgress, setPhotoProgress] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;

    mobilenet
      .load({ version: 2, alpha: 1.0 })
      .then((loaded) => {
        if (active) setModel(loaded);
      })
      .catch(() => {
        if (active) setError("No fue posible cargar el modelo de búsqueda visual.");
      })
      .finally(() => {
        if (active) setLoadingModel(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getInventoryPhotoIds()
      .then((ids) => { if (active) setPhotoIds(ids); })
      .catch((loadError) => { if (active) setError(loadError.message || "No se pudieron consultar las fotografías."); })
      .finally(() => { if (active) setLoadingPhotos(false); });
    return () => { active = false; };
  }, []);

  const productosConFoto = useMemo(() => {
    const byId = new Map(inventario.map((item) => [String(item.id), item]));
    return photoIds.map((id) => byId.get(String(id))).filter(Boolean);
  }, [inventario, photoIds]);

  const buscar = async (file) => {
    if (!file || !model) return;

    setError("");
    setSearching(true);
    setResults([]);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const queryEmbedding = await getEmbedding(model, objectUrl);
      const matches = [];

      setPhotoProgress(0);
      for (let index = 0; index < photoIds.length; index++) {
        try {
          // La imagen completa se descarga solo al ejecutar la búsqueda.
          const item = await getItemById(photoIds[index]);
          if (item && item.foto) {
            const embedding = await getEmbedding(model, item.foto);
            const similarity = cosineSimilarity(queryEmbedding, embedding);
            matches.push({ ...item, similarity });
          }
        } catch {
          // Ignorar fotografías dañadas o incompatibles.
        } finally {
          setPhotoProgress(index + 1);
        }
      }

      matches.sort((a, b) => b.similarity - a.similarity);
      setResults(matches.slice(0, 8));
    } catch {
      setError("No se pudo analizar la imagen. Intenta con otra fotografía.");
    } finally {
      setSearching(false);
    }
  };

  const handleFile = (event) => {
    buscar(event.target.files?.[0]);
    event.target.value = "";
  };

  return (
    <main className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#941B80]">Buscar por imagen</h1>
            <p className="text-gray-600 mt-1">
              Sube una foto y encuentra los productos visualmente más parecidos.
            </p>
          </div>

          <label className="bg-[#941B80] hover:bg-[#692D80] text-white px-6 py-3 rounded-xl font-semibold cursor-pointer transition text-center">
            📷 Subir fotografía
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm">
          <span className={loadingModel ? "text-amber-600" : "text-emerald-600"}>
            {loadingModel ? "Preparando búsqueda visual..." : "Búsqueda visual lista"}
          </span>
          <span className="text-gray-400">
            {loadingPhotos ? "Consultando fotografías…" : `${photoIds.length} productos con fotografía`}
          </span>
        </div>

        {preview && (
          <div className="mt-6 flex flex-col md:flex-row gap-6 items-start">
            <div>
              <p className="font-semibold text-[#143B46] mb-2">Imagen consultada</p>
              <img
                src={preview}
                alt="Imagen para búsqueda"
                className="w-56 h-56 object-cover rounded-2xl border-4 border-[#0096AE]"
              />
            </div>

            <div className="flex-1">
              <p className="font-semibold text-[#143B46] mb-2">Resultados</p>

              {searching && (
                <div className="py-6 text-gray-500">
                  <p>Analizando fotografías: {photoProgress} de {photoIds.length}…</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-[#0096AE] transition-all" style={{ width: `${photoIds.length ? (photoProgress / photoIds.length) * 100 : 0}%` }} />
                  </div>
                </div>
              )}

              {!searching && results.length === 0 && (
                <p className="text-gray-500 py-6">
                  {loadingPhotos ? "Consultando artículos con fotografía…" : photoIds.length === 0 ? "No hay artículos con fotografía registrada." : "No hay coincidencias. Prueba con otra fotografía."}
                </p>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((item) => (
                  <div key={item.id} className="border rounded-2xl p-3 bg-slate-50">
                    <img
                      src={item.foto}
                      alt={item.articulo}
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <h3 className="font-bold mt-3 text-[#143B46]">{item.articulo}</h3>
                    <p className="text-sm text-gray-500">
                      {item.categoria || "Sin categoría"} · {item.cantidad ?? 0} piezas
                    </p>
                    <p className="text-sm text-[#941B80] font-semibold mt-1">
                      Coincidencia: {Math.round(item.similarity * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-700">
            {error}
          </div>
        )}

        {!preview && !loadingModel && (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center text-gray-500">
            Sube una fotografía del promocional que quieres localizar.
          </div>
        )}
      </div>
    </main>
  );
}
