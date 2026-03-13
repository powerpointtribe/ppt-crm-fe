import { useState, useEffect } from 'react'
import { Bell, Palette, Monitor, Sun, Moon, Save, RefreshCw, Lock, Eye, EyeOff, KeyRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Layout from '@/components/Layout'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { apiService } from '@/services/api'
import { membersService } from '@/services/members-unified'
import { showToast } from '@/utils/toast'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required').min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

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
  theme: (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system',
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

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
      checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
        checked ? 'translate-x-4' : 'translate-x-0.5'
      } mt-0.5`}
    />
  </button>
)

const PasswordField = ({
  label,
  show,
  onToggle,
  error,
  ...props
}: {
  label: string
  show: boolean
  onToggle: () => void
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
      <input
        type={show ? 'text' : 'password'}
        className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
)

export default function UserSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<any>(null)
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [activeSection, setActiveSection] = useState<'preferences' | 'security'>('preferences')

  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    setError: setPasswordError,
    reset: resetPasswordForm,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  const handlePasswordChange = async (data: ChangePasswordFormData) => {
    setChangingPassword(true)
    try {
      await membersService.changePassword(data.currentPassword, data.newPassword)
      showToast('Password changed successfully', 'success')
      resetPasswordForm()
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message
      if (errorMessage?.toLowerCase().includes('current password')) {
        setPasswordError('currentPassword', { type: 'manual', message: 'Current password is incorrect' })
      } else {
        setPasswordError('newPassword', { type: 'manual', message: errorMessage || 'An error occurred. Please try again.' })
      }
    } finally {
      setChangingPassword(false)
    }
  }

  useEffect(() => { loadPreferences() }, [])
  useEffect(() => { applyTheme(preferences.theme) }, [preferences.theme])

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement
    if (theme === 'system') {
      root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
    localStorage.setItem('theme', theme)
  }

  const loadPreferences = async () => {
    try {
      setError(null)
      const data = await apiService.get<UserPreferences>('/members/my-preferences')
      // Preserve the locally saved theme over API defaults
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
      const merged = { ...defaultPreferences, ...data }
      if (savedTheme && !data?.theme) {
        merged.theme = savedTheme
      }
      setPreferences(merged)
    } catch (error: any) {
      console.error('Error loading preferences:', error)
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
      if (savedTheme) setPreferences(prev => ({ ...prev, theme: savedTheme }))
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
    category: K, key: NK, value: UserPreferences[K][NK]
  ) => {
    setPreferences(prev => ({ ...prev, [category]: { ...prev[category], [key]: value } }))
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

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
      <div className="max-w-xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {[
            { key: 'preferences' as const, label: 'Preferences', icon: Palette },
            { key: 'security' as const, label: 'Security', icon: KeyRound },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeSection === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeSection === 'preferences' && (
          <div className="space-y-3">
            {/* Theme */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Theme</h3>
              <div className="flex gap-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference('theme', option.value as 'light' | 'dark' | 'system')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      preferences.theme === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-3.5 w-3.5 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notifications</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {[
                  { key: 'email' as const, label: 'Email notifications', desc: 'Receive updates via email' },
                  { key: 'sms' as const, label: 'SMS notifications', desc: 'Receive updates via SMS' },
                  { key: 'push' as const, label: 'Push notifications', desc: 'Browser push notifications' },
                  { key: 'followUpReminders' as const, label: 'Follow-up reminders', desc: 'Get reminded about pending follow-ups' },
                  { key: 'weeklyReports' as const, label: 'Weekly reports', desc: 'Receive weekly summary emails' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{setting.label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{setting.desc}</p>
                    </div>
                    <Toggle
                      checked={preferences.notifications[setting.key]}
                      onChange={(v) => updateNestedPreference('notifications', setting.key, v)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Display */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="h-3.5 w-3.5 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Display</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                <div className="flex items-center justify-between py-2.5 first:pt-0">
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">Compact mode</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Reduce spacing for more content</p>
                  </div>
                  <Toggle
                    checked={preferences.display.compactMode}
                    onChange={(v) => updateNestedPreference('display', 'compactMode', v)}
                  />
                </div>
                <div className="flex items-center justify-between py-2.5 last:pb-0">
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">Welcome message</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Show greeting on dashboard</p>
                  </div>
                  <Toggle
                    checked={preferences.display.showWelcomeMessage}
                    onChange={(v) => updateNestedPreference('display', 'showWelcomeMessage', v)}
                  />
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" onClick={loadPreferences} variant="outline">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change Password</h3>
            </div>

            <form onSubmit={handlePasswordSubmit(handlePasswordChange)} className="space-y-3 max-w-sm">
              <PasswordField
                label="Current Password"
                placeholder="Enter current password"
                show={showCurrentPassword}
                onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
                error={passwordErrors.currentPassword?.message}
                {...registerPassword('currentPassword')}
              />
              <PasswordField
                label="New Password"
                placeholder="Min. 8 characters"
                show={showNewPassword}
                onToggle={() => setShowNewPassword(!showNewPassword)}
                error={passwordErrors.newPassword?.message}
                {...registerPassword('newPassword')}
              />
              <PasswordField
                label="Confirm New Password"
                placeholder="Re-enter new password"
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword')}
              />

              <div className="pt-1">
                <Button type="submit" size="sm" disabled={changingPassword}>
                  {changingPassword ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5 mr-1.5" />}
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  )
}
