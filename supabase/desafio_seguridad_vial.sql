-- Desafío Digital de Seguridad Vial Quálitas
-- Ejecutar una sola vez en Supabase SQL Editor.
create sequence if not exists public.desafio_seguridad_vial_folio_seq start 1;

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
begin
  if length(trim(coalesce(p_nombre,''))) < 3 then raise exception 'Escribe tu nombre completo.'; end if;
  if p_telefono !~ '^[0-9]{10}$' then raise exception 'El teléfono debe contener 10 dígitos.'; end if;
  if p_correo !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$' then raise exception 'El correo electrónico no es válido.'; end if;
  if p_tiene_seguro not in ('Sí','No') then raise exception 'Selecciona si cuentas con seguro.'; end if;
  if p_aseguradora not in ('Quálitas','GNP','AXA','MAPFRE','HDI','Chubb','Otra','Sin seguro') then raise exception 'Selecciona una aseguradora válida.'; end if;
  if p_tiene_seguro = 'No' and p_aseguradora <> 'Sin seguro' then raise exception 'Si no cuentas con seguro, selecciona Sin seguro.'; end if;
  if p_anio < 1990 or p_anio > extract(year from now())::integer + 1 then raise exception 'El año del vehículo no es válido.'; end if;
  if p_pernocta not in ('Cochera','Calle','Estacionamiento') then raise exception 'Selecciona dónde pasa la noche el vehículo.'; end if;
  if p_uso not in ('Particular','Trabajo','Plataforma') then raise exception 'Selecciona el uso del vehículo.'; end if;
  if p_preocupacion not in ('Robo','Daños materiales','Accidentes','Responsabilidad civil') then raise exception 'Selecciona tu principal preocupación.'; end if;
  -- Cinco minijuegos otorgan hasta 500 puntos (100 por actividad).
  if p_puntaje < 0 or p_puntaje > 500 then raise exception 'La puntuación no es válida.'; end if;
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
