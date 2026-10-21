let locks = 0

/** Bloquea el scroll de la página mientras haya alguna hoja abierta; devuelve la función que la libera. */
export function lockScroll(): () => void {
  locks++
  document.body.style.overflow = 'hidden'
  let released = false
  return () => {
    if (released) return
    released = true
    if (--locks === 0) document.body.style.overflow = ''
  }
}
