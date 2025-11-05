import React from 'react'
import { motion } from 'framer-motion'
import {
  UserPlus, Heart, CheckCircle, Users, BookOpen, Droplets,
  Home, Award, Crown, Star
} from 'lucide-react'

interface StageIndicatorProps {
  stage: 'new' | 'engaged' | 'closed'
  integrationStage: 'none' | 'assigned_to_district' | 'started_cohort' | 'baptism_class' | 'baptized' | 'cell_group' | 'ministry_assigned' | 'leadership_training' | 'fully_integrated'
  interestedInJoining: boolean
  className?: string
}

const stageConfig = {
  new: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: UserPlus,
    label: 'New Visitor'
  },
  engaged: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Heart,
    label: 'Engaged'
  },
  closed: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: CheckCircle,
    label: 'Closed'
  }
}

const integrationStageConfig = {
  none: { color: 'bg-gray-100 text-gray-600', icon: UserPlus, label: 'Not Started', order: 0 },
  assigned_to_district: { color: 'bg-blue-100 text-blue-700', icon: Users, label: 'District Assigned', order: 1 },
  started_cohort: { color: 'bg-purple-100 text-purple-700', icon: BookOpen, label: 'Cohort Started', order: 2 },
  baptism_class: { color: 'bg-indigo-100 text-indigo-700', icon: BookOpen, label: 'Baptism Class', order: 3 },
  baptized: { color: 'bg-blue-100 text-blue-700', icon: Droplets, label: 'Baptized', order: 4 },
  cell_group: { color: 'bg-green-100 text-green-700', icon: Home, label: 'Cell Group', order: 5 },
  ministry_assigned: { color: 'bg-orange-100 text-orange-700', icon: Award, label: 'Ministry Assigned', order: 6 },
  leadership_training: { color: 'bg-red-100 text-red-700', icon: Crown, label: 'Leadership Training', order: 7 },
  fully_integrated: { color: 'bg-yellow-100 text-yellow-700', icon: Star, label: 'Fully Integrated', order: 8 },
}

export default function StageIndicator({
  stage,
  integrationStage,
  interestedInJoining,
  className = ''
}: StageIndicatorProps) {
  const stageInfo = stageConfig[stage]
  const integrationInfo = integrationStageConfig[integrationStage]
  const StageIcon = stageInfo.icon
  const IntegrationIcon = integrationInfo.icon

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Stage */}
      <div className="flex items-center space-x-3">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${stageInfo.color}`}>
          <StageIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{stageInfo.label}</span>
        </div>

        {interestedInJoining && (
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
            <Heart className="w-3 h-3" />
            <span className="text-xs font-medium">Interested in Joining</span>
          </div>
        )}
      </div>

      {/* Integration Stage */}
      {stage !== 'closed' && integrationStage !== 'none' && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Integration Progress
          </div>

          {/* Integration Stage Badge */}
          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${integrationInfo.color}`}>
            <IntegrationIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{integrationInfo.label}</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Integration</span>
              <span>{integrationInfo.order}/8</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(integrationInfo.order / 8) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Integration Milestones */}
      {stage !== 'closed' && integrationStage !== 'none' && (
        <div className="grid grid-cols-4 gap-1 max-w-xs">
          {Object.entries(integrationStageConfig)
            .filter(([key]) => key !== 'none')
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([key, config]) => (
              <div
                key={key}
                className={`h-2 rounded-full transition-colors ${
                  config.order <= integrationInfo.order
                    ? 'bg-green-400'
                    : 'bg-gray-200'
                }`}
                title={config.label}
              />
            ))}
        </div>
      )}
    </div>
  )
}