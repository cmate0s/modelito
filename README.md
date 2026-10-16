# Modelito

Diario personal de outfits: haces una foto de lo que llevas, se guarda con el tiempo de ese día y tu valoración, y otro día con temperatura parecida te recuerda qué te pusiste.

PWA (React + Vite + TypeScript). Los datos se guardan en el propio dispositivo (IndexedDB); no hay servidor ni cuentas. El tiempo viene de [Open-Meteo](https://open-meteo.com/).

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # build de producción en dist/
```

## Notas

- Las fotos se reducen a 1280 px (JPEG) antes de guardarse.
- Ajustes → "Descargar copia" exporta todo a JSON; "Restaurar copia" lo importa.
- Para instalar en el móvil: abrir la URL y "Añadir a pantalla de inicio".
