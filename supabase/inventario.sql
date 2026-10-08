-- Inventario Quálitas - Supabase
-- Ejecuta este archivo en Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.inventario_qualitas (
  id uuid primary key default gen_random_uuid(),
  articulo text not null,
  categoria text default '',
  cantidad integer not null default 0,
  ubicacion text default '',
  observaciones text default '',
  foto text default '',
  stock_minimo integer not null default 10,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz
);

alter table public.inventario_qualitas enable row level security;

-- Esta primera versión permite que la aplicación compartida consulte y modifique
-- el inventario sin iniciar sesión. Para un inventario interno, se recomienda
-- sustituir estas políticas por políticas basadas en Supabase Auth.
drop policy if exists "inventario_select_public" on public.inventario_qualitas;
drop policy if exists "inventario_insert_public" on public.inventario_qualitas;
drop policy if exists "inventario_update_public" on public.inventario_qualitas;
drop policy if exists "inventario_delete_public" on public.inventario_qualitas;

create policy "inventario_select_public"
  on public.inventario_qualitas
  for select
  to anon, authenticated
  using (true);

create policy "inventario_insert_public"
  on public.inventario_qualitas
  for insert
  to anon, authenticated
  with check (true);

create policy "inventario_update_public"
  on public.inventario_qualitas
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "inventario_delete_public"
  on public.inventario_qualitas
  for delete
  to anon, authenticated
  using (true);

create index if not exists inventario_qualitas_articulo_idx
  on public.inventario_qualitas (articulo);

create index if not exists inventario_qualitas_categoria_idx
  on public.inventario_qualitas (categoria);

create index if not exists inventario_qualitas_ubicacion_idx
  on public.inventario_qualitas (ubicacion);
