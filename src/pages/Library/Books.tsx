import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Book as BookIcon,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  BookOpen
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import { libraryService } from '@/services/library'
import { Book, BookCategory, BookStatus, BookQueryParams } from '@/types/library'
import { showToast } from '@/utils/toast'

function getStatusBadge(status: BookStatus) {
  switch (status) {
    case BookStatus.AVAILABLE:
      return <Badge variant="success">Available</Badge>
    case BookStatus.LOW_STOCK:
      return <Badge variant="warning">Low Stock</Badge>
    case BookStatus.OUT_OF_STOCK:
      return <Badge variant="error">Out of Stock</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function Books() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true)
      const params: BookQueryParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        categoryId: selectedCategory || undefined,
        status: selectedStatus as BookStatus || undefined,
      }

      const response = await libraryService.getBooks(params)
      setBooks(response.items)
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages,
      }))
    } catch (error: any) {
      console.error('Error fetching books:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedCategory, selectedStatus])

  const fetchCategories = async () => {
    try {
      const cats = await libraryService.getActiveCategories()
      setCategories(cats)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((prev) => ({ ...prev, page: 1 }))
    setSearchParams({
      ...(searchTerm && { search: searchTerm }),
      ...(selectedCategory && { category: selectedCategory }),
      ...(selectedStatus && { status: selectedStatus }),
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return

    try {
      await libraryService.deleteBook(id)
      showToast('success', 'Book deleted successfully')
      fetchBooks()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete book')
    }
  }

  return (
    <Layout title="Library Books">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Books</h1>
            <p className="text-gray-600">Manage your library collection</p>
          </div>
          <Link to="/library/books/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search by title, author, ISBN..."
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
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value={BookStatus.AVAILABLE}>Available</option>
              <option value={BookStatus.LOW_STOCK}>Low Stock</option>
              <option value={BookStatus.OUT_OF_STOCK}>Out of Stock</option>
            </select>
            <Button type="submit">
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </form>
        </Card>

        {/* Books List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-600">{error.message}</p>
            <Button variant="outline" onClick={fetchBooks} className="mt-4">
              Retry
            </Button>
          </Card>
        ) : books.length === 0 ? (
          <Card className="p-8 text-center">
            <BookIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No books found</p>
            <Link to="/library/books/new">
              <Button>Add First Book</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book, index) => (
              <motion.div
                key={book._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:shadow-lg transition-shadow h-full flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{book.title}</h3>
                        <p className="text-sm text-gray-600">{book.author}</p>
                      </div>
                      {getStatusBadge(book.status)}
                    </div>

                    {book.isbn && (
                      <p className="text-xs text-gray-500 mb-2">ISBN: {book.isbn}</p>
                    )}

                    {typeof book.category === 'object' && book.category && (
                      <Badge
                        variant="secondary"
                        className="mb-2"
                        style={{ backgroundColor: book.category.color + '20', color: book.category.color }}
                      >
                        {book.category.name}
                      </Badge>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                      <span>Total: {book.totalQuantity}</span>
                      <span>Available: {book.availableQuantity}</span>
                    </div>

                    {book.location && (
                      <p className="text-xs text-gray-500 mt-2">Location: {book.location}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/library/books/${book._id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/library/books/${book._id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(book._id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {book.availableQuantity > 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/library/borrowings/new?bookId=${book._id}`)}
                        className="ml-auto"
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        Issue
                      </Button>
                    )}
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
