import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { AuthProvider } from './contexts/AuthContext-unified.tsx'
import './index.css'

// Initialize theme before rendering to prevent flash
// Default to light theme - only apply dark if user explicitly selected it
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
  const theme = savedTheme || 'light' // Default to light instead of system

  if (theme === 'system') {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', systemPrefersDark)
  } else {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}

initializeTheme()

// Listen for system theme changes (only applies when user has selected 'system')
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'system') {
    document.documentElement.classList.toggle('dark', e.matches)
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)