-- Tablas para sincronizar la ruleta de activaciones entre dispositivos.
-- Ejecutar una sola vez en Supabase > SQL Editor.

create table if not exists public.ruleta_activaciones_config (
  id text primary key check (id = 'default'),
  premios jsonb not null default '[
    {"label":"Pluma","probability":45},
    {"label":"Bolsa","probability":15},
    {"label":"Cilindro","probability":15},
    {"label":"Libreta","probability":8},
    {"label":"Tupper","probability":8},
    {"label":"Audífonos","probability":6},
    {"label":"Lonchera","probability":2},
    {"label":"Lámpara","probability":1}
  ]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.ruleta_activaciones_historial (
  id uuid primary key default gen_random_uuid(),
  premio text not null,
  probabilidad numeric(5,2) not null check (probabilidad > 0 and probabilidad <= 100),
  created_at timestamptz not null default now()
);

insert into public.ruleta_activaciones_config (id)
values ('default')
on conflict (id) do nothing;

alter table public.ruleta_activaciones_config enable row level security;
alter table public.ruleta_activaciones_historial enable row level security;

-- La aplicación usa la clave publishable/anon desde el navegador.
-- No colocar nunca una service_role key en el frontend.
grant select, insert, update on public.ruleta_activaciones_config to anon, authenticated;
grant select, insert on public.ruleta_activaciones_historial to anon, authenticated;

drop policy if exists "Ruleta config visible para app" on public.ruleta_activaciones_config;
create policy "Ruleta config visible para app"
  on public.ruleta_activaciones_config for select
  to anon, authenticated using (true);

drop policy if exists "Ruleta config editable por app" on public.ruleta_activaciones_config;
create policy "Ruleta config editable por app"
  on public.ruleta_activaciones_config for insert
  to anon, authenticated with check (id = 'default');

drop policy if exists "Ruleta config actualizable por app" on public.ruleta_activaciones_config;
create policy "Ruleta config actualizable por app"
  on public.ruleta_activaciones_config for update
  to anon, authenticated using (id = 'default') with check (id = 'default');

drop policy if exists "Ruleta historial visible para app" on public.ruleta_activaciones_historial;
create policy "Ruleta historial visible para app"
  on public.ruleta_activaciones_historial for select
  to anon, authenticated using (true);

drop policy if exists "Ruleta historial insertable por app" on public.ruleta_activaciones_historial;
create policy "Ruleta historial insertable por app"
  on public.ruleta_activaciones_historial for insert
  to anon, authenticated with check (premio <> '' and probabilidad > 0 and probabilidad <= 100);

-- Habilitar actualizaciones en tiempo real si la publicación estándar de Supabase existe.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'ruleta_activaciones_config'
    ) then
      alter publication supabase_realtime add table public.ruleta_activaciones_config;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'ruleta_activaciones_historial'
    ) then
      alter publication supabase_realtime add table public.ruleta_activaciones_historial;
    end if;
  end if;
end $$;
