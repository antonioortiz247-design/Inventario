import { useEffect, useMemo, useState } from "react";

import {
  addItem,
  deleteItem,
  getDashboardStats,
  getInventory,
  searchItems,
  updateItem,
} from "../services/inventory.service";

export default function useInventory() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = () => {
    try {
      const data = getInventory();

      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const agregarArticulo = (item) => {
    const nuevo = addItem(item);

    setItems((prev) => [...prev, nuevo]);

    return nuevo;
  };

  const actualizarArticulo = (id, data) => {
    const actualizado = updateItem(id, data);

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? actualizado : item
      )
    );

    return actualizado;
  };

  const eliminarArticulo = (id) => {
    deleteItem(id);

    setItems((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  const resultados = useMemo(() => {
    if (!search.trim()) {
      return items;
    }

    return searchItems(search);
  }, [items, search]);

  const estadisticas = useMemo(() => {
    return getDashboardStats();
  }, [items]);

  return {
    loading,

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
