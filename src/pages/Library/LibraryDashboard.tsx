import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Book,
  Users,
  Clock,
  AlertTriangle,
  Plus,
  Download,
  BookOpen,
  FolderOpen,
  ArrowRight,
  TrendingUp
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { libraryService } from '@/services/library'
import { LibraryStats, BorrowingStats, Borrowing } from '@/types/library'
import { formatDate } from '@/utils/formatters'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: string
  link?: string
}

function StatsCard({ title, value, subtitle, icon, color = 'blue', link }: StatsCardProps) {
  const content = (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <div className={`text-${color}-600`}>
            {icon}
          </div>
        </div>
      </div>
    </Card>
  )

  return link ? <Link to={link}>{content}</Link> : content
}

export default function LibraryDashboard() {
  const [bookStats, setBookStats] = useState<LibraryStats | null>(null)
  const [borrowingStats, setBorrowingStats] = useState<BorrowingStats | null>(null)
  const [overdueBorrowings, setOverdueBorrowings] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [books, borrowings, overdue] = await Promise.all([
        libraryService.getBookStats(),
        libraryService.getBorrowingStats(),
        libraryService.getOverdueBorrowings()
      ])

      setBookStats(books)
      setBorrowingStats(borrowings)
      setOverdueBorrowings(overdue.slice(0, 5))
    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Library Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Library Management">
        <div className="text-center text-red-600 p-8">
          <p>Error loading library data: {error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Library Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Library Dashboard</h1>
            <p className="text-gray-600">Manage books and borrowings</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/library/borrowings/new">
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Issue Book
              </Button>
            </Link>
            <Link to="/library/books/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Books"
            value={bookStats?.totalBooks.toLocaleString() || 0}
            subtitle={`${bookStats?.totalCopies || 0} total copies`}
            icon={<Book className="h-6 w-6" />}
            color="blue"
            link="/library/books"
          />
          <StatsCard
            title="Available"
            value={bookStats?.availableCopies.toLocaleString() || 0}
            subtitle="Copies available"
            icon={<TrendingUp className="h-6 w-6" />}
            color="green"
          />
          <StatsCard
            title="Borrowed"
            value={borrowingStats?.activeBorrowings || 0}
            subtitle="Currently borrowed"
            icon={<Users className="h-6 w-6" />}
            color="purple"
            link="/library/borrowings"
          />
          <StatsCard
            title="Overdue"
            value={borrowingStats?.overdueCount || 0}
            subtitle="Need attention"
            icon={<AlertTriangle className="h-6 w-6" />}
            color="red"
            link="/library/overdue"
          />
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/library/books">
              <Button variant="outline" className="w-full justify-start">
                <Book className="h-4 w-4 mr-2" />
                Browse Books
              </Button>
            </Link>
            <Link to="/library/categories">
              <Button variant="outline" className="w-full justify-start">
                <FolderOpen className="h-4 w-4 mr-2" />
                Manage Categories
              </Button>
            </Link>
            <Link to="/library/borrowings">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                View Borrowings
              </Button>
            </Link>
            <Link to="/library/overdue">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Overdue Books
              </Button>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Books */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overdue Books</h3>
              <Link to="/library/overdue">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            {overdueBorrowings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No overdue books</p>
            ) : (
              <div className="space-y-3">
                {overdueBorrowings.map((borrowing) => (
                  <motion.div
                    key={borrowing._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {typeof borrowing.book === 'object' ? borrowing.book.title : 'Unknown Book'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {typeof borrowing.member === 'object'
                          ? `${borrowing.member.firstName} ${borrowing.member.lastName}`
                          : 'Unknown Member'}
                      </p>
                      <div className="flex items-center text-sm text-red-600 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Due: {formatDate(borrowing.dueDate)}
                        <span className="ml-2 font-medium">
                          ({borrowing.currentOverdueDays || borrowing.overdueDays} days overdue)
                        </span>
                      </div>
                    </div>
                    <Badge variant="error">Overdue</Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Popular Books */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Most Borrowed Books</h3>
            </div>
            {!borrowingStats?.popularBooks?.length ? (
              <p className="text-gray-500 text-center py-8">No borrowing data yet</p>
            ) : (
              <div className="space-y-3">
                {borrowingStats.popularBooks.slice(0, 5).map((book, index) => (
                  <motion.div
                    key={book.bookId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{book.title}</p>
                        <p className="text-sm text-gray-600">{book.author}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{book.borrowCount} times</Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Category Breakdown */}
        {bookStats?.categoryBreakdown && bookStats.categoryBreakdown.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Books by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {bookStats.categoryBreakdown.map((category, index) => (
                <div key={category.categoryId || index} className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{category.count}</p>
                  <p className="text-sm text-gray-600 truncate">{category.categoryName}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
