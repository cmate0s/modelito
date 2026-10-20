import { ImagesIcon } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { importPhotos } from '../lib/importPhotos.ts'
import type { Outfit } from '../lib/types.ts'
import { loadPlace } from '../lib/weather.ts'

/** Carga fotos de la galería como modelitos pasados, con su fecha y el tiempo que hizo ese día. */
export function ImportPhotos({
  outfits,
  onDone,
  primary = false,
}: {
  outfits: Outfit[]
  onDone: (message: string) => void
  primary?: boolean
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [note, setNote] = useState('')

  async function run(files: File[]) {
    if (files.length === 0) return
    const place = loadPlace()
    if (!place) {
      setNote('Primero elige tu ubicación en «Hoy»: hace falta para saber el tiempo de esos días.')
      return
    }
    setNote('')
    setProgress({ done: 0, total: files.length })
    try {
      const r = await importPhotos(files, place, outfits, (done, total) => setProgress({ done, total }))
      const extra = [r.duplicates ? `${r.duplicates} repetidas` : '', r.withoutWeather ? `${r.withoutWeather} sin tiempo` : '']
        .filter(Boolean)
        .join(' · ')
      onDone(`${r.added === 1 ? '1 foto cargada' : `${r.added} fotos cargadas`}${extra ? ` · ${extra}` : ''}`)
    } catch (e) {
      setNote((e as Error).message)
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="import">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void run([...(e.target.files ?? [])])
          e.target.value = ''
        }}
      />
      <button
        className={primary ? 'btn primary' : 'btn'}
        disabled={progress !== null}
        onClick={() => ref.current?.click()}
      >
        <ImagesIcon size={18} weight="light" aria-hidden="true" />
        {progress ? `Cargando ${Math.min(progress.done + 1, progress.total)} de ${progress.total}…` : 'Cargar fotos de mi galería'}
      </button>
      {note && (
        <p className="muted small" role="status">
          {note}
        </p>
      )}
    </div>
  )
}
