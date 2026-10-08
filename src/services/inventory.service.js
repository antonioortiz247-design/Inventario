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
  id: item.id,
  articulo: item.articulo || "",
  categoria: item.categoria || "",
  cantidad: Number(item.cantidad || 0),
  ubicacion: item.ubicacion || "",
  observaciones: item.observaciones || "",
  foto: item.foto || "",
  stockMinimo: Number(item.stock_minimo ?? 10),
  fechaCreacion: item.fecha_creacion,
  fechaActualizacion: item.fecha_actualizacion,
});

const getLocal = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocal = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
};

export const getInventory = async () => {
  if (!supabaseConfigured) return getLocal();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("fecha_creacion", { ascending: false });

  if (error) throw new Error(`No se pudo cargar el inventario: ${error.message}`);

  // Migración inicial: si la base está vacía y este dispositivo ya tenía
  // inventario local, lo subimos automáticamente una sola vez.
  if ((!data || data.length === 0)) {
    const localItems = getLocal();

    if (localItems.length > 0) {
      const { error: migrationError } = await supabase
        .from(TABLE)
        .upsert(localItems.map(toDb), { onConflict: "id" });

      if (!migrationError) {
        return localItems;
      }
    }
  }

  return (data || []).map(fromDb);
};

export const saveInventory = async (items) => {
  if (!supabaseConfigured) return saveLocal(items);

  const rows = items.map(toDb);
  const { error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: "id" });

  if (error) throw new Error(`No se pudo sincronizar el inventario: ${error.message}`);

  return true;
};

export const addItem = async (item) => {
  const newItem = {
    id: item.id || crypto.randomUUID(),
    fechaCreacion: new Date().toISOString(),
    ...item,
  };

  if (!supabaseConfigured) {
    const inventory = getLocal();
    inventory.push(newItem);
    saveLocal(inventory);
    return newItem;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(toDb(newItem))
    .select()
    .single();

  if (error) throw new Error(`No se pudo guardar el artículo: ${error.message}`);

  return fromDb(data);
};

export const updateItem = async (id, updatedData) => {
  const payload = {
    ...updatedData,
    fechaActualizacion: new Date().toISOString(),
  };

  if (!supabaseConfigured) {
    const inventory = getLocal();
    const updated = inventory.map((item) =>
      item.id === id ? { ...item, ...payload } : item
    );
    saveLocal(updated);
    return updated.find((item) => item.id === id);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(toDb({ id, ...payload }))
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`No se pudo actualizar el artículo: ${error.message}`);

  return fromDb(data);
};

export const deleteItem = async (id) => {
  if (!supabaseConfigured) {
    const updated = getLocal().filter((item) => item.id !== id);
    saveLocal(updated);
    return updated;
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);

  if (error) throw new Error(`No se pudo eliminar el artículo: ${error.message}`);

  return getInventory();
};

export const getItemById = async (id) => {
  if (!supabaseConfigured) {
    return getLocal().find((item) => item.id === id) || null;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo obtener el artículo: ${error.message}`);

  return data ? fromDb(data) : null;
};

export const searchItems = async (searchTerm = "") => {
  const inventory = await getInventory();
  const term = searchTerm.toLowerCase().trim();

  if (!term) return inventory;

  return inventory.filter((item) =>
    [
      item.articulo,
      item.categoria,
      item.ubicacion,
      item.observaciones,
    ]
      .join(" ")
      .toLowerCase()
      .includes(term)
  );
};

export const getDashboardStats = (inventory = []) => {
  const totalArticulos = inventory.length;
  const piezasTotales = inventory.reduce(
    (total, item) => total + Number(item.cantidad || 0),
    0
  );

  const stockBajo = inventory.filter(
    (item) => Number(item.cantidad || 0) <= Number(item.stockMinimo || 10)
  ).length;

  const stockCritico = inventory.filter(
    (item) => Number(item.cantidad || 0) <= 5
  ).length;

  return { totalArticulos, piezasTotales, stockBajo, stockCritico };
};

export default {
  getInventory,
  saveInventory,
  addItem,
  updateItem,
  deleteItem,
  getItemById,
  searchItems,
  getDashboardStats,
};
