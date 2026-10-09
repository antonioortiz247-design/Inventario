import { supabase, supabaseConfigured } from "../lib/supabase";

const STORAGE_KEY = "inventario-qualitas";
const TABLE = "inventario_qualitas";

const toDb = (item) => ({
  id: item.id,
  articulo: item.articulo || "",
  categoria: item.categoria || "",
  cantidad: Number(item.cantidad || 0),
  ubicacion: item.ubicacion || "",
  observaciones: item.observaciones || "",
  foto: item.foto || "",
  stock_minimo: Number(item.stockMinimo ?? item.stock_minimo ?? 10),
  fecha_creacion: item.fechaCreacion || item.fecha_creacion || new Date().toISOString(),
  fecha_actualizacion: item.fechaActualizacion || item.fecha_actualizacion || null,
});

const fromDb = (item) => ({
  id: item.id, articulo: item.articulo || "", categoria: item.categoria || "",
  cantidad: Number(item.cantidad || 0), ubicacion: item.ubicacion || "",
  observaciones: item.observaciones || "", foto: item.foto || "",
  stockMinimo: Number(item.stock_minimo ?? 10),
  fechaCreacion: item.fecha_creacion, fechaActualizacion: item.fecha_actualizacion,
});

const getLocal = () => {
  try { const data = localStorage.getItem(STORAGE_KEY); return data ? JSON.parse(data) : []; }
  catch { return []; }
};

const saveLocal = (items) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); return true; }
  catch { return false; }
};

// La lista omite deliberadamente la columna foto: las imágenes Base64 son grandes
// y no deben descargarse cada vez que se abre el inventario.
export const getInventory = async () => {
  if (!supabaseConfigured) return getLocal();
  const pageSize = 100;
  const rows = [];
  let start = 0;
  while (true) {
    const { data, error } = await supabase.from(TABLE)
      .select("id, articulo, categoria, cantidad, ubicacion, observaciones, stock_minimo, fecha_creacion, fecha_actualizacion")
      .range(start, start + pageSize - 1);
    if (error) throw new Error(`No se pudo cargar el inventario desde Supabase: ${error.message}. No se han borrado ni reemplazado registros.`);
    const batch = data || [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    start += pageSize;
  }
  if (rows.length === 0) {
    const localItems = getLocal();
    if (localItems.length > 0) {
      const { error } = await supabase.from(TABLE).upsert(localItems.map(toDb), { onConflict: "id" });
      if (!error) return localItems;
    }
  }
  return rows.map(fromDb);
};

export const saveInventory = async (items) => {
  if (!supabaseConfigured) return saveLocal(items);
  const { error } = await supabase.from(TABLE).upsert(items.map(toDb), { onConflict: "id" });
  if (error) throw new Error(`No se pudo sincronizar el inventario: ${error.message}`);
  return true;
};

export const addItem = async (item) => {
  const newItem = { id: item.id || crypto.randomUUID(), fechaCreacion: new Date().toISOString(), ...item };
  if (!supabaseConfigured) { const inventory = getLocal(); inventory.push(newItem); saveLocal(inventory); return newItem; }
  const { data, error } = await supabase.from(TABLE).insert(toDb(newItem)).select("id, articulo, categoria, cantidad, ubicacion, observaciones, stock_minimo, fecha_creacion, fecha_actualizacion").single();
  if (error) throw new Error(`No se pudo guardar el artículo: ${error.message}`);
  return fromDb(data);
};

export const updateItem = async (id, updatedData) => {
  const payload = { ...updatedData, fechaActualizacion: new Date().toISOString() };
  if (!supabaseConfigured) { const inventory = getLocal(); const updated = inventory.map((item) => item.id === id ? { ...item, ...payload } : item); saveLocal(updated); return updated.find((item) => item.id === id); }
  // Si la edición no incluye foto, no se envía la columna foto y se conserva la imagen existente.
  const dbPayload = toDb({ id, ...payload });
  if (updatedData.foto === undefined) delete dbPayload.foto;
  const { data, error } = await supabase.from(TABLE).update(dbPayload).eq("id", id).select("id, articulo, categoria, cantidad, ubicacion, observaciones, stock_minimo, fecha_creacion, fecha_actualizacion").single();
  if (error) throw new Error(`No se pudo actualizar el artículo: ${error.message}`);
  return { ...fromDb(data), ...(updatedData.foto !== undefined ? { foto: updatedData.foto } : {}) };
};

export const deleteItem = async (id) => {
  if (!supabaseConfigured) { const updated = getLocal().filter((item) => item.id !== id); saveLocal(updated); return updated; }
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(`No se pudo eliminar el artículo: ${error.message}`);
  return getInventory();
};

// Se recupera la foto completa solo al abrir un artículo para editarlo.
export const getItemById = async (id) => {
  if (!supabaseConfigured) return getLocal().find((item) => item.id === id) || null;
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo obtener el artículo: ${error.message}`);
  return data ? fromDb(data) : null;
};


// Consulta únicamente IDs; no descarga imágenes Base64 de gran tamaño.
export const getInventoryPhotoIds = async () => {
  if (!supabaseConfigured) {
    return getLocal().filter((item) => typeof item.foto === "string" && item.foto.length > 0).map(({ id }) => id);
  }
  const { data, error } = await supabase.from(TABLE).select("id").not("foto", "is", null).neq("foto", "");
  if (error) throw new Error("No se pudo consultar qué artículos tienen fotografía: " + error.message);
  return (data || []).map(({ id }) => id);
};

export const searchItems = async (searchTerm = "") => {
  const inventory = await getInventory(); const term = searchTerm.toLowerCase().trim();
  if (!term) return inventory;
  return inventory.filter((item) => [item.articulo, item.categoria, item.ubicacion, item.observaciones].join(" ").toLowerCase().includes(term));
};

export const getDashboardStats = (inventory = []) => ({
  totalArticulos: inventory.length,
  piezasTotales: inventory.reduce((total, item) => total + Number(item.cantidad || 0), 0),
  stockBajo: inventory.filter((item) => Number(item.cantidad || 0) <= Number(item.stockMinimo || 10)).length,
  stockCritico: inventory.filter((item) => Number(item.cantidad || 0) <= 5).length,
});

export default { getInventory, saveInventory, addItem, updateItem, deleteItem, getItemById, getInventoryPhotoIds, searchItems, getDashboardStats };
