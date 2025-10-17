import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Upload,
  Users,
  Group,
  UserPlus,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import BulkUploadModal from '@/components/ui/BulkUploadModal'

export default function BulkUpload() {
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const navigate = useNavigate()

  const entityTypes = [
    {
      id: 'members',
      name: 'Members',
      description: 'Upload church members from CSV or Excel files',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      maxFileSize: 10,
      allowedFormats: ['.csv', '.xlsx', '.xls'],
      templateColumns: ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender'],
      sampleCount: '250+ members uploaded this month'
    },
    {
      id: 'groups',
      name: 'Groups',
      description: 'Import ministry groups and their members',
      icon: Group,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      maxFileSize: 5,
      allowedFormats: ['.csv', '.xlsx'],
      templateColumns: ['name', 'description', 'type', 'leader', 'meetingDay'],
      sampleCount: '45 groups imported this month'
    },
    {
      id: 'first-timers',
      name: 'First Timers',
      description: 'Upload visitor and first-timer information',
      icon: UserPlus,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      maxFileSize: 5,
      allowedFormats: ['.csv', '.xlsx'],
      templateColumns: ['firstName', 'lastName', 'email', 'phone', 'visitDate'],
      sampleCount: '120 visitors processed this month'
    }
  ]

  const handleEntitySelect = (entityId: string) => {
    setSelectedEntity(entityId)
    setUploadModalOpen(true)
  }

  const handleUploadSuccess = (result: any) => {
    setUploadModalOpen(false)
    setSelectedEntity(null)
    // Show success notification or redirect
  }

  const handleDownloadTemplate = (entityId: string) => {
    // Download template logic
    console.log('Downloading template for:', entityId)
  }

  return (
    <Layout title="Bulk Upload">
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
            <h1 className="text-2xl font-bold text-foreground">Bulk Upload</h1>
            <p className="text-muted-foreground">Import data from CSV or Excel files</p>
          </div>
        </motion.div>

        {/* Upload Statistics */}
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
                <div className="text-2xl font-bold text-foreground">156</div>
                <div className="text-sm text-muted-foreground">Successful Uploads</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">8</div>
                <div className="text-sm text-muted-foreground">Failed Uploads</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">2,845</div>
                <div className="text-sm text-muted-foreground">Records Uploaded</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <RefreshCw className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-foreground">6</div>
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
            <p className="text-muted-foreground">Choose the type of data you want to upload</p>
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
                        <span className="text-muted-foreground">Max file size:</span>
                        <Badge variant="outline">{entity.maxFileSize}MB</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Formats:</span>
                        <div className="flex gap-1">
                          {entity.allowedFormats.map((format) => (
                            <Badge key={format} variant="secondary" className="text-xs">
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-center text-muted-foreground pt-2 border-t">
                        {entity.sampleCount}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => handleEntitySelect(entity.id)}
                        className="w-full"
                        size="sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload {entity.name}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDownloadTemplate(entity.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Upload Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-3">Upload Guidelines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">File Requirements</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Use CSV or Excel format (.csv, .xlsx, .xls)</li>
                      <li>• Maximum file size: 10MB</li>
                      <li>• First row should contain column headers</li>
                      <li>• Ensure data is properly formatted</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Data Validation</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Email addresses must be valid format</li>
                      <li>• Phone numbers should include country code</li>
                      <li>• Dates should be in YYYY-MM-DD format</li>
                      <li>• Required fields cannot be empty</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Upload Modal */}
      {selectedEntity && (
        <BulkUploadModal
          isOpen={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false)
            setSelectedEntity(null)
          }}
          entityName={entityTypes.find(e => e.id === selectedEntity)?.name || ''}
          entityType={selectedEntity}
          onSuccess={handleUploadSuccess}
          allowedFormats={entityTypes.find(e => e.id === selectedEntity)?.allowedFormats}
          maxFileSize={entityTypes.find(e => e.id === selectedEntity)?.maxFileSize}
          templateColumns={entityTypes.find(e => e.id === selectedEntity)?.templateColumns}
        />
      )}
    </Layout>
  )
}