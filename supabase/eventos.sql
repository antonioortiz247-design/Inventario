-- Modo evento para Inventario Quálitas.
-- Ejecutar una vez en Supabase > SQL Editor. No modifica los artículos existentes.
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  fecha_evento date not null,
  ubicacion text not null default '',
  responsable text not null default '',
  estado text not null default 'borrador' check (estado in ('borrador','confirmado','en_curso','finalizado','cancelado')),
  notas text not null default '',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create table if not exists public.evento_materiales (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  articulo_id uuid not null references public.inventario_qualitas(id) on delete restrict,
  cantidad_reservada integer not null check (cantidad_reservada > 0),
  cantidad_entregada integer not null default 0 check (cantidad_entregada >= 0 and cantidad_entregada <= cantidad_reservada),
  creado_en timestamptz not null default now(),
  unique(evento_id, articulo_id)
);
create index if not exists eventos_fecha_idx on public.eventos(fecha_evento);
create index if not exists evento_materiales_evento_idx on public.evento_materiales(evento_id);
create index if not exists evento_materiales_articulo_idx on public.evento_materiales(articulo_id);
alter table public.eventos enable row level security;
alter table public.evento_materiales enable row level security;
drop policy if exists "eventos_select_public" on public.eventos;
drop policy if exists "eventos_insert_public" on public.eventos;
drop policy if exists "eventos_update_public" on public.eventos;
drop policy if exists "evento_materiales_select_public" on public.evento_materiales;
drop policy if exists "evento_materiales_insert_public" on public.evento_materiales;
drop policy if exists "evento_materiales_update_public" on public.evento_materiales;
drop policy if exists "evento_materiales_delete_public" on public.evento_materiales;
create policy "eventos_select_public" on public.eventos for select to anon, authenticated using (true);
create policy "eventos_insert_public" on public.eventos for insert to anon, authenticated with check (true);
create policy "eventos_update_public" on public.eventos for update to anon, authenticated using (true) with check (true);
create policy "evento_materiales_select_public" on public.evento_materiales for select to anon, authenticated using (true);
create policy "evento_materiales_insert_public" on public.evento_materiales for insert to anon, authenticated with check (true);
create policy "evento_materiales_update_public" on public.evento_materiales for update to anon, authenticated using (true) with check (true);
create policy "evento_materiales_delete_public" on public.evento_materiales for delete to anon, authenticated using (true);

create or replace function public.confirmar_evento(p_evento_id uuid)
returns public.eventos language plpgsql security invoker set search_path=public as $$
declare v_evento public.eventos; v_mat record; v_disponible integer; v_reservado integer;
begin
 select * into v_evento from public.eventos where id=p_evento_id for update;
 if not found then raise exception 'No se encontró el evento'; end if;
 if v_evento.estado <> 'borrador' then raise exception 'Solo se pueden confirmar eventos en borrador'; end if;
 if not exists(select 1 from public.evento_materiales where evento_id=p_evento_id) then raise exception 'Agrega al menos un material antes de confirmar'; end if;
 for v_mat in select em.articulo_id, em.cantidad_reservada, i.articulo, i.cantidad from public.evento_materiales em join public.inventario_qualitas i on i.id=em.articulo_id where em.evento_id=p_evento_id for update of i loop
   select coalesce(sum(em2.cantidad_reservada-em2.cantidad_entregada),0)::integer into v_reservado
   from public.evento_materiales em2 join public.eventos e2 on e2.id=em2.evento_id
   where em2.articulo_id=v_mat.articulo_id and e2.estado in ('confirmado','en_curso') and e2.id<>p_evento_id;
   v_disponible := v_mat.cantidad - v_reservado;
   if v_mat.cantidad_reservada > v_disponible then
     raise exception 'Stock insuficiente para "%". Físico: %, reservado en otros eventos: %, disponible para reservar: %, solicitado: %', v_mat.articulo, v_mat.cantidad, v_reservado, greatest(v_disponible,0), v_mat.cantidad_reservada;
   end if;
 end loop;
 update public.eventos set estado='confirmado', actualizado_en=now() where id=p_evento_id returning * into v_evento;
 return v_evento;
end; $$;

create or replace function public.cancelar_evento(p_evento_id uuid)
returns public.eventos language plpgsql security invoker set search_path=public as $$
declare v_evento public.eventos;
begin
 select * into v_evento from public.eventos where id=p_evento_id for update;
 if not found then raise exception 'No se encontró el evento'; end if;
 if v_evento.estado not in ('borrador','confirmado') then raise exception 'Solo se pueden cancelar eventos en borrador o confirmados'; end if;
 if exists(select 1 from public.evento_materiales where evento_id=p_evento_id and cantidad_entregada>0) then raise exception 'El evento ya tiene entregas; no se puede cancelar automáticamente'; end if;
 update public.eventos set estado='cancelado', actualizado_en=now() where id=p_evento_id returning * into v_evento;
 return v_evento;
