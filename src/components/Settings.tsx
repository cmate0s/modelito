import { CloudArrowDownIcon, DownloadSimpleIcon, InfoIcon, UploadSimpleIcon } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { exportBackup, importBackup } from '../lib/db.ts'
import { PageHeader } from './PageHeader.tsx'

export function Settings({ count, onImported }: { count: number; onImported: (msg: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function doExport() {
    setBusy(true)
    try {
      const blob = await exportBackup()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `modelito-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      onImported('Copia descargada')
    } finally {
      setBusy(false)
    }
  }

  async function doImport(file: File | undefined) {
    if (!file) return
    setError('')
    try {
      const n = await importBackup(file)
      onImported(n === 1 ? '1 modelito restaurado' : `${n} modelitos restaurados`)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="page">
      <PageHeader title="Ajustes" />
      <section className="card">
        <div className="card-icon">
          <CloudArrowDownIcon size={24} weight="duotone" aria-hidden="true" />
        </div>
        <h2>Copia de seguridad</h2>
        <p className="muted">
          Tus {count} modelitos viven solo en este móvil. Si lo cambias o borras los datos del navegador,
          se pierden. Descarga una copia de vez en cuando.
        </p>
        <div className="row">
          <button className="btn primary" onClick={doExport} disabled={count === 0 || busy}>
            <DownloadSimpleIcon size={20} weight="bold" aria-hidden="true" />
            {busy ? 'Preparando…' : 'Descargar'}
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <UploadSimpleIcon size={20} weight="bold" aria-hidden="true" />
            Restaurar
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
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
      </section>
      <section className="card">
        <div className="card-icon">
          <InfoIcon size={24} weight="duotone" aria-hidden="true" />
        </div>
        <h2>Sobre Modelito</h2>
        <p className="muted">
          Datos del tiempo de{' '}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>
          , con licencia CC BY 4.0. Sin cuentas ni servidores: nada sale de tu móvil salvo la consulta del tiempo.
        </p>
      </section>
      <p className="signature">
        <a href="https://mate0s-web.vercel.app" target="_blank" rel="noreferrer">
          hecho por mate0s<span className="signature-cursor" aria-hidden="true" />
        </a>
      </p>
    </div>
  )
}
