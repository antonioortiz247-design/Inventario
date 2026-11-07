-- Restaura el sorteo aleatorio ponderado por participaciones activas.
-- Cada participación activa equivale a una oportunidad dentro del sorteo.

create or replace function public.calaverita_2026_publicar_ganador()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner record;
  v_count integer;
  v_total_tickets bigint;
  v_draw bigint;
begin
  select count(*)::integer, coalesce(sum(participaciones_activas), 0)::bigint
    into v_count, v_total_tickets
  from public.calaverita_2026_registros
  where asistencia_confirmada is true
    and coalesce(tiene_auto, true) is true
    and coalesce(participaciones_activas, 0) > 0;

  if v_total_tickets < 1 then
    return jsonb_build_object(
      'eligible_count', v_count,
      'winner', null,
      'message', 'No hay participantes elegibles para realizar el sorteo.'
    );
  end if;

  -- Se extrae un boleto uniforme entre todos los boletos activos.
  v_draw := floor(random() * v_total_tickets)::bigint + 1;

  with eligible as (
    select id, nombre, folio, participaciones_activas,
      sum(participaciones_activas) over (order by id rows between unbounded preceding and current row) as ticket_end
    from public.calaverita_2026_registros
    where asistencia_confirmada is true
      and coalesce(tiene_auto, true) is true
      and coalesce(participaciones_activas, 0) > 0
  )
  select nombre, folio
    into v_winner
  from eligible
  where ticket_end >= v_draw
  order by ticket_end
  limit 1;

  return jsonb_build_object(
    'eligible_count', v_count,
    'winner', jsonb_build_object(
      'nombre', v_winner.nombre,
      'folio', v_winner.folio
    )
  );
end;
$$;

revoke all on function public.calaverita_2026_publicar_ganador() from public;
grant execute on function public.calaverita_2026_publicar_ganador() to anon, authenticated;
