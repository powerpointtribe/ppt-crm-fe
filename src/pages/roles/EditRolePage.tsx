import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Shield, Check, AlertCircle } from 'lucide-react'
import { rolesService, Role, Permission, UpdateRoleDto, MembershipStatusTag } from '@/services/roles'
import { useAuth } from '@/contexts/AuthContext-unified'
import Layout from '@/components/Layout'

export default function EditRolePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [role, setRole] = useState<Role | null>(null)
  const [allPermissions, setAllPermissions] = useState<Record<string, Permission[]>>({})
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<UpdateRoleDto>({
    displayName: '',
    description: '',
    colorCode: '#6B7280',
    isActive: true,
    membershipStatusTag: undefined
  })

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

  // Check if user has permission to update roles
  const canUpdateRole = hasPermission('roles:update-role')
  const canAssignPermissions = hasPermission('roles:assign-permissions')

  // If user doesn't have update permission, show access denied message
  if (!canUpdateRole) {
    return (
      <Layout title="Edit Role">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-6xl mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600 mb-4">
            You don't have permission to edit roles. Please contact your administrator.
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

  useEffect(() => {
    if (id) {
      fetchRoleAndPermissions()
    }
  }, [id])

  const fetchRoleAndPermissions = async () => {
    if (!id) return

    try {
      setLoading(true)
      const [roleData, permissionsByModule] = await Promise.all([
        rolesService.getRoleById(id, true),
        rolesService.getPermissionsByModule()
      ])

      setRole(roleData)
      setFormData({
        displayName: roleData.displayName,
        description: roleData.description,
        colorCode: roleData.colorCode || '#6B7280',
        isActive: roleData.isActive,
        membershipStatusTag: roleData.membershipStatusTag
      })
      setAllPermissions(permissionsByModule)

      // Set currently selected permissions (extract IDs from populated permission objects)
      const permissionIds = (roleData.permissions || []).map((p: any) =>
        typeof p === 'string' ? p : p._id
      )
      setSelectedPermissions(new Set(permissionIds))
    } catch (error) {
      console.error('Failed to fetch role:', error)
      alert('Failed to load role')
      navigate('/roles')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId)
      } else {
        newSet.add(permissionId)
      }
      return newSet
    })
  }

  const handleSelectAllInModule = (module: string, select: boolean) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev)
      const modulePerms = allPermissions[module] || []
      modulePerms.forEach(perm => {
        if (select) {
          newSet.add(perm._id)
        } else {
          newSet.delete(perm._id)
        }
      })
      return newSet
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    try {
      setSaving(true)

      // Update role details
      await rolesService.updateRole(id, formData)

      // Update permissions (replace all) - only if user has permission
      if (canAssignPermissions && selectedPermissions.size > 0) {
        await rolesService.assignPermissions(id, Array.from(selectedPermissions))
      }

      alert('Role updated successfully')
      navigate('/roles')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update role')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Edit Role">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading role...</p>
        </div>
      </Layout>
    )
  }

  if (!role) {
    return null
  }

  const moduleNames = Object.keys(allPermissions).sort()
  const totalPermissions = Object.values(allPermissions).reduce((sum, perms) => sum + perms.length, 0)
  const selectedCount = selectedPermissions.size

  return (
    <Layout
      title="Edit Role"
      subtitle="Modify role details and manage permissions"
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/roles')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Roles
          </button>
          {role.isSystemRole && (
            <span className="inline-block mt-2 px-3 py-1 rounded bg-red-100 text-red-800 text-sm font-medium">
              System Role
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Role Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name (readonly for system roles) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={role.name}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            {/* Slug (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <input
                type="text"
                value={role.slug}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 font-mono text-sm"
              />
            </div>
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
              disabled={role.isSystemRole}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              disabled={role.isSystemRole}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
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

          {/* Active Status */}
          {!role.isSystemRole && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active (users can be assigned this role)
              </label>
            </div>
          )}
        </div>

        {/* Permissions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Permissions</h2>
            <div className="text-sm text-gray-600">
              {selectedCount} / {totalPermissions} permissions selected
            </div>
          </div>

          <div className="space-y-4">
            {moduleNames.map(module => {
              const permissions = allPermissions[module] || []
              const moduleSelectedCount = permissions.filter(p => selectedPermissions.has(p._id)).length
              const allSelected = moduleSelectedCount === permissions.length

              return (
                <div key={module} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900 capitalize">
                        {module.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({moduleSelectedCount}/{permissions.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectAllInModule(module, !allSelected)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {permissions.map(permission => {
                      const isSelected = selectedPermissions.has(permission._id)

                      return (
                        <label
                          key={permission._id}
                          className={`flex items-start gap-2 p-3 rounded-lg border-2 cursor-pointer transition ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="relative flex items-center justify-center mt-0.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handlePermissionToggle(permission._id)}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {permission.displayName}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mt-1">
                              {permission.name}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-gray-600 mt-1">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 bg-white rounded-lg shadow-sm p-6">
          <button
            type="button"
            onClick={() => navigate('/roles')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </Layout>
  )
}
