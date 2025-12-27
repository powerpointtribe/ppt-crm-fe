import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Edit2,
  Shield,
  AlertCircle,
  Lock,
  ChevronDown,
  Hash,
  Layers,
  Eye,
  Plus,
  Trash2,
  Settings
} from 'lucide-react'
import { rolesService, RoleWithPermissions, Permission } from '@/services/roles'
import { useAuth } from '@/contexts/AuthContext-unified'
import { PermissionGuard } from '@/guards'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

// Permission action icons
const actionIcons: Record<string, React.ReactNode> = {
  view: <Eye className="w-3.5 h-3.5" />,
  create: <Plus className="w-3.5 h-3.5" />,
  update: <Edit2 className="w-3.5 h-3.5" />,
  delete: <Trash2 className="w-3.5 h-3.5" />,
  manage: <Settings className="w-3.5 h-3.5" />,
}

const getActionIcon = (permName: string) => {
  const name = permName.toLowerCase()
  if (name.includes('view') || name.includes('read') || name.includes('get')) return actionIcons.view
  if (name.includes('create') || name.includes('add') || name.includes('register')) return actionIcons.create
  if (name.includes('update') || name.includes('edit') || name.includes('assign')) return actionIcons.update
  if (name.includes('delete') || name.includes('remove')) return actionIcons.delete
  return actionIcons.manage
}

const getActionColor = (permName: string) => {
  const name = permName.toLowerCase()
  if (name.includes('view') || name.includes('read') || name.includes('get')) return 'text-blue-600 bg-blue-50'
  if (name.includes('create') || name.includes('add') || name.includes('register')) return 'text-green-600 bg-green-50'
  if (name.includes('update') || name.includes('edit') || name.includes('assign')) return 'text-amber-600 bg-amber-50'
  if (name.includes('delete') || name.includes('remove')) return 'text-red-600 bg-red-50'
  return 'text-purple-600 bg-purple-50'
}

export default function RoleDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const [role, setRole] = useState<RoleWithPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  const canViewRoleDetails = hasPermission('roles:view-role-details')

  if (!canViewRoleDetails) {
    return (
      <Layout title="Role Details">
        <Card className="text-center py-12 max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to view role details.
          </p>
          <Button onClick={() => navigate('/roles')}>
            Return to Roles
          </Button>
        </Card>
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
      // Expand first module by default
      const permissions = Array.isArray(data.permissions) ? data.permissions as Permission[] : []
      const modules = [...new Set(permissions.filter(p => typeof p === 'object' && p.module).map(p => (p as Permission).module))]
      if (modules.length > 0) {
        setExpandedModules(new Set([modules[0]]))
      }
    } catch (error) {
      console.error('Failed to fetch role:', error)
      navigate('/roles')
    } finally {
      setLoading(false)
    }
  }

  const toggleModule = (module: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(module)) {
        next.delete(module)
      } else {
        next.add(module)
      }
      return next
    })
  }

  const expandAll = () => {
    const modules = Object.keys(permissionsByModule)
    setExpandedModules(new Set(modules))
  }

  const collapseAll = () => {
    setExpandedModules(new Set())
  }

  if (loading) {
    return (
      <Layout title="Role Details">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  if (!role) return null

  const permissions = Array.isArray(role.permissions) ? role.permissions as Permission[] : []
  const permissionsByModule = permissions.reduce((acc, perm) => {
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
    <Layout title="Role Details" subtitle={role.displayName}>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button
            onClick={() => navigate('/roles')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Roles
          </button>
        </motion.div>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  role.isSystemRole
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-primary-100 text-primary-600'
                }`}>
                  {role.isSystemRole ? <Lock className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-semibold text-gray-900">{role.displayName}</h1>
                    {role.isSystemRole && (
                      <Badge variant="secondary" className="text-xs">System</Badge>
                    )}
                    {role.isActive ? (
                      <Badge variant="success" className="text-xs">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 font-mono mb-2">{role.slug}</p>
                  {role.description && (
                    <p className="text-sm text-gray-600">{role.description}</p>
                  )}
                </div>
              </div>
              <PermissionGuard permission="roles:update-role">
                <Button size="sm" onClick={() => navigate(`/roles/${role._id}/edit`)}>
                  <Edit2 className="w-4 h-4 mr-1.5" />
                  Edit
                </Button>
              </PermissionGuard>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{permissions.length}</p>
                  <p className="text-xs text-gray-500">Permissions</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{moduleNames.length}</p>
                  <p className="text-xs text-gray-500">Modules</p>
                </div>
              </div>
              {role.level !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Hash className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{role.level}</p>
                    <p className="text-xs text-gray-500">Level</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Permissions Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-700">Permissions by Module</h2>
              {moduleNames.length > 0 && (
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    onClick={expandAll}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Expand All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={collapseAll}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
              )}
            </div>

            {permissions.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">No permissions assigned</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {moduleNames.map((module) => {
                  const modulePermissions = permissionsByModule[module] || []
                  const isExpanded = expandedModules.has(module)

                  return (
                    <div key={module}>
                      <button
                        onClick={() => toggleModule(module)}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-primary-100 text-primary-600 flex items-center justify-center">
                            <Shield className="w-3 h-3" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {module.replace(/[-_]/g, ' ')}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            ({modulePermissions.length})
                          </span>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-2">
                              <div className="bg-gray-50 rounded p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                                {modulePermissions.map((permission, permIndex) => (
                                  <motion.div
                                    key={permission._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: permIndex * 0.01 }}
                                    className="flex items-center gap-1.5 px-2 py-1.5 bg-white rounded border border-gray-100"
                                  >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${getActionColor(permission.name)}`}>
                                      {getActionIcon(permission.name)}
                                    </div>
                                    <span className="text-xs text-gray-700 truncate">
                                      {permission.displayName}
                                    </span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}
