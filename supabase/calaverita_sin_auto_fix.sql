-- Ejecutar en Supabase SQL Editor para corregir el prerregistro de personas que no tienen automóvil.
-- Los datos del vehículo deben poder ser NULL cuando tiene_auto = false.
alter table public.calaverita_2026_registros
  alter column marca drop not null,
  alter column modelo drop not null,
  alter column anio drop not null,
  alter column tiene_seguro drop not null,
  alter column aseguradora drop not null,
  alter column vencimiento drop not null;

notify pgrst, 'reload schema';
