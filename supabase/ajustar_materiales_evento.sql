-- Ajuste seguro de promocionales en borradores y eventos activos.
-- Ejecutar una sola vez en Supabase > SQL Editor.
create or replace function public.ajustar_material_evento(
  p_evento_id uuid,
  p_articulo_id uuid,
  p_cantidad_delta integer
) returns public.evento_materiales
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_evento public.eventos;
  v_material public.evento_materiales;
  v_articulo public.inventario_qualitas;
  v_reservado_otros integer := 0;
  v_pendiente_actual integer := 0;
  v_nueva_cantidad integer;
begin
  if p_cantidad_delta is null or p_cantidad_delta = 0 then
    raise exception 'Indica una cantidad distinta de cero.';
  end if;

  select * into v_evento from public.eventos where id = p_evento_id for update;
  if not found then raise exception 'No se encontró el evento.'; end if;
  if v_evento.estado not in ('borrador','confirmado','en_curso') then
    raise exception 'Solo se pueden modificar materiales de borradores o eventos activos.';
  end if;

  select * into v_articulo from public.inventario_qualitas where id = p_articulo_id for update;
  if not found then raise exception 'No se encontró el promocional en el inventario.'; end if;

  select * into v_material
  from public.evento_materiales
  where evento_id = p_evento_id and articulo_id = p_articulo_id
  for update;

  if p_cantidad_delta < 0 then
    if not found then raise exception 'Ese promocional no está agregado al evento.'; end if;
    v_nueva_cantidad := v_material.cantidad_reservada + p_cantidad_delta;
    if v_nueva_cantidad < v_material.cantidad_entregada then
      raise exception 'No puedes reducir la reserva por debajo de lo ya entregado (%).', v_material.cantidad_entregada;
    end if;
    if v_nueva_cantidad < 0 then raise exception 'La cantidad no puede ser negativa.'; end if;
    if v_nueva_cantidad = 0 then
      delete from public.evento_materiales where id = v_material.id returning * into v_material;
      return v_material;
    end if;
    update public.evento_materiales
      set cantidad_reservada = v_nueva_cantidad
      where id = v_material.id returning * into v_material;
    return v_material;
  end if;

  if v_evento.estado in ('confirmado','en_curso') then
    select coalesce(sum(em.cantidad_reservada - em.cantidad_entregada), 0)::integer
      into v_reservado_otros
    from public.evento_materiales em
    join public.eventos e on e.id = em.evento_id
    where em.articulo_id = p_articulo_id
      and e.estado in ('confirmado','en_curso')
      and e.id <> p_evento_id;

    v_pendiente_actual := case when v_material.id is not null then greatest(0, v_material.cantidad_reservada - v_material.cantidad_entregada) else 0 end;
    if p_cantidad_delta > v_articulo.cantidad - v_reservado_otros - v_pendiente_actual then
      raise exception 'Stock insuficiente para "%". Físico: %, reservado en otros eventos: %, disponible adicional: %.',
        v_articulo.articulo, v_articulo.cantidad, v_reservado_otros,
        greatest(0, v_articulo.cantidad - v_reservado_otros - v_pendiente_actual);
    end if;
  end if;

  if v_material.id is not null then
    update public.evento_materiales
      set cantidad_reservada = cantidad_reservada + p_cantidad_delta
      where id = v_material.id returning * into v_material;
  else
    insert into public.evento_materiales(evento_id, articulo_id, cantidad_reservada)
      values (p_evento_id, p_articulo_id, p_cantidad_delta)
      returning * into v_material;
  end if;

  update public.eventos set actualizado_en = now() where id = p_evento_id;
  return v_material;
end;
$$;

grant execute on function public.ajustar_material_evento(uuid, uuid, integer) to anon, authenticated;
