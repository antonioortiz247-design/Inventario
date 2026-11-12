-- Ranking público del Reto Qualicoche Run.
-- Expone únicamente nombre de pila y puntuación; nunca teléfono, correo ni folio.
create or replace function public.obtener_ranking_publico_desafio()
returns table (nombre text, puntaje integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    split_part(trim(d.nombre), ' ', 1) as nombre,
    d.puntaje
  from public.desafio_seguridad_vial d
  where (d.creado_en at time zone 'America/Mexico_City')::date =
        (now() at time zone 'America/Mexico_City')::date
  order by d.puntaje desc, d.creado_en asc
  limit 10;
$$;

revoke all on function public.obtener_ranking_publico_desafio() from public;
grant execute on function public.obtener_ranking_publico_desafio() to anon, authenticated;
