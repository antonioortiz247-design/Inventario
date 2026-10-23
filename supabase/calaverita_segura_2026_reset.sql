-- Complemento para Calaverita Segura 2026: reinicio administrativo de registros de prueba.
-- Ejecutar en Supabase SQL Editor. Requiere una sesión autenticada.
create or replace function public.calaverita_2026_reiniciar_pruebas()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_count integer;
begin
  if auth.uid() is null then
    raise exception 'Se requiere una sesión de administrador.';
  end if;

  -- WHERE TRUE hace explícito que el reinicio aplica a todos los registros.
  delete from public.calaverita_2026_registros where true;
  get diagnostics v_deleted_count = row_count;

  return jsonb_build_object('deleted_count', v_deleted_count);
end;
$$;

revoke all on function public.calaverita_2026_reiniciar_pruebas() from public;
grant execute on function public.calaverita_2026_reiniciar_pruebas() to authenticated;
