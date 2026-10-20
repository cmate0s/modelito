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

Estilo «atelier»: sobrio y editorial, con marfil, tinta y un toque de camel (versión clara y oscura, en variables CSS al principio de `src/index.css`). Los títulos y cifras usan Cormorant Garamond; el texto, Manrope; las etiquetas, Manrope en mayúsculas espaciadas. Los iconos son Phosphor en trazo fino.

Los gráficos son bocetos de moda en línea fina generados en Google Flow (Nano Banana): una hoja de seis dibujos (`design/atelier-lineart.jpg`). El script los recorta, los convierte en máscaras (solo canal alfa, para que se tiñan con el color del texto en claro y oscuro) y genera también el monograma «M» de los iconos de la PWA y la imagen para compartir:

```bash
python3 design/build-assets.py     # requiere Pillow, numpy, fonttools y brotli, y haber hecho npm install
```

Salidas: iconos de la PWA e `og-image.jpg` en `public/`, y `src/assets/art/*.webp`. `src/lib/art.ts` los expone y `LineArt` los pinta.

- Las fotos se reducen a 1280 px (JPEG) antes de guardarse.
- Ajustes → "Descargar copia" exporta todo a JSON; "Restaurar copia" lo importa.
- Para instalar en el móvil: abrir la URL y "Añadir a pantalla de inicio".
