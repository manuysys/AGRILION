'use client'

import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

/**
 * Fallback estático elegante: si el asset externo (prod.spline.design) falla
 * —sin conexión, 404 o WebGL no disponible— la landing no queda con un área
 * rota, sino con un panel oscuro coherente con la identidad visual.
 */
function StaticFallback({ className }: { className?: string }) {
  return (
    <div className={`${className ?? ''} relative flex items-center justify-center`}>
      <div
        className="absolute w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-center w-40 h-40 rounded-full border border-emerald-500/20 bg-emerald-500/5">
        <span
          className="absolute inset-0 rounded-full border border-emerald-500/30 animate-pulse"
          aria-hidden="true"
        />
        <span
          className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]"
          aria-hidden="true"
        />
      </div>
      <span className="sr-only">Escena 3D no disponible en este momento</span>
    </div>
  )
}

function LoadingFallback({ className }: { className?: string }) {
  return (
    <div className={`${className ?? ''} relative flex items-center justify-center`}>
      <div className="relative flex items-center justify-center w-24 h-24">
        <span
          className="absolute inset-0 rounded-full border border-emerald-500/20 animate-pulse"
          aria-hidden="true"
        />
        <span
          className="w-2.5 h-2.5 rounded-full bg-emerald-400"
          aria-hidden="true"
        />
      </div>
      <span className="sr-only">Cargando escena 3D…</span>
    </div>
  )
}

/**
 * Captura errores al importar o montar la escena externa (la API pública de
 * Spline no expone onError) y muestra el fallback estático.
 */
class SplineErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('SplineScene: no se pudo cargar la escena', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [timedOut, setTimedOut] = useState(false)
  const loadedRef = useRef(false)

  // Si el asset remoto tarda demasiado o falla en silencio (el runtime de
  // Spline puede fallar sin lanzar un error a React), mostrar el fallback.
  // El reset de `timedOut` ocurre al remontar (la escena es constante por página).
  useEffect(() => {
    loadedRef.current = false
    const timer = window.setTimeout(() => {
      if (!loadedRef.current) setTimedOut(true)
    }, 12_000)
    return () => window.clearTimeout(timer)
  }, [scene])

  const fallback = <StaticFallback className={className} />

  return (
    <SplineErrorBoundary fallback={fallback}>
      {timedOut ? (
        fallback
      ) : (
        <Suspense fallback={<LoadingFallback className={className} />}>
          <Spline
            scene={scene}
            className={className}
            onLoad={() => {
              loadedRef.current = true
            }}
          />
        </Suspense>
      )}
    </SplineErrorBoundary>
  )
}
