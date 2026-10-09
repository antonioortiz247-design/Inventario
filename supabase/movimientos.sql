-- Inventario Quálitas: movimientos trazables y actualización atómica de existencias.
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- No modifica ni elimina los artículos existentes.

create table if not exists public.inventario_movimientos (
  id uuid primary key default gen_random_uuid(),
  articulo_id uuid not null references public.inventario_qualitas(id) on delete restrict,
  tipo text not null check (tipo in ('entrada', 'salida', 'ajuste')),
  cantidad integer not null check (cantidad > 0),
  existencia_anterior integer not null check (existencia_anterior >= 0),
  existencia_posterior integer not null check (existencia_posterior >= 0),
  motivo text not null,
  responsable text not null default '',
  observaciones text not null default '',
  creado_en timestamptz not null default now()
);

create index if not exists inventario_movimientos_articulo_idx
  on public.inventario_movimientos (articulo_id, creado_en desc);
create index if not exists inventario_movimientos_fecha_idx
  on public.inventario_movimientos (creado_en desc);

alter table public.inventario_movimientos enable row level security;

drop policy if exists "movimientos_select_public" on public.inventario_movimientos;
drop policy if exists "movimientos_insert_public" on public.inventario_movimientos;

create policy "movimientos_select_public"
  on public.inventario_movimientos for select to anon, authenticated using (true);
create policy "movimientos_insert_public"
  on public.inventario_movimientos for insert to anon, authenticated with check (true);

create or replace function public.registrar_movimiento(
  p_articulo_id uuid,
  p_tipo text,
  p_cantidad integer,
  p_motivo text,
  p_responsable text default '',
  p_observaciones text default ''
)
returns public.inventario_movimientos
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_actual integer;
  v_nuevo integer;
  v_movimiento public.inventario_movimientos;
begin
  if p_tipo not in ('entrada', 'salida', 'ajuste') then
    raise exception 'Tipo de movimiento no válido';
  end if;
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero';
  end if;
  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'El motivo es obligatorio';
  end if;

  select cantidad into v_actual
  from public.inventario_qualitas
  where id = p_articulo_id
  for update;

  if not found then
    raise exception 'No se encontró el artículo';
  end if;

  if p_tipo = 'entrada' then
    v_nuevo := v_actual + p_cantidad;
  elsif p_tipo = 'salida' then
    if p_cantidad > v_actual then
      raise exception 'La salida supera las existencias disponibles (%).', v_actual;
    end if;
    v_nuevo := v_actual - p_cantidad;
  else
    v_nuevo := p_cantidad;
  end if;

  update public.inventario_qualitas
  set cantidad = v_nuevo, fecha_actualizacion = now()
  where id = p_articulo_id;

  insert into public.inventario_movimientos (
    articulo_id, tipo, cantidad, existencia_anterior, existencia_posterior,
    motivo, responsable, observaciones
  ) values (
    p_articulo_id, p_tipo, p_cantidad, v_actual, v_nuevo,
    trim(p_motivo), coalesce(trim(p_responsable), ''), coalesce(trim(p_observaciones), '')
  ) returning * into v_movimiento;

  return v_movimiento;
end;
$$;
