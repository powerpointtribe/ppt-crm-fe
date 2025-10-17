import { motion } from 'framer-motion'
import { Construction, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from './ui/Card'

interface PlaceholderPageProps {
  title: string
  description: string
  moduleName: string
}

export default function PlaceholderPage({ title, description, moduleName }: PlaceholderPageProps) {
  const navigate = useNavigate()

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto mt-20"
      >
        <Card className="text-center">
          <Construction className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-6">{description}</p>
          <p className="text-sm text-gray-500 mb-6">
            The {moduleName} module is currently under development and will be available soon.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </Card>
      </motion.div>
    </div>
  )
}