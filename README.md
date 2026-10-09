# Inventario Quálitas PWA

Sistema de gestión de inventario para promocionales, materiales publicitarios y artículos operativos de Quálitas.

## Funcionalidades

- Alta, edición y eliminación de artículos.
- Captura de fotografías desde la cámara o selección desde la galería.
- Búsqueda de artículos por texto.
- Búsqueda visual por imagen.
- Importación y exportación de inventario mediante Excel.
- Dashboard con indicadores y control de stock mínimo.
- Persistencia en Supabase, con respaldo local cuando Supabase no está configurado.
- Migración inicial del inventario guardado en el navegador a Supabase cuando la tabla está vacía.
- Interfaz adaptable a dispositivos móviles.

## Tecnologías

- React
- Vite
- Tailwind CSS
- Supabase (`@supabase/supabase-js`)
- TensorFlow.js / MobileNet para búsqueda visual
- XLSX para importación y exportación de Excel

## Requisitos de configuración

### 1. Base de datos Supabase

Ejecuta el script SQL ubicado en `supabase/inventario.sql` desde el SQL Editor de tu proyecto de Supabase. Esto crea la tabla `public.inventario_qualitas` y sus políticas iniciales.

> **Seguridad:** las políticas incluidas son abiertas para permitir la conexión inicial sin autenticación. Antes de utilizar datos internos reales, configura autenticación y restringe las políticas RLS para que solo usuarios autorizados puedan consultar y modificar el inventario.

### 2. Variables de entorno

En Vercel, abre **Project Settings → Environment Variables** y agrega:

- `VITE_SUPABASE_URL`: URL del proyecto Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: clave pública/publishable de Supabase.

Usa únicamente la clave publicable en el frontend. No coloques claves `service_role` ni claves secretas en variables `VITE_*`.

Después de guardar las variables, genera un nuevo deployment para que se apliquen.

Si las variables no están configuradas, la aplicación utiliza el almacenamiento local del navegador; los datos locales no se comparten entre dispositivos.

## Desarrollo local

Instala las dependencias:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible normalmente en `http://localhost:5173`.

## Compilación y vista previa

```bash
npm run build
npm run preview
```

## Despliegue en Vercel

1. Importa el repositorio de GitHub en Vercel con framework **Vite**.
2. Configura las variables de entorno de Supabase indicadas arriba.
3. Despliega la rama `main`.
4. Confirma en los logs que el deployment corresponde al commit más reciente.

## Estructura principal

- `src/components/`: componentes de interfaz.
- `src/pages/`: pantallas de la aplicación.
- `src/hooks/`: hooks de estado y carga de inventario.
- `src/services/`: operaciones de inventario y persistencia.
- `src/lib/supabase.js`: cliente de Supabase.
- `supabase/inventario.sql`: esquema y políticas iniciales de la base de datos.

## Colores corporativos Quálitas

- Morados: `#941B80`, `#D12893`, `#9279BA`, `#692D80`, `#512950`
- Turquesas y azules: `#0096AE`, `#46B8E9`, `#0F98D7`, `#037081`, `#143B46`
