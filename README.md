# Modelito

Diario personal de outfits: haces una foto de lo que llevas, se guarda con el tiempo de ese día y tu valoración, y otro día con temperatura parecida te recuerda qué te pusiste.

PWA (React + Vite + TypeScript). Los datos se guardan en el propio dispositivo (IndexedDB); no hay servidor ni cuentas. El tiempo viene de [Open-Meteo](https://open-meteo.com/).

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # build de producción en dist/
```

## Diseño

Estilo «caramelo»: alegre, redondo y táctil. La paleta sale del icono (cielo, coral, sol y la mascota menta) y se define en variables CSS al principio de `src/index.css`, con versión clara y oscura. Títulos y botones usan Fredoka; el texto, Manrope.

Los gráficos (icono, ilustraciones de pantallas vacías y pasos, estados del tiempo, caras de frío/perfecto/calor, pegatinas del fondo y confeti, e imagen para compartir) se generaron en Google Flow (Nano Banana) tomando la mascota como referencia de estilo. Los originales están en `design/` y este script los recorta, quita el fondo magenta de las pegatinas y los optimiza:

```bash
python3 design/build-assets.py     # requiere Pillow y numpy
```

Salidas: iconos de la PWA e `og-image.jpg` en `public/`, y `src/assets/{art,weather,feel,stickers}/*.webp`. `src/lib/art.ts` los expone al código.

- Las fotos se reducen a 1280 px (JPEG) antes de guardarse.
- Ajustes → "Descargar copia" exporta todo a JSON; "Restaurar copia" lo importa.
- Para instalar en el móvil: abrir la URL y "Añadir a pantalla de inicio".
