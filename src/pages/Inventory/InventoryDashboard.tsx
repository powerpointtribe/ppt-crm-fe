import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Archive
} from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { inventoryService, InventoryItem, InventoryStatistics } from '@/services/inventory'
import { formatDate, formatCurrency } from '@/utils/formatters'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: string
}

function StatsCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatsCardProps) {
  return (
    <Card className="p-6">
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
      {trend && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center">
            <span className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-sm text-gray-500 ml-2">from last month</span>
          </div>
        </div>
      )}
    </Card>
  )
}

function getStockStatusColor(stockStatus: string): string {
  switch (stockStatus) {
    case 'OUT_OF_STOCK': return 'bg-red-100 text-red-800'
    case 'LOW_STOCK': return 'bg-yellow-100 text-yellow-800'
    case 'IN_STOCK': return 'bg-green-100 text-green-800'
    case 'OVERSTOCK': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function InventoryDashboard() {
  const [statistics, setStatistics] = useState<InventoryStatistics | null>(null)
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([])
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [stats, lowStock, expiring] = await Promise.all([
        inventoryService.getStatistics(),
        inventoryService.getLowStockItems(),
        inventoryService.getExpiringItems(30)
      ])

      setStatistics(stats)
      setLowStockItems(lowStock.slice(0, 5)) // Show only top 5
      setExpiringItems(expiring.slice(0, 5)) // Show only top 5
    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout title="Inventory Management">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Inventory Management">
        <div className="text-center text-red-600 p-8">
          <p>Error loading inventory data: {error.message}</p>
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
    <Layout title="Inventory Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
            <p className="text-gray-600">Manage your church's inventory and assets</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link to="/inventory/items/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Items"
              value={statistics.totalItems.toLocaleString()}
              subtitle="Active inventory items"
              icon={<Package className="h-6 w-6" />}
              color="blue"
            />
            <StatsCard
              title="Total Value"
              value={formatCurrency(statistics.totalValue)}
              subtitle="Current inventory value"
              icon={<DollarSign className="h-6 w-6" />}
              color="green"
            />
            <StatsCard
              title="Low Stock"
              value={statistics.lowStockItems}
              subtitle="Items need restocking"
              icon={<AlertTriangle className="h-6 w-6" />}
              color="yellow"
            />
            <StatsCard
              title="Out of Stock"
              value={statistics.outOfStockItems}
              subtitle="Items unavailable"
              icon={<TrendingDown className="h-6 w-6" />}
              color="red"
            />
          </div>
        )}

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/inventory/items">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                View All Items
              </Button>
            </Link>
            <Link to="/inventory/categories">
              <Button variant="outline" className="w-full justify-start">
                <Archive className="h-4 w-4 mr-2" />
                Manage Categories
              </Button>
            </Link>
            <Link to="/inventory/movements">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Stock Movements
              </Button>
            </Link>
            <Link to="/inventory/reports">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Items */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Low Stock Items</h3>
              <Link to="/inventory/items?lowStock=true">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No low stock items</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Current: {item.currentStock} {item.unitOfMeasurement}
                      </p>
                      <p className="text-sm text-yellow-600">
                        Reorder at: {item.reorderLevel} {item.unitOfMeasurement}
                      </p>
                    </div>
                    <Badge className={getStockStatusColor(item.stockStatus || '')}>
                      {item.stockStatus?.replace('_', ' ')}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Expiring Items */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Expiring Soon</h3>
              <Link to="/inventory/items?expiring=true">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            {expiringItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items expiring soon</p>
            ) : (
              <div className="space-y-3">
                {expiringItems.map((item) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Stock: {item.currentStock} {item.unitOfMeasurement}
                      </p>
                      <div className="flex items-center text-sm text-orange-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Expires: {formatDate(item.expiryDate!)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Top Categories */}
        {statistics?.topCategories && statistics.topCategories.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statistics.topCategories.slice(0, 3).map((category, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{category.category}</p>
                  <p className="text-sm text-gray-600">{category.count} items</p>
                  <p className="text-sm text-green-600">{formatCurrency(category.value)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}