end; $$;

create or replace function public.entregar_material_evento(p_evento_material_id uuid, p_cantidad integer, p_responsable text default '', p_observaciones text default '')
returns public.evento_materiales language plpgsql security invoker set search_path=public as $$
declare v_mat public.evento_materiales; v_evento public.eventos; v_mov public.inventario_movimientos;
begin
 if p_cantidad is null or p_cantidad<=0 then raise exception 'La cantidad a entregar debe ser mayor que cero'; end if;
 select * into v_mat from public.evento_materiales where id=p_evento_material_id for update;
 if not found then raise exception 'No se encontró el material reservado'; end if;
 select * into v_evento from public.eventos where id=v_mat.evento_id for update;
 if v_evento.estado not in ('confirmado','en_curso') then raise exception 'El evento debe estar confirmado para entregar materiales'; end if;
 if p_cantidad > v_mat.cantidad_reservada-v_mat.cantidad_entregada then raise exception 'La cantidad supera lo reservado pendiente de entrega (%)', v_mat.cantidad_reservada-v_mat.cantidad_entregada; end if;
 v_mov := public.registrar_movimiento(v_mat.articulo_id,'salida',p_cantidad,'Entrega para evento: '||v_evento.nombre,coalesce(trim(p_responsable),''),coalesce(trim(p_observaciones),''));
 update public.evento_materiales set cantidad_entregada=cantidad_entregada+p_cantidad where id=p_evento_material_id returning * into v_mat;
 if not exists(select 1 from public.evento_materiales where evento_id=v_evento.id and cantidad_entregada<cantidad_reservada) then
   update public.eventos set estado='finalizado', actualizado_en=now() where id=v_evento.id;
 else
   update public.eventos set estado='en_curso', actualizado_en=now() where id=v_evento.id and estado='confirmado';
 end if;
 return v_mat;
end; $$;

-- Editar datos generales del evento sin tocar existencias.
create or replace function public.actualizar_evento(
  p_evento_id uuid, p_nombre text, p_fecha_evento date, p_ubicacion text default '', p_responsable text default '', p_notas text default ''
) returns public.eventos language plpgsql security invoker set search_path=public as $$
declare v_evento public.eventos;
begin
 select * into v_evento from public.eventos where id=p_evento_id for update;
 if not found then raise exception 'No se encontró el evento'; end if;
 if v_evento.estado in ('finalizado','cancelado') then raise exception 'No se pueden editar eventos finalizados o cancelados'; end if;
 if coalesce(trim(p_nombre),'')='' then raise exception 'El nombre del evento es obligatorio'; end if;
 update public.eventos set nombre=trim(p_nombre), fecha_evento=p_fecha_evento,
   ubicacion=coalesce(trim(p_ubicacion),''), responsable=coalesce(trim(p_responsable),''),
   notas=coalesce(trim(p_notas),''), actualizado_en=now()
 where id=p_evento_id returning * into v_evento;
 return v_evento;
end; $$;

-- Marcar terminado no devuelve material ya entregado. Las cantidades no entregadas dejan de estar reservadas.
create or replace function public.finalizar_evento(p_evento_id uuid)
returns public.eventos language plpgsql security invoker set search_path=public as $$
declare v_evento public.eventos;
begin
 select * into v_evento from public.eventos where id=p_evento_id for update;
 if not found then raise exception 'No se encontró el evento'; end if;
 if v_evento.estado not in ('confirmado','en_curso') then raise exception 'Solo se pueden finalizar eventos confirmados o en curso'; end if;
 update public.eventos set estado='finalizado', actualizado_en=now() where id=p_evento_id returning * into v_evento;
 return v_evento;
end; $$;

-- Borrar evento revierte las entregas registradas mediante entradas trazables y libera las reservas pendientes.
create or replace function public.eliminar_evento(p_evento_id uuid)
returns public.eventos language plpgsql security invoker set search_path=public as $$
declare v_evento public.eventos; v_mat record;
begin
 select * into v_evento from public.eventos where id=p_evento_id for update;
 if not found then raise exception 'No se encontró el evento'; end if;
 for v_mat in
   select em.articulo_id, em.cantidad_entregada, i.articulo
   from public.evento_materiales em join public.inventario_qualitas i on i.id=em.articulo_id
   where em.evento_id=p_evento_id and em.cantidad_entregada>0
   for update of i
 loop
   perform public.registrar_movimiento(v_mat.articulo_id,'entrada',v_mat.cantidad_entregada,
     'Reversión por eliminación del evento: '||v_evento.nombre,'Sistema',
     'Se reintegran '||v_mat.cantidad_entregada||' unidad(es) del artículo '||v_mat.articulo||' al eliminar el evento.');
 end loop;
 delete from public.eventos where id=p_evento_id returning * into v_evento;
 return v_evento;
end; $$;
