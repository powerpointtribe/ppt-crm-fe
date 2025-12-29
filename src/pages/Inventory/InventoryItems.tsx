import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Clock,
  BarChart3,
  ChevronDown,
  X
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { inventoryService, InventoryItem, InventoryQueryParams } from '@/services/inventory'
import { formatDate, formatCurrency } from '@/utils/formatters'
import { useAppStore } from '@/store'

function getStockStatusColor(stockStatus: string): string {
  switch (stockStatus) {
    case 'OUT_OF_STOCK': return 'bg-red-100 text-red-800'
    case 'LOW_STOCK': return 'bg-yellow-100 text-yellow-800'
    case 'IN_STOCK': return 'bg-green-100 text-green-800'
    case 'OVERSTOCK': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-800'
    case 'INACTIVE': return 'bg-gray-100 text-gray-800'
    case 'DISCONTINUED': return 'bg-red-100 text-red-800'
    case 'DAMAGED': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function InventoryItems() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedBranch, branches } = useAppStore()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '')
  const [branchFilter, setBranchFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Show branch filter when viewing "All Campuses"
  const showBranchFilter = !selectedBranch && branches.length > 0

  useEffect(() => {
    loadItems()
  }, [searchParams, branchFilter, selectedBranch])

  const loadItems = async () => {
    try {
      setLoading(true)
      // Use selectedBranch if set, otherwise use the filter dropdown
      const effectiveBranchId = selectedBranch?._id || branchFilter || undefined
      const params: InventoryQueryParams = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: 10,
        search: searchParams.get('search') || undefined,
        category: searchParams.get('category') || undefined,
        status: searchParams.get('status') as any || undefined,
        lowStock: searchParams.get('lowStock') === 'true' || undefined,
        expiring: searchParams.get('expiring') === 'true' || undefined,
        branchId: effectiveBranchId,
        sortBy: searchParams.get('sortBy') || 'name',
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
      }

      const response = await inventoryService.getItems(params)
      setItems(response.items)
      setPagination(response.pagination)
    } catch (error: any) {
      console.error('Error loading inventory items:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const newParams = new URLSearchParams(searchParams)
    if (searchTerm) {
      newParams.set('search', searchTerm)
    } else {
      newParams.delete('search')
    }
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Export functionality to be implemented')
  }

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedStatus('')
    setBranchFilter('')
    setSearchParams({})
  }

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', page.toString())
    setSearchParams(newParams)
  }

  const hasActiveFilters = searchTerm || selectedCategory || selectedStatus || branchFilter || searchParams.get('lowStock') || searchParams.get('expiring')

  // Search Section to be displayed in header
  const searchSection = (
    <form onSubmit={handleSearch} className="flex gap-3 flex-wrap items-center w-full">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {!showFilters && selectedCategory && (
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value)
            handleFilterChange('category', e.target.value)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Categories</option>
        </select>
      )}

      {!showFilters && selectedStatus && (
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value)
            handleFilterChange('status', e.target.value)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DISCONTINUED">Discontinued</option>
          <option value="DAMAGED">Damaged</option>
        </select>
      )}

      <button
        type="submit"
        className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
      >
        Search
      </button>

      <Button
        type="button"
        variant="secondary"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </Button>

      <Button variant="secondary" onClick={handleExport}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      <Link to="/inventory/items/new">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </Link>
    </form>
  )

  if (loading) {
    return (
      <Layout
        title="Inventory Items"
        subtitle="Manage your church's inventory items"
        searchSection={searchSection}
      >
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Inventory Items"
      subtitle="Manage your church's inventory items"
      searchSection={searchSection}
    >
      <div className="space-y-6">
        {/* Advanced Filters */}
        {showFilters && (
          <Card className="p-6">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {showBranchFilter && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                    <select
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Campuses</option>
                      {branches.map(branch => (
                        <option key={branch._id} value={branch._id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value)
                      handleFilterChange('category', e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {/* Categories would be loaded dynamically */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value)
                      handleFilterChange('status', e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="DISCONTINUED">Discontinued</option>
                    <option value="DAMAGED">Damaged</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </Card>
        )}

        {/* Active Filters Badge */}
        {hasActiveFilters && !showFilters && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="outline">
                  Search: {searchTerm}
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      handleFilterChange('search', '')
                    }}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="outline">
                  Category: {selectedCategory}
                  <button
                    onClick={() => {
                      setSelectedCategory('')
                      handleFilterChange('category', '')
                    }}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </Card>
        )}

        {/* Items Grid */}
        {error ? (
          <div className="text-center text-red-600 p-8">
            <p>Error loading inventory items: {error.message}</p>
            <Button variant="outline" size="sm" onClick={loadItems} className="mt-4">
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first inventory item</p>
            <Link to="/inventory/items/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="p-6 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.itemCode}</p>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        {item.stockStatus && (
                          <Badge className={getStockStatusColor(item.stockStatus)}>
                            {item.stockStatus.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Stock:</span>
                        <span className="font-medium">{item.currentStock} {item.unitOfMeasurement}</span>
                      </div>
                      {item.reorderLevel > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Reorder Level:</span>
                          <span className="font-medium">{item.reorderLevel} {item.unitOfMeasurement}</span>
                        </div>
                      )}
                      {item.unitCost > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Unit Cost:</span>
                          <span className="font-medium">{formatCurrency(item.unitCost)}</span>
                        </div>
                      )}
                      {item.totalValue && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Value:</span>
                          <span className="font-medium text-green-600">{formatCurrency(item.totalValue)}</span>
                        </div>
                      )}
                    </div>

                    {(item.expiryDate || item.lastStockCheck) && (
                      <div className="border-t border-gray-200 pt-4 mb-4">
                        {item.expiryDate && (
                          <div className="flex items-center text-sm text-orange-600 mb-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Expires: {formatDate(item.expiryDate)}
                          </div>
                        )}
                        {item.lastStockCheck && (
                          <div className="text-sm text-gray-500">
                            Last checked: {formatDate(item.lastStockCheck)}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Link to={`/inventory/items/${item._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link to={`/inventory/items/${item._id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}