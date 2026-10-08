import React, { useState, useEffect } from "react";

export default function App() {
  const [items, setItems] = useState([]);
  const [articulo, setArticulo] = useState("");
  const [cantidad, setCantidad] = useState("");

  useEffect(() => {
    const datos = localStorage.getItem("inventario");
    if (datos) {
      setItems(JSON.parse(datos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("inventario", JSON.stringify(items));
  }, [items]);

  const guardar = () => {
    if (!articulo || !cantidad) return;

    setItems([
      ...items,
      {
        articulo,
        cantidad,
      },
    ]);

    setArticulo("");
    setCantidad("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background:
          "linear-gradient(135deg,#941B80,#692D80,#0096AE)",
        color: "#fff",
      }}
    >
      <h1>Inventario Quálitas</h1>

      <div
        style={{
          background: "#fff",
          color: "#000",
          padding: 20,
          borderRadius: 12,
          marginTop: 20,
        }}
      >
        <input
          placeholder="Artículo"
          value={articulo}
          onChange={(e) => setArticulo(e.target.value)}
        />

        <input
          placeholder="Cantidad"
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          style={{ marginLeft: 10 }}
        />

        <button
          onClick={guardar}
          style={{
            marginLeft: 10,
            background: "#941B80",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 8,
          }}
        >
          Guardar
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              background: "#fff",
              color: "#000",
              marginBottom: 10,
              padding: 15,
              borderRadius: 10,
            }}
          >
            <b>{item.articulo}</b>
            <br />
            Cantidad: {item.cantidad}
          </div>
        ))}
      </div>
    </div>
  );
}
