-- Calaverita Segura Quálitas 2026
-- Ejecutar en Supabase > SQL Editor antes de usar el evento.
create table if not exists public.calaverita_2026_registros (
  id uuid primary key default gen_random_uuid(),
  fecha_registro timestamptz not null default now(),
  nombre text not null,
  telefono text not null,
  correo text not null,
  municipio text not null,
  marca text not null,
  modelo text not null,
  anio integer not null,
  tiene_seguro text not null check (tiene_seguro in ('Sí','No')),
  aseguradora text,
  vencimiento text,
  tipo_cliente text not null check (tipo_cliente in ('CLIENTE_VIGENTE','RENOVACION','PROSPECTO')),
  puntaje_reto integer not null default 0 check (puntaje_reto between 0 and 5),
  participaciones integer not null default 1 check (participaciones between 1 and 5),
  interes_cotizacion text,
  estatus_seguimiento text not null default 'PENDIENTE'
);
alter table public.calaverita_2026_registros enable row level security;
grant insert on public.calaverita_2026_registros to anon, authenticated;
grant select, update on public.calaverita_2026_registros to authenticated;
drop policy if exists "calaverita_registro_publico_insert" on public.calaverita_2026_registros;
create policy "calaverita_registro_publico_insert" on public.calaverita_2026_registros for insert to anon, authenticated
with check (length(trim(nombre)) >= 2 and length(trim(telefono)) between 10 and 20 and length(trim(correo)) > 3);
drop policy if exists "calaverita_registros_personal_select" on public.calaverita_2026_registros;
create policy "calaverita_registros_personal_select" on public.calaverita_2026_registros for select to authenticated using (true);
drop policy if exists "calaverita_registros_personal_update" on public.calaverita_2026_registros;
create policy "calaverita_registros_personal_update" on public.calaverita_2026_registros for update to authenticated using (true) with check (true);

create or replace function public.calaverita_2026_finalizar_reto(p_id uuid, p_puntaje integer)
returns public.calaverita_2026_registros
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if p_puntaje < 0 or p_puntaje > 5 then raise exception 'Puntaje fuera de rango'; end if;
  update public.calaverita_2026_registros
  set puntaje_reto = p_puntaje,
      participaciones = 1
        + case when tipo_cliente = 'CLIENTE_VIGENTE' then 1 when tipo_cliente = 'RENOVACION' then 2 else 0 end
        + case when p_puntaje >= 4 then 1 else 0 end
  where id = p_id
  returning * into v_row;
  if not found then raise exception 'Registro no encontrado'; end if;
  return v_row;
end;
$$;
revoke all on function public.calaverita_2026_finalizar_reto(uuid, integer) from public;
grant execute on function public.calaverita_2026_finalizar_reto(uuid, integer) to anon, authenticated;

-- Nota de seguridad: el registro público puede insertar datos, pero sólo personal autenticado puede consultarlos.
