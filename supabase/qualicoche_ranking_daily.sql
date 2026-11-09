-- Qualicoche Run: soporte de resultados y ranking diario.
-- Ejecutar en Supabase SQL Editor antes del evento.
-- El formulario actual captura nombre, teléfono y datos de contacto; los campos
-- de perfil vehicular ya no forman parte del flujo del minijuego.
alter table public.desafio_seguridad_vial
  alter column anio drop not null,
  alter column pernocta drop not null,
  alter column uso drop not null,
  alter column preocupacion drop not null;

create index if not exists desafio_seguridad_vial_ranking_dia_idx
  on public.desafio_seguridad_vial (creado_en desc, puntaje desc);

-- La RPC existente conserva la validación de nombre, teléfono, correo,
-- aseguradora y puntaje (0 a 500). Los campos vehiculares pueden quedar NULL.
