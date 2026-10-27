-- Ejecutar una sola vez en Supabase SQL Editor para habilitar el formulario con filtro de automóvil.
alter table public.calaverita_2026_registros
  add column if not exists version_vehiculo text,
  add column if not exists codigo_postal text,
  add column if not exists uso_vehiculo text,
  add column if not exists cobertura_interes text,
  add column if not exists autoriza_contacto_cotizacion boolean not null default false,
  add column if not exists tiene_auto boolean not null default true;

drop function if exists public.calaverita_2026_preregistrar(text,text,text,text,text,text,text);
drop function if exists public.calaverita_2026_preregistrar(text,text,text,text,text,text,text,text,text,integer,text,text,text,text,boolean);

create function public.calaverita_2026_preregistrar(
  p_nombre text, p_telefono text, p_correo text, p_municipio text,
  p_tiene_seguro text default null, p_aseguradora text default null, p_vencimiento text default null,
  p_marca text default null, p_modelo text default null, p_anio integer default null,
  p_version text default null, p_codigo_postal text default null,
  p_uso_vehiculo text default null, p_cobertura_interes text default null,
  p_autoriza_contacto boolean default false, p_tiene_auto boolean default true
) returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare
  v_row public.calaverita_2026_registros;
  v_folio text;
  v_next bigint;
  v_phone text := regexp_replace(coalesce(p_telefono,''),'[^0-9]','','g');
  v_email text := lower(trim(coalesce(p_correo,'')));
begin
  if length(trim(coalesce(p_nombre,'')))<2 then raise exception 'Escribe tu nombre completo.'; end if;
  if length(v_phone)<10 then raise exception 'Escribe un teléfono válido.'; end if;
  if position('@' in v_email)<2 then raise exception 'Escribe un correo válido.'; end if;
  if p_tiene_auto is null then raise exception 'Selecciona si tienes automóvil.'; end if;
  if p_tiene_auto and p_tiene_seguro not in ('Sí','No') then raise exception 'Selecciona si cuentas con seguro.'; end if;
  if p_tiene_auto and coalesce(trim(p_marca),'') = '' then raise exception 'Selecciona la marca del vehículo.'; end if;
  if p_tiene_auto and coalesce(trim(p_modelo),'') = '' then raise exception 'Escribe el modelo del vehículo.'; end if;
  if p_tiene_auto and (p_anio is null or p_anio < 1980 or p_anio > extract(year from now())::integer + 1) then raise exception 'Selecciona un año modelo válido.'; end if;
  if p_tiene_auto and coalesce(trim(p_codigo_postal),'') !~ '^[0-9]{5}$' then raise exception 'Escribe un código postal de cinco dígitos.'; end if;

  perform pg_advisory_xact_lock(hashtext('calaverita_preregistro:' || least(v_phone,v_email)));
  perform pg_advisory_xact_lock(hashtext('calaverita_preregistro:' || greatest(v_phone,v_email)));

  select * into v_row
  from public.calaverita_2026_registros r
  where regexp_replace(coalesce(r.telefono,''),'[^0-9]','','g') = v_phone
     or lower(trim(coalesce(r.correo,''))) = v_email
  order by r.fecha_preregistro desc nulls last
  limit 1;
  if found then return v_row; end if;

  perform pg_advisory_xact_lock(hashtext('calaverita_2026_folio_seq'));
    select coalesce(max(substring(folio from '[0-9]+$')::bigint),0)+1 into v_next
      from public.calaverita_2026_registros where folio like 'ODQRR - %';
    perform setval('public.calaverita_2026_folio_seq',v_next,false);
    v_folio := 'ODQRR - ' || lpad(nextval('public.calaverita_2026_folio_seq')::text,4,'0');


  insert into public.calaverita_2026_registros(
    folio,preregistrado,fecha_preregistro,participacion_preregistro_reservada,
    asistencia_confirmada,participaciones_activas,codigo_qr,
    nombre,telefono,correo,municipio,marca,modelo,anio,tiene_seguro,aseguradora,vencimiento,
    version_vehiculo,codigo_postal,uso_vehiculo,cobertura_interes,autoriza_contacto_cotizacion,
    tipo_cliente,puntaje_reto,participaciones,interes_cotizacion,estatus_seguimiento,tiene_auto
  ) values (
    v_folio,true,now(),case when p_tiene_auto then 1 else 0 end,false,0,case when p_tiene_auto then v_folio else null end,
    trim(p_nombre),trim(p_telefono),trim(p_correo),trim(p_municipio),
    nullif(trim(coalesce(p_marca,'')),''),nullif(trim(coalesce(p_modelo,'')),''),p_anio,
    nullif(p_tiene_seguro,''),nullif(p_aseguradora,''),nullif(p_vencimiento,''),
    nullif(trim(coalesce(p_version,'')),''),nullif(trim(coalesce(p_codigo_postal,'')),''),
    nullif(trim(coalesce(p_uso_vehiculo,'')),''),nullif(trim(coalesce(p_cobertura_interes,'')),''),coalesce(p_autoriza_contacto,false),
    case when p_tiene_auto and p_tiene_seguro='Sí' and p_aseguradora='Quálitas' then 'CLIENTE_VIGENTE'
         when p_tiene_auto and p_tiene_seguro='Sí' and p_vencimiento in ('Menos de 30 días','30 a 60 días','60 a 90 días') then 'RENOVACION'
         else 'PROSPECTO' end,
    0,1,null,
    case when p_tiene_auto then 'PRERREGISTRADO' else 'LEAD_SIN_AUTO' end,p_tiene_auto
  ) returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.calaverita_2026_preregistrar(text,text,text,text,text,text,text,text,text,integer,text,text,text,text,boolean,boolean) from public;
grant execute on function public.calaverita_2026_preregistrar(text,text,text,text,text,text,text,text,text,integer,text,text,text,text,boolean,boolean) to anon, authenticated;

create or replace function public.calaverita_2026_confirmar_asistencia(p_id uuid)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  select * into v_row from public.calaverita_2026_registros where id=p_id for update;
  if not found then raise exception 'Participante no encontrado'; end if;
  if v_row.asistencia_confirmada then return v_row; end if;
  update public.calaverita_2026_registros
  set asistencia_confirmada=true,
      fecha_confirmacion=coalesce(fecha_confirmacion,now()),
      conductor_seguro_estado=case when coalesce(tiene_auto,true) and conductor_seguro_estado='sin_iniciar' then 'en_espera' else conductor_seguro_estado end,
      participaciones_activas=case when coalesce(tiene_auto,true)=false then 0 else greatest(coalesce(participaciones_activas,0),1)
        + case when preregistrado and coalesce(participacion_preregistro_reservada,0)>0 then 1 else 0 end
        + case when tipo_cliente='CLIENTE_VIGENTE' then 1 when tipo_cliente='RENOVACION' then 2 else 0 end
        + case when coalesce(puntaje_reto,0)>=4 then 1 else 0 end end,
      participaciones=case when coalesce(tiene_auto,true)=false then greatest(coalesce(participaciones,1),1) else greatest(coalesce(participaciones_activas,0),1)
        + case when preregistrado and coalesce(participacion_preregistro_reservada,0)>0 then 1 else 0 end
        + case when tipo_cliente='CLIENTE_VIGENTE' then 1 when tipo_cliente='RENOVACION' then 2 else 0 end
        + case when coalesce(puntaje_reto,0)>=4 then 1 else 0 end end
  where id=p_id returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.calaverita_2026_confirmar_asistencia(uuid) from public;
grant execute on function public.calaverita_2026_confirmar_asistencia(uuid) to authenticated;

notify pgrst, 'reload schema';
