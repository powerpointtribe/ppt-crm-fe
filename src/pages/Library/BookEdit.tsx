import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { libraryService } from '@/services/library'
import { Book, BookCategory } from '@/types/library'
import { bookSchema, BookFormData } from '@/schemas/library'
import { showToast } from '@/utils/toast'

export default function BookEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [book, setBook] = useState<Book | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
  })

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [bookData, cats] = await Promise.all([
        libraryService.getBookById(id!),
        libraryService.getActiveCategories()
      ])
      setBook(bookData)
      setCategories(cats)

      // Populate form with book data
      reset({
        branch: typeof bookData.branch === 'object' ? bookData.branch._id : bookData.branch,
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn || '',
        description: bookData.description || '',
        category: typeof bookData.category === 'object' ? bookData.category._id : bookData.category || '',
        totalQuantity: bookData.totalQuantity,
        publisher: bookData.publisher || '',
        publishedDate: bookData.publishedDate
          ? new Date(bookData.publishedDate).toISOString().split('T')[0]
          : '',
        pageCount: bookData.pageCount || undefined,
        location: bookData.location || '',
        coverImage: bookData.coverImage || '',
        tags: bookData.tags || [],
      })
    } catch (error: any) {
      console.error('Error fetching book:', error)
      showToast('error', 'Failed to load book')
      navigate('/library/books')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: BookFormData) => {
    try {
      setSaving(true)
      await libraryService.updateBook(id!, data)
      showToast('success', 'Book updated successfully')
      navigate(`/library/books/${id}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update book')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Edit Book">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (!book) {
    return (
      <Layout title="Edit Book">
        <Card className="p-8 text-center">
          <p className="text-red-600">Book not found</p>
          <Button variant="outline" onClick={() => navigate('/library/books')} className="mt-4">
            Back to Books
          </Button>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout title="Edit Book">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/library/books/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Book Details
          </Button>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Book</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('title')}
                    placeholder="Enter book title"
                    error={errors.title?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('author')}
                    placeholder="Enter author name"
                    error={errors.author?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ISBN
                  </label>
                  <Input
                    {...register('isbn')}
                    placeholder="Enter ISBN"
                    error={errors.isbn?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Copies <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    {...register('totalQuantity', { valueAsNumber: true })}
                    placeholder="Number of copies"
                    error={errors.totalQuantity?.message}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Currently borrowed: {book.totalQuantity - book.availableQuantity}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter book description"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">Additional Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Publisher
                  </label>
                  <Input
                    {...register('publisher')}
                    placeholder="Enter publisher"
                    error={errors.publisher?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Published Date
                  </label>
                  <Input
                    type="date"
                    {...register('publishedDate')}
                    error={errors.publishedDate?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Count
                  </label>
                  <Input
                    type="number"
                    min="1"
                    {...register('pageCount', { valueAsNumber: true })}
                    placeholder="Number of pages"
                    error={errors.pageCount?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <Input
                    {...register('location')}
                    placeholder="e.g., Shelf A-3"
                    error={errors.location?.message}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image URL
                  </label>
                  <Input
                    {...register('coverImage')}
                    placeholder="https://example.com/cover.jpg"
                    error={errors.coverImage?.message}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/library/books/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
