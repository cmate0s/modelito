import { useEffect, useRef } from 'react'

/*
  Botón «atrás» del móvil: cada capa abierta (una pestaña que no es la de inicio, la hoja de una semana,
  el detalle de una foto) añade una entrada al historial del navegador. Atrás cierra la capa de encima;
  solo en la pantalla de inicio, sin capas, sale de la app.
*/

const stack: { id: number; close: () => void }[] = []
let nextId = 1
/** Retrocesos propios pendientes (capas cerradas desde la interfaz) y cuántos popstate hay que ignorar. */
let pendingBacks = 0
let backTimer: number | undefined
let ignoredPops = 0

window.addEventListener('popstate', () => {
  if (ignoredPops > 0) {
    ignoredPops--
    return
  }
  stack.pop()?.close()
})

function push(close: () => void): () => void {
  const id = nextId++
  stack.push({ id, close })
  if (pendingBacks > 0) {
    // se cerró una capa y se abre otra a la vez: se reutiliza su entrada del historial
    pendingBacks--
    if (pendingBacks === 0) {
      clearTimeout(backTimer)
      backTimer = undefined
    }
  } else {
    history.pushState({ modelitoLayer: id }, '')
  }
  return () => {
    const i = stack.findIndex((e) => e.id === id)
    if (i < 0) return // ya la cerró el botón atrás
    stack.splice(i, 1)
    pendingBacks++
    // un instante después, para agrupar varias capas que se cierran juntas en un solo retroceso
    backTimer ??= window.setTimeout(() => {
      const n = pendingBacks
      pendingBacks = 0
      backTimer = undefined
      if (n > 0) {
        ignoredPops++
        history.go(-n)
      }
    }, 0)
  }
}

/** Mientras `active`, el botón atrás ejecuta `onBack` en lugar de salir de la app. */
export function useBackEntry(active: boolean, onBack: () => void) {
  const ref = useRef(onBack)
  useEffect(() => {
    ref.current = onBack
  })
  useEffect(() => {
    if (!active) return
    return push(() => ref.current())
  }, [active])
}
