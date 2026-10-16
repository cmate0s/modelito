import { useEffect, useRef } from 'react'

// Un único observer para toda la app: marca el elemento al entrar en pantalla y deja de vigilarlo.
const observer =
  typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            ;(entry.target as HTMLElement).dataset.shown = ''
            observer!.unobserve(entry.target)
          }
        },
        { rootMargin: '0px 0px -6% 0px' },
      )

/** Aparición suave al entrar en pantalla. El elemento necesita la clase `reveal`. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!observer) {
      el.dataset.shown = ''
      return
    }
    observer.observe(el)
    return () => observer.unobserve(el)
  }, [])
  return ref
}
