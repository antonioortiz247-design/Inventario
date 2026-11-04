-- SEGURIDAD CENTRAL HUB QUALITAS
-- Ejecutar una sola vez en Supabase > SQL Editor.
-- La cuenta Auth existente indicada se convierte en admin. No crea usuarios.

begin;

create table if not exists public.app_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.app_user_roles enable row level security;

create or replace function public.app_is_staff()
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (select 1 from public.app_user_roles
    where user_id = auth.uid() and role in ('admin','staff'));
$$;

create or replace function public.app_is_admin()
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (select 1 from public.app_user_roles
    where user_id = auth.uid() and role = 'admin');
$$;

revoke all on function public.app_is_staff() from public, anon;
revoke all on function public.app_is_admin() from public, anon;
grant execute on function public.app_is_staff() to authenticated;
grant execute on function public.app_is_admin() to authenticated;

drop policy if exists app_roles_read_self_or_admin on public.app_user_roles;
drop policy if exists app_roles_admin_manage on public.app_user_roles;
create policy app_roles_read_self_or_admin on public.app_user_roles
  for select to authenticated using (user_id = auth.uid() or public.app_is_admin());
create policy app_roles_admin_manage on public.app_user_roles
  for all to authenticated using (public.app_is_admin()) with check (public.app_is_admin());
revoke all on public.app_user_roles from anon;
grant select, insert, update, delete on public.app_user_roles to authenticated;

insert into public.app_user_roles (user_id, role)
values ('b88c5284-bebc-4576-bb99-e97fb2cd3ffa'::uuid, 'admin')
on conflict (user_id) do update set role='admin', updated_at=now();

-- Tablas internas: sólo admin/staff autenticados.
do $$
declare t text; p record;
begin
  foreach t in array array[
    'inventario_qualitas','inventario_movimientos','eventos','evento_materiales',
    'ruleta_activaciones_config','ruleta_activaciones_historial',
    'ruleta_activaciones_prospectos','calaverita_2026_registros',
    'desafio_seguridad_vial'
  ] loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I enable row level security',t);
      for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
        execute format('drop policy %I on public.%I',p.policyname,t);
      end loop;
      execute format('create policy hub_staff_all on public.%I for all to authenticated using (public.app_is_staff()) with check (public.app_is_staff())',t);
      execute format('revoke all on public.%I from anon',t);
      execute format('grant select, insert, update, delete on public.%I to authenticated',t);
    end if;
  end loop;
end $$;

-- Excepciones públicas limitadas para la ruleta (sin lectura de datos personales).
do $$
begin
  if to_regclass('public.ruleta_activaciones_config') is not null then
    grant select on public.ruleta_activaciones_config to anon;
    drop policy if exists ruleta_public_config_read on public.ruleta_activaciones_config;
    create policy ruleta_public_config_read on public.ruleta_activaciones_config
      for select to anon using (id='default');
  end if;
  if to_regclass('public.ruleta_activaciones_historial') is not null then
    grant insert on public.ruleta_activaciones_historial to anon;
    drop policy if exists ruleta_public_spin_insert on public.ruleta_activaciones_historial;
    create policy ruleta_public_spin_insert on public.ruleta_activaciones_historial
      for insert to anon with check (length(trim(premio))>0 and probabilidad>0 and probabilidad<=100);
  end if;
  if to_regclass('public.ruleta_activaciones_prospectos') is not null then
    grant insert on public.ruleta_activaciones_prospectos to anon;
    drop policy if exists ruleta_public_prospect_insert on public.ruleta_activaciones_prospectos;
    create policy ruleta_public_prospect_insert on public.ruleta_activaciones_prospectos
      for insert to anon with check (length(trim(nombre))>=2 and length(trim(telefono)) between 10 and 20 and acepta_aviso=true);
  end if;
end $$;

-- Cierra las RPC internas a usuarios sin rol. Se preservan expresamente
-- las RPC públicas de captura calaverita_2026_preregistrar y registrar_desafio_seguridad_vial.
do $$
declare f record; body text;
begin
  for f in
    select p.oid, p.proname, pg_get_functiondef(p.oid) as definition
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname = any(array[
      'registrar_movimiento','confirmar_evento','cancelar_evento',
      'entregar_material_evento','actualizar_evento','finalizar_evento',
      'eliminar_evento','ajustar_material_evento',
      'calaverita_2026_confirmar_asistencia',
      'calaverita_2026_conductor_seguro_iniciar',
      'calaverita_2026_conductor_seguro_completar',
      'calaverita_2026_finalizar_reto','calaverita_2026_reiniciar_pruebas'
    ])
  loop
    body := regexp_replace(f.definition, '(begin)',
      E'BEGIN\n IF NOT public.app_is_staff() THEN RAISE EXCEPTION ''Se requiere personal autorizado.''; END IF;\n',
      'i');
    execute body;
    execute format('revoke all on function %s from public, anon',f.oid::regprocedure);
    execute format('grant execute on function %s to authenticated',f.oid::regprocedure);
  end loop;
end $$;

commit;

-- Alta de personal adicional, después de crear su usuario en Supabase Auth:
-- insert into public.app_user_roles(user_id,role)
-- values ('UUID-DEL-USUARIO'::uuid,'staff')
-- on conflict(user_id) do update set role='staff',updated_at=now();
