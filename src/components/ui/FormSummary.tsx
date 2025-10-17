import { motion } from 'framer-motion'
import { Check, Edit, User, Phone, Building, Star, Heart, FileText } from 'lucide-react'
import Card from './Card'
import Button from './Button'
import { MemberFormData } from '@/schemas/member'

interface FormSummaryProps {
  data: Partial<MemberFormData>
  onEdit: (step: number) => void
  onSubmit: () => void
  loading?: boolean
  mode: 'create' | 'edit'
}

export default function FormSummary({
  data,
  onEdit,
  onSubmit,
  loading = false,
  mode
}: FormSummaryProps) {
  const sections = [
    {
      id: 1,
      title: 'Personal Information',
      icon: User,
      items: [
        { label: 'Name', value: `${data.firstName || ''} ${data.lastName || ''}`.trim() },
        { label: 'Date of Birth', value: data.dateOfBirth },
        { label: 'Gender', value: data.gender },
        { label: 'Marital Status', value: data.maritalStatus },
        { label: 'Occupation', value: data.occupation }
      ].filter(item => item.value)
    },
    {
      id: 2,
      title: 'Contact & Address',
      icon: Phone,
      items: [
        { label: 'Email', value: data.email },
        { label: 'Phone', value: data.phone },
        { label: 'Address', value: data.address?.street ? `${data.address.street}, ${data.address.city}, ${data.address.state}` : undefined },
        { label: 'Work Address', value: data.workAddress }
      ].filter(item => item.value)
    },
    {
      id: 3,
      title: 'Church Information',
      icon: Building,
      items: [
        { label: 'District', value: data.district },
        { label: 'Unit', value: data.unit },
        { label: 'Membership Status', value: data.membershipStatus?.replace('_', ' ') },
        { label: 'Date Joined', value: data.dateJoined },
        { label: 'Leadership Roles', value: getLeadershipRoles(data) }
      ].filter(item => item.value)
    },
    {
      id: 4,
      title: 'Ministry & Skills',
      icon: Star,
      items: [
        { label: 'Ministries', value: data.ministries?.filter(Boolean).join(', ') },
        { label: 'Skills', value: data.skills?.filter(Boolean).join(', ') }
      ].filter(item => item.value)
    },
    {
      id: 5,
      title: 'Family Information',
      icon: Heart,
      items: [
        { label: 'Spouse', value: data.spouse },
        { label: 'Children', value: data.children?.filter(Boolean).join(', ') },
        { label: 'Emergency Contact', value: data.emergencyContact?.name }
      ].filter(item => item.value)
    },
    {
      id: 6,
      title: 'Additional Details',
      icon: FileText,
      items: [
        { label: 'Notes', value: data.notes }
      ].filter(item => item.value)
    }
  ]

  function getLeadershipRoles(data: Partial<MemberFormData>) {
    const roles = []
    if (data.leadershipRoles?.isDistrictPastor) roles.push('District Pastor')
    if (data.leadershipRoles?.isChamp) roles.push('Champ')
    if (data.leadershipRoles?.isUnitHead) roles.push('Unit Head')
    return roles.join(', ')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center pb-6 border-b border-gray-100">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-3 bg-green-100 rounded-full">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Review Information</h3>
            <p className="text-gray-600">Please review the information before submitting</p>
          </div>
        </div>
      </div>

      {/* Summary Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="p-6 h-full hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <section.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">{section.title}</h4>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(section.id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>

              <div className="space-y-3">
                {section.items.length > 0 ? (
                  section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-600 flex-shrink-0 w-1/3">
                        {item.label}:
                      </span>
                      <span className="text-sm text-gray-900 flex-1 text-right break-words">
                        {item.value || 'Not provided'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No information provided</p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Submit Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="pt-6 border-t border-gray-100"
      >
        <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Ready to {mode === 'create' ? 'Create' : 'Update'} Member?
              </h4>
              <p className="text-sm text-gray-600">
                All information looks good. Click submit to {mode === 'create' ? 'create' : 'update'} this member.
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onSubmit}
                loading={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 px-8"
              >
                {loading ? 'Saving...' : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    {mode === 'create' ? 'Create Member' : 'Update Member'}
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}