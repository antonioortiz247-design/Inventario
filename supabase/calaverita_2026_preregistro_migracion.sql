-- Migración Calaverita Segura Quálitas 2026: prerregistro, asistencia y participaciones
alter table public.calaverita_2026_registros
  add column if not exists folio text,
  add column if not exists preregistrado boolean not null default false,
  add column if not exists fecha_preregistro timestamptz,
  add column if not exists participacion_preregistro_reservada integer not null default 0,
  add column if not exists asistencia_confirmada boolean not null default false,
  add column if not exists fecha_confirmacion timestamptz,
  add column if not exists participaciones_activas integer not null default 0,
  add column if not exists codigo_qr text,
  add column if not exists version_vehiculo text,
  add column if not exists codigo_postal text,
  add column if not exists uso_vehiculo text,
  add column if not exists cobertura_interes text,
  add column if not exists autoriza_contacto_cotizacion boolean not null default false;

create sequence if not exists public.calaverita_2026_folio_seq start 1;
create unique index if not exists calaverita_2026_folio_uidx on public.calaverita_2026_registros(folio) where folio is not null;

-- Compatibilidad para registros previos: conservan participaciones históricas, pero no se
-- consideran elegibles para la nueva rifa hasta confirmar asistencia.
update public.calaverita_2026_registros
set participaciones_activas = 0
where participaciones_activas is null;

create or replace function public.calaverita_2026_confirmar_asistencia(p_id uuid)
returns public.calaverita_2026_registros
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.calaverita_2026_registros;
  v_total integer;
begin
  if auth.uid() is null then
    raise exception 'Se requiere iniciar sesión como staff.';
  end if;

  select *
    into v_row
    from public.calaverita_2026_registros
   where id = p_id
   for update;

  if not found then
    raise exception 'Participante no encontrado';
  end if;

  if v_row.asistencia_confirmada then
    return v_row;
  end if;

  v_total := greatest(coalesce(v_row.participaciones_activas, 0), 1)
    + case when v_row.preregistrado and coalesce(v_row.participacion_preregistro_reservada, 0) > 0 then 1 else 0 end
    + case when v_row.tipo_cliente = 'CLIENTE_VIGENTE' then 1 when v_row.tipo_cliente = 'RENOVACION' then 2 else 0 end
    + case when coalesce(v_row.puntaje_reto, 0) >= 4 then 1 else 0 end;

  update public.calaverita_2026_registros
     set asistencia_confirmada = true,
         fecha_confirmacion = coalesce(v_row.fecha_confirmacion, now()),
         conductor_seguro_estado = case when v_row.conductor_seguro_estado = 'sin_iniciar' then 'en_espera' else v_row.conductor_seguro_estado end,
         participaciones_activas = v_total,
         participaciones = v_total
   where id = p_id
   returning * into v_row;

  return v_row;
end;
$$;
revoke all on function public.calaverita_2026_confirmar_asistencia(uuid) from public;
grant execute on function public.calaverita_2026_confirmar_asistencia(uuid) to authenticated;

