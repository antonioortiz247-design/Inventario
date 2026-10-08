const STORAGE_KEY = "inventario-qualitas";

export const getInventory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error al obtener inventario:", error);

    return [];
  }
};

export const saveInventory = (items) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items)
    );

    return true;
  } catch (error) {
    console.error("Error al guardar inventario:", error);

    return false;
  }
};

export const addItem = (item) => {
  const inventory = getInventory();

  const newItem = {
    id: crypto.randomUUID(),
    fechaCreacion: new Date().toISOString(),
    ...item,
  };

  inventory.push(newItem);

  saveInventory(inventory);

  return newItem;
};

export const updateItem = (id, updatedData) => {
  const inventory = getInventory();

  const updatedInventory = inventory.map((item) =>
    item.id === id
      ? {
          ...item,
          ...updatedData,
          fechaActualizacion:
            new Date().toISOString(),
        }
      : item
  );

  saveInventory(updatedInventory);

  return updatedInventory.find(
    (item) => item.id === id
  );
};

export const deleteItem = (id) => {
  const inventory = getInventory();

  const updatedInventory = inventory.filter(
    (item) => item.id !== id
  );

  saveInventory(updatedInventory);

  return updatedInventory;
};

export const getItemById = (id) => {
  const inventory = getInventory();

  return (
    inventory.find(
      (item) => item.id === id
    ) || null
  );
};

export const searchItems = (searchTerm = "") => {
  const inventory = getInventory();

  const term = searchTerm.toLowerCase();

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

export const getDashboardStats = () => {
  const inventory = getInventory();

  const totalArticulos = inventory.length;

  const piezasTotales = inventory.reduce(
    (total, item) =>
      total + Number(item.cantidad || 0),
    0
  );

  const stockBajo = inventory.filter(
    (item) =>
      Number(item.cantidad || 0) <=
      Number(item.stockMinimo || 10)
  ).length;

  const stockCritico = inventory.filter(
    (item) =>
      Number(item.cantidad || 0) <= 5
  ).length;

  return {
    totalArticulos,
    piezasTotales,
    stockBajo,
    stockCritico,
  };
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
