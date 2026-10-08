import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addItem,
  deleteItem,
  getDashboardStats,
  getInventory,
  updateItem,
} from "../services/inventory.service";

export default function useInventory() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarInventario = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    cargarInventario();
  }, [cargarInventario]);

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
      setItems((prev) =>
        prev.map((item) => (item.id === id ? actualizado : item))
      );
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
  }, [items, search]);

  const estadisticas = useMemo(
    () => getDashboardStats(items),
    [items]
  );

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
