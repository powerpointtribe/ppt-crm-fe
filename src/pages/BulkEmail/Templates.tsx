import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import { bulkEmailService } from '@/services/bulk-email'
import { EmailTemplate, EmailTemplateCategory, TemplateQueryParams } from '@/types/bulk-email'
import { showToast } from '@/utils/toast'
import { formatDate } from '@/utils/formatters'

function getCategoryBadge(category: EmailTemplateCategory) {
  const colors: Record<EmailTemplateCategory, string> = {
    [EmailTemplateCategory.GENERAL]: 'bg-gray-100 text-gray-700',
    [EmailTemplateCategory.WELCOME]: 'bg-green-100 text-green-700',
    [EmailTemplateCategory.ANNOUNCEMENT]: 'bg-blue-100 text-blue-700',
    [EmailTemplateCategory.EVENT]: 'bg-purple-100 text-purple-700',
    [EmailTemplateCategory.REMINDER]: 'bg-orange-100 text-orange-700',
    [EmailTemplateCategory.NEWSLETTER]: 'bg-pink-100 text-pink-700',
  }

  return (
    <Badge className={colors[category]}>
      {category.toLowerCase().replace('_', ' ')}
    </Badge>
  )
}

export default function Templates() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const params: TemplateQueryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        category: selectedCategory as EmailTemplateCategory || undefined,
      }

      const response = await bulkEmailService.getTemplates(params)
      setTemplates(response.items)
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }))
    } catch (error: any) {
      console.error('Error fetching templates:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedCategory])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    setSearchParams({
      ...(searchTerm && { search: searchTerm }),
      ...(selectedCategory && { category: selectedCategory }),
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return

    try {
      await bulkEmailService.deleteTemplate(id)
      showToast('success', 'Template deleted successfully')
      fetchTemplates()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete template')
    }
  }

  return (
    <Layout title="Email Templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-gray-600">Manage reusable email templates</p>
          </div>
          <Link to="/bulk-email/templates/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {Object.values(EmailTemplateCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.toLowerCase().replace('_', ' ')}
                </option>
              ))}
            </select>
            <Button type="submit">
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </form>
        </Card>

        {/* Templates List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-600">{error.message}</p>
            <Button variant="outline" onClick={fetchTemplates} className="mt-4">
              Retry
            </Button>
          </Card>
        ) : templates.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No templates found</p>
            <Link to="/bulk-email/templates/new">
              <Button>Create First Template</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <motion.div
                key={template._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(template.category)}
                      {template.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-1">{template.subject}</p>

                  <div className="text-xs text-gray-500 mb-4">
                    Created: {formatDate(template.createdAt)}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/bulk-email/templates/${template._id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/bulk-email/templates/${template._id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template._id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          />
        )}
      </div>
    </Layout>
  )
}
