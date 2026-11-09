import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import {
  addItem,
  deleteItem,
  getDashboardStats,
  getInventory,
  updateItem,
} from "../services/inventory.service";

export default function useInventory({ enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  const cargarInventario = useCallback(async () => {
    if (!enabled) return [];
    setLoading(true);
    setError("");
    try {
      const data = await getInventory();
      setItems(data);
      return data;
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo cargar el inventario.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // No consultar tablas protegidas hasta confirmar que Supabase restauró
  // la sesión. Esto evita que la primera petición salga antes del login.
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    if (!supabaseConfigured) {
      setLoading(false);
      setError("Supabase no está configurado.");
      return undefined;
    }

    let active = true;
    let loadedUserId = null;
    let loadingUserId = null;

    const syncSession = async (session) => {
      if (!active) return;
      const userId = session?.user?.id || null;

      if (!userId) {
        loadedUserId = null;
        loadingUserId = null;
        setItems([]);
        setLoading(false);
        return;
      }

      if (loadedUserId === userId || loadingUserId === userId) return;
      loadingUserId = userId;
      setLoading(true);
      setError("");

      try {
        const data = await getInventory();
        if (!active) return;
        setItems(data);
        loadedUserId = userId;
      } catch (err) {
        if (!active) return;
        console.error(err);
        setError(err.message || "No se pudo cargar el inventario.");
      } finally {
        if (active && loadingUserId === userId) {
          loadingUserId = null;
          setLoading(false);
        }
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Diferir la consulta fuera del callback de auth para evitar bloquear
      // el ciclo interno de autenticación de Supabase.
      Promise.resolve().then(() => syncSession(session));
    });

    supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) {
          setError("No se pudo recuperar la sesión: " + sessionError.message);
          setLoading(false);
          return;
        }
        return syncSession(data?.session || null);
      })
      .catch((err) => {
        if (!active) return;
        setError("No se pudo verificar la sesión: " + (err?.message || "Error desconocido"));
        setLoading(false);
      });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [enabled]);

  const agregarArticulo = async (item) => {
    setError("");
    try {
      const nuevo = await addItem(item);
      setItems((prev) => [nuevo, ...prev]);
      return nuevo;
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo guardar el artículo.");
      throw err;
    }
  };

  const actualizarArticulo = async (id, data) => {
    setError("");
    try {
      const actualizado = await updateItem(id, data);
      setItems((prev) => prev.map((item) => (item.id === id ? actualizado : item)));
      return actualizado;
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo actualizar el artículo.");
      throw err;
    }
  };

  const eliminarArticulo = async (id) => {
    setError("");
    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo eliminar el artículo.");
      throw err;
    }
  };

  const resultados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.articulo, item.categoria, item.ubicacion, item.observaciones]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [items, search]);

  const estadisticas = useMemo(() => getDashboardStats(items), [items]);

  return {
    loading,
    error,
    items,
    resultados,
    search,
    setSearch,
    estadisticas,
    cargarInventario,
    agregarArticulo,
    actualizarArticulo,
    eliminarArticulo,
  };
}
