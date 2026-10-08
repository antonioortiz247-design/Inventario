import { useEffect, useState } from "react";

const DB_NAME = "InventarioQualitasDB";
const DB_VERSION = 1;
const STORE_NAME = "inventario";

export default function useIndexedDB() {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      if (
        !database.objectStoreNames.contains(
          STORE_NAME
        )
      ) {
        database.createObjectStore(
          STORE_NAME,
          {
            keyPath: "id",
          }
        );
      }
    };

    request.onsuccess = (event) => {
      setDb(event.target.result);
      setLoading(false);
    };

    request.onerror = () => {
      console.error(
        "Error al abrir IndexedDB"
      );
      setLoading(false);
    };
  }, []);

  const getAll = () => {
    return new Promise((resolve, reject) => {
      if (!db) return resolve([]);

      const transaction =
        db.transaction(
          STORE_NAME,
          "readonly"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      const request = store.getAll();

      request.onsuccess = () =>
        resolve(request.result);

      request.onerror = () =>
        reject(request.error);
    });
  };

  const add = (data) => {
    return new Promise((resolve, reject) => {
      if (!db) return reject();

      const transaction =
        db.transaction(
          STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      const request = store.add(data);

      request.onsuccess = () =>
        resolve(data);

      request.onerror = () =>
        reject(request.error);
    });
  };

  const update = (data) => {
    return new Promise((resolve, reject) => {
      if (!db) return reject();

      const transaction =
        db.transaction(
          STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      const request = store.put(data);

      request.onsuccess = () =>
        resolve(data);

      request.onerror = () =>
        reject(request.error);
    });
  };

  const remove = (id) => {
    return new Promise((resolve, reject) => {
      if (!db) return reject();

      const transaction =
        db.transaction(
          STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      const request = store.delete(id);

      request.onsuccess = () =>
        resolve(true);

      request.onerror = () =>
        reject(request.error);
    });
  };

  const clear = () => {
    return new Promise((resolve, reject) => {
      if (!db) return reject();

      const transaction =
        db.transaction(
          STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      const request = store.clear();

      request.onsuccess = () =>
        resolve(true);

      request.onerror = () =>
        reject(request.error);
    });
  };

  return {
    db,
    loading,
    getAll,
    add,
    update,
    remove,
    clear,
  };
}