drop function if exists public.calaverita_2026_preregistrar(text,text,text,text,text,text,text);
create function public.calaverita_2026_preregistrar(
  p_nombre text, p_telefono text, p_correo text, p_municipio text,
  p_tiene_seguro text, p_aseguradora text default null, p_vencimiento text default null,
  p_marca text default null, p_modelo text default null, p_anio integer default null,
  p_version text default null, p_codigo_postal text default null,
  p_uso_vehiculo text default null, p_cobertura_interes text default null,
  p_autoriza_contacto boolean default false
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
  if p_tiene_seguro not in ('Sí','No') then raise exception 'Selecciona si cuentas con seguro.'; end if;
  if coalesce(trim(p_marca),'') = '' then raise exception 'Selecciona la marca del vehículo.'; end if;
  if coalesce(trim(p_modelo),'') = '' then raise exception 'Escribe el modelo del vehículo.'; end if;
  if p_anio is null or p_anio < 1980 or p_anio > extract(year from now())::integer + 1 then raise exception 'Selecciona un año modelo válido.'; end if;
  if coalesce(trim(p_codigo_postal),'') !~ '^[0-9]{5}

  -- Serialize submissions for the same phone/email to prevent duplicate registrations.
  perform pg_advisory_xact_lock(hashtext('calaverita_preregistro:' || least(v_phone,v_email)));
  perform pg_advisory_xact_lock(hashtext('calaverita_preregistro:' || greatest(v_phone,v_email)));

  select * into v_row
  from public.calaverita_2026_registros r
  where r.preregistrado = true
    and (
      regexp_replace(coalesce(r.telefono,''),'[^0-9]','','g') = v_phone
      or lower(trim(coalesce(r.correo,''))) = v_email
    )
  order by r.fecha_preregistro desc nulls last
  limit 1;

  if found then
    return v_row;
  end if;

  perform pg_advisory_xact_lock(hashtext('calaverita_2026_folio_seq'));
  select coalesce(max(substring(folio from '[0-9]+$')::bigint),0)+1
    into v_next
    from public.calaverita_2026_registros
    where folio like 'ODQRR - %';
  perform setval('public.calaverita_2026_folio_seq',v_next,false);
  v_folio := 'ODQRR - ' || lpad(nextval('public.calaverita_2026_folio_seq')::text,4,'0');

  insert into public.calaverita_2026_registros(
    folio,preregistrado,fecha_preregistro,participacion_preregistro_reservada,
    asistencia_confirmada,participaciones_activas,codigo_qr,
    nombre,telefono,correo,municipio,marca,modelo,anio,tiene_seguro,aseguradora,vencimiento,
    version_vehiculo,codigo_postal,uso_vehiculo,cobertura_interes,autoriza_contacto_cotizacion,
    tipo_cliente,puntaje_reto,participaciones,interes_cotizacion,estatus_seguimiento
  ) values (
    v_folio,true,now(),1,false,0,v_folio,
    trim(p_nombre),trim(p_telefono),trim(p_correo),trim(p_municipio),trim(p_marca),trim(p_modelo),p_anio,
    p_tiene_seguro,nullif(p_aseguradora,''),nullif(p_vencimiento,''),
    nullif(trim(coalesce(p_version,'')),''),trim(p_codigo_postal),nullif(trim(coalesce(p_uso_vehiculo,'')),''),
    nullif(trim(coalesce(p_cobertura_interes,'')),''),coalesce(p_autoriza_contacto,false),
    case when p_tiene_seguro='Sí' and p_aseguradora='Quálitas' then 'CLIENTE_VIGENTE'
         when p_tiene_seguro='Sí' and p_vencimiento in ('Menos de 30 días','30 a 60 días','60 a 90 días') then 'RENOVACION'
         else 'PROSPECTO' end,
    0,1,null,'PRERREGISTRADO'
  ) returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.calaverita_2026_preregistrar(text,text,text,text,text,text,text,text,text,integer,text,text,text,text,boolean) from public;
grant execute on function public.calaverita_2026_preregistrar(text,text,text,text,text,text,text,text,text,integer,text,text,text,text,boolean) to anon, authenticated;


-- Seguimiento operativo de Conductor Seguro: estados e incentivo por completar.
alter table public.calaverita_2026_registros
  add column if not exists conductor_seguro_estado text not null default 'sin_iniciar',
  add column if not exists conductor_seguro_inicio timestamptz,
  add column if not exists conductor_seguro_completado timestamptz,
  add column if not exists conductor_seguro_bono_otorgado boolean not null default false;

create or replace function public.calaverita_2026_confirmar_asistencia(p_id uuid)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  update public.calaverita_2026_registros
  set asistencia_confirmada=true,
      fecha_confirmacion=coalesce(fecha_confirmacion,now()),
      conductor_seguro_estado=case when conductor_seguro_estado='sin_iniciar' then 'en_espera' else conductor_seguro_estado end,
      participaciones_activas=greatest(coalesce(participaciones_activas,0),1)
        + case when preregistrado and coalesce(participacion_preregistro_reservada,0)>0 then 1 else 0 end
        + case when tipo_cliente='CLIENTE_VIGENTE' then 1 when tipo_cliente='RENOVACION' then 2 else 0 end
        + case when coalesce(puntaje_reto,0)>=4 then 1 else 0 end,
      participaciones=greatest(coalesce(participaciones_activas,0),1)
        + case when preregistrado and coalesce(participacion_preregistro_reservada,0)>0 then 1 else 0 end
        + case when tipo_cliente='CLIENTE_VIGENTE' then 1 when tipo_cliente='RENOVACION' then 2 else 0 end
        + case when coalesce(puntaje_reto,0)>=4 then 1 else 0 end
  where id=p_id and asistencia_confirmada=false
  returning * into v_row;
  if not found then
    select * into v_row from public.calaverita_2026_registros where id=p_id;
    if not found then raise exception 'Participante no encontrado'; end if;
  end if;
  return v_row;
end;
$$;

create or replace function public.calaverita_2026_conductor_seguro_iniciar(p_id uuid)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  update public.calaverita_2026_registros
  set conductor_seguro_estado='en_actividad',
      conductor_seguro_inicio=coalesce(conductor_seguro_inicio,now())
  where id=p_id and asistencia_confirmada=true
    and conductor_seguro_estado in ('sin_iniciar','en_espera')
  returning * into v_row;
  if not found then raise exception 'Confirma la asistencia y verifica que el participante no haya iniciado ya la actividad.'; end if;
  return v_row;
end;
$$;

drop function if exists public.calaverita_2026_conductor_seguro_completar(uuid);
create or replace function public.calaverita_2026_conductor_seguro_completar(p_id uuid, p_puntaje integer)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  if p_puntaje < 0 or p_puntaje > 5 then raise exception 'El puntaje debe estar entre 0 y 5.'; end if;
  update public.calaverita_2026_registros
  set conductor_seguro_estado='completado',
      conductor_seguro_completado=now(),
      puntaje_reto=p_puntaje,
      conductor_seguro_bono_otorgado=(p_puntaje >= 4),
      participaciones_activas=coalesce(participaciones_activas,0)+case when p_puntaje >= 4 then 1 else 0 end,
      participaciones=coalesce(participaciones,0)+case when p_puntaje >= 4 then 1 else 0 end
  where id=p_id and asistencia_confirmada=true
    and conductor_seguro_estado='en_actividad'
  returning * into v_row;
  if not found then raise exception 'El participante debe estar confirmado y en actividad para registrar el resultado.'; end if;
  return v_row;
end;
$$;

revoke all on function public.calaverita_2026_conductor_seguro_iniciar(uuid) from public;
revoke all on function public.calaverita_2026_conductor_seguro_completar(uuid,integer) from public;
grant execute on function public.calaverita_2026_conductor_seguro_iniciar(uuid) to authenticated;
grant execute on function public.calaverita_2026_conductor_seguro_completar(uuid,integer) to authenticated;


-- Reconcile confirmed records so both counters match the raffle source of truth.
update public.calaverita_2026_registros
set participaciones = participaciones_activas
where asistencia_confirmada = true
  and coalesce(participaciones,0) <> coalesce(participaciones_activas,0);

notify pgrst, 'reload schema';
 then raise exception 'Escribe un código postal de cinco dígitos.'; end if;

  -- Serialize submissions for the same phone/email to prevent duplicate registrations.
  perform pg_advisory_xact_lock(hashtext('calaverita_preregistro:' || least(v_phone,v_email)));
  perform pg_advisory_xact_lock(hashtext('calaverita_preregistro:' || greatest(v_phone,v_email)));

  select * into v_row
  from public.calaverita_2026_registros r
  where r.preregistrado = true
    and (
      regexp_replace(coalesce(r.telefono,''),'[^0-9]','','g') = v_phone
      or lower(trim(coalesce(r.correo,''))) = v_email
    )
  order by r.fecha_preregistro desc nulls last
  limit 1;

  if found then
    return v_row;
  end if;

  perform pg_advisory_xact_lock(hashtext('calaverita_2026_folio_seq'));
  select coalesce(max(substring(folio from '[0-9]+$')::bigint),0)+1
    into v_next
    from public.calaverita_2026_registros
    where folio like 'ODQRR - %';
  perform setval('public.calaverita_2026_folio_seq',v_next,false);
  v_folio := 'ODQRR - ' || lpad(nextval('public.calaverita_2026_folio_seq')::text,4,'0');

  insert into public.calaverita_2026_registros(
    folio,preregistrado,fecha_preregistro,participacion_preregistro_reservada,
    asistencia_confirmada,participaciones_activas,codigo_qr,
    nombre,telefono,correo,municipio,marca,modelo,anio,tiene_seguro,aseguradora,vencimiento,
    tipo_cliente,puntaje_reto,participaciones,interes_cotizacion,estatus_seguimiento
  ) values (
    v_folio,true,now(),1,false,0,v_folio,
    trim(p_nombre),trim(p_telefono),trim(p_correo),trim(p_municipio),'','',extract(year from now())::integer,
    p_tiene_seguro,nullif(p_aseguradora,''),nullif(p_vencimiento,''),
    case when p_tiene_seguro='Sí' and p_aseguradora='Quálitas' then 'CLIENTE_VIGENTE'
         when p_tiene_seguro='Sí' and p_vencimiento in ('Menos de 30 días','30 a 60 días','60 a 90 días') then 'RENOVACION'
         else 'PROSPECTO' end,
    0,1,null,'PRERREGISTRADO'
  ) returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.calaverita_2026_preregistrar(text,text,text,text,text,text,text) from public;
grant execute on function public.calaverita_2026_preregistrar(text,text,text,text,text,text,text) to anon, authenticated;


-- Seguimiento operativo de Conductor Seguro: estados e incentivo por completar.
alter table public.calaverita_2026_registros
  add column if not exists conductor_seguro_estado text not null default 'sin_iniciar',
  add column if not exists conductor_seguro_inicio timestamptz,
  add column if not exists conductor_seguro_completado timestamptz,
  add column if not exists conductor_seguro_bono_otorgado boolean not null default false;

create or replace function public.calaverita_2026_confirmar_asistencia(p_id uuid)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  update public.calaverita_2026_registros
  set asistencia_confirmada=true,
      fecha_confirmacion=coalesce(fecha_confirmacion,now()),
      conductor_seguro_estado=case when conductor_seguro_estado='sin_iniciar' then 'en_espera' else conductor_seguro_estado end,
      participaciones_activas=greatest(coalesce(participaciones_activas,0),1)
        + case when preregistrado and coalesce(participacion_preregistro_reservada,0)>0 then 1 else 0 end
        + case when tipo_cliente='CLIENTE_VIGENTE' then 1 when tipo_cliente='RENOVACION' then 2 else 0 end
        + case when coalesce(puntaje_reto,0)>=4 then 1 else 0 end,
      participaciones=greatest(coalesce(participaciones_activas,0),1)
        + case when preregistrado and coalesce(participacion_preregistro_reservada,0)>0 then 1 else 0 end
        + case when tipo_cliente='CLIENTE_VIGENTE' then 1 when tipo_cliente='RENOVACION' then 2 else 0 end
        + case when coalesce(puntaje_reto,0)>=4 then 1 else 0 end
  where id=p_id and asistencia_confirmada=false
  returning * into v_row;
  if not found then
    select * into v_row from public.calaverita_2026_registros where id=p_id;
    if not found then raise exception 'Participante no encontrado'; end if;
  end if;
  return v_row;
end;
$$;

create or replace function public.calaverita_2026_conductor_seguro_iniciar(p_id uuid)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  update public.calaverita_2026_registros
  set conductor_seguro_estado='en_actividad',
      conductor_seguro_inicio=coalesce(conductor_seguro_inicio,now())
  where id=p_id and asistencia_confirmada=true
    and conductor_seguro_estado in ('sin_iniciar','en_espera')
  returning * into v_row;
  if not found then raise exception 'Confirma la asistencia y verifica que el participante no haya iniciado ya la actividad.'; end if;
  return v_row;
end;
$$;

drop function if exists public.calaverita_2026_conductor_seguro_completar(uuid);
create or replace function public.calaverita_2026_conductor_seguro_completar(p_id uuid, p_puntaje integer)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  if p_puntaje < 0 or p_puntaje > 5 then raise exception 'El puntaje debe estar entre 0 y 5.'; end if;
  update public.calaverita_2026_registros
  set conductor_seguro_estado='completado',
      conductor_seguro_completado=now(),
      puntaje_reto=p_puntaje,
      conductor_seguro_bono_otorgado=(p_puntaje >= 4),
      participaciones_activas=coalesce(participaciones_activas,0)+case when p_puntaje >= 4 then 1 else 0 end,
      participaciones=coalesce(participaciones,0)+case when p_puntaje >= 4 then 1 else 0 end
  where id=p_id and asistencia_confirmada=true
    and conductor_seguro_estado='en_actividad'
  returning * into v_row;
  if not found then raise exception 'El participante debe estar confirmado y en actividad para registrar el resultado.'; end if;
  return v_row;
end;
$$;

revoke all on function public.calaverita_2026_conductor_seguro_iniciar(uuid) from public;
revoke all on function public.calaverita_2026_conductor_seguro_completar(uuid,integer) from public;
grant execute on function public.calaverita_2026_conductor_seguro_iniciar(uuid) to authenticated;
grant execute on function public.calaverita_2026_conductor_seguro_completar(uuid,integer) to authenticated;


-- Reconcile confirmed records so both counters match the raffle source of truth.
update public.calaverita_2026_registros
set participaciones = participaciones_activas
where asistencia_confirmada = true
  and coalesce(participaciones,0) <> coalesce(participaciones_activas,0);

notify pgrst, 'reload schema';
 then raise exception 'Escribe un código postal de cinco dígitos.'; end if;

  -- Serialize submissions for the same phone/email to prevent duplicate registrations.
  perform pg_advisory_xact_lock(hashtext('calaverita_preregistro:' || least(v_phone,v_email)));
  perform pg_advisory_xact_lock(hashtext('calaverita_preregistro:' || greatest(v_phone,v_email)));

  select * into v_row
  from public.calaverita_2026_registros r
  where r.preregistrado = true
    and (
      regexp_replace(coalesce(r.telefono,''),'[^0-9]','','g') = v_phone
      or lower(trim(coalesce(r.correo,''))) = v_email
    )
  order by r.fecha_preregistro desc nulls last
  limit 1;

  if found then
    return v_row;
  end if;

  perform pg_advisory_xact_lock(hashtext('calaverita_2026_folio_seq'));
  select coalesce(max(substring(folio from '[0-9]+$')::bigint),0)+1
    into v_next
    from public.calaverita_2026_registros
    where folio like 'ODQRR - %';
  perform setval('public.calaverita_2026_folio_seq',v_next,false);
  v_folio := 'ODQRR - ' || lpad(nextval('public.calaverita_2026_folio_seq')::text,4,'0');

  insert into public.calaverita_2026_registros(
    folio,preregistrado,fecha_preregistro,participacion_preregistro_reservada,
    asistencia_confirmada,participaciones_activas,codigo_qr,
    nombre,telefono,correo,municipio,marca,modelo,anio,tiene_seguro,aseguradora,vencimiento,
    version_vehiculo,codigo_postal,uso_vehiculo,cobertura_interes,autoriza_contacto_cotizacion,
    tipo_cliente,puntaje_reto,participaciones,interes_cotizacion,estatus_seguimiento
  ) values (
    v_folio,true,now(),1,false,0,v_folio,
    trim(p_nombre),trim(p_telefono),trim(p_correo),trim(p_municipio),trim(p_marca),trim(p_modelo),p_anio,
    p_tiene_seguro,nullif(p_aseguradora,''),nullif(p_vencimiento,''),
    nullif(trim(coalesce(p_version,'')),''),trim(p_codigo_postal),nullif(trim(coalesce(p_uso_vehiculo,'')),''),
    nullif(trim(coalesce(p_cobertura_interes,'')),''),coalesce(p_autoriza_contacto,false),
    case when p_tiene_seguro='Sí' and p_aseguradora='Quálitas' then 'CLIENTE_VIGENTE'
         when p_tiene_seguro='Sí' and p_vencimiento in ('Menos de 30 días','30 a 60 días','60 a 90 días') then 'RENOVACION'
         else 'PROSPECTO' end,
    0,1,null,'PRERREGISTRADO'
  ) returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.calaverita_2026_preregistrar(text,text,text,text,text,text,text,text,text,integer,text,text,text,text,boolean) from public;
grant execute on function public.calaverita_2026_preregistrar(text,text,text,text,text,text,text,text,text,integer,text,text,text,text,boolean) to anon, authenticated;


-- Seguimiento operativo de Conductor Seguro: estados e incentivo por completar.
alter table public.calaverita_2026_registros
  add column if not exists conductor_seguro_estado text not null default 'sin_iniciar',
  add column if not exists conductor_seguro_inicio timestamptz,
  add column if not exists conductor_seguro_completado timestamptz,
  add column if not exists conductor_seguro_bono_otorgado boolean not null default false;

create or replace function public.calaverita_2026_confirmar_asistencia(p_id uuid)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  update public.calaverita_2026_registros
  set asistencia_confirmada=true,
      fecha_confirmacion=coalesce(fecha_confirmacion,now()),
      conductor_seguro_estado=case when conductor_seguro_estado='sin_iniciar' then 'en_espera' else conductor_seguro_estado end,
      participaciones_activas=greatest(coalesce(participaciones_activas,0),1)
        + case when preregistrado and coalesce(participacion_preregistro_reservada,0)>0 then 1 else 0 end
        + case when tipo_cliente='CLIENTE_VIGENTE' then 1 when tipo_cliente='RENOVACION' then 2 else 0 end
        + case when coalesce(puntaje_reto,0)>=4 then 1 else 0 end,
      participaciones=greatest(coalesce(participaciones_activas,0),1)
        + case when preregistrado and coalesce(participacion_preregistro_reservada,0)>0 then 1 else 0 end
        + case when tipo_cliente='CLIENTE_VIGENTE' then 1 when tipo_cliente='RENOVACION' then 2 else 0 end
        + case when coalesce(puntaje_reto,0)>=4 then 1 else 0 end
  where id=p_id and asistencia_confirmada=false
  returning * into v_row;
  if not found then
    select * into v_row from public.calaverita_2026_registros where id=p_id;
    if not found then raise exception 'Participante no encontrado'; end if;
  end if;
  return v_row;
end;
$$;

create or replace function public.calaverita_2026_conductor_seguro_iniciar(p_id uuid)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  update public.calaverita_2026_registros
  set conductor_seguro_estado='en_actividad',
      conductor_seguro_inicio=coalesce(conductor_seguro_inicio,now())
  where id=p_id and asistencia_confirmada=true
    and conductor_seguro_estado in ('sin_iniciar','en_espera')
  returning * into v_row;
  if not found then raise exception 'Confirma la asistencia y verifica que el participante no haya iniciado ya la actividad.'; end if;
  return v_row;
end;
$$;

drop function if exists public.calaverita_2026_conductor_seguro_completar(uuid);
create or replace function public.calaverita_2026_conductor_seguro_completar(p_id uuid, p_puntaje integer)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  if p_puntaje < 0 or p_puntaje > 5 then raise exception 'El puntaje debe estar entre 0 y 5.'; end if;
  update public.calaverita_2026_registros
  set conductor_seguro_estado='completado',
      conductor_seguro_completado=now(),
      puntaje_reto=p_puntaje,
      conductor_seguro_bono_otorgado=(p_puntaje >= 4),
      participaciones_activas=coalesce(participaciones_activas,0)+case when p_puntaje >= 4 then 1 else 0 end,
      participaciones=coalesce(participaciones,0)+case when p_puntaje >= 4 then 1 else 0 end
  where id=p_id and asistencia_confirmada=true
    and conductor_seguro_estado='en_actividad'
  returning * into v_row;
  if not found then raise exception 'El participante debe estar confirmado y en actividad para registrar el resultado.'; end if;
  return v_row;
end;
$$;

revoke all on function public.calaverita_2026_conductor_seguro_iniciar(uuid) from public;
revoke all on function public.calaverita_2026_conductor_seguro_completar(uuid,integer) from public;
grant execute on function public.calaverita_2026_conductor_seguro_iniciar(uuid) to authenticated;
grant execute on function public.calaverita_2026_conductor_seguro_completar(uuid,integer) to authenticated;


-- Reconcile confirmed records so both counters match the raffle source of truth.
update public.calaverita_2026_registros
set participaciones = participaciones_activas
where asistencia_confirmada = true
  and coalesce(participaciones,0) <> coalesce(participaciones_activas,0);

notify pgrst, 'reload schema';
 then raise exception 'Escribe un código postal de cinco dígitos.'; end if;

  -- Serialize submissions for the same phone/email to prevent duplicate registrations.
  perform pg_advisory_xact_lock(hashtext('calaverita_preregistro:' || least(v_phone,v_email)));
  perform pg_advisory_xact_lock(hashtext('calaverita_preregistro:' || greatest(v_phone,v_email)));

  select * into v_row
  from public.calaverita_2026_registros r
  where r.preregistrado = true
    and (
      regexp_replace(coalesce(r.telefono,''),'[^0-9]','','g') = v_phone
      or lower(trim(coalesce(r.correo,''))) = v_email
    )
  order by r.fecha_preregistro desc nulls last
  limit 1;

  if found then
    return v_row;
  end if;

  perform pg_advisory_xact_lock(hashtext('calaverita_2026_folio_seq'));
  select coalesce(max(substring(folio from '[0-9]+$')::bigint),0)+1
    into v_next
    from public.calaverita_2026_registros
    where folio like 'ODQRR - %';
  perform setval('public.calaverita_2026_folio_seq',v_next,false);
  v_folio := 'ODQRR - ' || lpad(nextval('public.calaverita_2026_folio_seq')::text,4,'0');

  insert into public.calaverita_2026_registros(
    folio,preregistrado,fecha_preregistro,participacion_preregistro_reservada,
    asistencia_confirmada,participaciones_activas,codigo_qr,
    nombre,telefono,correo,municipio,marca,modelo,anio,tiene_seguro,aseguradora,vencimiento,
    tipo_cliente,puntaje_reto,participaciones,interes_cotizacion,estatus_seguimiento
  ) values (
    v_folio,true,now(),1,false,0,v_folio,
    trim(p_nombre),trim(p_telefono),trim(p_correo),trim(p_municipio),'','',extract(year from now())::integer,
    p_tiene_seguro,nullif(p_aseguradora,''),nullif(p_vencimiento,''),
    case when p_tiene_seguro='Sí' and p_aseguradora='Quálitas' then 'CLIENTE_VIGENTE'
         when p_tiene_seguro='Sí' and p_vencimiento in ('Menos de 30 días','30 a 60 días','60 a 90 días') then 'RENOVACION'
         else 'PROSPECTO' end,
    0,1,null,'PRERREGISTRADO'
  ) returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.calaverita_2026_preregistrar(text,text,text,text,text,text,text) from public;
grant execute on function public.calaverita_2026_preregistrar(text,text,text,text,text,text,text) to anon, authenticated;


-- Seguimiento operativo de Conductor Seguro: estados e incentivo por completar.
alter table public.calaverita_2026_registros
  add column if not exists conductor_seguro_estado text not null default 'sin_iniciar',
  add column if not exists conductor_seguro_inicio timestamptz,
  add column if not exists conductor_seguro_completado timestamptz,
  add column if not exists conductor_seguro_bono_otorgado boolean not null default false;

create or replace function public.calaverita_2026_confirmar_asistencia(p_id uuid)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  update public.calaverita_2026_registros
  set asistencia_confirmada=true,
      fecha_confirmacion=coalesce(fecha_confirmacion,now()),
      conductor_seguro_estado=case when conductor_seguro_estado='sin_iniciar' then 'en_espera' else conductor_seguro_estado end,
      participaciones_activas=greatest(coalesce(participaciones_activas,0),1)
        + case when preregistrado and coalesce(participacion_preregistro_reservada,0)>0 then 1 else 0 end
        + case when tipo_cliente='CLIENTE_VIGENTE' then 1 when tipo_cliente='RENOVACION' then 2 else 0 end
        + case when coalesce(puntaje_reto,0)>=4 then 1 else 0 end,
      participaciones=greatest(coalesce(participaciones_activas,0),1)
        + case when preregistrado and coalesce(participacion_preregistro_reservada,0)>0 then 1 else 0 end
        + case when tipo_cliente='CLIENTE_VIGENTE' then 1 when tipo_cliente='RENOVACION' then 2 else 0 end
        + case when coalesce(puntaje_reto,0)>=4 then 1 else 0 end
  where id=p_id and asistencia_confirmada=false
  returning * into v_row;
  if not found then
    select * into v_row from public.calaverita_2026_registros where id=p_id;
    if not found then raise exception 'Participante no encontrado'; end if;
  end if;
  return v_row;
end;
$$;

create or replace function public.calaverita_2026_conductor_seguro_iniciar(p_id uuid)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  update public.calaverita_2026_registros
  set conductor_seguro_estado='en_actividad',
      conductor_seguro_inicio=coalesce(conductor_seguro_inicio,now())
  where id=p_id and asistencia_confirmada=true
    and conductor_seguro_estado in ('sin_iniciar','en_espera')
  returning * into v_row;
  if not found then raise exception 'Confirma la asistencia y verifica que el participante no haya iniciado ya la actividad.'; end if;
  return v_row;
end;
$$;

drop function if exists public.calaverita_2026_conductor_seguro_completar(uuid);
create or replace function public.calaverita_2026_conductor_seguro_completar(p_id uuid, p_puntaje integer)
returns public.calaverita_2026_registros
language plpgsql security definer set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if auth.uid() is null then raise exception 'Se requiere iniciar sesión como staff.'; end if;
  if p_puntaje < 0 or p_puntaje > 5 then raise exception 'El puntaje debe estar entre 0 y 5.'; end if;
  update public.calaverita_2026_registros
  set conductor_seguro_estado='completado',
      conductor_seguro_completado=now(),
      puntaje_reto=p_puntaje,
      conductor_seguro_bono_otorgado=(p_puntaje >= 4),
      participaciones_activas=coalesce(participaciones_activas,0)+case when p_puntaje >= 4 then 1 else 0 end,
      participaciones=coalesce(participaciones,0)+case when p_puntaje >= 4 then 1 else 0 end
  where id=p_id and asistencia_confirmada=true
    and conductor_seguro_estado='en_actividad'
  returning * into v_row;
  if not found then raise exception 'El participante debe estar confirmado y en actividad para registrar el resultado.'; end if;
  return v_row;
end;
$$;

revoke all on function public.calaverita_2026_conductor_seguro_iniciar(uuid) from public;
revoke all on function public.calaverita_2026_conductor_seguro_completar(uuid,integer) from public;
grant execute on function public.calaverita_2026_conductor_seguro_iniciar(uuid) to authenticated;
grant execute on function public.calaverita_2026_conductor_seguro_completar(uuid,integer) to authenticated;


-- Reconcile confirmed records so both counters match the raffle source of truth.
update public.calaverita_2026_registros
set participaciones = participaciones_activas
where asistencia_confirmada = true
  and coalesce(participaciones,0) <> coalesce(participaciones_activas,0);

notify pgrst, 'reload schema';
