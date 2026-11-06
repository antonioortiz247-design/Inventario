-- Funciones públicas limitadas para la pantalla de transmisión de Calaverita Segura 2026.
-- Sólo exponen el total de participantes elegibles y los datos públicos del ganador.

create or replace function public.calaverita_2026_conteo_publico()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'eligible_count',
    count(*)::integer
  )
  from public.calaverita_2026_registros
  where asistencia_confirmada is true
    and coalesce(tiene_auto, true) is true
    and coalesce(participaciones_activas, 0) > 0;
$$;

create or replace function public.calaverita_2026_publicar_ganador()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner record;
  v_count integer;
begin
  select count(*)::integer
    into v_count
  from public.calaverita_2026_registros
  where asistencia_confirmada is true
    and coalesce(tiene_auto, true) is true
    and coalesce(participaciones_activas, 0) > 0;

  select nombre, folio, asistencia_confirmada, participaciones_activas
    into v_winner
  from public.calaverita_2026_registros
  where folio = 'ODQRR - 0009'
    and lower(trim(nombre)) = lower('Misael Villa Acosta')
    and asistencia_confirmada is true
    and coalesce(tiene_auto, true) is true
    and coalesce(participaciones_activas, 0) > 0
  limit 1;

  if not found then
    return jsonb_build_object(
      'eligible_count', v_count,
      'winner', null,
      'message', 'No se encontró un registro elegible para mostrar.'
    );
  end if;

  return jsonb_build_object(
    'eligible_count', v_count,
    'winner', jsonb_build_object(
      'nombre', v_winner.nombre,
      'folio', v_winner.folio
    )
  );
end;
$$;

revoke all on function public.calaverita_2026_conteo_publico() from public;
revoke all on function public.calaverita_2026_publicar_ganador() from public;
grant execute on function public.calaverita_2026_conteo_publico() to anon, authenticated;
grant execute on function public.calaverita_2026_publicar_ganador() to anon, authenticated;
