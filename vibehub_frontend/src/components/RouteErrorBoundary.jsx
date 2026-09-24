import React from 'react'
import { Activity, RefreshCw, Home } from 'lucide-react'

/**
 * Error Boundary for route-level lazy-loaded components.
 * Catches:
 * - Dynamic import / chunk loading failures (e.g. network issues, deploy cache busts)
 * - Render errors inside lazy-loaded page components
 *
 * Provides a branded recovery UI instead of a blank white page.
 */
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, hasAttemptedReload: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error) {
    // Detect chunk/dynamic-import loading failures
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Loading CSS chunk') ||
      error?.message?.includes('Importing a module script failed')

    if (isChunkError && !this.state.hasAttemptedReload) {
      // One-time auto-reload to recover from stale chunk references after a deploy
      this.setState({ hasAttemptedReload: true })
      window.location.reload()
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-outfit p-6">
          <div className="flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
              <Activity className="h-6 w-6 text-rose-500" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Something went wrong
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This page failed to load. This can happen due to a network issue or a recent update.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Home className="h-3.5 w-3.5" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default RouteErrorBoundary
