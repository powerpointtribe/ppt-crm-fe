import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Edit3,
  Users,
  Group,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Settings
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import BulkEditModal from '@/components/ui/BulkEditModal'

interface UpdateOperation {
  id: string
  field: string
  operation: 'set' | 'append' | 'prepend' | 'replace'
  value: string
  condition?: string
}

export default function BulkUpdate() {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [updateOperations, setUpdateOperations] = useState<UpdateOperation[]>([])
  const navigate = useNavigate()

  const entityTypes = [
    {
      id: 'members',
      name: 'Members',
      description: 'Update church member information in bulk',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      totalRecords: 1250,
      updatableFields: [
        { field: 'membershipStatus', label: 'Membership Status', type: 'select' },
        { field: 'district', label: 'District', type: 'select' },
        { field: 'ministries', label: 'Ministries', type: 'multiselect' },
        { field: 'phone', label: 'Phone Number', type: 'text' },
        { field: 'address', label: 'Address', type: 'text' }
      ]
    },
    {
      id: 'groups',
      name: 'Groups',
      description: 'Update group settings and member assignments',
      icon: Group,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      totalRecords: 45,
      updatableFields: [
        { field: 'status', label: 'Group Status', type: 'select' },
        { field: 'meetingDay', label: 'Meeting Day', type: 'select' },
        { field: 'leader', label: 'Group Leader', type: 'select' },
        { field: 'description', label: 'Description', type: 'text' }
      ]
    },
    {
      id: 'first-timers',
      name: 'First Timers',
      description: 'Update visitor follow-up status and information',
      icon: UserPlus,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      totalRecords: 320,
      updatableFields: [
        { field: 'followUpStatus', label: 'Follow-up Status', type: 'select' },
        { field: 'assignedTo', label: 'Assigned To', type: 'select' },
        { field: 'priority', label: 'Priority Level', type: 'select' },
        { field: 'notes', label: 'Notes', type: 'text' }
      ]
    }
  ]

  const handleEntitySelect = (entityId: string) => {
    setSelectedEntity(entityId)
    setUpdateModalOpen(true)
  }

  const handleUpdateSuccess = (result: any) => {
    setUpdateModalOpen(false)
    setSelectedEntity(null)
    setSelectedRecords([])
  }

  const getEntityData = (entityId: string) => {
    return entityTypes.find(e => e.id === entityId)
  }

  return (
    <Layout title="Bulk Update">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/bulk-operations')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Bulk Operations
            </Button>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-foreground">Bulk Update</h1>
            <p className="text-muted-foreground">Update multiple records at once</p>
          </div>
        </motion.div>

        {/* Update Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">142</div>
                <div className="text-sm text-muted-foreground">Successful Updates</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">5</div>
                <div className="text-sm text-muted-foreground">Failed Updates</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Edit3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">1,890</div>
                <div className="text-sm text-muted-foreground">Records Updated</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <RefreshCw className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">3</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Entity Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Select Data Type</h2>
            <p className="text-muted-foreground">Choose the type of data you want to update</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {entityTypes.map((entity, index) => (
              <motion.div
                key={entity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className={`p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 ${entity.borderColor} ${entity.bgColor}`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${entity.gradient} rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <entity.icon className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2">{entity.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{entity.description}</p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Total records:</span>
                        <Badge variant="outline">{entity.totalRecords.toLocaleString()}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Updatable fields:</span>
                        <Badge variant="secondary">{entity.updatableFields.length}</Badge>
                      </div>
                      <div className="text-xs text-center text-muted-foreground pt-2 border-t">
                        Last updated 2 hours ago
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => handleEntitySelect(entity.id)}
                        className="w-full"
                        size="sm"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Update {entity.name}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(`/bulk-operations/${entity.id}/update`)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Advanced Update
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Common Update Operations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Common Update Operations</h3>
              <p className="text-muted-foreground">Quick access to frequently used bulk updates</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: 'Update Member Status',
                  description: 'Change membership status for multiple members',
                  entityType: 'members',
                  field: 'membershipStatus',
                  icon: Users,
                  color: 'bg-blue-500'
                },
                {
                  title: 'Assign to Districts',
                  description: 'Move members to different districts',
                  entityType: 'members',
                  field: 'district',
                  icon: Users,
                  color: 'bg-green-500'
                },
                {
                  title: 'Update Group Leaders',
                  description: 'Assign new leaders to multiple groups',
                  entityType: 'groups',
                  field: 'leader',
                  icon: Group,
                  color: 'bg-purple-500'
                },
                {
                  title: 'Set Follow-up Status',
                  description: 'Update visitor follow-up progress',
                  entityType: 'first-timers',
                  field: 'followUpStatus',
                  icon: UserPlus,
                  color: 'bg-orange-500'
                },
                {
                  title: 'Change Group Status',
                  description: 'Activate or deactivate multiple groups',
                  entityType: 'groups',
                  field: 'status',
                  icon: Group,
                  color: 'bg-indigo-500'
                },
                {
                  title: 'Assign Follow-up Person',
                  description: 'Assign visitors to follow-up team',
                  entityType: 'first-timers',
                  field: 'assignedTo',
                  icon: UserPlus,
                  color: 'bg-teal-500'
                }
              ].map((operation, index) => (
                <motion.div
                  key={operation.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 cursor-pointer group"
                  onClick={() => {
                    setSelectedEntity(operation.entityType)
                    setUpdateModalOpen(true)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${operation.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <operation.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{operation.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{operation.description}</p>
                      <Badge variant="outline" className="text-xs">
                        {operation.entityType.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Update Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Update Guidelines</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Always preview changes before applying
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Use filters to target specific records
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Backup important data before bulk updates
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Test updates on a small batch first
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Safety Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    Automatic validation before updates
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    Rollback capability for recent changes
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    Detailed operation logs and history
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    Confirmation required for critical changes
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Update Modal */}
      {selectedEntity && (
        <BulkEditModal
          isOpen={updateModalOpen}
          onClose={() => {
            setUpdateModalOpen(false)
            setSelectedEntity(null)
          }}
          entityName={getEntityData(selectedEntity)?.name || ''}
          entityType={selectedEntity}
          selectedRecords={selectedRecords}
          onSuccess={handleUpdateSuccess}
          availableFields={getEntityData(selectedEntity)?.updatableFields || []}
        />
      )}
    </Layout>
  )
}