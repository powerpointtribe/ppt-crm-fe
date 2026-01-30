import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Search } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { libraryService } from '@/services/library'
import { apiService } from '@/services/api'
import { Book } from '@/types/library'
import { borrowingSchema, BorrowingFormData } from '@/schemas/library'
import { showToast } from '@/utils/toast'
import { useAppStore } from '@/store'

interface Member {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
}

export default function BorrowingNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { selectedBranch } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [bookSearch, setBookSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const preselectedBookId = searchParams.get('bookId')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BorrowingFormData>({
    resolver: zodResolver(borrowingSchema),
    defaultValues: {
      branch: selectedBranch?._id || '',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
    },
  })

  useEffect(() => {
    if (selectedBranch?._id) {
      setValue('branch', selectedBranch._id)
    }
  }, [selectedBranch, setValue])

  useEffect(() => {
    if (preselectedBookId) {
      loadPreselectedBook(preselectedBookId)
    }
  }, [preselectedBookId])

  const loadPreselectedBook = async (bookId: string) => {
    try {
      const book = await libraryService.getBookById(bookId)
      setSelectedBook(book)
      setValue('book', book._id)
    } catch (error) {
      console.error('Error loading book:', error)
    }
  }

  const searchBooks = async () => {
    if (bookSearch.length < 2) return
    try {
      const response = await libraryService.getBooks({
        search: bookSearch,
        limit: 10,
      })
      setBooks(response.items.filter((b) => b.availableQuantity > 0))
    } catch (error) {
      console.error('Error searching books:', error)
    }
  }

  const searchMembers = async () => {
    if (memberSearch.length < 2) return
    try {
      const response = await apiService.get<any>('/members', {
        params: { search: memberSearch, limit: 10 },
      })
      setMembers(response.items || response.data?.items || [])
    } catch (error) {
      console.error('Error searching members:', error)
    }
  }

  const selectBook = (book: Book) => {
    setSelectedBook(book)
    setValue('book', book._id)
    setBooks([])
    setBookSearch('')
  }

  const selectMember = (member: Member) => {
    setSelectedMember(member)
    setValue('member', member._id)
    setMembers([])
    setMemberSearch('')
  }

  const onSubmit = async (data: BorrowingFormData) => {
    try {
      setLoading(true)
      await libraryService.createBorrowing(data)
      showToast('success', 'Book issued successfully')
      navigate('/library/borrowings')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to issue book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Issue Book">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/library/borrowings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Borrowings
          </Button>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Issue Book to Member</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Book Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Book <span className="text-red-500">*</span>
              </label>
              {selectedBook ? (
                <div className="p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{selectedBook.title}</p>
                    <p className="text-sm text-gray-600">{selectedBook.author}</p>
                    <p className="text-sm text-green-600">
                      {selectedBook.availableQuantity} copies available
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBook(null)
                      setValue('book', '')
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Search for a book..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    onKeyUp={() => searchBooks()}
                    icon={<Search className="h-4 w-4" />}
                  />
                  {books.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {books.map((book) => (
                        <div
                          key={book._id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => selectBook(book)}
                        >
                          <p className="font-medium text-gray-900">{book.title}</p>
                          <p className="text-sm text-gray-600">{book.author}</p>
                          <p className="text-xs text-green-600">
                            {book.availableQuantity} available
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.book && (
                <p className="text-red-500 text-sm mt-1">{errors.book.message}</p>
              )}
            </div>

            {/* Member Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member <span className="text-red-500">*</span>
              </label>
              {selectedMember ? (
                <div className="p-4 bg-green-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedMember.email}</p>
                    {selectedMember.phone && (
                      <p className="text-sm text-gray-600">{selectedMember.phone}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMember(null)
                      setValue('member', '')
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Search for a member..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    onKeyUp={() => searchMembers()}
                    icon={<Search className="h-4 w-4" />}
                  />
                  {members.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {members.map((member) => (
                        <div
                          key={member._id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => selectMember(member)}
                        >
                          <p className="font-medium text-gray-900">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {errors.member && (
                <p className="text-red-500 text-sm mt-1">{errors.member.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                {...register('dueDate')}
                min={new Date().toISOString().split('T')[0]}
                error={errors.dueDate?.message}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/library/borrowings')}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading} disabled={!selectedBook || !selectedMember}>
                <Save className="h-4 w-4 mr-2" />
                Issue Book
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
