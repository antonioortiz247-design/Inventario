-- Desafío Digital de Seguridad Vial Quálitas
-- Ejecutar una sola vez en Supabase SQL Editor.
create sequence if not exists public.desafio_seguridad_vial_folio_seq start 1;

-- Configuración persistente del modo público: demo por defecto.
create table if not exists public.desafio_seguridad_vial_config (
  id integer primary key check (id = 1),
  competencia_activa boolean not null default false,
  actualizado_en timestamptz not null default now()
);
insert into public.desafio_seguridad_vial_config (id, competencia_activa)
values (1, false)
on conflict (id) do nothing;

alter table public.desafio_seguridad_vial_config enable row level security;
drop policy if exists "desafio_vial_config_public_read" on public.desafio_seguridad_vial_config;
create policy "desafio_vial_config_public_read"
  on public.desafio_seguridad_vial_config for select to anon, authenticated using (true);
revoke all on public.desafio_seguridad_vial_config from public, anon, authenticated;
grant select on public.desafio_seguridad_vial_config to anon, authenticated;

create or replace function public.configurar_modo_competencia(p_activo boolean)
returns public.desafio_seguridad_vial_config
language plpgsql
security definer
set search_path = public
as $
declare
  v_config public.desafio_seguridad_vial_config;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión como organizador para cambiar el modo.';
  end if;
  update public.desafio_seguridad_vial_config
    set competencia_activa = coalesce(p_activo, false),
        actualizado_en = now()
    where id = 1
    returning * into v_config;
  if not found then
    raise exception 'No existe la configuración del desafío.';
  end if;
  return v_config;
end;
$;
revoke all on function public.configurar_modo_competencia(boolean) from public, anon;
grant execute on function public.configurar_modo_competencia(boolean) to authenticated;

create table if not exists public.desafio_seguridad_vial (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  nombre text not null,
  telefono text not null,
  correo text not null,
  tiene_seguro text not null,
  aseguradora text not null,
  anio integer not null,
  pernocta text not null,
  uso text not null,
  preocupacion text not null,
  puntaje integer not null default 0,
  perfil text not null,
  solicita_cotizacion boolean not null default false,
  solicita_asesoria boolean not null default false,
  creado_en timestamptz not null default now()
);

create index if not exists desafio_seguridad_vial_creado_idx
  on public.desafio_seguridad_vial (creado_en desc);
create index if not exists desafio_seguridad_vial_folio_idx
  on public.desafio_seguridad_vial (folio);

alter table public.desafio_seguridad_vial enable row level security;
drop policy if exists "desafio_vial_admin_read" on public.desafio_seguridad_vial;
create policy "desafio_vial_admin_read"
  on public.desafio_seguridad_vial for select to authenticated using (true);
grant select on public.desafio_seguridad_vial to authenticated;
revoke all on public.desafio_seguridad_vial from anon;

create or replace function public.registrar_desafio_seguridad_vial(
  p_nombre text,
  p_telefono text,
  p_correo text,
  p_tiene_seguro text,
  p_aseguradora text,
  p_anio integer,
  p_pernocta text,
  p_uso text,
  p_preocupacion text,
  p_puntaje integer,
  p_perfil text,
  p_solicita_cotizacion boolean default false,
  p_solicita_asesoria boolean default false
) returns public.desafio_seguridad_vial
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.desafio_seguridad_vial;
  v_folio text;
  v_competencia_activa boolean;
begin
  -- Bloquea la fila de configuración durante el registro para evitar
  -- que una desactivación concurrente permita guardar una partida tardía.
  select competencia_activa into v_competencia_activa
    from public.desafio_seguridad_vial_config
    where id = 1
    for share;
  if coalesce(v_competencia_activa, false) is not true then
    raise exception 'La competencia está desactivada. Esta partida no puede registrarse.';
  end if;
  if length(trim(coalesce(p_nombre,''))) < 3 then raise exception 'Escribe tu nombre completo.'; end if;
  if p_telefono !~ '^[0-9]{10}$' then raise exception 'El teléfono debe contener 10 dígitos.'; end if;
  if p_correo !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then raise exception 'El correo electrónico no es válido.'; end if;
  if p_tiene_seguro not in ('Sí','No') then raise exception 'Selecciona si cuentas con seguro.'; end if;
  if p_aseguradora not in ('Quálitas','GNP','AXA','MAPFRE','HDI','Chubb','Otra','Sin seguro') then raise exception 'Selecciona una aseguradora válida.'; end if;
  if p_tiene_seguro = 'No' and p_aseguradora <> 'Sin seguro' then raise exception 'Si no cuentas con seguro, selecciona Sin seguro.'; end if;
  if p_anio < 1990 or p_anio > extract(year from now())::integer + 1 then raise exception 'El año del vehículo no es válido.'; end if;
  if p_pernocta not in ('Cochera','Calle','Estacionamiento') then raise exception 'Selecciona dónde pasa la noche el vehículo.'; end if;
  if p_uso not in ('Particular','Trabajo','Plataforma') then raise exception 'Selecciona el uso del vehículo.'; end if;
  if p_preocupacion not in ('Robo','Daños materiales','Accidentes','Responsabilidad civil') then raise exception 'Selecciona tu principal preocupación.'; end if;
  -- El puntaje del recorrido no tiene un tope fijo de 500 puntos.
  if p_puntaje is null or p_puntaje < 0 then raise exception 'La puntuación no es válida.'; end if;
  v_folio := 'QSV-' || lpad(nextval('public.desafio_seguridad_vial_folio_seq')::text, 4, '0');
  insert into public.desafio_seguridad_vial (
    folio,nombre,telefono,correo,tiene_seguro,aseguradora,anio,pernocta,uso,preocupacion,
    puntaje,perfil,solicita_cotizacion,solicita_asesoria
  ) values (
    v_folio,trim(p_nombre),p_telefono,lower(trim(p_correo)),p_tiene_seguro,p_aseguradora,p_anio,
    p_pernocta,p_uso,p_preocupacion,p_puntaje,p_perfil,coalesce(p_solicita_cotizacion,false),
    coalesce(p_solicita_asesoria,false)
  ) returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.registrar_desafio_seguridad_vial(text,text,text,text,text,integer,text,text,text,integer,text,boolean,boolean) from public;
grant execute on function public.registrar_desafio_seguridad_vial(text,text,text,text,text,integer,text,text,text,integer,text,boolean,boolean) to anon, authenticated;
grant usage, select on sequence public.desafio_seguridad_vial_folio_seq to postgres;
