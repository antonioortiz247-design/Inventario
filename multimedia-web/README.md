# Multimedia web — Inventario Quálitas

Compilado de recursos gráficos y multimedia encontrados en el repositorio `Inventario`.

## Contenido

### logos/
- `Logo-Horizontal.png` — logotipo horizontal.
- `Logo-Vertical 4000px.png` — logotipo vertical.
- `Q-morado.png` — símbolo Q para la barra lateral plegada.
- `Quálitas - H con slogan.png` — variante horizontal con slogan.
- `Quálitas - V con slogan.png` — variante vertical con slogan.
- `Quálitas-1-Vertical 2000 px.png` — variante vertical.
- `letragrama-qualitas-verde.png` — letragrama usado en encabezados.

### favicons/
- `Logo-Vertical 4000px.png` — recurso configurado como favicon en `index.html`.

### pwa/
- `calaverita.svg` — icono SVG referenciado por `manifest.webmanifest`.

### social/
- `calaverita-whatsapp.png` — imagen social Open Graph y Twitter Card.

## Observaciones técnicas

- Los iconos `public/icons/icon-192.png` y `public/icons/icon-512.png`, el `public/favicon.ico` y dos imágenes de `src/assets/` existen en el repositorio, pero sus tamaños son de 1–2 bytes; son archivos vacíos o inválidos y por eso no se copiaron como recursos utilizables.
- `manifest.json` todavía referencia esos dos PNG de PWA inválidos. `manifest.webmanifest` referencia `pwa/calaverita.svg` en el proyecto original.
- Los iconos de interfaz creados con React Icons/Lucide son componentes vectoriales del código, no archivos multimedia independientes, por lo que no se exportan como imágenes.
- Este paquete reúne archivos gráficos del repositorio; no incluye librerías, fuentes de iconos de terceros ni recursos servidos dinámicamente desde servicios externos.

## Ubicación original

Los archivos se copiaron desde `public/` del proyecto y se conservaron con sus nombres originales. No se movieron ni eliminaron los originales.
