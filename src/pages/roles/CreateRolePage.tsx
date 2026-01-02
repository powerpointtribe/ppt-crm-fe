import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, AlertCircle, Package } from 'lucide-react'
import { rolesService, CreateRoleDto, MembershipStatusTag, ModuleInfo } from '@/services/roles'
import { useAuth } from '@/contexts/AuthContext-unified'
import Layout from '@/components/Layout'

export default function CreateRolePage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(false)
  const [availableModules, setAvailableModules] = useState<ModuleInfo[]>([])
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<CreateRoleDto>({
    name: '',
    slug: '',
    displayName: '',
    description: '',
    colorCode: '#6B7280',
    membershipStatusTag: undefined,
    modules: []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch available modules on mount
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const modules = await rolesService.getAvailableModules()
        setAvailableModules(modules)
      } catch (error) {
        console.error('Failed to fetch available modules:', error)
      }
    }
    fetchModules()
  }, [])

  // Membership status options
  const membershipStatusOptions: { value: MembershipStatusTag | ''; label: string }[] = [
    { value: '', label: 'None (No automatic status change)' },
    { value: 'MEMBER', label: 'Member' },
    { value: 'DC', label: "David's Company (DC)" },
    { value: 'LXL', label: 'League of Xtraordinary Leaders (LXL)' },
    { value: 'DIRECTOR', label: 'Director' },
    { value: 'PASTOR', label: 'Pastor' },
    { value: 'CAMPUS_PASTOR', label: 'Campus Pastor' },
    { value: 'SENIOR_PASTOR', label: 'Senior Pastor' },
  ]

  // Check if user has permission to create roles
  const canCreateRole = hasPermission('roles:create-role')

  // If user doesn't have create permission, show access denied message
  if (!canCreateRole) {
    return (
      <Layout title="Create New Role">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-3xl mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600 mb-4">
            You don't have permission to create roles. Please contact your administrator.
          </p>
          <button
            onClick={() => navigate('/roles')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Return to Roles
          </button>
        </div>
      </Layout>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
      setFormData(prev => ({
        ...prev,
        slug
      }))
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId)
      } else {
        newSet.add(moduleId)
      }
      return newSet
    })
  }

  const handleSelectAllModules = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedModules(new Set(availableModules.map(m => m.identifier)))
    } else {
      setSelectedModules(new Set())
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required'
    if (!formData.displayName.trim()) newErrors.displayName = 'Display name is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setLoading(true)
      const roleData: CreateRoleDto = {
        ...formData,
        modules: Array.from(selectedModules)
      }
      const newRole = await rolesService.createRole(roleData)
      navigate(`/roles/${newRole._id}/edit`)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout
      title="Create New Role"
      subtitle="Create a new role and assign permissions"
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/roles')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Roles
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="e.g., District Coordinator"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug * (auto-generated)
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.slug ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm`}
            placeholder="e.g., district_coordinator"
          />
          {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name *
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${
              errors.displayName ? 'border-red-500' : 'border-gray-300'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="e.g., District Coordinator"
          />
          {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Describe the responsibilities and scope of this role..."
          />
        </div>

        {/* Color Code */}
        <div>
          <label htmlFor="colorCode" className="block text-sm font-medium text-gray-700 mb-1">
            Color Code
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              id="colorCode"
              name="colorCode"
              value={formData.colorCode}
              onChange={handleChange}
              className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.colorCode}
              onChange={(e) => setFormData(prev => ({ ...prev, colorCode: e.target.value }))}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              placeholder="#6B7280"
            />
          </div>
        </div>

        {/* Membership Status Tag */}
        <div>
          <label htmlFor="membershipStatusTag" className="block text-sm font-medium text-gray-700 mb-1">
            Membership Status Tag
          </label>
          <select
            id="membershipStatusTag"
            name="membershipStatusTag"
            value={formData.membershipStatusTag || ''}
            onChange={(e) => {
              const value = e.target.value
              setFormData(prev => ({
                ...prev,
                membershipStatusTag: value ? value as MembershipStatusTag : undefined
              }))
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
          >
            {membershipStatusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            When this role is assigned to a member, their membership status will automatically update to this value.
          </p>
        </div>

        {/* Module Selection */}
        {availableModules.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600" />
                <label className="block text-sm font-medium text-gray-700">
                  Module Access
                </label>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {selectedModules.size} / {availableModules.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectAllModules(selectedModules.size !== availableModules.length)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {selectedModules.size === availableModules.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Select the modules this role should have access to. Users with this role will be able to view data from selected modules.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableModules.map(module => {
                const isSelected = selectedModules.has(module.identifier)
                return (
                  <label
                    key={module.identifier}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleModuleToggle(module.identifier)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {module.displayName}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate('/roles')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Role
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </Layout>
  )
}
