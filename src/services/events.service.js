import { supabase, supabaseConfigured } from "../lib/supabase";

const requireSupabase = () => {
  if (!supabaseConfigured) throw new Error("El Modo evento requiere conexión con Supabase.");
};

export async function listarEventos() {
  requireSupabase();
  const { data, error } = await supabase.from("eventos").select("*").order("fecha_evento", { ascending: true }).order("creado_en", { ascending: false });
  if (error) throw new Error("No se pudieron cargar los eventos: " + error.message);
  return data || [];
}

export async function listarMaterialesEvento(eventoId) {
  requireSupabase();
  const { data, error } = await supabase.from("evento_materiales")
    .select("id, evento_id, articulo_id, cantidad_reservada, cantidad_entregada, inventario_qualitas(articulo, categoria, cantidad, ubicacion, stock_minimo)")
    .eq("evento_id", eventoId).order("creado_en", { ascending: true });
  if (error) throw new Error("No se pudieron cargar los materiales del evento: " + error.message);
  return (data || []).map((row) => ({ ...row, articulo: row.inventario_qualitas?.articulo || "Artículo no disponible", categoria: row.inventario_qualitas?.categoria || "", existencia: Number(row.inventario_qualitas?.cantidad || 0), ubicacion: row.inventario_qualitas?.ubicacion || "", stockMinimo: Number(row.inventario_qualitas?.stock_minimo ?? 10) }));
}

export async function crearEvento(evento) {
  requireSupabase();
  const payload = { nombre: evento.nombre.trim(), fecha_evento: evento.fecha_evento, ubicacion: (evento.ubicacion || "").trim(), responsable: (evento.responsable || "").trim(), notas: (evento.notas || "").trim(), estado: "borrador" };
  const { data, error } = await supabase.from("eventos").insert(payload).select("*").single();
  if (error) throw new Error("No se pudo crear el evento: " + error.message);
  return data;
}

export async function agregarMaterialEvento(eventoId, articuloId, cantidad) {
  requireSupabase();
  const { data: evento, error: eventError } = await supabase.from("eventos").select("estado").eq("id", eventoId).single();
  if (eventError) throw new Error(eventError.message);
  if (evento.estado !== "borrador") throw new Error("Solo puedes modificar materiales de un evento en borrador.");
  const { data: existing, error: existingError } = await supabase.from("evento_materiales").select("id, cantidad_reservada, cantidad_entregada").eq("evento_id", eventoId).eq("articulo_id", articuloId).maybeSingle();
  if (existingError) throw new Error(existingError.message);
  const qty = Number(cantidad);
  if (!Number.isInteger(qty) || qty <= 0) throw new Error("La cantidad debe ser un entero mayor que cero.");
  if (existing) {
    const { error } = await supabase.from("evento_materiales").update({ cantidad_reservada: Number(existing.cantidad_reservada) + qty }).eq("id", existing.id);
    if (error) throw new Error("No se pudo aumentar la cantidad reservada: " + error.message);
  } else {
    const { error } = await supabase.from("evento_materiales").insert({ evento_id: eventoId, articulo_id: articuloId, cantidad_reservada: qty });
    if (error) throw new Error("No se pudo agregar el material: " + error.message);
  }
}

export async function confirmarEvento(eventoId) {
  requireSupabase();
  const { data, error } = await supabase.rpc("confirmar_evento", { p_evento_id: eventoId });
  if (error) throw new Error(error.message);
  return data;
}
export async function cancelarEvento(eventoId) {
  requireSupabase();
  const { data, error } = await supabase.rpc("cancelar_evento", { p_evento_id: eventoId });
  if (error) throw new Error(error.message);
  return data;
}
export async function entregarMaterialEvento(materialId, cantidad, responsable, observaciones) {
  requireSupabase();
  const { data, error } = await supabase.rpc("entregar_material_evento", { p_evento_material_id: materialId, p_cantidad: Number(cantidad), p_responsable: responsable || "", p_observaciones: observaciones || "" });
  if (error) throw new Error(error.message);
  return data;
}
