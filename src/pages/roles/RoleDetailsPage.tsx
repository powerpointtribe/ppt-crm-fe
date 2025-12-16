import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Shield, Users, AlertCircle } from 'lucide-react'
import { rolesService, RoleWithPermissions, Permission } from '@/services/roles'
import { useAuth } from '@/contexts/AuthContext-unified'
import { PermissionGuard } from '@/guards'
import Layout from '@/components/Layout'

export default function RoleDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [role, setRole] = useState<RoleWithPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user has permission to view role details
  const canViewRoleDetails = hasPermission('roles:view-role-details')

  // If user doesn't have view permission, show access denied message
  if (!canViewRoleDetails) {
    return (
      <Layout title="Role Details">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-4xl mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600 mb-4">
            You don't have permission to view role details. Please contact your administrator.
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
      fetchRole()
    }
  }, [id])

  const fetchRole = async () => {
    if (!id) return

    try {
      setLoading(true)
      const data = await rolesService.getRoleById(id, true)
      setRole(data)
    } catch (error) {
      console.error('Failed to fetch role:', error)
      alert('Failed to load role')
      navigate('/roles')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Role Details">
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

  // Group permissions by module
  const permissions = Array.isArray(role.permissions) ? role.permissions as Permission[] : []

  const permissionsByModule = permissions.reduce((acc, perm) => {
    // Only process if permission is an object (populated)
    if (typeof perm === 'object' && perm.module) {
      if (!acc[perm.module]) {
        acc[perm.module] = []
      }
      acc[perm.module].push(perm)
    }
    return acc
  }, {} as Record<string, Permission[]>)

  const moduleNames = Object.keys(permissionsByModule).sort()

  return (
    <Layout
      title={`${role.displayName} - Role Details`}
      subtitle={role.description || 'View role information and assigned permissions'}
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
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {role.isSystemRole && (
                  <span className="px-3 py-1 rounded bg-red-100 text-red-800 text-sm font-medium">
                    System Role
                  </span>
                )}
                {!role.isActive && (
                  <span className="px-3 py-1 rounded bg-gray-100 text-gray-800 text-sm font-medium">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="font-mono">{role.slug}</span>
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  {permissions.length} permissions
                </span>
              </div>
            </div>

          <PermissionGuard permission="roles:update-role">
            <Link
              to={`/roles/${role._id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <Edit className="w-5 h-5" />
              Edit Role
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Permissions</h2>

        {permissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No permissions assigned to this role</p>
          </div>
        ) : (
          <div className="space-y-4">
            {moduleNames.map(module => {
              const modulePermissions = permissionsByModule[module] || []

              return (
                <div key={module} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900 capitalize">
                      {module.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({modulePermissions.length} permission{modulePermissions.length !== 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {modulePermissions.map(permission => (
                      <div
                        key={permission._id}
                        className="p-3 border border-gray-200 rounded-lg"
                      >
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
                        {permission.endpoint && (
                          <div className="text-xs text-gray-500 mt-2">
                            {permission.endpoint.method} {permission.endpoint.path}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </div>
    </Layout>
  )
}
