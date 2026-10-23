-- Ajuste seguro para Calaverita Segura 2026.
-- Ejecutar después del SQL inicial. Evita dar permiso SELECT público a los datos personales.
create or replace function public.calaverita_2026_registrar(
  p_nombre text, p_telefono text, p_correo text, p_municipio text,
  p_marca text, p_modelo text, p_anio integer, p_tiene_seguro text,
  p_aseguradora text, p_vencimiento text, p_tipo_cliente text,
  p_interes_cotizacion text, p_participaciones integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.calaverita_2026_registros;
begin
  if length(trim(coalesce(p_nombre,''))) < 2 then raise exception 'Nombre no válido'; end if;
  if length(regexp_replace(coalesce(p_telefono,''), '\D', '', 'g')) < 10 then raise exception 'Teléfono no válido'; end if;
  if length(trim(coalesce(p_correo,''))) < 4 then raise exception 'Correo no válido'; end if;
  if p_tiene_seguro not in ('Sí','No') then raise exception 'Selecciona si cuentas con seguro'; end if;
  if p_tipo_cliente not in ('CLIENTE_VIGENTE','RENOVACION','PROSPECTO') then raise exception 'Clasificación no válida'; end if;
  if p_participaciones < 1 or p_participaciones > 3 then raise exception 'Participaciones iniciales no válidas'; end if;
  insert into public.calaverita_2026_registros
    (nombre,telefono,correo,municipio,marca,modelo,anio,tiene_seguro,aseguradora,vencimiento,tipo_cliente,interes_cotizacion,participaciones)
  values
    (trim(p_nombre),trim(p_telefono),trim(p_correo),trim(p_municipio),trim(p_marca),trim(p_modelo),p_anio,p_tiene_seguro,nullif(p_aseguradora,''),nullif(p_vencimiento,''),p_tipo_cliente,nullif(p_interes_cotizacion,''),p_participaciones)
  returning * into v_row;
  return jsonb_build_object('id',v_row.id,'fecha_registro',v_row.fecha_registro,'nombre',v_row.nombre,'tipo_cliente',v_row.tipo_cliente,'puntaje_reto',v_row.puntaje_reto,'participaciones',v_row.participaciones);
end;
$$;
revoke all on function public.calaverita_2026_registrar(text,text,text,text,text,text,integer,text,text,text,text,text,integer) from public;
grant execute on function public.calaverita_2026_registrar(text,text,text,text,text,text,integer,text,text,text,text,text,integer) to anon, authenticated;

create or replace function public.calaverita_2026_finalizar_reto(p_id uuid, p_puntaje integer)
returns jsonb
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
  return jsonb_build_object('id',v_row.id,'fecha_registro',v_row.fecha_registro,'nombre',v_row.nombre,'tipo_cliente',v_row.tipo_cliente,'puntaje_reto',v_row.puntaje_reto,'participaciones',v_row.participaciones);
end;
$$;
revoke all on function public.calaverita_2026_finalizar_reto(uuid, integer) from public;
grant execute on function public.calaverita_2026_finalizar_reto(uuid, integer) to anon, authenticated;
