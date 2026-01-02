import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Palette, Monitor, Sun, Moon, Save, RefreshCw } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { apiService } from '@/services/api'
import { showToast } from '@/utils/toast'

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    followUpReminders: boolean
    weeklyReports: boolean
  }
  display: {
    compactMode: boolean
    showWelcomeMessage: boolean
  }
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  notifications: {
    email: true,
    sms: false,
    push: true,
    followUpReminders: true,
    weeklyReports: false,
  },
  display: {
    compactMode: false,
    showWelcomeMessage: true,
  },
}

export default function UserSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<any>(null)
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)

  useEffect(() => {
    loadPreferences()
  }, [])

  useEffect(() => {
    applyTheme(preferences.theme)
  }, [preferences.theme])

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement
    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', systemPrefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
    localStorage.setItem('theme', theme)
  }

  const loadPreferences = async () => {
    try {
      setError(null)
      const data = await apiService.get<UserPreferences>('/members/my-preferences')
      setPreferences({ ...defaultPreferences, ...data })
    } catch (error: any) {
      console.error('Error loading preferences:', error)
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
      if (savedTheme) {
        setPreferences(prev => ({ ...prev, theme: savedTheme }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await apiService.patch('/members/my-preferences', preferences)
      localStorage.setItem('theme', preferences.theme)
      showToast('Preferences saved', 'success')
    } catch (error: any) {
      showToast(`Failed to save: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const updateNestedPreference = <K extends 'notifications' | 'display', NK extends keyof UserPreferences[K]>(
    category: K,
    key: NK,
    value: UserPreferences[K][NK]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value },
    }))
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  )

  if (loading) {
    return (
      <Layout title="Settings">
        <div className="flex justify-center items-center h-48">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Settings">
        <ErrorBoundary error={error} onRetry={loadPreferences} />
      </Layout>
    )
  }

  return (
    <Layout title="Settings">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Personalize your experience</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={loadPreferences} variant="outline">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Save
            </Button>
          </div>
        </div>

        {/* Appearance */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">Theme</label>
              <div className="flex gap-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference('theme', option.value as 'light' | 'dark' | 'system')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      preferences.theme === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-400 dark:text-gray-500">Language</label>
                <p className="text-xs text-gray-400 dark:text-gray-600">Coming soon</p>
              </div>
              <select
                value={preferences.language}
                onChange={(e) => updatePreference('language', e.target.value)}
                disabled
                className="px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="yo">Yoruba</option>
                <option value="ig">Igbo</option>
                <option value="ha">Hausa</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>

          <div className="space-y-2">
            {[
              { key: 'email' as const, label: 'Email notifications' },
              { key: 'sms' as const, label: 'SMS notifications' },
              { key: 'push' as const, label: 'Push notifications' },
              { key: 'followUpReminders' as const, label: 'Follow-up reminders' },
              { key: 'weeklyReports' as const, label: 'Weekly reports' },
            ].map((setting) => (
              <div key={setting.key} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-gray-700 dark:text-gray-300">{setting.label}</span>
                <Toggle
                  checked={preferences.notifications[setting.key]}
                  onChange={(v) => updateNestedPreference('notifications', setting.key, v)}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Display */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Display</h2>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-1.5">
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Compact mode</span>
                <p className="text-xs text-gray-500 dark:text-gray-500">Reduce spacing for more content</p>
              </div>
              <Toggle
                checked={preferences.display.compactMode}
                onChange={(v) => updateNestedPreference('display', 'compactMode', v)}
              />
            </div>
            <div className="flex items-center justify-between py-1.5">
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Welcome message</span>
                <p className="text-xs text-gray-500 dark:text-gray-500">Show on dashboard</p>
              </div>
              <Toggle
                checked={preferences.display.showWelcomeMessage}
                onChange={(v) => updateNestedPreference('display', 'showWelcomeMessage', v)}
              />
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
