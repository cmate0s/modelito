import { useRef, useState } from 'react'
import { exportBackup, importBackup } from '../lib/db.ts'

export function Settings({ count, onImported }: { count: number; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  async function doExport() {
    const blob = await exportBackup()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `modelito-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Copia descargada.')
  }

  async function doImport(file: File | undefined) {
    if (!file) return
    try {
      const n = await importBackup(file)
      onImported()
      setMsg(`Importados ${n} modelitos.`)
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  return (
    <div className="page">
      <section className="card">
        <h2>Copia de seguridad</h2>
        <p className="hint">
          Tus {count} modelitos viven solo en este dispositivo. Si cambias de móvil o borras los datos del
          navegador se pierden, así que descarga una copia de vez en cuando.
        </p>
        <div className="row">
          <button className="btn primary" onClick={doExport} disabled={count === 0}>
            Descargar copia
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Restaurar copia
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            doImport(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {msg && <p className="hint">{msg}</p>}
      </section>
    </div>
  )
}
