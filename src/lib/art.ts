// Bocetos de línea creados en Google Flow y recortados por design/build-assets.py.
// Solo traen canal alfa: se pintan con el color del texto mediante una máscara CSS.
const files = import.meta.glob('../assets/art/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export type ArtName = 'blazer' | 'sweater' | 'trench' | 'sunglasses'

export const art = (name: ArtName) => files[`../assets/art/${name}.webp`] ?? ''
