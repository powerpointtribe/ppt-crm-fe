import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Shield, Eye, AlertCircle, Lock, Filter, X } from 'lucide-react'
import { rolesService, Role } from '@/services/roles'
import { useAuth } from '@/contexts/AuthContext-unified'
import { PermissionGuard } from '@/guards'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import PageToolbar from '@/components/ui/PageToolbar'
import FilterModal from '@/components/ui/FilterModal'
import { SkeletonTable } from '@/components/ui/Skeleton'

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const typeOptions = [
  { value: 'system', label: 'System Roles' },
  { value: 'custom', label: 'Custom Roles' },
]

export default function RolesListPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Applied filter states
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Temporary filter states (for modal)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [tempStatusFilter, setTempStatusFilter] = useState('')
  const [tempTypeFilter, setTempTypeFilter] = useState('')

  const hasActiveFilters = statusFilter || typeFilter
  const activeFilterCount = [statusFilter, typeFilter].filter(Boolean).length

  const canViewRoles = hasPermission('roles:view-roles')

  const openFilterModal = () => {
    setTempStatusFilter(statusFilter)
    setTempTypeFilter(typeFilter)
    setShowFilterModal(true)
  }

  const closeFilterModal = () => {
    setShowFilterModal(false)
  }

  const applyFilters = () => {
    setStatusFilter(tempStatusFilter)
    setTypeFilter(tempTypeFilter)
    setShowFilterModal(false)
  }

  const clearTempFilters = () => {
    setTempStatusFilter('')
    setTempTypeFilter('')
  }

  const clearAppliedFilters = () => {
    setStatusFilter('')
    setTypeFilter('')
  }

  if (!canViewRoles) {
    return (
      <Layout title="Roles Management">
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to view roles.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </Layout>
    )
  }

  useEffect(() => {
    fetchRoles()
  }, [statusFilter, typeFilter])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const filterActive = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined
      const filterSystem = typeFilter === 'system' ? true : typeFilter === 'custom' ? false : undefined

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

  const handleSearch = () => {
    fetchRoles()
  }

  const handleDelete = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete "${roleName}"?`)) {
      return
    }
    try {
      await rolesService.deleteRole(roleId)
      fetchRoles()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete role')
    }
  }

  const filteredRoles = roles.filter(role => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        role.displayName.toLowerCase().includes(search) ||
        role.name.toLowerCase().includes(search) ||
        role.slug?.toLowerCase().includes(search)
      )
    }
    return true
  })

  if (loading) {
    return (
      <Layout title="Roles" subtitle="Manage roles and permissions">
        <SkeletonTable />
      </Layout>
    )
  }

  return (
    <Layout title="Roles" subtitle="Manage roles and permissions">
      <div className="space-y-4">
        <PageToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={handleSearch}
          searchPlaceholder="Search roles..."
          secondaryActions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openFilterModal}
                className={hasActiveFilters ? 'border-primary-500 text-primary-600' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAppliedFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          }
          primaryActions={
            <PermissionGuard permission="roles:create-role">
              <Button size="sm" onClick={() => navigate('/roles/create')}>
                <Plus className="h-4 w-4 mr-1.5" />
                New Role
              </Button>
            </PermissionGuard>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            {filteredRoles.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No roles found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRoles.map((role, index) => (
                      <motion.tr
                        key={role._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              role.isSystemRole
                                ? 'bg-purple-100 text-purple-600'
                                : 'bg-primary-100 text-primary-600'
                            }`}>
                              {role.isSystemRole ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{role.displayName}</p>
                              <p className="text-xs text-gray-500 font-mono">{role.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {role.isSystemRole ? (
                            <Badge variant="secondary" className="text-xs">System</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Custom</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Shield className="w-3.5 h-3.5 text-gray-400" />
                            <span>{Array.isArray(role.permissions) ? role.permissions.length : 0}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {role.isActive ? (
                            <Badge variant="success" className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/roles/${role._id}`)}
                              className="h-8 w-8 p-0"
                              title="View"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </Button>
                            <PermissionGuard permission="roles:update-role">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/roles/${role._id}/edit`)}
                                className="h-8 w-8 p-0"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4 text-gray-500" />
                              </Button>
                            </PermissionGuard>
                            <PermissionGuard permission="roles:delete-role">
                              {!role.isSystemRole && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(role._id, role.displayName)}
                                  className="h-8 w-8 p-0 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              )}
                            </PermissionGuard>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Summary Footer */}
        {filteredRoles.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between text-sm text-gray-500 px-1"
          >
            <span>
              Showing {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                {filteredRoles.filter(r => r.isSystemRole).length} System
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                {filteredRoles.filter(r => !r.isSystemRole).length} Custom
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={closeFilterModal}
        onApply={applyFilters}
        onReset={clearTempFilters}
        title="Filter Roles"
        subtitle="Refine your role list"
        activeFilterCount={activeFilterCount}
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: tempStatusFilter,
            onChange: setTempStatusFilter,
            options: statusOptions,
            placeholder: 'All statuses',
          },
          {
            id: 'type',
            label: 'Role Type',
            value: tempTypeFilter,
            onChange: setTempTypeFilter,
            options: typeOptions,
            placeholder: 'All types',
          },
        ]}
      />
    </Layout>
  )
}
