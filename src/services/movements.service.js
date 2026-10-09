import { supabase, supabaseConfigured } from "../lib/supabase";

export async function listarMovimientos(limit = 100) {
  if (!supabaseConfigured) throw new Error("Los movimientos requieren conexión con Supabase.");
  const { data, error } = await supabase
    .from("inventario_movimientos")
    .select("id, articulo_id, tipo, cantidad, existencia_anterior, existencia_posterior, motivo, responsable, observaciones, creado_en, inventario_qualitas(articulo)")
    .order("creado_en", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`No se pudo consultar el historial: ${error.message}`);
  return (data || []).map((row) => ({ ...row, articulo: row.inventario_qualitas?.articulo || "Artículo eliminado" }));
}

export async function registrarMovimiento({ articuloId, tipo, cantidad, motivo, responsable, observaciones }) {
  if (!supabaseConfigured) throw new Error("Los movimientos requieren conexión con Supabase.");
  const { data, error } = await supabase.rpc("registrar_movimiento", {
    p_articulo_id: articuloId,
    p_tipo: tipo,
    p_cantidad: Number(cantidad),
    p_motivo: motivo.trim(),
    p_responsable: (responsable || "").trim(),
    p_observaciones: (observaciones || "").trim(),
  });
  if (error) throw new Error(error.message || "No se pudo registrar el movimiento.");
  return data;
}
