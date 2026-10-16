import { useCallback, useEffect, useState } from 'react'
import { Detail } from './components/Detail.tsx'
import { History } from './components/History.tsx'
import { Settings } from './components/Settings.tsx'
import { Today } from './components/Today.tsx'
import { listOutfits } from './lib/db.ts'
import type { Outfit } from './lib/types.ts'

type Tab = 'today' | 'history' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Hoy', icon: '👗' },
  { id: 'history', label: 'Historial', icon: '🗂️' },
  { id: 'settings', label: 'Ajustes', icon: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [open, setOpen] = useState<Outfit | null>(null)

  const reload = useCallback(() => {
    listOutfits().then(setOutfits)
  }, [])

  useEffect(() => {
    reload()
    // pide a Chrome/Safari que no purgue los datos por falta de espacio
    navigator.storage?.persist?.()
  }, [reload])

  return (
    <div className="app">
      <header>
        <h1>Modelito</h1>
      </header>
      <main>
        {tab === 'today' && (
          <Today
            outfits={outfits}
            onOpen={setOpen}
            onSaved={() => {
              reload()
              setTab('history')
            }}
          />
        )}
        {tab === 'history' && <History outfits={outfits} onOpen={setOpen} />}
        {tab === 'settings' && <Settings count={outfits.length} onImported={reload} />}
      </main>
      <nav>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'on' : ''}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden="true">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
      {open && <Detail outfit={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </div>
  )
}
