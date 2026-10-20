/** Fecha en que se hizo la foto: la del EXIF si la tiene, y si no la de modificación del archivo. */
export async function photoDate(file: File): Promise<Date> {
  try {
    const d = exifDate(await file.slice(0, 256 * 1024).arrayBuffer())
    if (d) return d
  } catch {
    // sin EXIF legible: se usa la fecha del archivo
  }
  return new Date(file.lastModified)
}

const TAG_DATE_TIME = 0x0132
const TAG_EXIF_IFD = 0x8769
const TAG_DATE_ORIGINAL = 0x9003

/** Busca el segmento Exif de un JPEG y devuelve DateTimeOriginal (o DateTime). */
function exifDate(buf: ArrayBuffer): Date | null {
  const v = new DataView(buf)
  if (v.byteLength < 12 || v.getUint16(0) !== 0xffd8) return null
  let off = 2
  while (off + 4 < v.byteLength) {
    if (v.getUint8(off) !== 0xff) return null
    const marker = v.getUint8(off + 1)
    if (marker === 0xe1 && v.getUint32(off + 4) === 0x45786966) return fromTiff(v, off + 10)
    if (marker === 0xda) return null // empieza la imagen: ya no hay metadatos
    off += 2 + v.getUint16(off + 2)
  }
  return null
}

function fromTiff(v: DataView, base: number): Date | null {
  const little = v.getUint16(base) === 0x4949
  const u16 = (o: number) => v.getUint16(o, little)
  const u32 = (o: number) => v.getUint32(o, little)

  /** Posición de la entrada con esa etiqueta dentro de un IFD, o -1. */
  const entry = (ifd: number, tag: number) => {
    const n = u16(base + ifd)
    for (let i = 0; i < n; i++) {
      const e = base + ifd + 2 + i * 12
      if (e + 12 > v.byteLength) return -1
      if (u16(e) === tag) return e
    }
    return -1
  }
  const text = (e: number) => {
    const at = base + u32(e + 8)
    let s = ''
    for (let i = 0; i < 19 && at + i < v.byteLength; i++) s += String.fromCharCode(v.getUint8(at + i))
    return s
  }

  const ifd0 = u32(base + 4)
  const exifPtr = entry(ifd0, TAG_EXIF_IFD)
  const original = exifPtr >= 0 ? entry(u32(exifPtr + 8), TAG_DATE_ORIGINAL) : -1
  const fallback = entry(ifd0, TAG_DATE_TIME)
  const e = original >= 0 ? original : fallback
  if (e < 0) return null
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(text(e))
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
  return Number.isNaN(d.getTime()) || +m[1] < 2000 ? null : d
}
