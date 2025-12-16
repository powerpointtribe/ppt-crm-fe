import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Shield, Search, AlertCircle } from 'lucide-react'
import { rolesService, Role } from '@/services/roles'
import { useAuth } from '@/contexts/AuthContext-unified'
import { PermissionGuard } from '@/guards'
import Layout from '@/components/Layout'

export default function RolesListPage() {
  const navigate = useNavigate()
  const { hasPermission, canAccessModule } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [filterSystem, setFilterSystem] = useState<boolean | undefined>(undefined)

  // Check if user has permission to view roles
  const canViewRoles = hasPermission('roles:view-roles')
  const canCreateRole = hasPermission('roles:create-role')
  const canEditRole = hasPermission('roles:update-role')
  const canDeleteRole = hasPermission('roles:delete-role')

  // If user doesn't have view permission, show access denied message
  if (!canViewRoles) {
    return (
      <Layout title="Roles Management">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600 mb-4">
            You don't have permission to view roles. Please contact your administrator.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </Layout>
    )
  }

  useEffect(() => {
    fetchRoles()
  }, [filterActive, filterSystem])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const data = await rolesService.getRoles({
        isActive: filterActive,
        isSystemRole: filterSystem,
        search: searchTerm
      })
      setRoles(data)
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchRoles()
  }

  const handleDelete = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return
    }

    try {
      await rolesService.deleteRole(roleId)
      fetchRoles()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete role')
    }
  }

  // Search Section to be displayed in header
  const searchSection = (
    <form onSubmit={handleSearch} className="flex gap-3 flex-wrap items-center w-full">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      <select
        value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'}
        onChange={(e) => setFilterActive(e.target.value === 'all' ? undefined : e.target.value === 'active')}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <select
        value={filterSystem === undefined ? 'all' : filterSystem ? 'system' : 'custom'}
        onChange={(e) => setFilterSystem(e.target.value === 'all' ? undefined : e.target.value === 'system')}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
      >
        <option value="all">All Types</option>
        <option value="system">System Roles</option>
        <option value="custom">Custom Roles</option>
      </select>

      <button
        type="submit"
        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
      >
        Search
      </button>
    </form>
  )

  return (
    <Layout
      title="Roles Management"
      subtitle="Manage user roles and their permissions"
      searchSection={searchSection}
    >
      {/* Actions Row */}
      <div className="flex justify-end mb-6">
        <PermissionGuard permission="roles:create-role">
          <Link
            to="/roles/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create Role
          </Link>
        </PermissionGuard>
      </div>

      {/* Roles List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading roles...</p>
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No roles found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {roles.map((role) => (
            <div
              key={role._id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {role.displayName}
                    </h3>
                    {role.isSystemRole && (
                      <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-medium">
                        System
                      </span>
                    )}
                    {!role.isActive && (
                      <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-3">
                    {role.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      {Array.isArray(role.permissions) ? role.permissions.length : 0} permissions
                    </span>
                    <span className="font-mono text-xs">
                      {role.slug}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/roles/${role._id}`}
                    className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    View
                  </Link>
                  <PermissionGuard permission="roles:update-role">
                    <button
                      onClick={() => navigate(`/roles/${role._id}/edit`)}
                      className="px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </PermissionGuard>
                  <PermissionGuard permission="roles:delete-role">
                    {!role.isSystemRole && (
                      <button
                        onClick={() => handleDelete(role._id, role.displayName)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </PermissionGuard>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
