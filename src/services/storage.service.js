const DB_PREFIX = "qualitas";

export const saveData = (key, data) => {
  try {
    localStorage.setItem(
      `${DB_PREFIX}-${key}`,
      JSON.stringify(data)
    );

    return true;
  } catch (error) {
    console.error(
      `Error guardando ${key}:`,
      error
    );

    return false;
  }
};

export const getData = (key, defaultValue = null) => {
  try {
    const data = localStorage.getItem(
      `${DB_PREFIX}-${key}`
    );

    return data
      ? JSON.parse(data)
      : defaultValue;
  } catch (error) {
    console.error(
      `Error obteniendo ${key}:`,
      error
    );

    return defaultValue;
  }
};

export const removeData = (key) => {
  try {
    localStorage.removeItem(
      `${DB_PREFIX}-${key}`
    );

    return true;
  } catch (error) {
    console.error(
      `Error eliminando ${key}:`,
      error
    );

    return false;
  }
};

export const clearAllData = () => {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`${DB_PREFIX}-`)) {
        localStorage.removeItem(key);
      }
    });

    return true;
  } catch (error) {
    console.error(
      "Error limpiando almacenamiento:",
      error
    );

    return false;
  }
};

export const exportBackup = () => {
  try {
    const backup = {};

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`${DB_PREFIX}-`)) {
        backup[key] = JSON.parse(
          localStorage.getItem(key)
        );
      }
    });

    return backup;
  } catch (error) {
    console.error(
      "Error generando respaldo:",
      error
    );

    return null;
  }
};

export const importBackup = (backupData) => {
  try {
    Object.entries(backupData).forEach(
      ([key, value]) => {
        localStorage.setItem(
          key,
          JSON.stringify(value)
        );
      }
    );

    return true;
  } catch (error) {
    console.error(
      "Error restaurando respaldo:",
      error
    );

    return false;
  }
};

export default {
  saveData,
  getData,
  removeData,
  clearAllData,
  exportBackup,
  importBackup,
};
