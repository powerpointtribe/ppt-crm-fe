import React, { Component, ReactNode } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <div className="flex flex-col items-center text-center gap-3 p-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
              <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
                An unexpected error occurred while loading this page. Refreshing usually fixes it.
                If the problem persists, please contact support.
              </p>
            </div>

            {this.state.error && (
              <details className="mt-4 rounded-md border border-border bg-muted/50 text-left">
                <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Error details
                </summary>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words border-t border-border px-3 py-2 font-mono text-xs text-foreground">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <Button onClick={() => window.location.reload()} className="mt-5 w-full">
              Refresh page
            </Button>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}