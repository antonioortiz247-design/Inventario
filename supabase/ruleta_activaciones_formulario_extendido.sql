-- Amplía el formulario de la ruleta para que capture los mismos datos de vehículo y seguro que Calaverita Segura.
alter table public.ruleta_activaciones_prospectos
  add column if not exists marca text,
  add column if not exists modelo text,
  add column if not exists anio integer,
  add column if not exists tiene_seguro text,
  add column if not exists aseguradora text,
  add column if not exists vencimiento text,
  add column if not exists interes_cotizacion text;

comment on column public.ruleta_activaciones_prospectos.marca is 'Marca del vehículo declarado por el participante';
comment on column public.ruleta_activaciones_prospectos.modelo is 'Modelo del vehículo declarado por el participante';
comment on column public.ruleta_activaciones_prospectos.anio is 'Año modelo del vehículo declarado por el participante';
comment on column public.ruleta_activaciones_prospectos.tiene_seguro is 'Indica si el participante cuenta actualmente con seguro';
comment on column public.ruleta_activaciones_prospectos.aseguradora is 'Aseguradora actual declarada por el participante';
comment on column public.ruleta_activaciones_prospectos.vencimiento is 'Rango aproximado de vencimiento de la póliza';
comment on column public.ruleta_activaciones_prospectos.interes_cotizacion is 'Interés declarado en recibir una cotización';