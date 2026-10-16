import { CheckIcon, ClockCounterClockwiseIcon, CoatHangerIcon, GearSixIcon, type Icon } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Detail } from './components/Detail.tsx'
import { History } from './components/History.tsx'
import { Settings } from './components/Settings.tsx'
import { Today } from './components/Today.tsx'
import { listOutfits } from './lib/db.ts'
import type { Outfit } from './lib/types.ts'

type Tab = 'today' | 'history' | 'settings'

const TABS: { id: Tab; label: string; icon: Icon }[] = [
  { id: 'today', label: 'Hoy', icon: CoatHangerIcon },
  { id: 'history', label: 'Historial', icon: ClockCounterClockwiseIcon },
  { id: 'settings', label: 'Ajustes', icon: GearSixIcon },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [open, setOpen] = useState<Outfit | null>(null)
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const toastTimer = useRef<number>(undefined)

  const reload = useCallback(() => {
    listOutfits().then(setOutfits)
  }, [])

  const notify = useCallback(
    (text: string) => {
      reload()
      setToast({ id: Date.now(), text })
      clearTimeout(toastTimer.current)
      toastTimer.current = window.setTimeout(() => setToast(null), 2600)
    },
    [reload],
  )

  const go = (next: Tab) => {
    setTab(next)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    reload()
    // pide a Chrome/Safari que no purgue los datos por falta de espacio
    navigator.storage?.persist?.()
  }, [reload])

  const active = TABS.findIndex((t) => t.id === tab)

  return (
    <div className="app">
      <a className="skip" href="#main">
        Saltar al contenido
      </a>
      <main id="main" key={tab}>
        {tab === 'today' && (
          <Today
            outfits={outfits}
            onOpen={setOpen}
            onSaved={() => {
              notify('Modelito guardado')
              go('history')
            }}
          />
        )}
        {tab === 'history' && <History outfits={outfits} onOpen={setOpen} onNew={() => go('today')} />}
        {tab === 'settings' && <Settings count={outfits.length} onImported={notify} />}
      </main>

      <nav className="island" aria-label="Secciones">
        <span
          className="island-thumb"
          style={{ transform: `translateX(${active * 100}%)` }}
          aria-hidden="true"
        />
        {TABS.map(({ id, label, icon: Glyph }) => (
          <button
            key={id}
            className={tab === id ? 'on' : ''}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => go(id)}
          >
            <Glyph size={24} weight={tab === id ? 'fill' : 'regular'} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>

      {toast && (
        <div className="toast" key={toast.id} role="status">
          <CheckIcon size={16} weight="bold" aria-hidden="true" />
          {toast.text}
        </div>
      )}

      {open && (
        <Detail key={open.id} outfit={open} onClose={() => setOpen(null)} onChanged={notify} />
      )}
    </div>
  )
}
